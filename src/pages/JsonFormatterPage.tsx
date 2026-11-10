import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "../components/AppLayout";
import { ToolSwitcher } from "../components/ToolSwitcher";
import { SearchResultsPanel, SearchToolbar } from "../components/SearchToolbar";
import type { MobileHeaderAction } from "../components/MobileActionsMenu";
import { CodeEditorPane } from "../components/TextEditorPair";
import { useSeo } from "../hooks/useSeo";
import { useTheme } from "../hooks/useTheme";
import { SITE } from "../config/site";
import { JSON_FAQS } from "../content/faqs";
import { findTextMatches } from "../lib/utils";
import {
  Sparkles,
  ArrowDownAZ,
  RotateCcw,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Upload,
  Layers,
  Code2,
} from "lucide-react";

interface JsonParseResult {
  valid: boolean;
  data?: unknown;
  error?: {
    message: string;
    line?: number;
    column?: number;
    start?: number;
    length?: number;
    excerpt?: string;
  };
}

interface FileUploadStatus {
  kind: "success" | "error";
  message: string;
  fileName?: string;
}

interface AutoFixChange {
  description: string;
  line: number;
}

type IndentType = 2 | 4 | "tab" | 1;

const SAMPLE_JSON = `{
  "tool": "DiffViewer",
  "feature": "JSON Formatter & Validator",
  "version": "1.0.0",
  "active": true,
  "privacy": {
    "clientSide": true,
    "serverUpload": false,
    "encryption": "in-memory-only"
  },
  "capabilities": [
    "format-and-beautify",
    "minify-and-compact",
    "sort-keys-alphabetically",
    "real-time-syntax-validation",
    "instant-diff-comparison"
  ],
  "stats": {
    "speedMs": 0,
    "accuracy": "100%",
    "supportedFormats": ["json", "geojson", "jsonld", "ndjson"]
  }
}`;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSingleLineFieldNames(value: string): string[] {
  return [...new Set(value.split(",").map((name) => name.trim()).filter(Boolean))];
}

function getLineNumber(value: string, index: number): number {
  return value.slice(0, index).split("\n").length;
}

function convertSingleQuotedStrings(
  value: string,
): { value: string; changes: AutoFixChange[] } {
  let result = "";
  const changes: AutoFixChange[] = [];
  let inDoubleQuotedString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (inDoubleQuotedString) {
      result += character;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inDoubleQuotedString = false;
      continue;
    }

    if (character === '"') {
      inDoubleQuotedString = true;
      result += character;
      continue;
    }

    if (character !== "'") {
      result += character;
      continue;
    }

    const start = index;
    let content = "";
    let closed = false;
    for (index += 1; index < value.length; index += 1) {
      const current = value[index];
      if (current === "'") {
        closed = true;
        break;
      }
      if (current === "\\" && index + 1 < value.length) {
        const next = value[index + 1];
        if (next === "'" || next === "\\" || next === '"') {
          content += next;
          index += 1;
          continue;
        }
        if (next === "n") content += "\n";
        else if (next === "r") content += "\r";
        else if (next === "t") content += "\t";
        else content += `\\${next}`;
        index += 1;
        continue;
      }
      content += current;
    }

    if (!closed) {
      result += value.slice(start);
      break;
    }

    result += JSON.stringify(content);
    changes.push({
      description: "Converted a single-quoted string to valid JSON quotes",
      line: getLineNumber(value, start),
    });
  }

  return { value: result, changes };
}

function quoteUnquotedKeys(value: string): {
  value: string;
  changes: AutoFixChange[];
} {
  let result = "";
  const changes: AutoFixChange[] = [];
  let inString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (inString) {
      result += character;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') {
      inString = true;
      result += character;
      continue;
    }

    result += character;
    if (character !== "{" && character !== ",") continue;

    let keyStart = index + 1;
    while (/\s/.test(value[keyStart] ?? "")) keyStart += 1;
    const keyMatch = /^[A-Za-z_$][\w$-]*/.exec(value.slice(keyStart));
    if (!keyMatch) continue;

    const keyEnd = keyStart + keyMatch[0].length;
    let colonIndex = keyEnd;
    while (/\s/.test(value[colonIndex] ?? "")) colonIndex += 1;
    if (value[colonIndex] !== ":") continue;

    result += value.slice(index + 1, keyStart);
    result += JSON.stringify(keyMatch[0]);
    result += value.slice(keyEnd, colonIndex + 1);
    index = colonIndex;
    changes.push({
      description: `Added quotes around the "${keyMatch[0]}" property name`,
      line: getLineNumber(value, keyStart),
    });
  }

  return { value: result, changes };
}

