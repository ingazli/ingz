import { NextRequest, NextResponse } from "next/server";

// Simple contact form handler — logs the inquiry and returns success.
// In production, swap the console.log for an email service (Resend, SendGrid, etc.)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, serviceType, serviceCount, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // TODO: replace with your email service of choice
  console.log("=== New Quote Request ===");
  console.log(`Name: ${name}`);
  console.log(`Email: ${email}`);
  if (phone) console.log(`Phone: ${phone}`);
  if (serviceType && serviceCount) {
    console.log(`Request: ${serviceCount} ${serviceType}`);
  }
  console.log(`Message: ${message}`);
  console.log("========================");

  return NextResponse.json({ success: true });
}
