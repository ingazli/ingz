import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
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

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[]";
  }
}

async function sendQuoteEmail(data: {
  name: string;
  email: string;
  phone: string;
  peopleCount: string;
  mealsPerDay: string;
  additionalInfo: string;
  householdQuestionnaire: unknown;
}) {
  if (!transporter) return;

  const html = [
    "<h2>New quote request</h2>",
    `<p><strong>Name:</strong> ${data.name}</p>`,
    `<p><strong>Email:</strong> ${data.email}</p>`,
    data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : "",
    `<p><strong>People count:</strong> ${data.peopleCount}</p>`,
    `<p><strong>Meals per day:</strong> ${data.mealsPerDay}</p>`,
    data.additionalInfo ? `<p><strong>Additional details:</strong><br />${data.additionalInfo.replace(/\n/g, "<br />")}</p>` : "",
    `<p><strong>Household questionnaire:</strong></p>`,
    `<pre>${safeJson(data.householdQuestionnaire)}</pre>`,
  ]
    .filter(Boolean)
    .join("\n");

  const text = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : "",
    `People count: ${data.peopleCount}`,
    `Meals per day: ${data.mealsPerDay}`,
    data.additionalInfo ? `Additional details: ${data.additionalInfo}` : "",
    `Household questionnaire: ${safeJson(data.householdQuestionnaire)}`,
  ]
    .filter(Boolean)
    .join("\n");

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: CONTACT_EMAIL_TO,
    subject: `Quote request from ${data.name}`,
    html,
    text,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const phone = clean(body.phone);
  const peopleCount = clean(body.peopleCount);
  const mealsPerDay = clean(body.mealsPerDay);
  const additionalInfo = clean(body.additionalInfo);
  const householdQuestionnaire = Array.isArray(body.householdQuestionnaire) ? body.householdQuestionnaire : [];

  if (!name || !email || !peopleCount || !mealsPerDay) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const householdSummary = householdQuestionnaire
    .map((member: Record<string, unknown>, index: number) => {
      const memberName = clean(member.personName ?? `Person ${index + 1}`);
      const portionSize = clean(member.portionSize);
      const allergies = clean(member.allergies);
      const dislikes = clean(member.dislikes);
      const favorites = clean(member.favorites);

      return [
        `${index + 1}. ${memberName}`,
        portionSize ? `portion size: ${portionSize}` : null,
        allergies ? `allergies: ${allergies}` : null,
        dislikes ? `dislikes: ${dislikes}` : null,
        favorites ? `favorites: ${favorites}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .join("\n");

  const requestSummary = [
    `Quote request`,
    `- People count: ${peopleCount}`,
    `- Meals per day: ${mealsPerDay}`,
    phone ? `- Phone: ${phone}` : null,
    additionalInfo ? `- Additional info: ${additionalInfo}` : null,
    householdSummary ? `- Household:\n${householdSummary}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await prisma.$executeRaw`
      INSERT INTO "ClientRequest" (
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
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${crypto.randomUUID()},
        ${"QUOTE_FORM"},
        ${name},
        ${email},
        ${phone || null},
        ${mealsPerDay},
        ${null},
        ${null},
        ${null},
        ${null},
        ${requestSummary},
        ${"QUOTE_REQUEST"},
        ${peopleCount},
        ${safeJson({ peopleCount, mealsPerDay, householdQuestionnaire, additionalInfo })},
        ${"NEW"},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error("Failed to store quote request:", error);
    return NextResponse.json({ error: "Failed to save request." }, { status: 500 });
  }

  try {
    await sendQuoteEmail({
      name,
      email,
      phone,
      peopleCount,
      mealsPerDay,
      additionalInfo,
      householdQuestionnaire,
    });
  } catch (error) {
    console.error("Failed to send quote email:", error);
  }

  return NextResponse.json({ success: true });
}