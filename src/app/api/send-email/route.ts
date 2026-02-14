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
  } catch (error: any) {
    console.error('SendGrid Email Error:', error.response?.body || error.message);
    return NextResponse.json(
      { message: 'Failed to send email', error: error.response?.body || error.message },
      { status: 500 }
    );
  }
}
