"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DOC_TYPES = [
  { value: "AADHAAR", label: "Aadhaar Card" },
  { value: "PAN", label: "PAN Card" },
  { value: "ELECTRICITY_BILL", label: "Electricity Bill" },
  { value: "WATER_BILL", label: "Water Bill" },
  { value: "BANK_STATEMENT", label: "Bank Statement" },
  { value: "SALARY_SLIP", label: "Salary Slip" },
  { value: "OTHER", label: "Other Document" },
];

export default function UploadPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentType, setDocumentType] = useState("OTHER");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    intelligence?: {
      typeVerification?: {
        isMatch: boolean;
        declaredType: string;
        mismatchReason: string | null;
        suspectedActualType: string | null;
      };
      isDummy?: boolean;
      validityReasons?: string[];
    };
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("documentType", documentType);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      // Show mismatch warning before redirecting
      if (data.intelligence?.typeVerification?.isMatch === false) {
        setResult(data);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show type mismatch result
  if (result?.intelligence?.typeVerification?.isMatch === false) {
    const tv = result.intelligence.typeVerification;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🚨</span>
            <h1 className="text-xl font-bold text-red-700">Document Type Mismatch Detected</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 space-y-2">
            <p className="text-sm text-red-800">
              <strong>You declared:</strong> {tv.declaredType}
            </p>
            <p className="text-sm text-red-800">
              <strong>Issue:</strong> {tv.mismatchReason}
            </p>
            {tv.suspectedActualType && (
              <p className="text-sm text-orange-700">
                <strong>Suspected actual type:</strong> {tv.suspectedActualType}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-6">
            The document has been submitted for manual review. Please ensure you select the correct document type when uploading.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setResult(null); setFile(null); }}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
            >
              Upload Again
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-white rounded-xl shadow-lg p-8"
      >
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Upload Document</h1>
        <p className="text-sm text-gray-500 mb-6">
          Select the correct document type — the system will verify your document matches the declared type.
        </p>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
            {error}
          </p>
        )}

        {/* Document Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Type <span className="text-red-500">*</span>
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            required
          >
            {DOC_TYPES.map(dt => (
              <option key={dt.value} value={dt.value}>{dt.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            ⚠️ Selecting the wrong type will be flagged as a mismatch by the AI system.
          </p>
        </div>

        {/* Document Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. My Aadhaar Card, HDFC Bank Statement"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description / Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional information about the document"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select File <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
          <p className="text-xs text-gray-400 mt-1">Supported: PDF, JPG, PNG — max 5MB</p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm"
          >
            {loading ? "Uploading & Verifying…" : "Upload Document"}
          </button>
        </div>
      </form>
    </div>
  );
}
