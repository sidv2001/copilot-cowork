"use client";

import { useState } from "react";
import {
  useDirectoryListing,
  useFileContent,
  useElectrobunFS,
} from "@/hooks/useElectrobunFS";

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Get the parent directory from a Windows or POSIX path. */
function parentDir(p: string): string | null {
  // Normalise separators
  const norm = p.replace(/\\/g, "/").replace(/\/+$/, "");
  const idx = norm.lastIndexOf("/");
  if (idx <= 0) return norm.length > 0 ? "/" : null;
  // Windows drive root, e.g. C:
  if (idx === 2 && norm[1] === ":") return norm.slice(0, 3);
  return norm.slice(0, idx);
}

// ---------------------------------------------------------------------------
// Icons (simple SVG inline, no external deps)
// ---------------------------------------------------------------------------

function FolderIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-indigo-400"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-zinc-500"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PathBar({
  path,
  onNavigate,
}: {
  path: string;
  onNavigate: (p: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(path);

  return editing ? (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onNavigate(draft);
        setEditing(false);
      }}
    >
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => setEditing(false)}
        className="flex-1 rounded bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 outline-none ring-1 ring-zinc-600 focus:ring-indigo-500"
      />
    </form>
  ) : (
    <button
      onClick={() => {
        setDraft(path);
        setEditing(true);
      }}
      className="w-full truncate rounded bg-zinc-800/60 px-3 py-1.5 text-left text-sm text-zinc-300 ring-1 ring-zinc-700 hover:ring-zinc-500"
      title="Click to edit path"
    >
      {path}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main FileBrowser component
// ---------------------------------------------------------------------------

export default function FileBrowser() {
  const fsAvailable = useElectrobunFS();
  const { path, entries, loading, error, navigate } = useDirectoryListing();
  const {
    file: openFile,
    loading: fileLoading,
    error: fileError,
    open: openFileContent,
    close: closeFile,
  } = useFileContent();

  // ── Not running inside Electrobun ──────────────────────────────────────
  if (!fsAvailable) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-500">
        <p className="mb-1 font-medium text-zinc-400">
          File system access unavailable
        </p>
        <p>
          Run the app with{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
            bun run dev
          </code>{" "}
          inside Electrobun to enable native FS browsing.
        </p>
      </div>
    );
  }

  // ── File viewer overlay ────────────────────────────────────────────────
  if (openFile || fileLoading || fileError) {
    return (
      <div className="flex flex-col gap-3">
        <button
          onClick={closeFile}
          className="self-start rounded bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
        >
          ← Back
        </button>

        {fileLoading && (
          <p className="animate-pulse text-sm text-zinc-500">
            Reading file…
          </p>
        )}

        {fileError && (
          <p className="text-sm text-red-400">{fileError}</p>
        )}

        {openFile && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="truncate">{openFile.path}</span>
              <span>{formatBytes(openFile.size)}</span>
            </div>
            <pre className="max-h-[60vh] overflow-auto rounded-lg bg-zinc-800/70 p-4 text-xs leading-relaxed text-zinc-300 ring-1 ring-zinc-700">
              {openFile.content}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // ── Directory browser ──────────────────────────────────────────────────
  const parent = parentDir(path);

  return (
    <div className="flex flex-col gap-3">
      {/* Path bar */}
      <PathBar path={path} onNavigate={navigate} />

      {/* Error */}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Listing */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
        {loading ? (
          <p className="animate-pulse px-4 py-6 text-center text-sm text-zinc-500">
            Loading…
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {/* Up one level */}
            {parent && (
              <li>
                <button
                  onClick={() => navigate(parent)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-zinc-400 hover:bg-zinc-800/60"
                >
                  <FolderIcon />
                  <span>..</span>
                </button>
              </li>
            )}

            {entries.map((entry) => (
              <li key={entry.path}>
                <button
                  onClick={() =>
                    entry.isDirectory
                      ? navigate(entry.path)
                      : openFileContent(entry.path)
                  }
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-zinc-800/60"
                >
                  {entry.isDirectory ? <FolderIcon /> : <FileIcon />}
                  <span className="flex-1 truncate text-zinc-200">
                    {entry.name}
                  </span>
                  <span className="hidden text-xs text-zinc-600 sm:inline">
                    {entry.isFile ? formatBytes(entry.size) : ""}
                  </span>
                  <span className="hidden text-xs text-zinc-600 md:inline">
                    {formatDate(entry.modifiedAt)}
                  </span>
                </button>
              </li>
            ))}

            {entries.length === 0 && !loading && (
              <li className="px-4 py-6 text-center text-sm text-zinc-600">
                Directory is empty
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
