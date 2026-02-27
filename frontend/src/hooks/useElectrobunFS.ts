"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CopilotCoworkFS,
  DirectoryEntry,
  FileContent,
} from "@/types/electrobun";

// ---------------------------------------------------------------------------
// Hook: useElectrobunFS
// ---------------------------------------------------------------------------

function getFS(): CopilotCoworkFS | null {
  if (typeof window === "undefined") return null;
  const cowork = window.__COPILOT_COWORK__;
  console.log("[useElectrobunFS] polling — __ELECTROBUN__:", window.__ELECTROBUN__, "__COPILOT_COWORK__:", !!cowork, "fs:", !!cowork?.fs);
  return cowork?.fs ?? null;
}

/**
 * Provides FS operations via the Electrobun RPC bridge.
 * Returns `null` when running outside the desktop shell (e.g. plain browser).
 */
export function useElectrobunFS() {
  const [available, setAvailable] = useState(false);
  const fsRef = useRef<CopilotCoworkFS | null>(null);

  useEffect(() => {
    console.log("[useElectrobunFS] starting bridge detection (polling every 100ms, max 20 attempts)...");
    // The bridge script may load after React mounts, so retry briefly.
    let attempts = 0;
    const id = setInterval(() => {
      const fs = getFS();
      if (fs) {
        console.log("[useElectrobunFS] ✔ Bridge detected! FS API is available.");
        fsRef.current = fs;
        setAvailable(true);
        clearInterval(id);
      } else if (++attempts > 20) {
        console.warn("[useElectrobunFS] ✖ Gave up after 20 attempts. Bridge not found.");
        clearInterval(id);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  return available ? fsRef.current : null;
}

// ---------------------------------------------------------------------------
// Hook: useDirectoryListing
// ---------------------------------------------------------------------------

interface DirectoryState {
  path: string;
  entries: DirectoryEntry[];
  loading: boolean;
  error: string | null;
}

export function useDirectoryListing(initialPath?: string) {
  const fs = useElectrobunFS();
  const [state, setState] = useState<DirectoryState>({
    path: initialPath ?? "",
    entries: [],
    loading: false,
    error: null,
  });

  const navigate = useCallback(
    async (dirPath: string) => {
      if (!fs) return;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const result = await fs.readDirectory(dirPath);
        setState({
          path: result.path,
          entries: result.entries,
          loading: false,
          error: null,
        });
      } catch (err: unknown) {
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to read directory",
        }));
      }
    },
    [fs],
  );

  // Load the initial path once FS becomes available
  useEffect(() => {
    if (!fs) return;
    if (initialPath) {
      navigate(initialPath);
    } else {
      fs.getHomePath().then(({ homePath }) => navigate(homePath));
    }
  }, [fs, initialPath, navigate]);

  return { ...state, navigate };
}

// ---------------------------------------------------------------------------
// Hook: useFileContent
// ---------------------------------------------------------------------------

interface FileState {
  file: FileContent | null;
  loading: boolean;
  error: string | null;
}

export function useFileContent() {
  const fs = useElectrobunFS();
  const [state, setState] = useState<FileState>({
    file: null,
    loading: false,
    error: null,
  });

  const open = useCallback(
    async (filePath: string) => {
      if (!fs) return;
      setState({ file: null, loading: true, error: null });
      try {
        const content = await fs.readFile(filePath);
        setState({ file: content, loading: false, error: null });
      } catch (err: unknown) {
        setState({
          file: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to read file",
        });
      }
    },
    [fs],
  );

  const close = useCallback(() => {
    setState({ file: null, loading: false, error: null });
  }, []);

  return { ...state, open, close };
}
