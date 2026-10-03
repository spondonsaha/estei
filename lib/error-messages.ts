/**
 * Centralised, user-facing error text.
 *
 * Rules followed here:
 *  - Say what went wrong in plain language, not with a code or exception name.
 *  - Say what the user can do next.
 *  - Never expose internal detail (stack traces, Prisma errors, SQL) to a browser.
 *
 * Admin-facing wording is deliberately more explicit than customer-facing wording:
 * an admin needs to know *which* record or step failed to fix it.
 */

export const ERR = {
  // ---------- Session / access ----------
  UNAUTHORIZED: "Your session has expired. Please sign in again to continue.",
  ADMIN_REQUIRED: "You need to sign in as an admin to do that.",
  FORBIDDEN: "Your account does not have permission to do that.",
  NOT_OWNER: "That record belongs to a different account. Check the details and try again.",

  // ---------- Auth ----------
  LOGIN_FAILED:
    "That email and password do not match an account. Check for typos in both fields, and make sure Caps Lock is off.",
  LOGIN_RATE_LIMITED:
    "Too many sign-in attempts from this device. Please wait 15 minutes before trying again.",
  LOGIN_EMAIL_INVALID: "Enter a valid email address, for example you@example.com.",
  LOGIN_PASSWORD_INVALID: "Enter your password. Passwords are at least 6 characters.",
  ACCOUNT_EXISTS:
    "An account already uses this email address or mobile number. Sign in instead, or contact us if you no longer remember your password.",
  REGISTER_FAILED:
    "We could not create your account. This is usually a temporary problem with our system — please try again in a moment.",
  REGISTER_RATE_LIMITED:
    "Too many accounts created from this device. Please wait a few minutes before trying again.",
  ACCOUNT_NOT_FOUND:
    "We could not find an account for that email address. You may need to register first.",
  ALREADY_VERIFIED: "This email address is already verified. You can sign in now.",
  OTP_SEND_FAILED:
    "We could not send the verification email right now. Please wait a moment and try again.",
  OTP_SEND_RATE_LIMITED:
    "Too many verification emails were requested for this account. Please wait a few minutes before trying again.",
  OTP_ACCOUNT_NOT_FOUND: "No account was found for this email address. Please register first.",
  OTP_ALREADY_VERIFIED: "This email address is already verified. You can sign in now.",
  OTP_CODE_INVALID: "That verification code is not valid. Please enter the 6-digit code we emailed you.",
  OTP_VERIFY_RATE_LIMITED:
    "Too many incorrect verification codes. Please wait a few minutes before trying again.",
  OTP_VERIFY_FAILED:
    "We could not verify that code right now. Please try again in a moment.",
  NOT_VERIFIED:
    "Please verify your email address before placing an order. You can request a new verification code from My Account.",

  // ---------- Orders ----------
  CART_EMPTY: "Your cart is empty. Add an item before checking out.",
  CART_ITEM_INVALID:
    "One of the items in your cart is no longer available. Please review your cart and try again.",
  PRODUCT_UNAVAILABLE:
    "Some items in your cart are no longer available. Please remove them and try again.",
  OUT_OF_STOCK: "Some items are out of stock. Please reduce the quantity or remove them to continue.",
  INVALID_DISTRICT: "Select a valid district from the list.",
  ORDER_CREATE_FAILED:
    "We could not place your order. Nothing has been charged — please try again in a moment, or contact us if it keeps happening.",
  ORDER_NOT_FOUND:
    "We could not find that order. Check the order number, or sign in to the account that placed it.",
  ORDER_CANCEL_NOT_ALLOWED:
    "This order can no longer be cancelled because it has already been processed. Please contact us if you need help.",
  ORDER_NOT_CANCELLABLE: "This order can no longer be cancelled.",
  ORDER_CANCEL_FAILED:
    "We could not cancel this order. Please try again, or contact us if the problem continues.",
  ORDER_LOAD_FAILED:
    "We could not load the details for this order. Your order is safe — please refresh the page, or contact us if it keeps happening.",

  // ---------- Cart / wishlist ----------
  CART_PRODUCT_UNAVAILABLE:
    "That product is no longer available and was not added to your cart.",
  CART_LOAD_FAILED:
    "We could not load your cart. Please refresh the page and try again.",
  CART_ITEM_NOT_FOUND:
    "That item is no longer in your cart. It may have already been removed.",
  CART_UPDATE_FAILED:
    "We could not update your cart. Please try again in a moment.",
  CART_CLEAR_FAILED:
    "We could not empty your cart. Please refresh the page and try again.",
  OUT_OF_STOCK_ITEM: "This item is out of stock. Please choose a different option.",
  WISHLIST_PRODUCT_INVALID: "That product could not be found, so it was not added to your wishlist.",
  PRODUCT_NOT_FOUND: "That product is no longer available.",
  WISHLIST_UPDATE_FAILED:
    "We could not update your wishlist. Please try again in a moment.",

  // ---------- Reviews ----------
  REVIEW_NAME_REQUIRED: "Enter your name so other customers know who wrote this review.",
  REVIEW_ALREADY_EXISTS: "You have already reviewed this product. Only one review per product is allowed.",
  REVIEW_TOO_SHORT: "Your review must be at least 10 characters.",
  REVIEW_SUBMIT_FAILED: "We could not submit your review. Please try again in a moment.",
  REVIEW_LOAD_FAILED: "We could not load reviews for this product.",
  REVIEW_INVALID: "Please choose a rating between 1 and 5 stars and write at least 10 characters.",

  // ---------- Contact / newsletter / dealer ----------
  CONTACT_SEND_FAILED:
    "We could not send your message. Please try again in a moment, or email us directly if this keeps happening.",
  NEWSLETTER_FAILED: "We could not subscribe you right now. Please try again in a moment.",
  DEALER_APPLY_FAILED:
    "We could not submit your dealer application. Please try again, or contact us directly if the problem continues.",
  DEALER_APPLY_RATE_LIMITED:
    "Too many applications were submitted from this device. Please wait a few minutes before trying again.",
  DEALER_APPLY_DUPLICATE:
    "You already have an active application with this mobile number. We will contact you once it has been reviewed.",
  DEALER_PACKAGE_INVALID: "Please choose a valid sell package from the list.",
  DEALER_UPLOADS_EXPIRED:
    "One or more of your uploaded documents are no longer available. Please upload them again.",

  ADMIN_STATUS_INVALID: "Choose a valid status from the list.",
  ADMIN_PRODUCT_INVALID:
    "Some details are missing or incorrect. Check the product name, slug, SKU, description, price and category, then try again.",
  ADMIN_STOCK_INVALID:
    "Enter the stock as a whole number of 0 or more, or enter a change in stock between -10000 and 10000.",
  ADMIN_SUBSCRIBER_ID_REQUIRED:
    "Choose a subscriber to remove from the list before continuing.",
  ADMIN_ORDER_NOT_FOUND:
    "That order no longer exists. It may have been deleted already.",
  ADMIN_PRODUCT_NOT_FOUND:
    "That product no longer exists. Go back to the product list and refresh the page.",
  ADMIN_VARIANT_NOT_FOUND:
    "That product option no longer exists. Refresh the page and try again.",
  ADMIN_PRODUCT_IN_USE:
    "This product is used by an existing order or review, so it cannot be deleted. Set it to inactive instead.",
  ADMIN_FILE_MISSING:
    "That file is no longer available on our storage. Ask the dealer to upload it again.",
  ADMIN_UPLOAD_RATE_LIMITED:
    "Too many uploads in a short time. Please wait a moment before trying again.",
  ADMIN_UPLOAD_NO_FILES: "Choose at least one image to upload.",
  ADMIN_UPLOAD_TOTAL_TOO_LARGE:
    "Those images are too large to upload together. Upload them one at a time.",
  ADMIN_ORDER_STATUS_CHANGED:
    "This order was updated by someone else while you were working on it. Refresh the page to see the latest details, then try again.",
  ADMIN_STOCK_NEGATIVE:
    "Stock cannot go below zero. Enter zero or more to continue.",

  // ---------- Admin: generic actions ----------
  ADMIN_LOAD_FAILED: "Could not load this list. Refresh the page and try again.",
  ADMIN_SAVE_FAILED:
    "Your change was not saved because of a problem on our side. Nothing was changed — please try again.",
  ADMIN_DELETE_FAILED: "This could not be deleted. Refresh the page and try again.",
  ADMIN_NOT_FOUND: "That record no longer exists. It may have been deleted already.",

  // ---------- Uploads ----------
  UPLOAD_FAILED:
    "The image could not be uploaded. Please try a different image, or try again in a moment.",
  UPLOAD_TOO_LARGE: "That image is too large. Please choose one under 5 MB.",
  UPLOAD_WRONG_TYPE: "That file is not an image. Please choose a JPG, PNG or WEBP file.",
  CLEANUP_FAILED: "Some unused images could not be removed. This does not affect your saved changes.",
  UPLOAD_RATE_LIMITED:
    "Too many uploads in a short time. Please wait a moment before trying again.",
  UPLOAD_NO_FILE: "Choose a file to upload.",
  UPLOAD_EMPTY_FILE: "That file is empty. Choose a different file and try again.",
} as const;

