"use client";

const bricks = Array.from({ length: 12 });

export default function BuildProgressAnimation() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-black/20 backdrop-blur" aria-label="Animated illustration of a project being built">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-300">From idea to build</p>
          <p className="mt-1 text-xs text-slate-300">Measure · match · make it real</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/15 text-lg text-emerald-300">✦</div>
      </div>
      <div className="relative mt-4 h-28 overflow-hidden rounded-2xl bg-gradient-to-b from-sky-950/60 to-emerald-950/40">
        <div className="absolute inset-x-0 bottom-0 h-7 bg-emerald-950/80" />
        <div className="absolute bottom-5 left-1/2 h-16 w-28 -translate-x-1/2 rounded-t-lg border-2 border-amber-200/80 bg-amber-100/10">
          <div className="absolute -top-9 left-1/2 h-16 w-16 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-amber-200/80" />
          <div className="absolute bottom-0 left-1/2 h-9 w-6 -translate-x-1/2 rounded-t bg-amber-200/70" />
          <div className="absolute left-3 top-4 h-4 w-4 rounded-sm border border-sky-100/70 bg-sky-200/40" />
          <div className="absolute right-3 top-4 h-4 w-4 rounded-sm border border-sky-100/70 bg-sky-200/40" />
        </div>
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5 opacity-90">
          {bricks.map((_, index) => <span key={index} className="h-2.5 w-5 rounded-[2px] bg-amber-200/75 shadow-sm shadow-amber-900/40 animate-[brickBuild_4s_ease-in-out_infinite]" style={{ animationDelay: `${index * 120}ms` }} />)}
        </div>
        <div className="absolute right-5 top-4 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_20px_rgba(110,231,183,.85)] animate-[floatBuilder_3s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
