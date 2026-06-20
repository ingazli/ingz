import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import nodemailer from "nodemailer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CONTACT_EMAIL_TO = process.env.CONTACT_EMAIL_TO ?? "inga@chefinga.com";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Chef & Co. <no-reply@chefinga.com>";
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const hasSmtpConfig = Boolean(SMTP_HOST && SMTP_PORT);
const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

async function sendMenuRequestEmail(data: {
  clientName: string;
  clientEmail: string;
  mealsPerDay: string;
  portionsPerMeal: string;
  preferredCuisines: string;
  avoidFoods: string;
  dietaryNeeds: string;
  notes: string;
}) {
  if (!transporter) return;

  const lines = [
    `<p><strong>Client:</strong> ${data.clientName}</p>`,
    `<p><strong>Email:</strong> ${data.clientEmail}</p>`,
    `<p><strong>Meals per day:</strong> ${data.mealsPerDay}</p>`,
    `<p><strong>Portions per meal:</strong> ${data.portionsPerMeal}</p>`,
    data.preferredCuisines ? `<p><strong>Preferred cuisines:</strong> ${data.preferredCuisines}</p>` : "",
    data.avoidFoods ? `<p><strong>Foods to avoid:</strong> ${data.avoidFoods}</p>` : "",
    data.dietaryNeeds ? `<p><strong>Dietary needs:</strong> ${data.dietaryNeeds}</p>` : "",
    data.notes ? `<p><strong>Notes:</strong><br />${data.notes.replace(/\n/g, "<br />")}</p>` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const text = [
    `Client: ${data.clientName}`,
    `Email: ${data.clientEmail}`,
    `Meals per day: ${data.mealsPerDay}`,
    `Portions per meal: ${data.portionsPerMeal}`,
    data.preferredCuisines ? `Preferred cuisines: ${data.preferredCuisines}` : "",
    data.avoidFoods ? `Foods to avoid: ${data.avoidFoods}` : "",
    data.dietaryNeeds ? `Dietary needs: ${data.dietaryNeeds}` : "",
    data.notes ? `Notes: ${data.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: CONTACT_EMAIL_TO,
    subject: `Menu request from ${data.clientName}`,
    html: `<h2>Client Menu Request</h2>${lines}`,
    text,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const mealsPerDay = clean(body.mealsPerDay);
  const portionsPerMeal = clean(body.portionsPerMeal);
  const preferredCuisines = clean(body.preferredCuisines);
  const avoidFoods = clean(body.avoidFoods);
  const dietaryNeeds = clean(body.dietaryNeeds);
  const notes = clean(body.notes);

  if (!mealsPerDay || !portionsPerMeal) {
    return NextResponse.json(
      { error: "Meals per day and portions per meal are required." },
      { status: 400 }
    );
  }

  const now = new Date();
  const requestSummary = [
    `Menu request (${now.toISOString()}):`,
    `- Meals per day: ${mealsPerDay}`,
    `- Portions per meal: ${portionsPerMeal}`,
    preferredCuisines ? `- Preferred cuisines: ${preferredCuisines}` : "",
    avoidFoods ? `- Foods to avoid: ${avoidFoods}` : "",
    dietaryNeeds ? `- Dietary needs: ${dietaryNeeds}` : "",
    notes ? `- Notes: ${notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, notes: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const existingNotes = user.notes?.trim();
  const updatedNotes = existingNotes
    ? `${existingNotes}\n\n${requestSummary}`
    : requestSummary;

  await prisma.user.update({
    where: { id: user.id },
    data: { notes: updatedNotes },
  });

  try {
    await sendMenuRequestEmail({
      clientName: user.name,
      clientEmail: user.email,
      mealsPerDay,
      portionsPerMeal,
      preferredCuisines,
      avoidFoods,
      dietaryNeeds,
      notes,
    });
  } catch (error) {
    console.error("Failed to send menu request email:", error);
  }

  return NextResponse.json({ success: true });
}