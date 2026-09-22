import nodemailer from "nodemailer";

export type MailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendMailResult = { ok: true } | { ok: false; error: string };

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "465");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn("[mailer] SMTP_HOST / SMTP_USER / SMTP_PASS not set — mail skipped");
    return null;
  }
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return cachedTransport;
}

export async function sendMail({ to, subject, html, text }: MailOptions): Promise<SendMailResult> {
  const transporter = getTransport();
  if (!transporter) return { ok: false, error: "MAIL_NOT_CONFIGURED" };
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });
    return { ok: true };
  } catch (err) {
    console.error("[mailer] send failed:", err);
    return { ok: false, error: "MAIL_SEND_FAILED" };
  }
}