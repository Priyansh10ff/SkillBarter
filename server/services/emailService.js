const nodemailer = require("nodemailer");
const env = require("../config/env");
const escapeHtml = require("../utils/escapeHtml");

// Emails that were not sent through SMTP (tests, or no EMAIL_* configured locally).
// Tests read links from here.
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

// One plain layout for every email: greeting, a line, a button, the raw link, a footnote
const linkEmail = ({ user, subject, intro, action, url, footnote }) => {
  const name = escapeHtml(user.name);
  return sendMail({
    to: user.email,
    subject,
    text: `Hi ${user.name},\n\n${intro}\n${url}\n\n${footnote}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
        <p>Hi ${name},</p>
        <p>${escapeHtml(intro)}</p>
        <p><a href="${url}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:4px">${escapeHtml(action)}</a></p>
        <p style="color:#666;font-size:13px">Or paste this link into your browser:<br>${url}</p>
        <p style="color:#999;font-size:12px">${escapeHtml(footnote)}</p>
      </div>`,
  });
};

const sendVerificationEmail = (user, rawToken) =>
  linkEmail({
    user,
    subject: "Verify your email - Skill Barter",
    intro: "Confirm your email to start trading hours on Skill Barter:",
    action: "Verify email",
    url: `${env.CLIENT_URL}/verify-email/${rawToken}`,
    footnote: "The link expires in 24 hours. If you didn't sign up, ignore this email.",
  });

const sendPasswordResetEmail = (user, rawToken) =>
  linkEmail({
    user,
    subject: "Reset your password - Skill Barter",
    intro: "Someone asked to reset your Skill Barter password. If it was you, choose a new one here:",
    action: "Choose a new password",
    url: `${env.CLIENT_URL}/reset-password/${rawToken}`,
    footnote: "The link expires in 1 hour. If you didn't ask for this, ignore this email and your password stays the same.",
  });

module.exports = { sendMail, sendVerificationEmail, sendPasswordResetEmail, outbox };
