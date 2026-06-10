"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import Link from "next/link";

interface Document {
  id: number;
  title: string;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
  createdAt: string;
}

interface DocumentsResponse {
  documents: Document[];
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  if (!mounted) return null;

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchDocuments = async () => {
      try {
        const res = await api.get<DocumentsResponse>("/documents");
        setDocuments(res.data.documents);
      } catch {
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-lg font-semibold text-black">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Document Dashboard
              </h1>
              <p className="text-gray-600 font-medium">
                All your uploaded documents appear below in order
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/documents/upload"
                className="px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                + Upload New Document
              </Link>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all duration-200 shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* EMPTY STATE */}
        {documents.length === 0 ? (
          <div className="bg-linear-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-12 text-center shadow-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              No documents uploaded yet
            </h2>
            <p className="text-gray-600 font-medium mb-6">
              Upload a document to start risk and sanction analysis
            </p>
            <Link
              href="/documents/upload"
              className="inline-block px-8 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Upload Document
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {doc.title}
                    </h2>
                    <p className="text-gray-600 font-medium mt-2">
                      {doc.content}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4 flex-wrap gap-2">
                    <span className="px-4 py-2 bg-linear-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-bold">
                      ID: {doc.id}
                    </span>
                    <span className="text-sm font-semibold text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${doc.status === "APPROVED" ? "bg-green-100 text-green-800 border-green-300" :
                      doc.status === "REJECTED" ? "bg-red-100 text-red-800 border-red-300" :
                        doc.status === "FLAGGED" ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                          "bg-gray-100 text-gray-700 border-gray-300"
                      }`}>
                      {doc.status === "APPROVED" ? "✅" : doc.status === "REJECTED" ? "❌" : doc.status === "FLAGGED" ? "🚩" : "⏳"} {doc.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}