function removeTrailingCommas(value: string): {
  value: string;
  changes: AutoFixChange[];
} {
  let result = "";
  const changes: AutoFixChange[] = [];
  let inString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (inString) {
      result += character;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') {
      inString = true;
      result += character;
      continue;
    }

    if (character !== ",") {
      result += character;
      continue;
    }

    let nextIndex = index + 1;
    while (/\s/.test(value[nextIndex] ?? "")) nextIndex += 1;
    if (value[nextIndex] === "}" || value[nextIndex] === "]") {
      changes.push({
        description: "Removed a trailing comma",
        line: getLineNumber(value, index),
      });
      continue;
    }

    result += character;
  }

  return { value: result, changes };
}

function removeJsonComments(value: string): {
  value: string;
  changes: AutoFixChange[];
} {
  let result = "";
  const changes: AutoFixChange[] = [];

  for (let index = 0; index < value.length; ) {
    if (value[index] === '"') {
      const start = index;
      let escaped = false;
      result += value[index++];
      while (index < value.length) {
        const character = value[index++];
        result += character;
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') break;
      }
      if (index === start) return { value: result, changes };
      continue;
    }

    if (value[index] === "/" && value[index + 1] === "/") {
      const start = index;
      while (index < value.length && value[index] !== "\n") index += 1;
      changes.push({
        description: "Removed a line comment",
        line: getLineNumber(value, start),
      });
      continue;
    }

    if (value[index] === "/" && value[index + 1] === "*") {
      const start = index;
      index += 2;
      while (
        index < value.length &&
        !(value[index] === "*" && value[index + 1] === "/")
      ) {
        if (value[index] === "\n") result += "\n";
        index += 1;
      }
      if (index < value.length) index += 2;
      changes.push({
        description: "Removed a block comment",
        line: getLineNumber(value, start),
      });
      continue;
    }

    result += value[index];
    index += 1;
  }

  return { value: result, changes };
}

function repairStringLiterals(value: string): {
  value: string;
  changes: AutoFixChange[];
} {
  let result = "";
  let inString = false;
  let escaped = false;
  let stringStart = -1;
  const changes: AutoFixChange[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (!inString) {
      result += character;
      if (character === '"') {
        inString = true;
        stringStart = index;
      }
      continue;
    }

    if (character === "\r" || character === "\n") {
      const line = getLineNumber(value, index);
      result += escaped ? "n" : "\\n";
      escaped = false;
      if (character === "\r" && value[index + 1] === "\n") index += 1;
      changes.push({
        description: "Escaped a line break inside a string",
        line,
      });
      continue;
    }

    result += character;
    if (escaped) escaped = false;
    else if (character === "\\") escaped = true;
    else if (character === '"') {
      inString = false;
      stringStart = -1;
    }
  }

  if (inString) {
    result += '"';
    changes.push({
      description: "Closed an unterminated string",
      line: getLineNumber(value, stringStart),
    });
  }

  return { value: result, changes };
}