/**
 * Zod's built-in messages are developer-facing ("Required",
 * "Expected object, received number"). They leak whenever a field is missing
 * rather than merely invalid, so they must never be shown to a customer.
 */
const ZOD_DEFAULT_MESSAGES = new Set([
  "Required",
  "Invalid input",
  "Expected string, received null",
  "Expected string, received undefined",
]);

function isZodDefault(message: string): boolean {
  if (ZOD_DEFAULT_MESSAGES.has(message)) return true;
  // Catches type mismatches such as "Expected object, received number".
  return /^Expected\b.+,\s+received\s+/i.test(message);
}

/**
 * Picks the message to show for a failed `safeParse`.
 *
 * Keeps the specific message when we wrote one ourselves, and replaces Zod's
 * default wording with `fallback` so the customer never sees schema jargon.
 */
export function validationMessage(
  issues: readonly { message: string }[] | undefined,
  fallback: string
): string {
  const first = issues?.[0]?.message;
  if (!first || isZodDefault(first)) return fallback;
  return first;
}

/**
 * Turns a caught error into a safe, readable message.
 * Internal details stay in the server log; the user gets the friendly text.
 */
export function friendlyError(err: unknown, fallback: string = ERR.UPLOAD_FAILED): string {
  if (err instanceof Error) {
    const message = err.message;
    // Validation-style failures from the image pipeline are safe and specific.
    if (/exceeds|only |corrupted|allowed|empty|unsupported|animated/i.test(message)) {
      return message;
    }
  }
  return fallback;
}