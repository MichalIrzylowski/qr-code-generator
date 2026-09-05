import { useCallback, useEffect, useState } from "react";
import { DEFAULT_DESIGN, type Design, type QrDesign } from "@/domain/design.ts";
import type { Payload } from "@/domain/payload.ts";
import { SHARE_PARAM, decodeShare } from "@/domain/share.ts";

const STORAGE_KEY = "qr-code-generator:design";

const DEFAULT_STATE: QrDesign = {
  payload: { kind: "url", value: "https://example.com" },
  design: DEFAULT_DESIGN,
};

/**
 * A share link wins over stored state: someone who opened a link wants to see
 * that design, not the one they were last editing.
 */
const loadInitial = (): QrDesign => {
  const shared = new URLSearchParams(window.location.search).get(SHARE_PARAM);
  if (shared) {
    const decoded = decodeShare(shared);
    if (decoded) return decoded;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_STATE;
    const parsed = JSON.parse(stored) as Partial<QrDesign>;
    return {
      payload: parsed.payload ?? DEFAULT_STATE.payload,
      design: { ...DEFAULT_DESIGN, ...parsed.design },
    };
  } catch {
    return DEFAULT_STATE;
  }
};

export const useQrDesign = () => {
  const [state, setState] = useState<QrDesign>(loadInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private browsing or a full quota. Persistence is a convenience, not a
      // requirement, so losing it must never break the editor.
    }
  }, [state]);

  const setPayload = useCallback((payload: Payload) => {
    setState((current) => ({ ...current, payload }));
  }, []);

  const updateDesign = useCallback((patch: Partial<Design>) => {
    setState((current) => ({ ...current, design: { ...current.design, ...patch } }));
  }, []);

  const applyDesign = useCallback((design: Design) => {
    setState((current) => ({ ...current, design }));
  }, []);

  return { ...state, setPayload, updateDesign, applyDesign };
};
