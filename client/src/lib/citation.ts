export interface CitableBook {
  title: string;
  author: string;
  isbn: string;
}

// Formats a "Firstname Lastname" (optionally multiple authors separated by
// commas/"and") into "Lastname, F." for APA/Chicago author-date style.
function invertName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const last = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map((p) => `${p[0].toUpperCase()}.`).join(' ');
  return `${last}, ${initials}`;
}

export function generateCitations(book: CitableBook) {
  const { title, author, isbn } = book;

  return {
    apa: `${invertName(author)} (n.d.). ${title}. ISBN ${isbn}.`,
    mla: `${author}. ${title}. n.d.`,
    chicago: `${author}. ${title}. n.d.`,
  };
}

export type CitationStyle = keyof ReturnType<typeof generateCitations>;
