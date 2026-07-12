export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="relative h-60">
        <div className="skeleton h-full w-full" />
        <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/70" />
      </div>
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="flex gap-2 mt-4">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-8 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
