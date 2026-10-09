export interface Post {
  slug: string
  title: string
  description: string
  date: string // YYYY-MM-DD
  readMins: number
  sections: { heading: string; body: string[] }[]
}

export const POSTS: Post[] = [
  {
    slug: 'how-to-compare-two-text-files-online',
    title: 'How to Compare Two Text Files Online (Free, No Upload)',
    description:
      'A quick guide to comparing two text or code files online, reading a diff, and doing it privately in your browser.',
    date: '2026-10-09',
    readMins: 4,
    sections: [
      {
        heading: 'What a diff actually shows',
        body: [
          'A diff compares two versions of a text and highlights what changed: lines that were removed, lines that were added, and lines that were edited. Reading a diff is much faster than scanning two files by eye.',
          'Good diff tools also highlight changes inside a line, so you can see that only one word or one character moved instead of the whole line.',
        ],
      },
      {
        heading: 'Steps to compare two files',
        body: [
          'Open DiffViewer and paste your original text on the left and the modified text on the right. Switch to Diff mode to see both sides aligned with changes highlighted.',
          'Click any line to inspect it in the bottom panels, where word-level differences are marked in red (removed) and green (added). You can edit either side directly and the diff updates instantly.',
        ],
      },
      {
        heading: 'Keeping your data private',
        body: [
          'DiffViewer runs the comparison in your browser, so the text you paste is not sent to a server. Still, avoid pasting passwords, API keys or customer data into any online tool unless you trust how it is hosted.',
        ],
      },
    ],
  },
  {
    slug: 'diff-vs-git-diff-what-is-the-difference',
    title: 'Online Diff Checker vs git diff: When to Use Which',
    description:
      'git diff is great inside a repository, but an online diff checker is faster for snippets, configs and pasted text. Here is when to use each.',
    date: '2026-10-09',
    readMins: 3,
    sections: [
      {
        heading: 'git diff is tied to a repository',
        body: [
          'git diff compares committed, staged or working-tree changes. It needs a repository and a terminal, which is ideal for code under version control.',
        ],
      },
      {
        heading: 'An online diff checker works on anything',
        body: [
          'If you have two pasted snippets, two API responses, or two config files from different servers, there is nothing to commit. A browser-based diff lets you paste both and compare in seconds.',
        ],
      },
      {
        heading: 'Rule of thumb',
        body: [
          'Use git diff for tracked project history. Use an online diff checker for ad-hoc comparisons, quick reviews and sharing a visual difference with someone who does not use Git.',
        ],
      },
    ],
  },
  {
    slug: 'compare-json-files-and-api-responses',
    title: 'How to Compare Two JSON Files or API Responses',
    description:
      'Tips for diffing JSON and API responses: format first, pick the JSON language mode, and focus on the changed keys.',
    date: '2026-10-09',
    readMins: 4,
    sections: [
      {
        heading: 'Format both sides the same way',
        body: [
          'JSON diffs get noisy when one side is minified and the other is pretty-printed. Format both with the same indentation (two spaces is common) before comparing.',
        ],
      },
      {
        heading: 'Use the JSON language mode',
        body: [
          'Select json in the language dropdown for syntax highlighting. It makes keys, strings and numbers easy to tell apart, which helps when scanning large responses.',
        ],
      },
      {
        heading: 'Watch for ordering and volatile fields',
        body: [
          'Object key order can differ without changing meaning, and fields such as timestamps or request IDs change every call. Ignore those and focus on the values that matter, like status codes, prices or flags.',
        ],
      },
    ],
  },
]

export const getPost = (slug: string) => POSTS.find(p => p.slug === slug)