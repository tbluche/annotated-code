-----

-- color:#000000;background:#b3e5fc;range:1
-- color:#000000;background:#b3e5fc;range:4
-- color:#000000;background:#ffe082;range:11

`fibonacci` uses **memoization** via `@lru_cache(maxsize=None)` (line 1 + line 4).

Without it, the naive recursive implementation on line 11 would recompute the same sub-problems
exponentially many times. With the cache, each value `fibonacci(k)` is computed only once and
stored for subsequent calls — reducing the time complexity from $O(2^n)$ to $O(n)$.

-----

-- color:#000000;background:#c8e6c9;range:7-8
-- color:#000000;background:#fff9c4;range:9-10

Two guard clauses protect the recursive function before it reaches its recursive step:

- Lines 7-8 validate the input, raising a `ValueError` for negative indices.
- Lines 9-10 are the **base cases**: `fibonacci(0) = 0` and `fibonacci(1) = 1`.

Without base cases a recursive function would call itself forever and raise `RecursionError`.

-----

-- color:#000000;background:#f8bbd0;range:14-18

`fibonacci_sequence` builds the result as a **list comprehension** (line 18), delegating each
individual value to the memoized `fibonacci`. The early return on line 17 handles the edge case
of a non-positive length without entering the comprehension.

-----

-- color:#000000;background:#e1bee7;range:27-31

`first_fibonacci_above` uses an **unbounded `while True` loop** because the target index is not
known in advance. The loop is guaranteed to terminate: Fibonacci numbers grow without bound, so
the condition `value > threshold` will eventually be satisfied for any finite `threshold`.

Line 30 returns both the index and the value as a tuple, making the result unambiguous for the
caller without requiring a second lookup.

-----
