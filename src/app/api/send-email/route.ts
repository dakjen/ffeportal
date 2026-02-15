// src/app/api/send-email/route.ts
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function POST(request: Request) {
  try {
    const { to, subject, text, html } = await request.json();

    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { message: 'Missing required email parameters (to, subject, text/html)' },
        { status: 400 }
      );
    }

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL as string, // Your verified sender email
      subject,
      text,
      html,
    };

    await sgMail.send(msg);

    return NextResponse.json({ message: 'Email sent successfully!' }, { status: 200 });
  } catch (error: unknown) {
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      // Fallback for non-Error objects, e.g., raw JSON from API or other types
      errorMessage = 'An unexpected error occurred: ' + String(error);
    }
    console.error('SendGrid Email Error:', error); // Log the full error object for inspection
    return NextResponse.json(
      { message: 'Failed to send email', error: errorMessage },
      { status: 500 }
    );
  }
}
