import { prisma } from "@/lib/prisma";
import RequestApprovalButton from "@/components/chef/RequestApprovalButton";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function displayValue(value: string | null | undefined) {
  return value && value.trim() ? value : "—";
}

function requestLabel(source: string) {
  return source === "CONTACT_FORM" ? "Contact Form" : "Quote Form";
}

export default async function ChefRequestsPage() {
  const requests = await prisma
    .$queryRaw<
      Array<{
        id: string;
        source: string;
        name: string;
        email: string;
        phone: string | null;
        mealsPerDay: string | null;
        portionsPerMeal: string | null;
        allergies: string | null;
        dislikes: string | null;
        favorites: string | null;
        additionalInfo: string | null;
        serviceType: string | null;
        serviceCount: string | null;
        message: string | null;
        status: string;
        createdAt: Date;
      }>
    >`
      SELECT
        "id",
        "source",
        "name",
        "email",
        "phone",
        "mealsPerDay",
        "portionsPerMeal",
        "allergies",
        "dislikes",
        "favorites",
        "additionalInfo",
        "serviceType",
        "serviceCount",
        "message",
        "status",
        "createdAt"
      FROM "ClientRequest"
      WHERE "status" <> 'APPROVED'
      ORDER BY "createdAt" DESC
    `
    .catch((error: unknown) => {
      const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: string }).code) : "";
      if (code === "42P01") return [];
      throw error;
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#3b2a1a]">Requests</h1>
          <p className="text-gray-500 text-sm">Stored client quote and contact submissions</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-600">No client requests have been saved yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <details key={request.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-[#3b2a1a]">{request.name}</h2>
                    <span className="text-[11px] rounded-full border border-[#eadfce] bg-[#faf5ef] px-2 py-0.5 text-[#7c5c3a]">
                      {requestLabel(request.source)}
                    </span>
                    <span className="text-[11px] rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-500">
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {request.email} {request.phone ? `• ${request.phone}` : ""}
                  </p>
                </div>
                <div className="text-xs text-gray-400">{formatDate(request.createdAt)}</div>
              </summary>

              <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
                <div className="rounded-lg bg-[#faf5ef] border border-[#eadfce] p-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7c5c3a]">Quote Details</p>
                  <p><span className="font-medium text-[#3b2a1a]">Meals per day:</span> {displayValue(request.mealsPerDay)}</p>
                  <p><span className="font-medium text-[#3b2a1a]">Portions per meal:</span> {displayValue(request.portionsPerMeal)}</p>
                  <p><span className="font-medium text-[#3b2a1a]">Allergies:</span> {displayValue(request.allergies)}</p>
                  <p><span className="font-medium text-[#3b2a1a]">Dislikes:</span> {displayValue(request.dislikes)}</p>
                  <p><span className="font-medium text-[#3b2a1a]">Favorites:</span> {displayValue(request.favorites)}</p>
                  <p><span className="font-medium text-[#3b2a1a]">Service type:</span> {displayValue(request.serviceType)}</p>
                  <p><span className="font-medium text-[#3b2a1a]">Service count:</span> {displayValue(request.serviceCount)}</p>
                </div>

                <div className="rounded-lg bg-white border border-gray-200 p-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7c5c3a]">Message</p>
                  <p className="whitespace-pre-wrap text-gray-700">{displayValue(request.additionalInfo || request.message)}</p>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-gray-500">
                  Approving this request will create or update the client account using their email address as the username.
                </div>
                <RequestApprovalButton requestId={request.id} initialStatus={request.status} email={request.email} />
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}