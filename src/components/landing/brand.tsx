import Link from "next/link";

/**
 * Interlocking-chevron "N" mark. On the dark Nexus theme the wordmark is white
 * with a cobalt accent chevron. Swap for /img/nexus/logo-mark.png if preferred.
 */
export function Logo({
  size = 28,
  showWordmark = true,
}: {
  size?: number;
  showWordmark?: boolean;
}) {
  return (
    <Link href="/" className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="NexusPly"
      >
        <path
          d="M6 24 L6 8 L12 8 L12 18 L20 8 L26 8 L26 24 L20 24 L20 14 L12 24 Z"
          fill="#ffffff"
        />
        <path d="M18 15 L26 8 L26 12 L20 18 Z" fill="var(--nx-blue)" />
      </svg>
      {showWordmark && (
        <span className="font-display text-[17px] font-bold tracking-tight text-white">
          NexusPly
        </span>
      )}
    </Link>
  );
}
