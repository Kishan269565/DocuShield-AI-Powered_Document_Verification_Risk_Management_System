"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { AxiosError } from "axios";

interface ApiErrorResponse {
  message?: string;
}

const DOC_TYPES = [
  { value: "AADHAAR", label: "Aadhaar Card" },
  { value: "PAN", label: "PAN Card" },
  { value: "ELECTRICITY_BILL", label: "Electricity Bill" },
  { value: "WATER_BILL", label: "Water Bill" },
  { value: "BANK_STATEMENT", label: "Bank Statement" },
  { value: "SALARY_SLIP", label: "Salary Slip" },
  { value: "OTHER", label: "Other Document" },
];

type TypeVerification = {
  isMatch: boolean;
  declaredType: string;
  mismatchReason: string | null;
  suspectedActualType: string | null;
};

export default function UploadDocumentPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("OTHER");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mismatch, setMismatch] = useState<TypeVerification | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMismatch(null);

    if (!file) {
      setError("Please select a document file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    formData.append("description", description);
    formData.append("title", file.name);

    try {
      setLoading(true);

      const res = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const tv = res.data?.intelligence?.typeVerification;
      if (tv && !tv.isMatch) {
        setMismatch(tv);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof AxiosError) {
        const apiError = err.response?.data as ApiErrorResponse;
        setError(apiError?.message || "Document upload failed");
      } else {
        setError("Unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  if (mismatch) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🚨</span>
            <h1 className="text-xl font-bold text-red-700">Document Type Mismatch Detected</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 space-y-2 text-sm">
            <p className="text-red-800">
              <strong>Declared as:</strong> {mismatch.declaredType}
            </p>
            <p className="text-red-800">
              <strong>Issue:</strong> {mismatch.mismatchReason}
            </p>
            {mismatch.suspectedActualType && (
              <p className="text-orange-700">
                <strong>Suspected actual type:</strong> {mismatch.suspectedActualType}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-5">
            The document has been submitted and flagged for manual review. Please upload the correct document or select the right document type.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setMismatch(null); setFile(null); }}
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
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Upload Document</h1>
      <p className="text-sm text-gray-600 mb-6">
        Select the correct document type — the AI will verify your document matches what you declare.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-xl p-6 space-y-5 shadow-sm"
      >
        {/* DOCUMENT TYPE */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Document Type <span className="text-red-500">*</span>
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {DOC_TYPES.map(dt => (
              <option key={dt.value} value={dt.value}>{dt.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            ⚠️ Selecting the wrong type will be flagged as a mismatch by the AI verification system.
          </p>
        </div>

        {/* FILE INPUT */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Document File <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700"
          />
          {file && (
            <p className="mt-1 text-sm text-gray-600">
              Selected: <span className="font-medium text-gray-800">{file.name}</span>
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">Supported: PDF, PNG, JPG — max 5MB</p>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any additional context for reviewers"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </p>
        )}

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
