"use client";

import { useCopilotPing } from "@/hooks/useCopilotSDK";

export default function CopilotStatus() {
  const { ping, result, loading, bridgeReady } = useCopilotPing();

  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-200">
          Copilot SDK Status
        </h3>
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            result?.ok
              ? "bg-green-500"
              : result && !result.ok
                ? "bg-red-500"
                : "bg-zinc-600"
          }`}
          title={result?.ok ? "Connected" : result?.error ?? "Not tested"}
        />
      </div>

      {!bridgeReady && (
        <p className="mb-4 text-sm text-zinc-500">
          Waiting for Electrobun bridge&hellip;
        </p>
      )}

      <button
        onClick={ping}
        disabled={!bridgeReady || loading}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Pinging…" : "Ping Copilot SDK"}
      </button>

      {result && (
        <div className="mt-4 rounded-lg bg-zinc-800/50 p-4 font-mono text-xs leading-relaxed">
          <Row label="OK" value={String(result.ok)} ok={result.ok} />
          <Row label="State" value={result.state} />
          <Row label="Message" value={result.message ?? "—"} />
          <Row
            label="Timestamp"
            value={
              result.timestamp
                ? new Date(result.timestamp).toLocaleString()
                : "—"
            }
          />
          {result.error && (
            <Row label="Error" value={result.error} ok={false} />
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex gap-3 py-0.5">
      <span className="w-24 shrink-0 text-zinc-500">{label}</span>
      <span
        className={
          ok === true
            ? "text-green-400"
            : ok === false
              ? "text-red-400"
              : "text-zinc-300"
        }
      >
        {value}
      </span>
    </div>
  );
}
