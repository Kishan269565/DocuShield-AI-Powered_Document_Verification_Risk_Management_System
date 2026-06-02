"use client";

import { useEffect, useState } from "react";

type RiskSnapshot = {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  aiVerdict: "APPROVE" | "REVIEW" | "REJECT";
  aiReason: string;
  behaviorFlags?: string[];
};

type SanctionDecision = {
  decision: "APPROVE" | "REJECT" | "FLAG";
  reason: string | null;
  createdAt: string;
  decidedBy: { email: string } | null;
};

type AIExtraction = {
  wordCount: number | null;
  containsSensitive: boolean;
  detectedKeywords: string[];
  isBlurry: boolean | null;
  possibleForgery: boolean | null;
};

type Document = {
  id: number;
  title: string;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
  createdAt: string;
  owner: { email: string };
  riskSnapshot?: RiskSnapshot | null;
  aiExtraction?: AIExtraction | null;
  sanctionDecisions?: SanctionDecision[];
};

const RISK_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700 border-gray-300",
  APPROVED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
  FLAGGED: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

const VERDICT_COLORS: Record<string, string> = {
  APPROVE: "text-green-700 bg-green-50",
  REVIEW: "text-yellow-700 bg-yellow-50",
  REJECT: "text-red-700 bg-red-50",
};

const STATUS_ICONS: Record<string, string> = {
  PENDING: "⏳",
  APPROVED: "✅",
  REJECTED: "❌",
  FLAGGED: "🚩",
};

