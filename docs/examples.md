# Examples

Worked example projects for exercising the full Synapse flow — build a
node, test it in the playground, export, and wire it into a real MCP
client. Each example below has been built and verified end-to-end this
way; add new ones the same way rather than editing these in place.

Every Code block reads a parsed `input` object and must `return` a string.
`async`/`await` work; **`fetch` and `console` are not available** (see the
README's [Security](../README.md#security) section for why) — these
examples are all pure computation for that reason.

## 1. `current_time` — single tool, no inputs

The smallest possible example: a tool that knows something an LLM can't
(the real current time).

- **Tool** `current_time`, no input properties.
- Code:
  ```js
  return new Date().toISOString();
  ```
- Group it, expose the group, export, wire into Claude Desktop, then ask
  it *"what's the current time?"*.

## 2. Text Toolkit — multiple node kinds, typed inputs

One project exercising all three MCP primitives together as a single
exposed kit.

- **Tool** `word_stats` — input properties: `text` (string, required),
  `include_reading_time` (boolean, optional).
  ```js
  const words = input.text.trim().split(/\s+/).filter(Boolean);
  const freq = {};
  for (const w of words) {
    const key = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (key) freq[key] = (freq[key] || 0) + 1;
  }
  const topWord = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const stats = {
    words: words.length,
    characters: input.text.length,
    mostFrequentWord: topWord,
  };
  if (input.include_reading_time) {
    stats.readingTimeMinutes = Math.ceil(words.length / 200);
  }
  return JSON.stringify(stats);
  ```
- **Tool** `slugify` — input properties: `text` (string, required),
  `max_length` (number, optional).
  ```js
  let slug = input.text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (input.max_length) slug = slug.slice(0, input.max_length).replace(/-+$/, "");
  return slug;
  ```
- **Resource** `synapse://text-toolkit/style-guide`
  ```js
  return "# Style Guide\n\n- Prefer active voice.\n- One idea per sentence.\n- Cut adverbs where the verb already carries the weight.";
  ```
- **Prompt** `improve-writing` — arguments: `text` (required), `tone`
  (required).
  ```js
  return `Rewrite the following text in a ${input.tone} tone, keeping the meaning intact:\n\n${input.text}`;
  ```
- Group all four, expose the group, export, wire it in, then ask the
  client to run `word_stats` on a paragraph, or `slugify` a title.

This example is also a good live regression check for the node editor's
"Input properties" list: type quickly into `word_stats`'s two property
rows back-to-back — that's the exact scenario a past focus-loss bug broke.

## Adding a new example

When you build one worth keeping: add a numbered section here with the
node kinds, their input properties (if any), and their full Code block —
enough for someone to reproduce it from this file alone, the same way the
two above are written.
