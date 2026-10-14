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
