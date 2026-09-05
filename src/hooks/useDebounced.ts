import { useEffect, useState } from "react";

/** Settle a fast-changing value, so expensive work runs on the pause, not the drag. */
export const useDebounced = <T,>(value: T, delayMs: number): T => {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
};
