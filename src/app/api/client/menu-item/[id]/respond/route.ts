import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/client/menu-item/[id]/respond
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { approved, clientNote } = body;

  // Verify the item belongs to this client
  const item = await prisma.menuItem.findFirst({
    where: { id, menu: { clientId: session.user.id } },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.menuItem.update({
    where: { id },
    data: { approved: approved ?? null, clientNote: clientNote ?? null },
  });

  return NextResponse.json(updated);
}
