"use client";

export default function BlockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow max-w-md text-center">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">
          Access Blocked
        </h1>

        <p className="text-gray-700 mb-4">
          Your request has been blocked due to security policy enforcement.
        </p>

        <p className="text-sm text-gray-500">
          If you believe this is an error, please contact support or try again
          later.
        </p>
      </div>
    </div>
  );
}
