"use client";

import { useState } from "react";
import api from "@/utils/api";

type CreateSanctionManagerResponse = {
  id: number;
  email: string;
  role: string;
};

export default function CreateSanctionManagerPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post<CreateSanctionManagerResponse>(
        "/admin/sanction-managers",
        { email, password }
      );

      setMessage(
        `Sanction Manager created successfully: ${res.data.email}`
      );
      setEmail("");
      setPassword("");
    } catch {
      setError("Failed to create Sanction Manager");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Create Sanction Manager
        </h1>

        <p className="text-sm text-gray-600 mb-6">
          Admin-only action. This will create login credentials for a
          Sanction Manager.
        </p>

        {message && (
          <div className="mb-4 rounded bg-green-100 px-4 py-3 text-green-800 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded bg-red-100 px-4 py-3 text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="manager@company.com"
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Temporary Password
            </label>
            <input
              type="password"
              placeholder="Enter a secure password"
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              The Sanction Manager can change this later.
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full rounded-md bg-black py-2.5 text-white font-semibold hover:bg-gray-900 disabled:opacity-50"
          >
            {loading ? "Creating Sanction Manager…" : "Create Sanction Manager"}
          </button>
        </div>
      </div>
    </div>
  );
}
