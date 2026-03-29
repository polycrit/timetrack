import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "TimeTrack <onboarding@resend.dev>",
    to: email,
    subject: "Verify your TimeTrack email",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="margin-bottom: 16px;">Verify your email</h2>
        <p style="color: #555; margin-bottom: 24px;">
          Click the button below to verify your email address and activate your TimeTrack account.
        </p>
        <a href="${verifyUrl}"
           style="display: inline-block; background: #C06A4A; color: #fff; padding: 12px 24px;
                  border-radius: 6px; text-decoration: none; font-weight: 500;">
          Verify Email
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 24px;">
          This link expires in 24 hours. If you didn't create an account, you can ignore this email.
        </p>
      </div>
    `,
  });
}