function repairJsonStructure(value: string): {
  value: string;
  changes: AutoFixChange[];
} | undefined {
  type Token = {
    kind: "punctuation" | "string" | "word";
    value: string;
    start: number;
    end: number;
  };
  type Insertion = {
    text: string;
    description: string;
  };

  const tokens: Token[] = [];
  for (let index = 0; index < value.length; ) {
    if (/\s/.test(value[index])) {
      index += 1;
      continue;
    }

    const start = index;
    const character = value[index];
    if ("{}[],:".includes(character)) {
      tokens.push({
        kind: "punctuation",
        value: character,
        start,
        end: ++index,
      });
      continue;
    }

    if (character === '"') {
      let escaped = false;
      index += 1;
      while (index < value.length) {
        const current = value[index];
        if (current === "\n" || current === "\r") return undefined;
        if (escaped) escaped = false;
        else if (current === "\\") escaped = true;
        else if (current === '"') {
          index += 1;
          break;
        }
        index += 1;
      }
      if (value[index - 1] !== '"') return undefined;
      tokens.push({
        kind: "string",
        value: value.slice(start, index),
        start,
        end: index,
      });
      continue;
    }

    while (
      index < value.length &&
      !/\s/.test(value[index]) &&
      !"{}[],:".includes(value[index])
    ) {
      index += 1;
    }
    if (index === start) return undefined;
    tokens.push({
      kind: "word",
      value: value.slice(start, index),
      start,
      end: index,
    });
  }

  const replacements = new Map<number, string>();
  const insertions = new Map<number, Insertion[]>();
  const changes: AutoFixChange[] = [];
  const addInsertion = (position: number, text: string, description: string) => {
    const atPosition = insertions.get(position) ?? [];
    atPosition.push({ text, description });
    insertions.set(position, atPosition);
    changes.push({ description, line: getLineNumber(value, position) });
  };

  const parseValue = (startIndex: number): number | undefined => {
    const token = tokens[startIndex];
    if (!token) return undefined;
    if (token.value === "{") return parseObject(startIndex + 1);
    if (token.value === "[") return parseArray(startIndex + 1);
    if (token.kind === "string") return startIndex + 1;

    if (
      token.kind === "word" &&
      token.value !== "true" &&
      token.value !== "false" &&
      token.value !== "null" &&
      !/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(token.value)
    ) {
      replacements.set(startIndex, JSON.stringify(token.value));
      changes.push({
        description: `Quoted the unquoted value "${token.value}"`,
        line: getLineNumber(value, token.start),
      });
    }
    return startIndex + 1;
  };

  const parseObject = (startIndex: number): number | undefined => {
    let index = startIndex;
    if (tokens[index]?.value === "}") return index + 1;

    while (index < tokens.length) {
      const key = tokens[index];
      if (key?.value === "]") {
        addInsertion(key.start, "}", "Added a missing closing brace");
        return index;
      }
      if (!key || (key.kind !== "string" && key.kind !== "word")) {
        return undefined;
      }
      if (key.kind === "word") {
        replacements.set(index, JSON.stringify(key.value));
        changes.push({
          description: `Added quotes around the "${key.value}" property name`,
          line: getLineNumber(value, key.start),
        });
      }
      index += 1;

      if (tokens[index]?.value !== ":") {
        const nextToken = tokens[index];
        if (
          !nextToken ||
          nextToken.value === "}" ||
          nextToken.value === "," ||
          nextToken.value === "]"
        ) {
          return undefined;
        }
        addInsertion(
          key.end,
          ":",
          `Added a missing colon after the "${key.value}" property name`,
        );
      } else {
        index += 1;
      }

      const valueStart = index;
      const valueEnd = parseValue(valueStart);
      if (valueEnd === undefined) return undefined;
      index = valueEnd;

      if (tokens[index]?.value === ",") {
        index += 1;
        if (tokens[index]?.value === "}") return undefined;
        continue;
      }
      if (tokens[index]?.value === "}") return index + 1;
      if (tokens[index]?.value === "]") {
        addInsertion(tokens[index].start, "}", "Added a missing closing brace");
        return index;
      }
      if (index >= tokens.length) {
        addInsertion(value.length, "}", "Added a missing closing brace");
        return index;
      }
      addInsertion(
        tokens[index - 1]?.end ?? key.end,
        ",",
        "Added a missing comma between object properties",
      );
    }

    addInsertion(value.length, "}", "Added a missing closing brace");
    return index;
  };

  const parseArray = (startIndex: number): number | undefined => {
    let index = startIndex;
    if (tokens[index]?.value === "]") return index + 1;

    while (index < tokens.length) {
      if (tokens[index]?.value === "}") {
        addInsertion(tokens[index].start, "]", "Added a missing closing bracket");
        return index;
      }
      const valueStart = index;
      const valueEnd = parseValue(valueStart);
      if (valueEnd === undefined) return undefined;
      index = valueEnd;

      if (tokens[index]?.value === ",") {
        index += 1;
        if (tokens[index]?.value === "]") return undefined;
        continue;
      }
      if (tokens[index]?.value === "]") return index + 1;
      if (tokens[index]?.value === "}") {
        addInsertion(tokens[index].start, "]", "Added a missing closing bracket");
        return index;
      }
      if (index >= tokens.length) {
        addInsertion(value.length, "]", "Added a missing closing bracket");
        return index;
      }
      addInsertion(
        tokens[index - 1]?.end ?? value.length,
        ",",
        "Added a missing comma between array values",
      );
    }

    addInsertion(value.length, "]", "Added a missing closing bracket");
    return index;
  };

  if (!tokens.length) return undefined;
  const nextToken = parseValue(0);
  if (nextToken === undefined || nextToken !== tokens.length) return undefined;

  let repaired = "";
  let tokenIndex = 0;
  for (let position = 0; position <= value.length; position += 1) {
    const additions = insertions.get(position);
    if (additions) repaired += additions.map(({ text }) => text).join("");
    const token = tokens[tokenIndex];
    if (!token || token.start !== position) {
      if (position < value.length) repaired += value[position];
      continue;
    }

    repaired += replacements.get(tokenIndex) ?? token.value;
    position = token.end - 1;
    tokenIndex += 1;
  }

  return { value: repaired, changes };
}

