# Numerical Question

## Float-precision tolerance comparison needs proper unit-test coverage

`scoreNumerical` in `frontend/src/model/question.ts` currently absorbs IEEE 754
noise with a hard-coded `FLOAT_EPSILON = 1e-9`:

```ts
const inTolerance = Math.abs(userValue - correct) <= tolerance + FLOAT_EPSILON
```

This was added because `Math.abs(3.13 - 3.14)` is actually `0.010000000000000231`
in JavaScript, which without slack would falsely reject a value sitting exactly
on a `0.01` tolerance boundary. The fix is correct for typical quiz-scale
values, but it deserves more thorough exercise than the current single E2E
scenario in `Question.Take.Numerical.feature` ("Tolerance widens the accepted
range, boundaries inclusive") gives it.

E2E coverage is expensive (one scenario per case is roughly one full quiz-take
flow), so the right place to grind through edge cases is **Vitest unit tests**,
which we don't yet have in the repo. Cases worth covering once Vitest lands:

- Boundary inclusivity at decimal scales: `0.001`, `0.01`, `0.1`, `1`, `100`
- Boundaries on the *negative* side of the correct answer
- Negative correct answers (`-3.14 ±0.01`, etc.)
- Very small tolerances (e.g. `1e-6`) — does `FLOAT_EPSILON = 1e-9` still
  produce sensible results, or does it swallow legitimately wrong answers?
- Very large values (e.g. `correct = 1e9`, `tolerance = 1`) — does the
  absolute epsilon still make sense, or do we need a relative one?
- Zero tolerance with non-integer correct answers — is exact equality
  reachable, or does any non-trivial decimal trip the comparison?
- The `compareNumericalAnswer` → `scoreNumerical` rename happened in the
  QuestionAnswer refactor (`cc3584ac`); confirm the new function returns
  the same `QuestionResult` shape as the old one for all the above.

More broadly, **the model layer is overdue for a unit test runner.** The
scoring functions, `evaluateAnswer`, smart constructors (`choiceAnswer`,
`numericalAnswer`), and the choice partial-score logic in `scoreChoice` are
all pure, fast, and currently only exercised through E2E. Vitest would let us
characterize edge cases in milliseconds rather than minutes, and would give
the team a place to land regression tests for issues like this one without
inflating the E2E suite.

### Action items
- Introduce Vitest in the frontend (`vitest.config.ts`, `pnpm test:fe`,
  CI hookup).
- Add unit tests for `scoreNumerical`, `scoreChoice`, `evaluateAnswer`,
  `choiceAnswer`, `numericalAnswer` in `frontend/src/model/question.test.ts`.
- Cover the float-precision cases above. If any reveal a deficiency in the
  fixed `FLOAT_EPSILON` approach, switch to a relative epsilon
  (`tolerance + Math.max(Math.abs(correct), Math.abs(userValue)) * Number.EPSILON * k`)
  or scale the comparison to integers (`Math.round((user - correct) * 10^n)`).
