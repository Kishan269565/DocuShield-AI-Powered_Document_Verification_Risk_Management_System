"use client";

type AIAdvice = {
  riskSummary?: string;
  riskSignals?: string[];
  confidence?: number; // 0–1
};

export default function AIAdvisoryPanel({
  advice,
}: {
  advice?: AIAdvice;
}) {
  if (!advice) return null;

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mt-6">
      <h3 className="text-sm font-semibold text-blue-800 mb-2">
        AI Advisory (Non-Authoritative)
      </h3>

      {advice.riskSummary && (
        <p className="text-sm text-blue-700 mb-2">
          {advice.riskSummary}
        </p>
      )}

      {advice.riskSignals && advice.riskSignals.length > 0 && (
        <ul className="list-disc list-inside text-sm text-blue-700 mb-2">
          {advice.riskSignals.map((signal, idx) => (
            <li key={idx}>{signal}</li>
          ))}
        </ul>
      )}

      {typeof advice.confidence === "number" && (
        <p className="text-xs text-blue-600">
          Confidence: {(advice.confidence * 100).toFixed(0)}%
        </p>
      )}

      <p className="text-xs text-blue-500 mt-2">
        AI suggestions are advisory only and do not affect system decisions.
      </p>
    </div>
  );
}
