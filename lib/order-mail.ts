import { emailLayout, escapeHtml } from "@/lib/mail-templates";
import { SITE_URL } from "@/lib/constants";
import { sendMail } from "@/lib/mailer";

function bdt(value: number | string | { toString(): string }): string {
  const num = Number(value);
  const amount = Number.isInteger(num) ? num.toString() : num.toFixed(2);
  return `৳${Number(amount).toLocaleString("en-US")}`;
}

export type OrderMailItem = {
  productName: string;
  size: string;
  colourName: string;
  unitPrice: number | string | { toString(): string };
  quantity: number;
};

export type OrderMailData = {
  orderNumber: string;
  viewToken?: string;
  customerName: string;
  district: string;
  paymentMethod: string;
  createdAt: Date;
  subtotal: number | string | { toString(): string };
  shippingFee: number | string | { toString(): string };
  total: number | string | { toString(): string };
  items: OrderMailItem[];
};

const C = {
  red: "#e01e26",
  black: "#0d0d0d",
  gray900: "#1f2933",
  gray600: "#5a6570",
  gray400: "#9aa5b1",
  gray200: "#e5e7eb",
  gray100: "#f2f4f6",
};

const PAYMENT_LABELS: Record<string, string> = {
  COD: "Cash on Delivery",
  BKASH: "bKash",
  NAGAD: "Nagad",
  CARD: "Card",
};

export function orderConfirmationEmailHtml(data: OrderMailData): string {
  const itemsRows = data.items
    .map((item) => {
      const lineTotal = Number(item.unitPrice) * item.quantity;
      return `
        <tr>
          <td class="mail-table-cell" style="padding:12px 14px;border-bottom:1px solid ${C.gray200};">
            <span style="color:${C.gray900};font-weight:600;">${escapeHtml(item.productName)}</span><br/>
            <span style="font-size:12px;color:${C.gray400};">${escapeHtml(item.colourName)} &middot; Size ${escapeHtml(item.size)} &middot; Qty ${item.quantity}</span>
          </td>
          <td class="mail-table-cell" style="padding:12px 14px;border-bottom:1px solid ${C.gray200};text-align:right;color:${C.gray600};white-space:nowrap;">${bdt(item.unitPrice)}</td>
          <td class="mail-table-cell" style="padding:12px 14px;border-bottom:1px solid ${C.gray200};text-align:right;color:${C.gray900};font-weight:600;white-space:nowrap;">${bdt(lineTotal)}</td>
        </tr>`;
    })
    .join("");

  const shippingTotalRow =
    Number(data.shippingFee) > 0
      ? `
        <tr>
          <td colspan="2" class="mail-table-cell" style="padding:8px 14px;text-align:right;color:${C.gray600};font-size:13px;">Delivery</td>
          <td class="mail-table-cell" style="padding:8px 14px;text-align:right;color:${C.gray900};white-space:nowrap;">${bdt(data.shippingFee)}</td>
        </tr>`
      : "";

  const orderUrl = `${SITE_URL}/order/${encodeURIComponent(data.orderNumber)}${
    data.viewToken ? `?token=${encodeURIComponent(data.viewToken)}` : ""
  }`;

  const metaRow = (label: string, value: string) => `
    <tr>
      <td class="mail-meta-label" style="padding:7px 6px;font-size:13px;color:${C.gray400};white-space:nowrap;">${label}</td>
      <td style="padding:7px 6px;font-size:13px;color:${C.gray900};font-weight:600;text-align:right;white-space:nowrap;">${value}</td>
    </tr>`;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C.gray900};letter-spacing:-0.02em;">Thank you for your order!</h1>
    <p style="margin:0 0 24px;color:${C.gray600};">Hi ${escapeHtml(data.customerName)}, your order has been placed successfully. We will confirm it once it starts processing.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;background:${C.gray100};border:1px solid ${C.gray200};border-radius:10px;">
      ${metaRow("Order number", escapeHtml(data.orderNumber))}
      ${metaRow("Placed on", escapeHtml(data.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })))}
      ${metaRow("Delivery to", escapeHtml(data.district))}
      ${metaRow("Payment", escapeHtml(PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod))}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid ${C.gray200};border-radius:10px;overflow:hidden;">
      <tr style="background:${C.gray100};">
        <th align="left" class="mail-table-cell" style="padding:10px 14px;color:${C.gray900};font-size:13px;">Item</th>
        <th align="right" class="mail-table-cell" style="padding:10px 14px;color:${C.gray900};font-size:13px;">Rate</th>
        <th align="right" class="mail-table-cell" style="padding:10px 14px;color:${C.gray900};font-size:13px;">Total</th>
      </tr>
      ${itemsRows}
      <tr>
        <td colspan="2" class="mail-table-cell" style="padding:8px 14px;text-align:right;color:${C.gray600};font-size:13px;">Subtotal</td>
        <td class="mail-table-cell" style="padding:8px 14px;text-align:right;color:${C.gray900};">${bdt(data.subtotal)}</td>
      </tr>
      ${shippingTotalRow}
      <tr>
        <td colspan="2" class="mail-table-cell" style="padding:12px 14px;text-align:right;color:${C.gray900};font-weight:700;font-size:15px;">Total</td>
        <td class="mail-table-cell" style="padding:12px 14px;text-align:right;color:${C.red};font-weight:800;font-size:18px;">${bdt(data.total)}</td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td align="center">
          <a href="${orderUrl}" class="mail-btn" style="display:inline-block;background:${C.red};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">Track your order</a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:${C.gray400};line-height:1.6;">If you have any questions, reply to this email or call our support line.</p>
  `;

  return emailLayout(SITE_URL, content);
}

export function orderConfirmationEmailText(data: OrderMailData): string {
  const orderUrl = `${SITE_URL}/order/${encodeURIComponent(data.orderNumber)}${
    data.viewToken ? `?token=${encodeURIComponent(data.viewToken)}` : ""
  }`;
  const lines = [
    `Hi ${data.customerName},`,
    ``,
    `Your order ${data.orderNumber} has been placed successfully.`,
    `Placed on: ${data.createdAt.toLocaleString("en-GB")}`,
    `Delivery district: ${data.district}`,
    `Payment method: ${PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod}`,
    ``,
    ...data.items.map(
      (item) => `- ${item.productName} (${item.colourName}, size ${item.size}) x ${item.quantity} - ${bdt(Number(item.unitPrice) * item.quantity)}`
    ),
    ``,
    `Subtotal: ${bdt(data.subtotal)}`,
    `Delivery: ${bdt(data.shippingFee)}`,
    `Total: ${bdt(data.total)}`,
    ``,
    `Track your order: ${orderUrl}`,
  ];
  return lines.join("\n");
}

export async function sendOrderConfirmation(to: string, data: OrderMailData): Promise<void> {
  try {
    await sendMail({
      to,
      subject: `Order confirmed — ${data.orderNumber}`,
      html: orderConfirmationEmailHtml(data),
      text: orderConfirmationEmailText(data),
    });
  } catch (err) {
    console.error("[order-mail] failed to send confirmation:", err);
  }
}