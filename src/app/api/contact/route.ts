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

async function sendContactEmail(data: {
  name: string;
  email: string;
  phone?: string;
  serviceType?: string;
  serviceCount?: string | number;
  message: string;
}) {
  if (!transporter) return false;

  const html = `
    <h2>New quote request</h2>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
    ${data.serviceType && data.serviceCount ? `<p><strong>Request:</strong> ${data.serviceCount} ${data.serviceType}</p>` : ""}
    <p><strong>Message:</strong></p>
    <p>${data.message.replace(/\n/g, "<br />")}</p>
  `;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: CONTACT_EMAIL_TO,
    subject: `New quote request from ${data.name}`,
    text: `New quote request from ${data.name} (${data.email})\n\n${data.phone ? `Phone: ${data.phone}\n` : ""}${data.serviceType && data.serviceCount ? `Request: ${data.serviceCount} ${data.serviceType}\n\n` : ""}Message:\n${data.message}`,
    html,
  });

  return true;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, serviceType, serviceCount, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const requestData = { name, email, phone, serviceType, serviceCount, message };

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
        ${"CONTACT_FORM"},
        ${name},
        ${email},
        ${phone || null},
        ${null},
        ${null},
        ${null},
        ${null},
        ${null},
        ${null},
        ${serviceType || null},
        ${serviceCount ? String(serviceCount) : null},
        ${message},
        ${"NEW"},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: string }).code) : "";
    if (code === "42P01") {
      console.warn("ClientRequest table is not available yet; skipping request storage.");
    } else {
    console.error("Failed to store contact request:", error);
      return NextResponse.json({ error: "Failed to save request." }, { status: 500 });
    }
  }

  if (hasSmtpConfig) {
    try {
      await sendContactEmail(requestData);
    } catch (error) {
      console.error("Failed to send contact email:", error);
      return NextResponse.json({ success: true, warning: "Request saved, but email delivery failed." });
    }
  } else {
    console.log("=== New Quote Request ===");
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    if (phone) console.log(`Phone: ${phone}`);
    if (serviceType && serviceCount) {
      console.log(`Request: ${serviceCount} ${serviceType}`);
    }
    console.log(`Message: ${message}`);
    console.log("========================");
  }

  return NextResponse.json({ success: true });
}
