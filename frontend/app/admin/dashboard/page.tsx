"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  _count: { documents: number; decisions: number };
}

interface Document {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  owner: { id: number; email: string; role: string };
  riskSnapshot: { riskLevel: string; riskScore: number } | null;
}

interface Sanction {
  id: number;
  decision: string;
  reason: string | null;
  createdAt: string;
  decidedBy: { id: number; email: string };
  document: { id: number; title: string };
}

interface AuditLog {
  id: number;
  action: string;
  timestamp: string;
  user: { email: string; role: string } | null;
}

interface DashboardData {
  users: User[];
  documents: Document[];
  sanctions: Sanction[];
  auditLogs: AuditLog[];
}

type Tab = "overview" | "users" | "sanctions" | "audit" | "createUser" | "demo";

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<DashboardData>("/admin/dashboard");
        setData(res.data);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-xl font-semibold">Loading Admin Dashboard...</p>
      </div>
    );
  }

  if (!data) return null;

  const customers = data.users.filter((u) => u.role === "CUSTOMER");
  const sanctionManagers = data.users.filter((u) => u.role === "SANCTION_MANAGER");

  const handleCreateSanctionManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await api.post("/admin/sanction-managers", { email, password });
      alert("Sanction Manager created successfully!");
      setEmail("");
      setPassword("");
      
      // Refresh data
      const res = await api.get<DashboardData>("/admin/dashboard");
      setData(res.data);
      setActiveTab("sanctions");
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create sanction manager");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* SIDEBAR */}
      <aside className="w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-xs text-slate-400">Block ID Guard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 ${
              activeTab === "overview" 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105" 
                : "hover:bg-slate-700/50 text-slate-300"
            }`}
          >
            <span className="text-xl">📊</span>
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 ${
              activeTab === "users" 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105" 
                : "hover:bg-slate-700/50 text-slate-300"
            }`}
          >
            <span className="text-xl">👥</span>
            <span>User Journey</span>
          </button>
          <button
            onClick={() => setActiveTab("sanctions")}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 ${
              activeTab === "sanctions" 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105" 
                : "hover:bg-slate-700/50 text-slate-300"
            }`}
          >
            <span className="text-xl">⚖️</span>
            <span>Sanction Manager</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 ${
              activeTab === "audit" 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105" 
                : "hover:bg-slate-700/50 text-slate-300"
            }`}
          >
            <span className="text-xl">📝</span>
            <span>Audit Logs</span>
          </button>
          <button
            onClick={() => setActiveTab("createUser")}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 ${
              activeTab === "createUser" 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105" 
                : "hover:bg-slate-700/50 text-slate-300"
            }`}
          >
            <span className="text-xl">➕</span>
            <span>Create User</span>
          </button>
          <button
            onClick={() => setActiveTab("demo")}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 ${
              activeTab === "demo" 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105" 
                : "hover:bg-slate-700/50 text-slate-300"
            }`}
          >
            <span className="text-xl">🎭</span>
            <span>Demo Mode</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <div>
                <p className="text-xs text-slate-400">Logged in as</p>
                <p className="text-sm font-semibold">Admin</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
              router.push("/admin/login");
            }}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === "overview" && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">System Overview</h2>
              <p className="text-gray-600">Real-time system statistics and metrics</p>
            </div>
            
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-blue-100 text-sm font-semibold">Total Users</p>
                  <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-5xl font-bold">{data.users.length}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-purple-100 text-sm font-semibold">Customers</p>
                  <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-5xl font-bold">{customers.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-green-100 text-sm font-semibold">Documents</p>
                  <svg className="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-5xl font-bold">{data.documents.length}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-orange-100 text-sm font-semibold">Sanctions</p>
                  <svg className="w-8 h-8 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-5xl font-bold">{data.sanctions.length}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <span className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></span>
                Recent Documents
              </h3>
              <div className="space-y-4">
                {data.documents.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                    <div>
                      <p className="font-bold text-gray-900">{doc.title}</p>
                      <p className="text-sm text-gray-500">by {doc.owner.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm ${
                        doc.status === "APPROVED" ? "bg-green-100 text-green-700" :
                        doc.status === "REJECTED" ? "bg-red-100 text-red-700" :
                        doc.status === "FLAGGED" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">User Journey Tracking</h2>
              <p className="text-gray-600">Monitor all customer activities and document uploads</p>
            </div>
            
            <div className="space-y-6">
              {customers.map((user) => {
                const userDocs = data.documents.filter((d) => d.owner.id === user.id);
                
                return (
                  <div key={user.id} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-200">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{user.email}</h3>
                          <p className="text-sm text-gray-500">
                            Registered: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-bold">
                        {user.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-700 font-semibold mb-2">Documents Uploaded</p>
                        <p className="text-4xl font-bold text-blue-900">{user._count.documents}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                        <p className="text-sm text-purple-700 font-semibold mb-2">Total Documents</p>
                        <p className="text-4xl font-bold text-purple-900">{userDocs.length}</p>
                      </div>
                    </div>

                    {userDocs.length > 0 && (
                      <div>
                        <p className="font-bold text-gray-900 mb-4 flex items-center">
                          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-2"></span>
                          Document History
                        </p>
                        <div className="space-y-3">
                          {userDocs.map((doc) => (
                            <div key={doc.id} className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                              <span className="font-semibold text-gray-900">{doc.title}</span>
                              <div className="flex gap-2 items-center">
                                {doc.riskSnapshot && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    doc.riskSnapshot.riskLevel === "LOW" ? "bg-green-100 text-green-700" :
                                    doc.riskSnapshot.riskLevel === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                                    doc.riskSnapshot.riskLevel === "HIGH" ? "bg-orange-100 text-orange-700" :
                                    "bg-red-100 text-red-700"
                                  }`}>
                                    {doc.riskSnapshot.riskLevel}
                                  </span>
                                )}
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  doc.status === "APPROVED" ? "bg-green-100 text-green-700" :
                                  doc.status === "REJECTED" ? "bg-red-100 text-red-700" :
                                  doc.status === "FLAGGED" ? "bg-yellow-100 text-yellow-700" :
                                  "bg-gray-100 text-gray-700"
                                }`}>
                                  {doc.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "sanctions" && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Sanction Manager Journey</h2>
              <p className="text-gray-600">Track all sanction decisions and manager activities</p>
            </div>
            
            <div className="mb-8 bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl shadow-xl border border-purple-100">
              <h3 className="text-2xl font-bold mb-6 flex items-center text-purple-900">
                <span className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full mr-3"></span>
                Active Sanction Managers
              </h3>
              <div className="space-y-4">
                {sanctionManagers.map((sm) => (
                  <div key={sm.id} className="flex justify-between items-center bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                        {sm.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{sm.email}</p>
                        <p className="text-sm text-gray-500">
                          Joined: {new Date(sm.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{sm._count.decisions}</p>
                      <p className="text-sm text-gray-600 font-semibold">Decisions Made</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <span className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full mr-3"></span>
                Recent Sanction Decisions
              </h3>
              <div className="space-y-4">
                {data.sanctions.map((sanction) => (
                  <div key={sanction.id} className="p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{sanction.document.title}</p>
                        <p className="text-sm text-gray-500">
                          by {sanction.decidedBy.email}
                        </p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm ${
                        sanction.decision === "APPROVE" ? "bg-green-100 text-green-700" :
                        sanction.decision === "REJECT" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {sanction.decision}
                      </span>
                    </div>
                    {sanction.reason && (
                      <p className="text-sm text-gray-700 bg-gray-100 p-3 rounded-lg font-medium">
                        {sanction.reason}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-3 font-semibold">
                      {new Date(sanction.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">Audit Logs</h2>
              <p className="text-gray-600">Complete system activity tracking and monitoring</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
              <div className="space-y-3">
                {data.auditLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{log.action}</p>
                        <p className="text-sm text-gray-600 font-medium">
                          {log.user ? `${log.user.email} (${log.user.role})` : "System"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 font-semibold">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "createUser" && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">Create Sanction Manager</h2>
              <p className="text-gray-600">Add new sanction managers to the system</p>
            </div>
            
            <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 max-w-2xl">
              <form onSubmit={handleCreateSanctionManager} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none bg-white text-gray-900 font-medium text-lg transition-all duration-200"
                    placeholder="sanction@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none bg-white text-gray-900 font-medium text-lg transition-all duration-200"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] text-lg"
                >
                  {creating ? "Creating..." : "Create Sanction Manager"}
                </button>
              </form>

              <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <p className="text-sm font-bold text-blue-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Current Sanction Managers
                </p>
                <div className="space-y-2">
                  {sanctionManagers.length === 0 ? (
                    <p className="text-sm text-gray-600 font-medium">No sanction managers yet</p>
                  ) : (
                    sanctionManagers.map((sm) => (
                      <div key={sm.id} className="flex items-center space-x-3 bg-white p-3 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                          {sm.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-900 font-semibold">{sm.email}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "demo" && (
          <div>
            <div className="mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent mb-2">🎭 Demo Mode - Quick Access</h2>
              <p className="text-gray-600 font-medium">Quick login links for presentation. Click to open in new tab.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Demo */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg border-2 border-blue-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-blue-900">Customer User</h3>
                    <p className="text-sm text-blue-700">Document Upload & Management</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Demo Credentials:</p>
                  <p className="text-sm text-gray-600">Email: <span className="font-mono bg-gray-100 px-2 py-1 rounded">user@demo.com</span></p>
                  <p className="text-sm text-gray-600">Password: <span className="font-mono bg-gray-100 px-2 py-1 rounded">demo123</span></p>
                </div>

                <div className="space-y-2">
                  <a
                    href="/register"
                    target="_blank"
                    className="block w-full px-4 py-3 bg-blue-600 text-white text-center font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    Register as User →
                  </a>
                  <a
                    href="/login"
                    target="_blank"
                    className="block w-full px-4 py-3 bg-white text-blue-600 text-center font-semibold rounded-lg hover:bg-gray-50 transition border-2 border-blue-600"
                  >
                    Login as User →
                  </a>
                </div>
              </div>

              {/* Sanction Manager Demo */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl shadow-lg border-2 border-purple-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-purple-900">Sanction Manager</h3>
                    <p className="text-sm text-purple-700">Review & Approve Documents</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Demo Credentials:</p>
                  <p className="text-sm text-gray-600">Email: <span className="font-mono bg-gray-100 px-2 py-1 rounded">sanction@demo.com</span></p>
                  <p className="text-sm text-gray-600">Password: <span className="font-mono bg-gray-100 px-2 py-1 rounded">demo123</span></p>
                </div>

                <div className="space-y-2">
                  <a
                    href="/sanction-login"
                    target="_blank"
                    className="block w-full px-4 py-3 bg-purple-600 text-white text-center font-semibold rounded-lg hover:bg-purple-700 transition"
                  >
                    Login as Sanction Manager →
                  </a>
                  <button
                    onClick={() => setActiveTab("createUser")}
                    className="block w-full px-4 py-3 bg-white text-purple-600 text-center font-semibold rounded-lg hover:bg-gray-50 transition border-2 border-purple-600"
                  >
                    Create New Sanction Manager
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
