import type { ReactNode } from "react";

export function FieldLabel({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      {icon && <span className="text-[#F01B24]" aria-hidden="true">{icon}</span>}
      <span className="text-sm font-semibold text-[#111827]">{children}</span>
      <span className="text-[#F01B24]" aria-hidden="true">*</span>
    </div>
  );
}