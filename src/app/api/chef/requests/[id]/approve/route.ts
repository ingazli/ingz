import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { authOptions } from "@/lib/auth";
import {
  DEFAULT_CUISINE_RATINGS,
  createDefaultPerson,
  getPortionSizeServings,
  PORTION_SIZE_OPTIONS,
  type QuestionnaireData,
} from "@/lib/client-questionnaire";
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeParseJson(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function normalizePersonQuestionnaire(input: unknown, fallbackName: string) {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const portionSize = String(raw.portionSize ?? "Standard").trim();
  const allergiesValue = raw.allergies;
  const allergies = Array.isArray(allergiesValue)
    ? allergiesValue.map((item) => String(item).trim()).filter(Boolean)
    : String(allergiesValue ?? "")
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);

  const person = createDefaultPerson(String(raw.personName ?? fallbackName).trim() || fallbackName);
  person.portionSize = PORTION_SIZE_OPTIONS.includes(portionSize as (typeof PORTION_SIZE_OPTIONS)[number])
    ? portionSize
    : "Standard";
  person.tryAnything = false;
  person.cuisineRatings = { ...DEFAULT_CUISINE_RATINGS };
  person.spiceLevel = 0;
  person.allergies = allergies;
  person.otherAllergies = "";
  person.favoriteFoods = String(raw.favorites ?? "").trim();
  person.avoidFoods = String(raw.dislikes ?? "").trim();

  return person;
}

function buildQuestionnaireData(request: {
  name: string;
  message: string | null;
  additionalInfo: string | null;
}) : QuestionnaireData {
  const parsed = safeParseJson(request.message);
  const householdQuestionnaire = Array.isArray(parsed?.householdQuestionnaire)
    ? parsed?.householdQuestionnaire
    : [];

  const household = householdQuestionnaire.length > 0
    ? householdQuestionnaire.map((member, index) => normalizePersonQuestionnaire(member, `Person ${index + 1}`))
    : [createDefaultPerson(request.name)];

  return { household };
}

