import {
  BadgeDollarSign,
  BadgePlus,
  BarChart3,
  Gift,
  Headset,
  IdCard,
  MapPin,
  Megaphone,
  MessagesSquare,
  Phone,
  ShieldCheck,
  Tag,
  TicketPercent,
  Truck,
  type LucideIcon,
} from "lucide-react";

export type DealerStatus = "PENDING" | "DOCS_REVIEW" | "VERIFIED" | "APPROVED" | "REJECTED";

export const DEALER_STATUSES: DealerStatus[] = ["PENDING", "DOCS_REVIEW", "VERIFIED", "APPROVED", "REJECTED"];

export const DEALER_STATUS_LABEL: Record<DealerStatus, string> = {
  PENDING: "Pending",
  DOCS_REVIEW: "Docs Required",
  VERIFIED: "Verified",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const DEALER_STATUS_TONE: Record<DealerStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  DOCS_REVIEW: "bg-orange-50 text-orange-700 border-orange-200",
  VERIFIED: "bg-blue-50 text-blue-700 border-blue-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export const MONTHLY_DEMAND_OPTIONS = [
  { value: "D_50_100", label: "50–100 pairs" },
  { value: "D_101_300", label: "101–300 pairs" },
  { value: "D_301_500", label: "301–500 pairs" },
  { value: "D_501_1000", label: "501–1000 pairs" },
  { value: "D_1000_PLUS", label: "1000+ pairs" },
];

export const MONTHLY_DEMAND_LABEL: Record<string, string> = Object.fromEntries(
  MONTHLY_DEMAND_OPTIONS.map((o) => [o.value, o.label])
);

export const DEALER_DOC_LABEL: Record<string, string> = {
  NID_FRONT: "NID Front",
  NID_BACK: "NID Back",
  FACE_PHOTO: "Face Photo",
  LOCATION_DOC: "Location Document",
};

const BENEFIT_ICONS: Record<string, LucideIcon> = {
  BadgeDollarSign,
  BadgePlus,
  BarChart3,
  Gift,
  Headset,
  IdCard,
  MapPin,
  Megaphone,
  MessagesSquare,
  Phone,
  ShieldCheck,
  Tag,
  TicketPercent,
  Truck,
};

export function benefitIcon(name: string): LucideIcon {
  return BENEFIT_ICONS[name] ?? Megaphone;
}

export const MAX_DOC_BYTES = 5 * 1024 * 1024;

export const ALLOWED_DOC_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);