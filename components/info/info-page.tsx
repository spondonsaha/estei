export function InfoPage({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="section-estei">
      <div className="container-estei max-w-4xl">
        <h1 className="text-3xl font-bold text-estei-gray-900">{title}</h1>
        {subtitle && <p className="mt-2 text-estei-gray-600">{subtitle}</p>}
        <div className="mt-8 space-y-6">{children}</div>
      </div>
    </div>
  );
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-estei-gray-200 bg-white p-6 shadow-card">
      <h2 className="mb-3 text-lg font-bold text-estei-gray-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-estei-gray-600">{children}</div>
    </section>
  );
}