"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CopilotCoworkCopilot, CopilotPingResult, CopilotChatResult } from "@/types/electrobun";

// ---------------------------------------------------------------------------
// Helper to grab the copilot bridge off the global
// ---------------------------------------------------------------------------

function getCopilot(): CopilotCoworkCopilot | null {
  if (typeof window === "undefined") return null;
  return window.__COPILOT_COWORK__?.copilot ?? null;
}

// ---------------------------------------------------------------------------
// Hook: useCopilotSDK
// ---------------------------------------------------------------------------

export function useCopilotSDK() {
  const [available, setAvailable] = useState(false);
  const copilotRef = useRef<CopilotCoworkCopilot | null>(null);

  useEffect(() => {
    let attempts = 0;
    const id = setInterval(() => {
      const copilot = getCopilot();
      if (copilot) {
        copilotRef.current = copilot;
        setAvailable(true);
        clearInterval(id);
      } else if (++attempts > 20) {
        clearInterval(id);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  return available ? copilotRef.current : null;
}

// ---------------------------------------------------------------------------
// Hook: useCopilotPing
// ---------------------------------------------------------------------------

export function useCopilotPing() {
  const copilot = useCopilotSDK();
  const [result, setResult] = useState<CopilotPingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [bridgeReady, setBridgeReady] = useState(false);

  useEffect(() => {
    if (copilot) setBridgeReady(true);
  }, [copilot]);

  const ping = useCallback(async () => {
    if (!copilot) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await copilot.ping();
      setResult(res);
    } catch (err: unknown) {
      setResult({
        ok: false,
        state: "bridge-error",
        message: null,
        timestamp: null,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }, [copilot]);

  return { ping, result, loading, bridgeReady };
}

// ---------------------------------------------------------------------------
// Hook: useCopilotChat
// ---------------------------------------------------------------------------

export function useCopilotChat() {
  const copilot = useCopilotSDK();
  const [loading, setLoading] = useState(false);
  const [bridgeReady, setBridgeReady] = useState(false);

  useEffect(() => {
    if (copilot) setBridgeReady(true);
  }, [copilot]);

  const sendMessage = useCallback(
    async (message: string): Promise<CopilotChatResult> => {
      if (!copilot) {
        return { ok: false, reply: null, error: "Bridge not ready" };
      }
      setLoading(true);
      try {
        const result = await copilot.chat(message);
        return result;
      } catch (err: unknown) {
        return {
          ok: false,
          reply: null,
          error: err instanceof Error ? err.message : String(err),
        };
      } finally {
        setLoading(false);
      }
    },
    [copilot],
  );

  return { sendMessage, loading, bridgeReady };
}