function summarizeHousehold(questionnaireData: QuestionnaireData): string {
  return questionnaireData.household
    .map((member, index) => {
      const portionServings = getPortionSizeServings(member.portionSize);
      const allergies = member.allergies.join(", ");
      const prefs = [member.favoriteFoods, member.avoidFoods]
        .filter(Boolean)
        .join(" | ");

      return [
        `${index + 1}. ${member.personName}`,
        `portion size: ${member.portionSize} (${portionServings} serving${portionServings === 1 ? "" : "s"})`,
        allergies ? `allergies: ${allergies}` : null,
        prefs ? `preferences: ${prefs}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .join("\n");
}

function formatRequestSummary(request: {
  name: string;
  email: string;
  peopleCount: string | null;
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
}) {
  return [
    `Approved client request for ${request.name} (${request.email})`,
    request.peopleCount ? `People count: ${request.peopleCount}` : null,
    request.phone ? `Phone: ${request.phone}` : null,
    request.mealsPerDay ? `Meals per day: ${request.mealsPerDay}` : null,
    request.portionsPerMeal ? `Portions per meal: ${request.portionsPerMeal}` : null,
    request.allergies ? `Allergies: ${request.allergies}` : null,
    request.dislikes ? `Dislikes: ${request.dislikes}` : null,
    request.favorites ? `Favorites: ${request.favorites}` : null,
    request.additionalInfo ? `Additional info: ${request.additionalInfo}` : null,
    request.serviceType ? `Service type: ${request.serviceCount ?? ""} ${request.serviceType}`.trim() : null,
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendWelcomeEmail(data: { name: string; email: string; password: string }) {
  if (!transporter) return;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: data.email,
    subject: "Your Chef Inga client account",
    html: [
      "<h2>Your client account is ready</h2>",
      `<p><strong>Name:</strong> ${data.name}</p>`,
      `<p><strong>Username:</strong> ${data.email}</p>`,
      `<p><strong>Temporary password:</strong> ${data.password}</p>`,
      "<p>Please sign in and change this password after your first login.</p>",
    ].join("\n"),
    text: [
      "Your client account is ready",
      `Name: ${data.name}`,
      `Username: ${data.email}`,
      `Temporary password: ${data.password}`,
      "Please sign in and change this password after your first login.",
    ].join("\n"),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CHEF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const requestId = clean(id);
    if (!requestId) {
      return NextResponse.json({ error: "Request id is required" }, { status: 400 });
    }

    const requests = await prisma.$queryRaw<
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
      WHERE "id" = ${requestId}
      LIMIT 1
    `;

    const request = requests[0];
    if (!request) {
      return NextResponse.json({ error: "Request not found", step: "load-request" }, { status: 404 });
    }

    const requestName = clean(request.name);
    const requestEmail = clean(request.email).toLowerCase();

    if (!requestName) {
      return NextResponse.json({ error: "Request is missing a client name.", step: "validate-name" }, { status: 400 });
    }

    if (!isValidEmail(requestEmail)) {
      return NextResponse.json(
        { error: "Request email is invalid. Update the request before approving it.", step: "validate-email" },
        { status: 400 }
      );
    }

    if (request.status === "APPROVED") {
      return NextResponse.json(
        {
          error: "Request has already been approved",
          status: request.status,
        },
        { status: 409 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: requestEmail },
      select: { id: true, role: true },
    });

    if (existingUser && existingUser.role !== "CLIENT") {
      return NextResponse.json({ error: "A non-client account already exists for this email.", step: "check-existing-user" }, { status: 409 });
    }

    const temporaryPassword = crypto.randomBytes(9).toString("base64url");
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
    const questionnaireData = buildQuestionnaireData(request);
    const householdAllergies = questionnaireData.household.flatMap((member) => member.allergies);
    const preferenceSummary = summarizeHousehold(questionnaireData);
    const requestSummary = formatRequestSummary({
      ...request,
      peopleCount: request.serviceCount,
    });

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: requestName,
            password: hashedPassword,
            role: "CLIENT",
            allergies: householdAllergies.length > 0 ? Array.from(new Set(householdAllergies)).join(", ") : request.allergies ?? null,
            preferences: [
              preferenceSummary,
              request.serviceType ? `Service: ${request.serviceCount ?? ""} ${request.serviceType}`.trim() : null,
            ]
              .filter(Boolean)
              .join(" | ") || null,
            notes: requestSummary,
            questionnaireData: JSON.stringify(questionnaireData),
          },
          select: { id: true, email: true, name: true },
        })
      : await prisma.user.create({
          data: {
            email: requestEmail,
            name: requestName,
            password: hashedPassword,
            role: "CLIENT",
            allergies: householdAllergies.length > 0 ? Array.from(new Set(householdAllergies)).join(", ") : request.allergies ?? null,
            preferences: [
              preferenceSummary,
              request.serviceType ? `Service: ${request.serviceCount ?? ""} ${request.serviceType}`.trim() : null,
            ]
              .filter(Boolean)
              .join(" | ") || null,
            notes: requestSummary,
            questionnaireData: JSON.stringify(questionnaireData),
          },
          select: { id: true, email: true, name: true },
        });

    await prisma.$executeRaw`
      UPDATE "ClientRequest"
      SET "status" = ${"APPROVED"}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${requestId}
    `;

    try {
      await sendWelcomeEmail({
        name: user.name,
        email: user.email,
        password: temporaryPassword,
      });
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }

    return NextResponse.json({
      success: true,
      requestId,
      clientId: user.id,
      username: user.email,
      temporaryPassword,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown approval error";
    console.error("Approve request failed:", error);
    return NextResponse.json(
      {
        error: message,
        step: "unhandled",
        details: error instanceof Error ? error.stack ?? null : null,
      },
      { status: 500 }
    );
  }
}