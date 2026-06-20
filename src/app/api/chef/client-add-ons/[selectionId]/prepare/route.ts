import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireChef() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CHEF") return null;
  return session;
}

// PATCH /api/chef/client-add-ons/[selectionId]/prepare
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ selectionId: string }> }
) {
  const session = await requireChef();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { selectionId } = await params;
  const body = await req.json().catch(() => ({}));
  const messageRaw = typeof body.message === "string" ? body.message.trim() : "";
  const preparedMessage = messageRaw || "Prepared!";

  const selection = await prisma.clientAddOnSelection.findUnique({
    where: { id: selectionId },
    select: { id: true, active: true },
  });

  if (!selection || !selection.active) {
    return NextResponse.json({ error: "Active add-on request not found" }, { status: 404 });
  }

  const updated = await prisma.clientAddOnSelection.update({
    where: { id: selectionId },
    data: {
      active: false,
      preparedMessage,
      preparedAt: new Date(),
    },
    include: {
      recipe: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    success: true,
    selection: {
      id: updated.id,
      recipeName: updated.recipe.name,
      clientName: updated.client.name,
      preparedMessage: updated.preparedMessage,
      preparedAt: updated.preparedAt,
    },
  });
}
