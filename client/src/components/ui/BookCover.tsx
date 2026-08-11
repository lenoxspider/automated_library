// Generates a consistent solid-color placeholder (hash of title/isbn -> hue)
// with the book's initials centered, so there is never a broken image icon.
// Used as the <img> fallback everywhere a cover is shown; once the backend
// cover-cache utility (Part 3) resolves a real /covers/{isbn}.jpg, `src`
// takes over instead.
function hashToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

function initials(title: string): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

interface BookCoverProps {
  title: string;
  isbn?: string;
  src?: string | null;
  className?: string;
}

export default function BookCover({ title, isbn, src, className = '' }: BookCoverProps) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={`Cover of ${title}`} className={`object-cover ${className}`} loading="lazy" />;
  }

  const hue = hashToHue(isbn || title);
  return (
    <div
      className={`flex items-center justify-center font-mono font-bold text-white/90 ${className}`}
      style={{ backgroundColor: `hsl(${hue}, 45%, 32%)` }}
      role="img"
      aria-label={`Cover placeholder for ${title}`}
    >
      <span className="text-2xl">{initials(title)}</span>
    </div>
  );
}