function recoverJsonWithSingleLineFields(
  raw: string,
  fieldNames: string[],
  fieldIndex = 0,
): JsonParseResult | undefined {
  try {
    return { valid: true, data: JSON.parse(raw) };
  } catch {
    if (fieldIndex >= fieldNames.length) return undefined;
  }

  const targetProperty = new RegExp(
    `${escapeRegExp(JSON.stringify(fieldNames[fieldIndex]))}\\s*:\\s*"`,
  ).exec(raw);
  if (!targetProperty) {
    return recoverJsonWithSingleLineFields(raw, fieldNames, fieldIndex + 1);
  }

  const openingQuote = targetProperty.index + targetProperty[0].lastIndexOf('"');
  const contentStart = openingQuote + 1;
  const propertyBoundary = /",\s*"((?:[^"\\]|\\.)*)"\s*:/g;
  const remainingInput = raw.slice(contentStart);
  let boundary: RegExpExecArray | null;

  while ((boundary = propertyBoundary.exec(remainingInput))) {
    const closingQuote = contentStart + boundary.index;
    const repaired =
      raw.slice(0, openingQuote) +
      JSON.stringify(raw.slice(contentStart, closingQuote)) +
      raw.slice(closingQuote + 1);
    const result = recoverJsonWithSingleLineFields(
      repaired,
      fieldNames,
      fieldIndex + 1,
    );
    if (result) return result;
  }

  return undefined;
}

function parseJsonWithError(
  raw: string,
  singleLineFieldNames: string,
): JsonParseResult {
  if (!raw.trim()) {
    return { valid: true, data: null };
  }

  try {
    return { valid: true, data: JSON.parse(raw) };
  } catch (err: unknown) {
    const recovered = recoverJsonWithSingleLineFields(
      raw,
      getSingleLineFieldNames(singleLineFieldNames),
    );
    if (recovered) return recovered;

    let message = err instanceof Error ? err.message : String(err);
    let line: number | undefined;
    let column: number | undefined;
    let errorPosition: number | undefined;

    let inString = false;
    let escaped = false;
    for (let index = 0; index < raw.length; index += 1) {
      const character = raw[index];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (character === "\\") {
          escaped = true;
        } else if (character === '"') {
          inString = false;
        }
        continue;
      }

      if (character === '"') {
        inString = true;
      } else if (character === ",") {
        let nextIndex = index + 1;
        while (/\s/.test(raw[nextIndex] ?? "")) nextIndex += 1;
        if (raw[nextIndex] === "}" || raw[nextIndex] === "]") {
          errorPosition = index;
          message = `Trailing comma before "${raw[nextIndex]}" is not allowed in JSON.`;
          break;
        }
      }
    }

    if (errorPosition !== undefined) {
      const precedingLines = raw.slice(0, errorPosition).split("\n");
      line = precedingLines.length;
      column = precedingLines[precedingLines.length - 1].length + 1;
    } else {
      const lineColumnMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
      if (lineColumnMatch) {
        line = Number(lineColumnMatch[1]);
        column = Number(lineColumnMatch[2]);
      } else {
        const positionMatch = message.match(/position\s+(\d+)/i);
        if (positionMatch) {
          errorPosition = Number(positionMatch[1]);
          const beforeError = raw.slice(0, errorPosition);
          const precedingLines = beforeError.split("\n");
          line = precedingLines.length;
          column = precedingLines[precedingLines.length - 1].length + 1;
        } else {
          const lineMatch = message.match(/line\s+(\d+)/i);
          if (lineMatch) line = Number(lineMatch[1]);
        }
      }
    }

    if (
      errorPosition === undefined &&
      line !== undefined &&
      column !== undefined
    ) {
      errorPosition =
        raw
          .split("\n")
          .slice(0, line - 1)
          .join("\n").length +
        (line > 1 ? 1 : 0) +
        column -
        1;
    }

    let excerpt: string | undefined;
    if (line !== undefined) {
      const sourceLine = raw.split("\n")[line - 1] ?? "";
      excerpt =
        column !== undefined
          ? `${sourceLine}\n${" ".repeat(Math.max(0, column - 1))}^`
          : sourceLine;
    }

    return {
      valid: false,
      error: {
        message,
        line,
        column,
        start: errorPosition,
        length:
          errorPosition !== undefined && errorPosition < raw.length ? 1 : 0,
        excerpt,
      },
    };
  }
}

function stringifyJsonData(
  data: unknown,
  indent: IndentType | 0,
  sortKeys: boolean,
  sortOrder: "asc" | "desc" | null = "asc",
  singleLineFieldNames = "",
): string {
  const indentation = indent === "tab" ? "\t" : " ".repeat(indent);
  const fieldNames = new Set(getSingleLineFieldNames(singleLineFieldNames));

  const stringify = (value: unknown, depth: number): string => {
    if (Array.isArray(value)) {
      if (value.length === 0) return "[]";
      const items = value.map((item) => stringify(item, depth + 1));
      if (!indentation) return `[${items.join(",")}]`;
      return `[\n${indentation.repeat(depth + 1)}${items.join(
        `,\n${indentation.repeat(depth + 1)}`,
      )}\n${indentation.repeat(depth)}]`;
    }

    if (value !== null && typeof value === "object") {
      const keys = Object.keys(value as Record<string, unknown>);
      if (sortKeys) {
        keys.sort((left, right) =>
          sortOrder !== "desc"
            ? left.localeCompare(right)
            : right.localeCompare(left),
        );
      }
      if (keys.length === 0) return "{}";
      const properties = keys.map((key) => {
        const propertyValue = (value as Record<string, unknown>)[key];
        const formattedValue =
          fieldNames.has(key) && typeof propertyValue === "string"
            ? propertyValue.replace(/[ \t]*\r?\n[ \t]*/g, " ")
            : propertyValue;
        const property = `${JSON.stringify(key)}${
          indentation ? ": " : ":"
        }${stringify(formattedValue, depth + 1)}`;
        return indentation
          ? `${indentation.repeat(depth + 1)}${property}`
          : property;
      });
      if (!indentation) return `{${properties.join(",")}}`;
      return `{\n${properties.join(`,\n`)}\n${indentation.repeat(depth)}}`;
    }

    return JSON.stringify(value) ?? "null";
  };

  return stringify(data, 0);
}

function formatJsonData(
  data: unknown,
  indent: IndentType,
  sortKeys = false,
  sortOrder: "asc" | "desc" | null = "asc",
  singleLineFieldNames = "",
): string {
  return stringifyJsonData(
    data,
    indent,
    sortKeys,
    sortOrder,
    singleLineFieldNames,
  );
}

export default function JsonFormatterPage() {
  const [inputJson, setInputJson] = useState<string>(SAMPLE_JSON);
  const [singleLineFieldName, setSingleLineFieldName] = useState("");
  const [autoFixChanges, setAutoFixChanges] = useState<AutoFixChange[] | null>(
    null,
  );
  const [indent, setIndent] = useState<IndentType>(2);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [searchSelection, setSearchSelection] = useState<
    { start: number; length: number; token: number } | undefined
  >();
  const [fileUploadStatus, setFileUploadStatus] =
    useState<FileUploadStatus | null>(null);
  const [uploadCountdown, setUploadCountdown] = useState(3);
  const { dark, toggle } = useTheme();

  useEffect(() => {
    if (fileUploadStatus?.kind !== "success") return;
    const timeoutId = window.setTimeout(() => {
      if (uploadCountdown <= 1) {
        setFileUploadStatus(null);
      } else {
        setUploadCountdown((countdown) => countdown - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [fileUploadStatus, uploadCountdown]);

  // Parse input in real time
  const parseResult = useMemo(() => {
    return parseJsonWithError(inputJson, singleLineFieldName);
  }, [inputJson, singleLineFieldName]);
  const hasStrictJsonSyntax = useMemo(() => {
    try {
      JSON.parse(inputJson);
      return true;
    } catch {
      return false;
    }
  }, [inputJson]);
  const searchResults = useMemo(
    () => findTextMatches(inputJson, searchQuery),
    [inputJson, searchQuery],
  );
  const selectedSearchIndex =
    searchResults.length > 0 ? activeSearchIndex % searchResults.length : -1;

  const selectSearchResult = (index: number) => {
    const result = searchResults[index];
    if (!result) return;
    setActiveSearchIndex(index);
    setSearchSelection((current) => ({
      start: result.start,
      length: result.length,
      token: (current?.token ?? 0) + 1,
    }));
  };

  const navigateSearchResults = (direction: 1 | -1) => {
    if (!searchResults.length) return;
    const startIndex =
      activeSearchIndex >= 0 && activeSearchIndex < searchResults.length
        ? activeSearchIndex
        : direction === 1
          ? -1
          : 0;
    const nextIndex =
      (startIndex + direction + searchResults.length) % searchResults.length;
    selectSearchResult(nextIndex);
  };

  // SEO configuration
  useSeo({
    title:
      "Free JSON Formatter & Validator Online – Beautify, Minify & Inspect | DiffViewer",
    description:
      "Free online JSON formatter, validator, and minifier. Beautify JSON, sort keys, inspect syntax errors with exact line numbers, and compare changes. 100% private in your browser.",
    path: "/json-formatter",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          name: "JSON Formatter – DiffViewer",
          url: SITE.url + "/json-formatter",
          description:
            "Free online JSON formatter, validator, and minifier with character-level accuracy and client-side privacy.",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
        {
          "@type": "FAQPage",
          mainEntity: JSON_FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: SITE.url + "/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Tools",
              item: SITE.url + "/tools",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "JSON Formatter",
              item: SITE.url + "/json-formatter",
            },
          ],
        },
      ],
    },
  });

  const handleFormat = () => {
    if (!inputJson.trim() || !parseResult.valid) return;
    setAutoFixChanges(null);
    setInputJson(
      formatJsonData(
        parseResult.data,
        indent,
        sortOrder !== null,
        sortOrder,
        singleLineFieldName,
      ),
    );
  };

  const handleSortKeys = (order: "asc" | "desc") => {
    setSortOrder(order);
    if (inputJson.trim() && parseResult.valid) {
      setAutoFixChanges(null);
      setInputJson(
        formatJsonData(
          parseResult.data,
          indent,
          true,
          order,
          singleLineFieldName,
        ),
      );
    }
  };

  const handleAutoFix = () => {
    let candidate = inputJson;
    const changes: AutoFixChange[] = [];
    const stringResult = repairStringLiterals(candidate);
    candidate = stringResult.value;
    changes.push(...stringResult.changes);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const commentResult = removeJsonComments(candidate);
      candidate = commentResult.value;
      changes.push(...commentResult.changes);

      const singleQuoteResult = convertSingleQuotedStrings(candidate);
      candidate = singleQuoteResult.value;
      changes.push(...singleQuoteResult.changes);

      const keyResult = quoteUnquotedKeys(candidate);
      candidate = keyResult.value;
      changes.push(...keyResult.changes);

      const commaResult = removeTrailingCommas(candidate);
      candidate = commaResult.value;
      changes.push(...commaResult.changes);
    }

    const structuralRepair = repairJsonStructure(candidate);
    if (structuralRepair) {
      candidate = structuralRepair.value;
      changes.push(...structuralRepair.changes);
    }

    try {
      JSON.parse(candidate);
    } catch {
      const fieldNames = getSingleLineFieldNames(singleLineFieldName);
      const recovered = recoverJsonWithSingleLineFields(candidate, fieldNames);
      if (!recovered) {
        setAutoFixChanges([]);
        return;
      }

      candidate = stringifyJsonData(
        recovered.data,
        indent,
        sortOrder !== null,
        sortOrder,
        singleLineFieldName,
      );
      const recoveredField = fieldNames.find((fieldName) =>
        inputJson.includes(`"${fieldName}"`),
      );
      if (recoveredField) {
        const fieldPosition = inputJson.indexOf(`"${recoveredField}"`);
        changes.push({
          description: `Repaired the quoted string for "${recoveredField}"`,
          line: getLineNumber(inputJson, fieldPosition),
        });
      }
    }

    try {
      JSON.parse(candidate);
    } catch {
      setAutoFixChanges([]);
      return;
    }

    if (candidate === inputJson || changes.length === 0) {
      setAutoFixChanges([]);
      return;
    }

    setInputJson(candidate);
    setAutoFixChanges(changes);
  };

  const handleLoadSample = () => {
    setAutoFixChanges(null);
    setInputJson(SAMPLE_JSON);
  };

  const handleClear = () => {
    setAutoFixChanges(null);
    setInputJson("");
  };

  const handleDownload = () => {
    if (!inputJson) return;
    const blob = new Blob([inputJson], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "formatted.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    setFileUploadStatus(null);
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setAutoFixChanges(null);
        setInputJson(content);
        setUploadCountdown(3);
        setFileUploadStatus({
          kind: "success",
          message: "File uploaded successfully",
          fileName: file.name,
        });
      } else {
        setFileUploadStatus({
          kind: "error",
          message: `Could not read "${file.name}" as text.`,
        });
      }
    };
    reader.onerror = () => {
      setFileUploadStatus({
        kind: "error",
        message: `Failed to read "${file.name}". Please try again.`,
      });
    };
    try {
      reader.readAsText(file);
    } catch (error: unknown) {
      setFileUploadStatus({
        kind: "error",
        message:
          error instanceof Error
            ? `Failed to read "${file.name}": ${error.message}`
            : `Failed to read "${file.name}". Please try again.`,
      });
    }
    e.target.value = "";
  };

  // const handleSendToDiff = () => {
  //   const formattedForDiff =
  //     inputJson.trim() && parseResult.valid
  //       ? formatJsonData(
  //           parseResult.data,
  //           indent,
  //           sortOrder !== null,
  //           sortOrder,
  //         )
  //       : inputJson;
  //   try {
  //     sessionStorage.setItem("dv_diff_left", inputJson);
  //     sessionStorage.setItem("dv_diff_right", formattedForDiff);
  //     sessionStorage.setItem("dv_diff_auto_mode", "diff");
  //   } catch {
  //     // ignore
  //   }
  //   navigate("/");
  // };

  const mobileActions: MobileHeaderAction[] = [
    {
      label: "Format JSON",
      Icon: Sparkles,
      onSelect: handleFormat,
      disabled: !parseResult.valid || !inputJson.trim(),
    },
    {
      label: "Sort Keys A-Z",
      Icon: ArrowDownAZ,
      onSelect: () => handleSortKeys("asc"),
      active: sortOrder === "asc",
    },
    {
      label: "Sort Keys Z-A",
      Icon: ArrowDownAZ,
      onSelect: () => handleSortKeys("desc"),
      active: sortOrder === "desc",
    },
    { label: "Load Sample", Icon: RotateCcw, onSelect: handleLoadSample },
    {
      label: "Clear All",
      Icon: Trash2,
      onSelect: handleClear,
      disabled: !inputJson,
      destructive: true,
    },
  ];

  const validationStatus = !inputJson.trim() ? (
    <span className="text-muted-foreground">Ready for JSON input</span>
  ) : !hasStrictJsonSyntax ? (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-destructive/15 text-destructive border border-destructive/30">
      <AlertCircle className="size-3.5" />
      <span>{parseResult.valid ? "Syntax needs repair" : "Syntax Error"}</span>
      {parseResult.error?.line && (
        <span>
          (Line {parseResult.error.line}
          {parseResult.error.column ? `, Col ${parseResult.error.column}` : ""})
        </span>
      )}
    </span>
  ) : parseResult.valid ? (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
      <CheckCircle2 className="size-3.5" />
      <span>Valid JSON</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-destructive/15 text-destructive border border-destructive/30">
      <AlertCircle className="size-3.5" />
      <span>Syntax Error</span>
      {parseResult.error?.line && (
        <span>
          (Line {parseResult.error.line}
          {parseResult.error.column ? `, Col ${parseResult.error.column}` : ""}
          )
        </span>
      )}
    </span>
  );

  const singleLineFieldsControl = (
    <label className="inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1 text-foreground dark:border-primary/40 dark:bg-primary/10">
      <span className="whitespace-nowrap text-[11px] font-medium">
        Keep on one line
      </span>
      <input
        type="text"
        value={singleLineFieldName}
        onChange={(event) => setSingleLineFieldName(event.target.value)}
        placeholder="field1, field2"
        aria-label="JSON fields to keep on one line"
        title="Enter comma-separated field names to keep their string values on one line"
        className="h-7 w-36 rounded-md border border-primary/25 bg-background px-2 font-mono text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      />
    </label>
  );

  return (
    <AppLayout
      dark={dark}
      onToggleDark={toggle}
      jsonIndent={indent}
      onJsonIndentChange={setIndent}
      jsonSortOrder={sortOrder}
      onJsonSortOrderChange={handleSortKeys}
      onJsonFormat={handleFormat}
      onJsonLoadSample={handleLoadSample}
      onJsonClear={handleClear}
    >
      <div className="flex flex-col flex-1 min-w-0">
        {/* Sub-header Navigation and Toolbar */}
        <div className="min-h-16 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-3 sm:px-6 py-3 border-b border-border bg-card/60 backdrop-blur-xs 2xl:h-16">
          {/* Tool Identifier and Tool Tabs */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <ToolSwitcher currentTool="json" actions={mobileActions} />
          </div>
        </div>

        {/* Fixed / Sticky search toolbar & results container */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/60 shadow-xs">
          <div className="px-3 sm:px-6 py-2 bg-muted/20 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 flex-wrap">
              <SearchToolbar
                open={searchOpen}
                query={searchQuery}
                resultCount={searchResults.length}
                activeIndex={selectedSearchIndex}
                placeholder="Search JSON"
                status={
                  <div className="flex flex-wrap items-center gap-3">
                    {validationStatus}
                    {singleLineFieldsControl}
                    {!hasStrictJsonSyntax && inputJson.trim() && (
                      <button
                        type="button"
                        onClick={handleAutoFix}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-primary/35 bg-primary/10 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      >
                        <Sparkles className="size-3.5" />
                        <span>Auto-fix JSON</span>
                      </button>
                    )}
                  </div>
                }
                onOpenChange={setSearchOpen}
                onQueryChange={(query) => {
                  setSearchQuery(query);
                  setActiveSearchIndex(-1);
                  setSearchSelection(undefined);
                }}
                onNavigate={navigateSearchResults}
                onClose={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                  setSearchSelection(undefined);
                }}
              />
            </div>
          </div>

          <SearchResultsPanel
            open={searchOpen}
            query={searchQuery}
            resultCount={searchResults.length}
          >
            {searchResults.map((result, index) => (
              <button
                key={`${result.start}-${result.value}-${index}`}
                type="button"
                role="option"
                aria-selected={selectedSearchIndex === index}
                onClick={() => selectSearchResult(index)}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                  selectedSearchIndex === index
                    ? "bg-primary/20 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {result.line}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-xs">
                  {result.value}
                </span>
                {result.fuzzy && (
                  <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-sans text-[10px] text-primary">
                    Closest
                  </span>
                )}
              </button>
            ))}
          </SearchResultsPanel>
        </div>

        {/* Single editable JSON document */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 bg-background min-h-[500px]">
          {fileUploadStatus?.kind === "success" ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-8 text-center shadow-xs">
              <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="size-8 text-emerald-500" />
              </span>
              <span className="flex flex-col gap-1 text-xs">
                <span className="font-semibold text-foreground">
                  {fileUploadStatus.message}
                </span>
                {fileUploadStatus.fileName && (
                  <span className="break-all text-muted-foreground">
                    {fileUploadStatus.fileName}
                  </span>
                )}
              </span>
              <span className="text-xs text-muted-foreground" aria-live="polite">
                Opening editor in {uploadCountdown}…
              </span>
              <button
                type="button"
                onClick={() => setFileUploadStatus(null)}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <span>Open Editor</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          ) : (
            <CodeEditorPane
              title="JSON Editor"
              subTitle="Editable"
              value={inputJson}
              onChange={(value) => {
                setInputJson(value);
                setAutoFixChanges(null);
              }}
              placeholder="Paste or type JSON here..."
              errorLine={parseResult.error?.line}
              errorColumn={parseResult.error?.column}
              errorLength={parseResult.error?.length}
              selectionRequest={searchSelection}
              searchMatches={searchOpen && searchQuery ? searchResults : undefined}
              activeSearchIndex={selectedSearchIndex}
              jsonBlockIndent={
                hasStrictJsonSyntax
                  ? indent === "tab"
                    ? "\t"
                    : " ".repeat(indent)
                  : undefined
              }
              editorNotice={
                <>
                  {fileUploadStatus?.kind === "error" && (
                    <div
                      role="status"
                      className="mx-3 mt-3 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-destructive sm:mx-4"
                    >
                      <AlertCircle className="size-5 shrink-0" />
                      <span className="text-xs font-medium">
                        {fileUploadStatus.message}
                      </span>
                    </div>
                  )}
                  {autoFixChanges !== null && (
                    <div
                      role="status"
                      className={`mx-3 mt-3 rounded-lg border px-3 py-2.5 text-xs sm:mx-4 ${
                        autoFixChanges.length
                          ? "border-emerald-500/30 bg-emerald-500/10 text-foreground"
                          : "border-amber-500/30 bg-amber-500/10 text-foreground"
                      }`}
                    >
                      {autoFixChanges.length ? (
                        <>
                          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                            Fixed {autoFixChanges.length} syntax{" "}
                            {autoFixChanges.length === 1 ? "issue" : "issues"}:
                          </p>
                          <ul className="mt-1 list-inside list-disc space-y-0.5 text-muted-foreground">
                            {autoFixChanges.map((change, index) => (
                              <li key={`${change.line}-${index}`}>
                                {change.description} (line {change.line})
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p>
                          No safe automatic fix was found. Check the syntax
                          error below and correct it manually.
                        </p>
                      )}
                    </div>
                  )}
                </>
              }
              extraHeaderActions={
                <>
                  <label
                    title="Upload .json file"
                    className="inline-flex items-center justify-center size-7 rounded-md border border-border/60 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                  >
                    <Upload className="size-3.5" />
                    <input
                      type="file"
                      accept=".json,application/json,text/plain"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!inputJson}
                    title="Download current JSON"
                    aria-label="Download current JSON"
                    className="inline-flex items-center justify-center size-7 rounded-md border border-border/60 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Download className="size-3.5" />
                  </button>
                </>
              }
              footer={
                !parseResult.valid && parseResult.error ? (
                  <div className="p-3 bg-destructive/10 border-t border-destructive/20 text-xs space-y-1.5 font-mono">
                    <div className="flex items-start gap-2 text-destructive font-semibold">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span className="leading-snug">
                        {parseResult.error.message}
                        {parseResult.error.line !== undefined && (
                          <span>
                            {" "}
                            (Line {parseResult.error.line}
                            {parseResult.error.column !== undefined
                              ? `, column ${parseResult.error.column}`
                              : ""}
                            )
                          </span>
                        )}
                      </span>
                    </div>
                    {parseResult.error.excerpt && (
                      <pre className="p-2 bg-destructive/15 text-destructive rounded overflow-x-auto text-[11px] leading-tight select-all">
                        {parseResult.error.excerpt}
                      </pre>
                    )}
                  </div>
                ) : null
              }
            />
          )}
        </div>

        {/* Informational & FAQ Section */}
        <section
          aria-label="About JSON Formatter and FAQs"
          className="border-t border-border/60 bg-muted/20 px-4 sm:px-6 py-12"
        >
          <div className="max-w-4xl mx-auto space-y-10">
            {/* Section Header */}
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Online JSON Formatter &amp; Validator – Private, Fast &amp;
                Accurate
              </h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Beautify nested payloads, strip whitespace with minification,
                recursively sort object keys, and instantly pinpoint syntax
                errors. Everything runs 100% inside your browser for zero data
                exposure.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                  <Sparkles className="size-4" />
                  <span>Custom Formatting</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Choose between 2 spaces, 4 spaces, or tab indentation to match
                  your codebase styling.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs">
                  <Layers className="size-4" />
                  <span>Recursive Key Sorting</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Order object keys alphabetically without reordering arrays for
                  deterministic, reliable diffs.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                  <Code2 className="size-4" />
                  <span>Diff Tool Integration</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Easily send raw and formatted JSON directly to DiffViewer to
                  inspect differences line by line.
                </p>
              </div>
            </div>

            {/* FAQ Cards */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-foreground font-semibold text-base">
                <HelpCircle className="size-4 text-primary" />
                <h3>Frequently Asked Questions</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {JSON_FAQS.map((f) => (
                  <div
                    key={f.q}
                    className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-2xs space-y-1.5"
                  >
                    <div className="font-medium text-xs text-foreground">
                      {f.q}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {f.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
