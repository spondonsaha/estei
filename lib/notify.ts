/**
 * Best-effort notifications.
 *
 * No SMS/Email provider is wired up in this project yet, so these are
 * deliberately non-blocking, never throw, and log to the console. To enable
 * real delivery, replace the bodies below with your provider (e.g. SMS API /
 * transactional email) — the application flow must never depend on them.
 */

type ApplicationInfo = {
  refNumber: string;
  phone: string;
  businessLoc: string;
};

export async function notifyAdminNewApplication(app: ApplicationInfo): Promise<void> {
  try {
    console.log(
      `[notify:admin] New dealer application ${app.refNumber} from ${app.phone} (${app.businessLoc})`
    );
  } catch {
    // ignore
  }
}

export async function notifyApplicantConfirmation(app: ApplicationInfo): Promise<void> {
  try {
    console.log(
      `[notify:applicant] Confirmed to ${app.phone}: your dealer application reference is ${app.refNumber}`
    );
  } catch {
    // ignore
  }
}