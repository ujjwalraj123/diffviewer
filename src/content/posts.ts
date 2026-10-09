export interface Post {
  slug: string
  title: string
  description: string
  date: string // YYYY-MM-DD
  readMins: number
  sections: { heading: string; body: string[] }[]
}

export const POSTS: Post[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // POST 1
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'how-to-compare-two-text-files-online',
    title: 'How to Compare Two Text Files Online (Free, No Upload)',
    description:
      'A practical guide to comparing two text or code files online: how a diff works, how to read the highlights, and how to keep your data private in the browser.',
    date: '2026-10-09',
    readMins: 4,
    sections: [
      {
        heading: 'Why comparing text by eye does not work',
        body: [
          `Anyone who has tried to spot the difference between two versions of a document knows how unreliable human eyes are. You read the first paragraph, then the second, and your brain quietly fills in what it expects to see. A missing comma, a swapped digit or a changed variable name can sit in plain sight for hours.`,
          `This gets worse as the text grows. A configuration file with 300 lines or an API response with thousands of characters is simply too long to compare line by line from memory. That is the problem a diff checker solves. It does the comparison for you, instantly and without getting tired, and shows only the parts that are different.`,
        ],
      },
      {
        heading: 'What a diff actually shows',
        body: [
          `A diff takes two versions of a text, usually called the original and the modified version, and works out the smallest set of changes that turns one into the other. The result falls into three simple categories: lines that were removed, lines that were added, and lines that were changed.`,
          `Most tools show these changes side by side. The original sits on the left and the modified version on the right, with matching lines aligned so you can follow the text across. Lines that are identical stay quiet, while changed lines are tinted so your eye jumps straight to them. Better tools go one step further and highlight changes inside a line, so you can see that only a single word moved rather than the entire sentence.`,
        ],
      },
      {
        heading: 'How to compare two texts in DiffViewer',
        body: [
          `Open DiffViewer and you will start in Edit mode with two editors. Paste your original text into the left editor and the updated text into the right one. If you are working with code, choose the matching language from the dropdown in the toolbar so you get proper syntax highlighting. There are options for JavaScript, TypeScript, JSON, HTML, CSS, Python, SQL, YAML and more.`,
          `Next, switch to Diff mode using the toggle in the toolbar. Both texts now appear in one side-by-side view with every change highlighted. Click on any line and two panels open at the bottom, showing that line from the original and from the modified side. Because these panels are editable, you can fix a typo or tweak a value right there and watch the diff update straight away. The copy button next to each panel lets you grab the result in one click.`,
        ],
      },
      {
        heading: 'Reading the highlights correctly',
        body: [
          `Colour is the quickest way to read a diff. Red marks content that exists in the original but is gone from the modified version. Green marks content that is new in the modified version. Everything without a tint is unchanged and can be ignored on a first pass.`,
          `Pay attention to the difference between line-level and word-level highlighting. When a whole line is tinted, the line was added or removed. When only a few words inside a line are tinted, the line was edited. In the bottom panels, DiffViewer marks the exact words that changed, which is especially useful for long lines such as minified code, URLs or log entries where a one-character difference is otherwise almost invisible.`,
        ],
      },
      {
        heading: 'Everyday situations where a diff saves time',
        body: [
          `Developers reach for a diff checker when reviewing a code change, comparing two versions of a configuration file, or checking what changed between two API responses. Writers and editors use them to see what a colleague altered in a draft. Students compare their answer with a reference solution. System administrators compare settings between two servers when one behaves differently from the other.`,
          `Any time you think "something is different here but I cannot see what", a diff is the right tool. It turns a vague suspicion into a concrete list of changes you can act on.`,
        ],
      },
      {
        heading: 'Tips for cleaner comparisons',
        body: [
          `Start by making sure both sides are formatted the same way. Differences in indentation, line endings or trailing spaces can flood the diff with changes that do not matter. If you are comparing code, run it through the same formatter first so only real changes remain.`,
          `Compare the right amount of text. If you paste two whole files but only care about one function, trim both sides down to that function. A smaller input gives a clearer result. Finally, keep the original and the modified version on the correct sides. Swapping them flips every red line to green and vice versa, which is a common source of confusion.`,
        ],
      },
      {
        heading: 'Keeping your data private',
        body: [
          `Privacy matters when the text you compare contains anything sensitive. DiffViewer runs the comparison in your browser, so the text you paste is not uploaded to a server for processing. That makes it suitable for quick checks of everyday code and documents.`,
          `As a general habit, avoid pasting passwords, API keys, private tokens or customer data into any online tool, however it is built. Replace secrets with placeholders before you compare, and you get the same result with no risk.`,
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // POST 2
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'diff-vs-git-diff-what-is-the-difference',
    title: 'Online Diff Checker vs git diff: When to Use Which',
    description:
      'git diff is powerful inside a repository, but an online diff checker is faster for pasted snippets, configs and API responses. Learn when to use each tool.',
    date: '2026-10-09',
    readMins: 4,
    sections: [
      {
        heading: 'Two tools, one idea',
        body: [
          `Both git diff and an online diff checker answer the same question: what is different between these two versions? The idea behind them is identical. They find the lines that were added, removed or changed and present them so you can review quickly.`,
          `Where they differ is in what they work with and how much setup they need. Picking the right one saves time, and many developers end up using both in the same week.`,
        ],
      },
      {
        heading: 'What git diff is built for',
        body: [
          `git diff is part of Git, the version control system most software teams use. It compares things that Git tracks. By default it shows the changes in your working directory that have not been staged yet. With the staged option it shows what is about to be committed, and you can also compare two commits, two branches or a commit against the current state.`,
          `This makes it ideal for reviewing your own work before you commit, understanding what a teammate changed, or tracking down when a bug was introduced. The output lives in the terminal, works in scripts and integrates with code review tools. If your files are in a repository, git diff is the natural choice.`,
        ],
      },
      {
        heading: 'Where git diff gets awkward',
        body: [
          `Not everything you want to compare lives in a repository. Imagine two JSON responses from an API, a config file copied from a production server, or a snippet someone sent you in a chat message. To use git diff you would have to save both to files, and either put them in a repository or use the no-index mode to compare two arbitrary files. That is a lot of ceremony for a quick check.`,
          `The terminal view also takes some getting used to. Unified diff output with plus and minus signs and hunk headers is efficient once you are fluent, but it is not friendly to people who do not live in the command line, such as designers, product managers or writers.`,
        ],
      },
      {
        heading: 'What an online diff checker is built for',
        body: [
          `An online diff checker removes the setup. You open the page, paste the original on one side and the modified text on the other, and the differences appear. There is nothing to install, no files to save and no repository to initialise. It works on any text at all: code, prose, logs, SQL, YAML or the output of another command.`,
          `Visual presentation is the other advantage. In DiffViewer both versions are shown side by side with colour highlighting, and you can click a line to see exactly which words changed. You can also edit either side directly and see the diff update, which makes it easy to experiment, merge pieces by hand or clean up text before using it elsewhere.`,
        ],
      },
      {
        heading: 'Sharing a difference with non-developers',
        body: [
          `One often overlooked benefit is communication. Telling a colleague "run git diff on that branch" is only useful if they have the code, Git and the habit. A visual, side-by-side comparison is understandable to almost anyone. When you need to show a client, a manager or a teammate from another discipline what changed between two versions of a text, a browser-based diff is far easier to follow than raw terminal output.`,
        ],
      },
      {
        heading: 'A simple rule of thumb',
        body: [
          `Use git diff when the files are tracked in a repository and you care about history, branches or commits. It is the right tool for reviewing code that is part of a project.`,
          `Use an online diff checker for everything ad hoc: pasted snippets, two API responses, config files from different machines, drafts of a document, or any comparison where creating a repository would be overkill. It is also the better choice when you want a quick visual answer or need to share one.`,
          `Neither tool replaces the other. Think of git diff as the precise instrument for version-controlled work and an online diff checker as the fast, flexible tool for everything else. Knowing both means you always have the quickest route to the answer.`,
        ],
      },
      {
        heading: 'A note on privacy',
        body: [
          `Because git diff runs on your machine, your data never leaves it. A browser-based tool can offer the same property if the comparison runs locally, which is how DiffViewer works. Whichever tool you use, do not paste secrets such as passwords or access tokens into a tool unless you are sure how it handles your data.`,
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // POST 3
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'compare-json-files-and-api-responses',
    title: 'How to Compare Two JSON Files or API Responses',
    description:
      'Learn how to diff JSON files and API responses accurately: format both sides, handle key order, ignore volatile fields and find the changes that matter.',
    date: '2026-10-09',
    readMins: 4,
    sections: [
      {
        heading: 'Why JSON comparisons go wrong',
        body: [
          `JSON is everywhere. It powers API responses, configuration files, package manifests and data exports. Sooner or later you need to know how two JSON documents differ: what changed between yesterday's response and today's, or why staging behaves differently from production.`,
          `The trouble is that two JSON documents can mean exactly the same thing and still look completely different as text. A plain text diff does not know that, so a careless comparison produces a wall of red and green that hides the real changes. A little preparation fixes almost all of it.`,
        ],
      },
      {
        heading: 'Step 1: format both sides the same way',
        body: [
          `The most common problem is formatting. One response may arrive minified on a single line, while the other is neatly indented. A diff will report the whole thing as changed even though the data is identical.`,
          `Format both documents with the same settings before comparing. In a browser console you can use JSON.stringify with the value, null and 2 as arguments to get two-space indentation. On the command line, jq with a single dot does the same job. Two spaces is a good default because it keeps lines short and readable. Once both sides share a layout, the diff only shows genuine changes.`,
        ],
      },
      {
        heading: 'Step 2: choose the JSON language mode',
        body: [
          `In DiffViewer, open the language dropdown in the toolbar and select json. This turns on syntax highlighting, so keys, strings, numbers and booleans each get their own colour. It sounds cosmetic, but it genuinely helps when you scan a long response, because you can tell at a glance whether a changed value is text, a number or a flag.`,
          `Paste the original into the left editor and the modified version into the right, then switch to Diff mode. Click any highlighted line to inspect it in the panels at the bottom, where the exact words and characters that changed are marked.`,
        ],
      },
      {
        heading: 'Step 3: deal with key ordering',
        body: [
          `According to the JSON specification, the order of keys inside an object has no meaning. Two servers can return the same data with the keys in a different order, and a text diff will flag every moved line as a change.`,
          `If you suspect ordering is the cause, sort the keys of both documents before comparing. The jq tool can do this with its sort-keys option, and many editors and formatters have an equivalent. Be careful with arrays, though. Unlike object keys, the order of items in an array usually does matter, so do not sort those unless you know the order is irrelevant.`,
        ],
      },
      {
        heading: 'Step 4: ignore the noise',
        body: [
          `API responses often contain fields that change on every request: timestamps, request IDs, trace tokens, session identifiers and cache values. They are real differences in the text but meaningless for your investigation.`,
          `Remove these fields from both sides, or replace them with the same placeholder, before you compare. What remains are the values that carry meaning, such as status codes, prices, feature flags, permissions and counts. This single step often turns a diff of hundreds of lines into a diff of three or four.`,
        ],
      },
      {
        heading: 'Subtle differences to watch for',
        body: [
          `Even after cleaning up, a few subtle issues deserve attention. A value of null is not the same as a missing key, and an empty string is not the same as null. The number 1 and the string "1" look similar but behave differently in code. Very large numbers can lose precision in some languages, so two systems may show slightly different digits for the same value.`,
          `Word-level highlighting is helpful here. When a line shows only a small tinted fragment, such as a pair of quotes or a trailing decimal, you immediately know the data type or precision changed rather than the content itself.`,
        ],
      },
      {
        heading: 'Keep sensitive data out',
        body: [
          `API responses frequently contain personal data, tokens or internal identifiers. DiffViewer compares your text in the browser instead of sending it to a server, which is a good start. Even so, replace real emails, keys and customer details with dummy values before pasting, and you can compare with complete peace of mind.`,
        ],
      },
    ],
  },
]

export const getPost = (slug: string) => POSTS.find(p => p.slug === slug)