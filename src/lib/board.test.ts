import assert from "node:assert/strict";
import test from "node:test";
import { applyProgress, filmPost, projectRows, sharePost, type StoredPlayer } from "./board.ts";

test("board ranks real progress and counts refs without seed players", () => {
  const now = 1_000;
  let players: StoredPlayer[] = [];
  players = applyProgress(players, { handle: "ada", referrer: "", round: "home", tasks: ["like", "repost", "comment", "notify", "token", "announce", "follow"], now });
  players = applyProgress(players, { handle: "bea", referrer: "ada", round: "home", tasks: ["like"], now: now + 1 });
  players = applyProgress(players, { handle: "bea", referrer: "ada", round: "home", tasks: ["repost"], now: now + 2 });
  const rows = projectRows(players);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.handle, "ada");
  assert.equal(rows[0]?.tasksDone, 7);
  assert.equal(rows[0]?.refs, 1);
  assert.equal(rows[0]?.earnedUsd, 50);
  assert.equal(rows[0]?.complete, true);
  assert.equal(rows[1]?.handle, "bea");
  assert.equal(rows[1]?.tasksDone, 2);
  assert.equal(rows[1]?.refs, 0);
  assert.equal(rows[1]?.earnedUsd, 0);
});

test("progress only adds tasks and ignores a self referral", () => {
  const players = applyProgress(
    [{ handle: "ada", referrer: "", rounds: { home: ["like"] }, updatedAt: 1 }],
    { handle: "Ada", referrer: "ada", round: "home", tasks: ["repost"], now: 2 },
  );
  assert.deepEqual(players[0]?.rounds.home, ["like", "repost"]);
  assert.equal(players[0]?.referrer, "");
});

test("share post includes the public ref link, score, and tags", () => {
  const text = sharePost({
    handle: "ada",
    tasksDone: 7,
    tasksTotal: 7,
    refs: 2,
    score: 1700,
    earnedUsd: 50,
    rank: 3,
    priceUsd: 0.000004395,
    complete: true,
  });
  assert.match(text, /Just completed the ClawCash tasks/);
  assert.match(text, /Collected \$50\.00/);
  assert.match(text, /Rank #3/);
  assert.match(text, /Score 1,700/);
  assert.match(text, /Refs 2/);
  assert.match(text, /https:\/\/clawcash\.vercel\.app\/r\/ada/);
  assert.match(text, /@CLAWRENAi @clawpumptech/);
  assert.match(text, /#CLAWRENA #ClawCash #ClawPump/);
  assert.match(text, /\$0\.00000440/);
  assert.ok(text.trimEnd().endsWith("https://clawcash.vercel.app/r/ada"));
});

test("film post ends on the full orbit video", () => {
  const text = filmPost();
  assert.match(text, /Site https:\/\/clawcash\.vercel\.app/);
  assert.match(text, /@CLAWRENAi @clawpumptech/);
  assert.match(text, /#CLAWRENA #ClawCash #ClawPump/);
  assert.ok(text.trimEnd().endsWith("https://clawcash.vercel.app/collection/orbit.mp4"));
});
