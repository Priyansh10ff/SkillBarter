const nodemailer = require("nodemailer");
const env = require("../config/env");
const escapeHtml = require("../utils/escapeHtml");

// Emails that were not sent through SMTP (tests, or no EMAIL_* configured locally).
// Tests read verification links from here.
const outbox = [];

const transporter =
  env.EMAIL_USER && env.EMAIL_PASS && env.NODE_ENV !== "test"
    ? nodemailer.createTransport({ service: "gmail", auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS } })
    : null;

const sendMail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    outbox.push({ to, subject, text, html });
    if (env.NODE_ENV !== "test") console.log(`[email not configured] to ${to}: ${subject}\n${text}\n`);
    return;
  }
  await transporter.sendMail({ from: `Skill Barter <${env.EMAIL_USER}>`, to, subject, text, html });
};

const sendVerificationEmail = (user, rawToken) => {
  const url = `${env.CLIENT_URL}/verify-email/${rawToken}`;
  const name = escapeHtml(user.name);
  return sendMail({
    to: user.email,
    subject: "Verify your email - Skill Barter",
    text: `Hi ${user.name},\n\nConfirm your email to start trading hours on Skill Barter:\n${url}\n\nThe link expires in 24 hours. If you didn't sign up, ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
        <p>Hi ${name},</p>
        <p>Confirm your email to start trading hours on Skill Barter.</p>
        <p><a href="${url}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:4px">Verify email</a></p>
        <p style="color:#666;font-size:13px">Or paste this link into your browser:<br>${url}</p>
        <p style="color:#999;font-size:12px">The link expires in 24 hours. If you didn't sign up, ignore this email.</p>
      </div>`,
  });
};

module.exports = { sendMail, sendVerificationEmail, outbox };
