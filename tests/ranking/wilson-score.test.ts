import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateWilsonLowerBound, evaluateReviewQuality } from "../../lib/ranking/factors/review-quality";

test("Wilson Score: unreviewed game (0 reviews) defaults to neutral 0.5", () => {
  const score = calculateWilsonLowerBound(0, 0);
  assert.strictEqual(score, 0.5);
});

test("Wilson Score: strictly bounded between 0 and 1", () => {
  const tests = [
    { pos: 0, tot: 100 },
    { pos: 100, tot: 100 },
    { pos: 50, tot: 100 },
    { pos: 1, tot: 1 },
    { pos: 9500, tot: 10000 },
  ];

  for (const t of tests) {
    const val = calculateWilsonLowerBound(t.pos, t.tot);
    assert.ok(val >= 0, `Value ${val} should be >= 0`);
    assert.ok(val <= 1, `Value ${val} should be <= 1`);
  }
});

test("Wilson Score: penalizes small sample sizes (5/5 vs 9,500/10,000)", () => {
  // A game with 5 out of 5 positive reviews (100% positive)
  const smallSampleScore = calculateWilsonLowerBound(5, 5);
  // A game with 9,500 out of 10,000 positive reviews (95% positive)
  const largeSampleScore = calculateWilsonLowerBound(9500, 10000);

  // The high-volume 95% game MUST rank higher than the 5-review 100% game
  assert.ok(
    largeSampleScore > smallSampleScore,
    `Large sample (${largeSampleScore}) should exceed small sample (${smallSampleScore})`
  );

  // 5/5 should have lower bound around ~0.56, while 9500/10000 should be ~0.945
  assert.ok(smallSampleScore < 0.65, `Small sample should be strictly penalized`);
  assert.ok(largeSampleScore > 0.94, `Large sample should have high confidence`);
});

test("Wilson Score: monotonic with respect to positive reviews for same total", () => {
  const total = 500;
  const score1 = calculateWilsonLowerBound(400, total);
  const score2 = calculateWilsonLowerBound(450, total);
  const score3 = calculateWilsonLowerBound(480, total);

  assert.ok(score1 < score2);
  assert.ok(score2 < score3);
});

test("evaluateReviewQuality: formats human-readable summary", () => {
  const res = evaluateReviewQuality(9500, 10000);
  assert.strictEqual(res.score, 95);
  assert.ok(res.summary.includes("95% positive"));
  assert.ok(res.summary.includes("10,000"));
});
