const { SendMailClient } = require("zeptomail");

const ZEPTO_URL = process.env.ZEPTOMAIL_URL || "https://api.zeptomail.in/v1.1/email";
const FROM_ADDRESS = process.env.MAIL_FROM_ADDRESS || "noreply@rivetglobal.net";
const FROM_NAME = process.env.MAIL_FROM_NAME || "Rivet AI";

let cachedClient = null;
function getClient() {
  if (cachedClient) return cachedClient;
  const token = process.env.ZEPTOMAIL_TOKEN;
  if (!token) {
    throw new Error("ZEPTOMAIL_TOKEN is not configured");
  }
  const formattedToken = token.startsWith("Zoho-enczapikey ")
    ? token
    : `Zoho-enczapikey ${token}`;
  cachedClient = new SendMailClient({ url: ZEPTO_URL, token: formattedToken });
  return cachedClient;
}

async function sendMail({ to, toName, subject, html, text }) {
  const client = getClient();
  return client.sendMail({
    from: { address: FROM_ADDRESS, name: FROM_NAME },
    to: [
      {
        email_address: {
          address: to,
          name: toName || to,
        },
      },
    ],
    subject,
    htmlbody: html,
    ...(text ? { textbody: text } : {}),
  });
}

function buildResetEmail({ name, resetUrl }) {
  const safeName = (name || "there").replace(/[<>]/g, "");
  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f5f7fb;padding:32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(15,23,42,0.06);">
        <tr>
          <td style="padding:28px 32px 8px;">
            <h1 style="margin:0;font-size:20px;color:#0f172a;">Reset your password</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 0;color:#334155;font-size:14px;line-height:1.6;">
            <p>Hi ${safeName},</p>
            <p>We received a request to reset the password for your Rivet AI account. Click the button below to choose a new password. This link will expire in 60 minutes.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 8px;">
            <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">Reset password</a>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 32px 28px;color:#64748b;font-size:12px;line-height:1.6;">
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break:break-all;color:#2563eb;">${resetUrl}</p>
            <p style="margin-top:18px;">If you didn't request this, you can safely ignore this email.</p>
            <p style="margin-top:18px;color:#94a3b8;">— Rivet AI</p>
          </td>
        </tr>
      </table>
    </div>
  `;
  const text = `Reset your password\n\nHi ${safeName},\n\nWe received a request to reset your Rivet AI password. Open the link below within 60 minutes to choose a new password:\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`;
  return { html, text };
}

module.exports = { sendMail, buildResetEmail };
