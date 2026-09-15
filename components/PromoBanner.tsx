import Link from "next/link";
import type { Promotion } from "@/data/promotion";

type PromoBannerProps = {
  promotion: Promotion;
};

const themeStyles = {
  deals: {
    accent: "text-green-400",
    button: "bg-white dark:bg-gray-900 text-black",
    overlay: "bg-gradient-to-r from-black/90 via-black/55 to-transparent",
    badge: "bg-green-500/20 text-green-300 border-green-400/30",
  },

  tech: {
    accent: "text-cyan-300",
    button: "bg-cyan-400 text-slate-950",
    overlay:
      "bg-gradient-to-r from-slate-950/95 via-slate-950/60 to-transparent",
    badge: "bg-cyan-400/20 text-cyan-300 border-cyan-300/30",
  },

  fashion: {
    accent: "text-pink-300",
    button: "bg-pink-300 text-rose-950",
    overlay: "bg-gradient-to-r from-rose-950/90 via-rose-900/50 to-transparent",
    badge: "bg-pink-300/20 text-pink-200 border-pink-300/30",
  },

  weekend: {
    accent: "text-orange-300",
    button: "bg-orange-400 text-orange-950",
    overlay:
      "bg-gradient-to-r from-orange-950/95 via-orange-900/55 to-transparent",
    badge: "bg-orange-400/20 text-orange-200 border-orange-300/30",
  },

  home: {
    accent: "text-emerald-300",
    button: "bg-white dark:bg-gray-900 text-stone-900",
    overlay:
      "bg-gradient-to-r from-stone-950/85 via-stone-900/45 to-transparent",
    badge: "bg-emerald-400/20 text-emerald-200 border-emerald-300/30",
  },
} as const;

export default function PromoBanner({ promotion }: PromoBannerProps) {
  const theme = themeStyles[promotion.theme];

  return (
    <article className="group relative min-h-[300px] overflow-hidden rounded-2xl bg-black sm:min-h-[340px] md:min-h-[380px]">
      {/* Background image */}
      <img
        src={promotion.image}
        alt={promotion.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* General image darkening */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Theme-specific gradient */}
      <div className={`absolute inset-0 ${theme.overlay}`} />

      {/* Content */}
      <div className="relative z-10 flex min-h-[300px] items-center px-6 py-10 sm:min-h-[340px] sm:px-10 md:min-h-[380px] md:px-14">
        <div className="max-w-xl text-white">
          {/* Campaign badge */}
          <div
            className={`mb-4 inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] backdrop-blur-sm sm:text-xs ${theme.badge}`}
          >
            {promotion.eyebrow}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            {promotion.title}
          </h2>

          {/* Accent line */}
          <div
            className={`mt-4 h-1 w-12 rounded-full ${theme.accent.replace(
              "text-",
              "bg-",
            )}`}
          />

          {/* Description */}
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
            {promotion.description}
          </p>

          {/* CTA */}
          <Link
            href={promotion.buttonLink}
            className={`mt-6 inline-flex rounded-full px-6 py-3 text-sm font-bold shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 ${theme.button}`}
          >
            {promotion.buttonText}
          </Link>
        </div>
      </div>
    </article>
  );
}
