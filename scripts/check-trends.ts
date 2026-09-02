/**
 * Proves `summarisePosts` ranks and extracts correctly.
 *
 * This is the half of a trend capture that decides what a customer is told is
 * "working", so it gets a test rather than a hopeful comment. Payload shapes
 * vary by platform, which is exactly where a silent wrong answer would come
 * from. Run: `npx tsx scripts/check-trends.ts`
 */
import { summarisePosts } from "../src/lib/trends";

let failed = 0;
function check(name: string, pass: boolean, detail = "") {
  if (!pass) failed++;
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log("summarisePosts");

// Nothing to rank
check("null payload → null", summarisePosts(null) === null);
check("empty array → null", summarisePosts([]) === null);
check(
  "unpublished posts only → null",
  summarisePosts([{ id: "1", content: "draft", status: "scheduled" }]) === null,
);
check(
  "post with no id → null",
  summarisePosts([{ content: "x", publishedAt: "2026-01-01" }]) === null,
);

// Ranking: shares weigh more than likes, which weigh more than views.
const ranked = summarisePosts([
  { id: "views", content: "a", publishedAt: "2026-01-01", views: 100 },
  { id: "shares", content: "b", publishedAt: "2026-01-01", shares: 10 }, // 10*30 = 300
  { id: "likes", content: "c", publishedAt: "2026-01-01", likes: 15 }, // 15*10 = 150
]);
check("ranks by weighted engagement", ranked?.topPosts[0]?.id === "shares", `got ${ranked?.topPosts[0]?.id}`);
check("second place correct", ranked?.topPosts[1]?.id === "likes", `got ${ranked?.topPosts[1]?.id}`);

// Alternate key names (snake_case + platform aliases) still parse.
const aliased = summarisePosts({
  posts: [
    {
      _id: "alt",
      caption: "hello #One",
      published_at: "2026-01-01",
      videoViews: 50,
      reactions: 2,
    },
  ],
});
check("reads _id / caption / published_at / videoViews", aliased?.topPosts[0]?.id === "alt");
check("score computed from aliases", aliased?.topPosts[0]?.score === 70, `got ${aliased?.topPosts[0]?.score}`);

// Hashtags: deduped within a post, counted across posts, lowercased.
const tagged = summarisePosts([
  { id: "1", content: "#School #school #Open", publishedAt: "2026-01-01", views: 10 },
  { id: "2", content: "#school day", publishedAt: "2026-01-01", views: 5 },
]);
const school = tagged?.topHashtags.find((h) => h.tag === "#school");
check("hashtags lowercased and deduped per post", school?.count === 2, `got ${school?.count}`);
check("distinct tags kept", tagged?.topHashtags.some((h) => h.tag === "#open") === true);
check(
  "most common tag first",
  tagged?.topHashtags[0]?.tag === "#school",
  `got ${tagged?.topHashtags[0]?.tag}`,
);

// Unicode hashtags (accented / non-Latin) survive — the audience is not
// English-only, and a \w-based regex would silently drop these.
const unicode = summarisePosts([
  { id: "1", content: "#école #школа", publishedAt: "2026-01-01", views: 1 },
]);
check("unicode hashtags captured", unicode?.topHashtags.length === 2, `got ${unicode?.topHashtags.length}`);

// Caps
const many = summarisePosts(
  Array.from({ length: 30 }, (_, i) => ({
    id: String(i),
    content: `#tag${i}`,
    publishedAt: "2026-01-01",
    views: i,
  })),
);
check("top posts capped at 10", many?.topPosts.length === 10, `got ${many?.topPosts.length}`);
check("hashtags capped at 15", (many?.topHashtags.length ?? 0) <= 15);
check("highest scorer first", many?.topPosts[0]?.id === "29", `got ${many?.topPosts[0]?.id}`);

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll trend summary checks passed.");
