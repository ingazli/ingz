import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireChef() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CHEF") return null;
  return session;
}

function toNumber(value: unknown): number {
  return Number(value);
}

// GET /api/chef/quotes
export async function GET() {
  const session = await requireChef();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quotes = await prisma.clientQuote.findMany({
    where: { chefId: session.user.id },
    include: {
      client: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quotes);
}

// POST /api/chef/quotes
export async function POST(req: NextRequest) {
  const session = await requireChef();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const clientId = String(body.clientId ?? "").trim();
  const mealsCount = toNumber(body.mealsCount);
  const groceryCost = toNumber(body.groceryCost);
  const laborHours = toNumber(body.laborHours);
  const laborRate = toNumber(body.laborRate);
  const profitPercent = toNumber(body.profitPercent);
  const note = String(body.note ?? "").trim() || null;

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  if (!Number.isInteger(mealsCount) || mealsCount < 1) {
    return NextResponse.json({ error: "mealsCount must be an integer >= 1" }, { status: 400 });
  }

  const numberFields = [
    ["groceryCost", groceryCost],
    ["laborHours", laborHours],
    ["laborRate", laborRate],
    ["profitPercent", profitPercent],
  ] as const;

  for (const [label, value] of numberFields) {
    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json({ error: `${label} must be a number >= 0` }, { status: 400 });
    }
  }

  const client = await prisma.user.findFirst({
    where: { id: clientId, role: "CLIENT" },
    select: { id: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const laborCost = laborHours * laborRate;
  const breakEvenCost = groceryCost + laborCost;
  const totalQuote = breakEvenCost * (1 + profitPercent / 100);
  const costPerMeal = breakEvenCost / mealsCount;
  const quotePerMeal = totalQuote / mealsCount;

  const quote = await prisma.clientQuote.create({
    data: {
      clientId,
      chefId: session.user.id,
      mealsCount,
      groceryCost,
      laborHours,
      laborRate,
      profitPercent,
      breakEvenCost,
      totalQuote,
      costPerMeal,
      quotePerMeal,
      note,
    },
    include: {
      client: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(quote, { status: 201 });
}
