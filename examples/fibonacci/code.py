from functools import lru_cache


@lru_cache(maxsize=None)
def fibonacci(n: int) -> int:
    """Return the n-th Fibonacci number (0-indexed)."""
    if n < 0:
        raise ValueError(f"n must be non-negative, got {n}")
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)


def fibonacci_sequence(length: int) -> list[int]:
    """Return the first `length` Fibonacci numbers as a list."""
    if length <= 0:
        return []
    return [fibonacci(i) for i in range(length)]


def first_fibonacci_above(threshold: int) -> tuple[int, int]:
    """Return the first Fibonacci number strictly greater than `threshold`.

    Returns a (index, value) tuple.
    """
    i = 0
    while True:
        value = fibonacci(i)
        if value > threshold:
            return i, value
        i += 1


if __name__ == "__main__":
    print("First 10 Fibonacci numbers:", fibonacci_sequence(10))
    idx, val = first_fibonacci_above(100)
    print(f"First Fibonacci above 100: F({idx}) = {val}")