export default function SanctionsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED">("ALL");
  const [decisionReasons, setDecisionReasons] = useState<Record<number, string>>({});

  const fetchQueue = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/sanctions/queue", {
      credentials: "include",
    });
    const data = await res.json();
    setDocuments(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchQueue(); }, []);

  const makeDecision = async (
    documentId: number,
    decision: "APPROVE" | "REJECT" | "FLAG"
  ) => {
    setActionLoading(documentId);
    await fetch(
      `http://localhost:5000/api/sanctions/documents/${documentId}/decision`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          decision,
          reason: decisionReasons[documentId] || `Manual ${decision.toLowerCase()} by sanction manager`,
        }),
      }
    );
    setActionLoading(null);
    await fetchQueue();
  };

  const filtered = filter === "ALL" ? documents : documents.filter(d => d.status === filter);

  const counts = {
    ALL: documents.length,
    PENDING: documents.filter(d => d.status === "PENDING").length,
    APPROVED: documents.filter(d => d.status === "APPROVED").length,
    REJECTED: documents.filter(d => d.status === "REJECTED").length,
    FLAGGED: documents.filter(d => d.status === "FLAGGED").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading sanction queue…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sanctions Review Queue</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Review AI-flagged documents and make approve / reject / flag decisions
            </p>
          </div>
          <button
            onClick={fetchQueue}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["ALL", "PENDING", "APPROVED", "REJECTED", "FLAGGED"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                filter === f
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
              }`}
            >
              {STATUS_ICONS[f] ?? "📋"} {f}{" "}
              <span className="ml-1 opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-lg">No documents in this category</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((doc) => {
              const isExpanded = expandedId === doc.id;
              const lastDecision = doc.sanctionDecisions?.[0];

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Card Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <h2 className="text-lg font-bold text-gray-900 truncate">
                            {doc.title}
                          </h2>
                          {/* Status Badge */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[doc.status]}`}
                          >
                            {STATUS_ICONS[doc.status]} {doc.status}
                          </span>
                          {/* Risk Level Badge */}
                          {doc.riskSnapshot && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${RISK_COLORS[doc.riskSnapshot.riskLevel]}`}
                            >
                              Risk: {doc.riskSnapshot.riskLevel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                          <span>👤 {doc.owner.email}</span>
                          <span>🕐 {new Date(doc.createdAt).toLocaleString()}</span>
                          {doc.riskSnapshot && (
                            <span className="font-semibold text-gray-700">
                              Score: {doc.riskSnapshot.riskScore}/100
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-400 text-xl select-none">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-6 pb-6 pt-4 space-y-5">

                      {/* AI Verdict Panel */}
                      {doc.riskSnapshot && (
                        <div className={`rounded-xl p-4 border ${VERDICT_COLORS[doc.riskSnapshot.aiVerdict]} border-current border-opacity-20`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {doc.riskSnapshot.aiVerdict === "APPROVE" ? "✅" : doc.riskSnapshot.aiVerdict === "REJECT" ? "🚫" : "🔍"}
                              </span>
                              <span className="font-bold text-base uppercase tracking-wide">
                                AI Verdict: {doc.riskSnapshot.aiVerdict}
                              </span>
                            </div>
                            {/* Risk Score Bar */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold opacity-70">Risk Score</span>
                              <div className="w-24 h-2 bg-black bg-opacity-10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    doc.riskSnapshot.riskScore >= 70 ? "bg-red-500" :
                                    doc.riskSnapshot.riskScore >= 50 ? "bg-orange-500" :
                                    doc.riskSnapshot.riskScore >= 30 ? "bg-yellow-500" : "bg-green-500"
                                  }`}
                                  style={{ width: `${doc.riskSnapshot.riskScore}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold">{doc.riskSnapshot.riskScore}/100</span>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed mb-3">{doc.riskSnapshot.aiReason}</p>

                          {/* AI Signals — each as a chip */}
                          {Array.isArray(doc.riskSnapshot.behaviorFlags) &&
                            doc.riskSnapshot.behaviorFlags.length > 0 && (
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide mb-2 opacity-60">Fraud Signals Detected</p>
                                <div className="space-y-1">
                                  {(doc.riskSnapshot.behaviorFlags as string[]).map((flag, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs bg-black bg-opacity-5 rounded-lg px-3 py-1.5">
                                      <span className="mt-0.5 shrink-0">
                                        {flag.startsWith("  ↳") ? "↳" : "⚠️"}
                                      </span>
                                      <span className={flag.startsWith("  ↳") ? "opacity-80 pl-2" : "font-medium"}>{flag.replace("  ↳ ", "")}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Document Integrity Checklist */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="font-semibold text-gray-700 mb-3 text-sm">🔬 Document Integrity Checklist</p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {[
                            { label: "Content not empty", pass: (doc.aiExtraction?.wordCount ?? 0) >= 20 },
                            { label: "Sufficient word count (≥20)", pass: (doc.aiExtraction?.wordCount ?? 0) >= 20 },
                            { label: "No placeholder/Lorem Ipsum text", pass: !doc.riskSnapshot?.behaviorFlags?.some((f: string) => f.includes("Placeholder")) },
                            { label: "Image quality acceptable", pass: doc.aiExtraction?.isBlurry !== true },
                            { label: "No image metadata anomaly", pass: doc.aiExtraction?.possibleForgery !== true },
                            { label: "Document type verified", pass: !doc.riskSnapshot?.behaviorFlags?.some((f: string) => f.includes("TYPE MISMATCH") || f.includes("mismatch")) },
                            { label: "No forgery signals", pass: !doc.riskSnapshot?.behaviorFlags?.some((f: string) => f.includes("forgery") || f.includes("Forgery")) },
                            { label: "AI verdict: safe to approve", pass: doc.riskSnapshot?.aiVerdict === "APPROVE" },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${
                                item.pass ? "bg-green-500" : "bg-red-500"
                              }`}>
                                {item.pass ? "✓" : "✕"}
                              </span>
                              <span className={item.pass ? "text-gray-600" : "text-red-700 font-medium"}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Previous Decision */}
                      {lastDecision && (
                        <div className="bg-blue-50 rounded-xl p-4 text-sm">
                          <p className="font-semibold text-blue-800 mb-1">📋 Last Decision</p>
                          <p className="text-blue-700">
                            <strong>{lastDecision.decision}</strong> by{" "}
                            {lastDecision.decidedBy?.email ?? "Unknown"} on{" "}
                            {new Date(lastDecision.createdAt).toLocaleString()}
                          </p>
                          {lastDecision.reason && (
                            <p className="text-blue-600 mt-1 text-xs">{lastDecision.reason}</p>
                          )}
                        </div>
                      )}

                      {/* Download */}
                      <button
                        onClick={() =>
                          window.open(
                            `http://localhost:5000/api/documents/${doc.id}/download`,
                            "_blank"
                          )
                        }
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm underline"
                      >
                        📥 Download & View Document
                      </button>

                      {/* Decision Reason Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Decision Reason (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Add a reason for your decision…"
                          value={decisionReasons[doc.id] ?? ""}
                          onChange={(e) =>
                            setDecisionReasons(prev => ({ ...prev, [doc.id]: e.target.value }))
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 flex-wrap">
                        <button
                          disabled={actionLoading === doc.id}
                          onClick={() => makeDecision(doc.id, "APPROVE")}
                          className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50 text-sm"
                        >
                          ✅ Approve
                        </button>
                        <button
                          disabled={actionLoading === doc.id}
                          onClick={() => makeDecision(doc.id, "REJECT")}
                          className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition disabled:opacity-50 text-sm"
                        >
                          ❌ Reject
                        </button>
                        <button
                          disabled={actionLoading === doc.id}
                          onClick={() => makeDecision(doc.id, "FLAG")}
                          className="px-5 py-2.5 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition disabled:opacity-50 text-sm"
                        >
                          🚩 Flag for Review
                        </button>
                        {actionLoading === doc.id && (
                          <span className="text-sm text-gray-500 self-center">Processing…</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
