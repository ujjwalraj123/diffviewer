export interface FAQItem {
  q: string
  a: string
}

export const FAQS: FAQItem[] = [
  {
    q: "Is this diff checker free?",
    a: "Yes. DiffViewer is completely free to use with no sign-up, no limits on the number of comparisons, and no watermarks.",
  },
  {
    q: "Is my data uploaded to a server?",
    a: "No. The comparison runs entirely client-side in your browser. Your text and code never leave your device, making it safe for confidential files and API tokens.",
  },
  {
    q: "What can I compare?",
    a: "You can compare any two pieces of text, code, JSON, configuration files, SQL queries, or markup with precise character-level highlighting.",
  },
  {
    q: "How do I switch between Split and Unified diff view?",
    a: "In the left sidebar or the diff action bar, click 'Split' for a side-by-side view, or 'Unified' for a single stacked view with colored additions and deletions.",
  },
  {
    q: "How does the character-level diff highlighting work?",
    a: "DiffViewer pinpoints changes at the individual character level. Unchanged text remains unhighlighted, while deleted characters are tinted red and inserted characters are tinted green, showing exact edits instantly.",
  },
]

export const JSON_FAQS: FAQItem[] = [
  {
    q: "Why should I format or beautify my JSON?",
    a: "Raw JSON from APIs and production servers is often minified without indentation or line breaks to reduce payload size. Beautifying JSON introduces consistent indentation and line breaks, making it human-readable, easier to debug, and simple to compare.",
  },
  {
    q: "Is my JSON data uploaded to an external server?",
    a: "No. All parsing, validation, formatting, minification, and key sorting happen 100% locally inside your web browser. Your data never leaves your computer.",
  },
  {
    q: "How does the JSON validator locate syntax errors?",
    a: "Our validator analyzes the JSON parser tokens in real time. If a syntax error occurs (such as a trailing comma, unquoted key, or missing bracket), it reports the exact line number, column number, and an excerpt highlighting where the mistake is.",
  },
  {
    q: "What does sorting object keys do?",
    a: "In the JSON specification, object keys have no intrinsic order. Two API responses with identical data can produce a noisy diff if keys are ordered differently. Sorting keys alphabetically arranges every object in a deterministic order so you can accurately compare versions.",
  },
  {
    q: "What is the difference between beautifying and minifying JSON?",
    a: "Beautifying adds newlines and indentation (2 spaces, 4 spaces, or tabs) for human inspection. Minifying strips all unnecessary whitespace and newlines, creating the smallest possible payload for production transmission or storage.",
  },
  {
    q: "Can I compare my raw JSON with the formatted result in DiffViewer?",
    a: "Yes! Click the 'Compare in Diff Tool' button in the toolbar. DiffViewer will automatically load your raw JSON on the left and the formatted JSON on the right so you can inspect structural modifications side by side.",
  },
]

