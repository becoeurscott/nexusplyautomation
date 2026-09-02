/**
 * Proves `parseJsonReply` survives what models actually return.
 *
 * `chat({json: true})` is a hint, not a guarantee, and a parse failure happens
 * *after* the customer's credit is spent — so this is a real acceptance test,
 * not a nicety. Run: `npx tsx scripts/check-ai-json.ts`
 */
import { asStringArray, clampScore, parseJsonReply } from "../src/lib/ai/json";

type Case = { name: string; input: string; expectObject: boolean };

const CASES: Case[] = [
  { name: "clean object", input: '{"score":72}', expectObject: true },
  {
    name: "markdown-fenced json",
    input: '```json\n{"score":72}\n```',
    expectObject: true,
  },
  { name: "bare fence", input: '```\n{"score":72}\n```', expectObject: true },
  {
    name: "leading prose",
    input: 'Sure! Here is the analysis:\n{"score":72}',
    expectObject: true,
  },
  {
    name: "prose on both sides",
    input: 'Here you go:\n{"score":72}\nHope that helps!',
    expectObject: true,
  },
  { name: "nested braces", input: '{"a":{"b":1},"score":72}', expectObject: true },
  { name: "empty string", input: "", expectObject: false },
  { name: "prose only", input: "I could not score that post.", expectObject: false },
  { name: "truncated json", input: '{"score":72,"factors":[', expectObject: false },
  { name: "bare number", input: "72", expectObject: false },
  { name: "bare string", input: '"seventy two"', expectObject: false },
];

let failed = 0;

console.log("parseJsonReply");
for (const c of CASES) {
  const got = parseJsonReply(c.input);
  const isObject = got !== null && typeof got === "object";
  const pass = isObject === c.expectObject;
  if (!pass) failed++;
  console.log(
    `  ${pass ? "PASS" : "FAIL"}  ${c.name.padEnd(22)} → ${isObject ? "object" : "null"}`,
  );
}

const CLAMPS: [unknown, number][] = [
  [72, 72],
  ["85", 85],
  [72.6, 73],
  [-10, 0],
  [420, 100],
  [NaN, 0],
  [null, 0],
  [undefined, 0],
  ["not a number", 0],
];

console.log("\nclampScore");
for (const [input, expected] of CLAMPS) {
  const got = clampScore(input);
  const pass = got === expected;
  if (!pass) failed++;
  console.log(
    `  ${pass ? "PASS" : "FAIL"}  ${String(input).padEnd(14)} → ${got} (want ${expected})`,
  );
}

console.log("\nasStringArray");
const ARRAYS: [unknown, number, number][] = [
  [["a", "b"], 5, 2],
  [["a", 1, null, "b"], 5, 2],
  [["  a  ", "", "  "], 5, 1],
  [["a", "b", "c"], 2, 2],
  ["not an array", 5, 0],
  [null, 5, 0],
];
for (const [input, limit, expectedLen] of ARRAYS) {
  const got = asStringArray(input, limit);
  const pass = got.length === expectedLen;
  if (!pass) failed++;
  console.log(
    `  ${pass ? "PASS" : "FAIL"}  ${JSON.stringify(input)?.slice(0, 24).padEnd(26)} → ${got.length} (want ${expectedLen})`,
  );
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll AI JSON parsing checks passed.");
