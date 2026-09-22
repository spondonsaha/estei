const COLORS = {
  red: "#e01e26",
  redHover: "#b8181f",
  black: "#0d0d0d",
  gray900: "#1f2933",
  gray600: "#5a6570",
  gray400: "#9aa5b1",
  gray200: "#e5e7eb",
  gray100: "#f4f5f7",
};

const FONT_STACK = "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif";

const SUPPORT_PHONE = "+880 1700000000";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function logoImage(siteUrl: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:0 0 16px;">
          <img src="${siteUrl}/logo.jpeg" alt="ESTEI" width="92" height="92" style="display:block;width:92px;height:92px;border-radius:16px;border:1px solid ${COLORS.gray200};outline:none;"/>
        </td>
      </tr>
    </table>`;
}

export function emailLayout(siteUrl: string, contentHtml: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="color-scheme" content="light"/>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.gray100};font-family:${FONT_STACK};-webkit-font-smoothing:antialiased;font-size:15px;line-height:1.6;color:${COLORS.gray600};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.gray100};padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border:1px solid ${COLORS.gray200};border-radius:14px;overflow:hidden;font-family:${FONT_STACK};">
            <tr>
              <td style="padding:28px 32px 20px;text-align:center;border-bottom:3px solid ${COLORS.red};background:linear-gradient(180deg,#ffffff 0%,#fafafa 100%);">
                ${logoImage(siteUrl)}
                <span style="display:inline-block;font-size:11px;letter-spacing:4px;color:${COLORS.gray400};text-transform:uppercase;">Step&nbsp;Forward</span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px;color:${COLORS.gray600};font-size:15px;line-height:1.7;">
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;border-top:1px solid ${COLORS.gray200};background:${COLORS.gray100};text-align:center;font-size:12px;color:${COLORS.gray400};line-height:1.9;">
                Need help? Call us at <span style="color:${COLORS.gray600};white-space:nowrap;">${SUPPORT_PHONE}</span><br/>
                &copy; ${new Date().getFullYear()} ESTEI &middot; <a href="${siteUrl}" style="color:${COLORS.red};text-decoration:none;font-weight:600;">${siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function otpEmailHtml(params: { siteUrl: string; name: string; code: string; expiresInMinutes: number }): string {
  const { siteUrl, name, code, expiresInMinutes } = params;
  const content = `
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:${COLORS.gray900};letter-spacing:-0.02em;">Verify your email</h1>
    <p style="margin:0 0 8px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 24px;">Use the 6-digit code below to verify your ESTEI account. It expires in ${expiresInMinutes} minutes.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;background:${COLORS.gray100};border:1px solid ${COLORS.gray200};border-radius:10px;">
      <tr>
        <td align="center" style="padding:28px 20px;background:#ffffff;border:2px dashed ${COLORS.red};border-radius:10px;">
          <span style="font-family:${FONT_STACK};font-size:40px;font-weight:800;letter-spacing:14px;color:${COLORS.black};">${escapeHtml(code)}</span>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:${COLORS.gray400};line-height:1.6;">
      Didn&apos;t request this email? You can safely ignore it. Your account stays protected.
    </p>
  `;
  return emailLayout(siteUrl, content);
}

export function otpEmailText(params: { name: string; code: string; expiresInMinutes: number }): string {
  const { name, code, expiresInMinutes } = params;
  return [
    `Hi ${name},`,
    ``,
    `Your ESTEI verification code is: ${code}`,
    `It expires in ${expiresInMinutes} minutes.`,
    ``,
    `If you did not create an ESTEI account, you can safely ignore this email.`,
  ].join("\n");
}