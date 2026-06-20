"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  requestId: string;
  initialStatus: string;
  email: string;
};

export default function RequestApprovalButton({ requestId, initialStatus, email }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; temporaryPassword: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isApproved = status === "APPROVED";

  async function approveRequest() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/chef/requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = (await res.json()) as { error?: string; status?: string; step?: string; details?: string | null; username?: string; temporaryPassword?: string };
      if (!res.ok) {
        const messageParts = [data.step ? `step=${data.step}` : null, data.error ?? "Failed to approve request", data.details ? `details=${data.details}` : null].filter(Boolean);
        throw new Error(messageParts.join(" | "));
      }

      if (data.status) setStatus(data.status);
      if (data.username && data.temporaryPassword) {
        setCredentials({ username: data.username, temporaryPassword: data.temporaryPassword });
      } else {
        setCredentials({ username: email, temporaryPassword: "Created successfully" });
      }
      router.refresh();
    } catch (error) {
      console.error(error);
      setCredentials(null);
      setStatus("ERROR");
      setError(error instanceof Error ? error.message : "Failed to approve request");
    } finally {
      setSaving(false);
    }
  }

  if (isApproved && !credentials) {
    return <span className="text-xs text-green-700 font-medium">Approved</span>;
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={approveRequest}
        disabled={saving || isApproved}
        className="inline-flex items-center justify-center rounded-lg bg-[#3b2a1a] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#2e1f0f] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Approving..." : isApproved ? "Approved" : "Approve & Create Client"}
      </button>

      {credentials && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-900">
          <p className="font-medium">Client account created</p>
          <p>Username: {credentials.username}</p>
          <p>Password: {credentials.temporaryPassword}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
          {error}
        </div>
      )}
    </div>
  );
}