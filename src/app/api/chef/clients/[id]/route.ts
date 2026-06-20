import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireChef() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CHEF") return null;
  return session;
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireChef();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const clientId = clean(id);
  if (!clientId) {
    return NextResponse.json({ error: "Client id is required" }, { status: 400 });
  }

  const client = await prisma.user.findFirst({
    where: { id: clientId, role: "CLIENT" },
    select: { id: true, email: true, name: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.mealFeedback.deleteMany({ where: { clientId: client.id } });
    await tx.weeklyMenu.deleteMany({ where: { clientId: client.id } });
    await tx.clientAddOnSelection.deleteMany({ where: { clientId: client.id } });
    await tx.clientQuote.deleteMany({ where: { clientId: client.id } });
    await tx.user.delete({ where: { id: client.id } });
  });

  return NextResponse.json({ success: true, clientId: client.id, email: client.email, name: client.name });
}