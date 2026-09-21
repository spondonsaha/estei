export default function Loading() {
  return (
    <div className="section-estei">
      <div className="container-estei grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square rounded-lg bg-estei-gray-100" />
            <div className="mt-3 h-4 w-3/4 rounded bg-estei-gray-100" />
            <div className="mt-2 h-4 w-1/2 rounded bg-estei-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}