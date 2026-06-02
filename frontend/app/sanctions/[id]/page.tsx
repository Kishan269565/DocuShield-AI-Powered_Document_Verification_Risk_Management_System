"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";

type DocumentDetail = {
  id: number;
  title: string;
  content: string;
  createdAt: string;

  // Optional — AI advisory (safe to ignore if backend not ready)
  aiAdvisory?: {
    summary?: string;
    riskSignals?: string[];
    confidence?: number;
  };
};

export default function SanctionDocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await api.get(`/document/${id}`);
        setDocument(res.data);
      } catch {
        setDocument(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-gray-600">Loading document…</div>;
  }

  if (!document) {
    return <div className="p-6 text-red-600">Document not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Document Info */}
      <section className="bg-white rounded-lg border p-4">
        <h1 className="text-xl font-semibold text-gray-800">
          {document.title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Created at: {new Date(document.createdAt).toLocaleString()}
        </p>
      </section>

      {/* AI Advisory (Read-only) */}
      <section className="bg-gray-50 rounded-lg border p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          AI Advisory (Read-only)
        </h2>

        {!document.aiAdvisory ? (
          <p className="text-gray-500">
            AI advisory is not available for this document yet.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-700">
              <span className="font-medium">Summary:</span>{" "}
              {document.aiAdvisory.summary || "No summary provided."}
            </p>

            <div>
              <p className="font-medium text-gray-700">Risk Signals:</p>
              <ul className="list-disc list-inside text-gray-600">
                {(document.aiAdvisory.riskSignals || []).length === 0 ? (
                  <li>No signals detected.</li>
                ) : (
                  document.aiAdvisory.riskSignals!.map((signal, idx) => (
                    <li key={idx}>{signal}</li>
                  ))
                )}
              </ul>
            </div>

            <p className="text-gray-700">
              <span className="font-medium">Confidence:</span>{" "}
              {document.aiAdvisory.confidence != null
                ? `${document.aiAdvisory.confidence}%`
                : "N/A"}
            </p>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500">
          ⚠️ AI insights are advisory only and do not make or override decisions.
        </p>
      </section>
    </div>
  );
}
