/**
 * Gmail SMTP mailer — nodemailer 기반
 * GMAIL_USER, GMAIL_APP_PASSWORD 환경변수 필요
 */
import nodemailer from "nodemailer";

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("GMAIL_USER 또는 GMAIL_APP_PASSWORD 환경변수가 설정되지 않았습니다.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendMail({ to, subject, html, replyTo }: SendMailOptions) {
  const transporter = createTransporter();
  const from = `noonch-i <${process.env.GMAIL_USER}>`;

  await transporter.sendMail({ from, to, subject, html, replyTo });
}
