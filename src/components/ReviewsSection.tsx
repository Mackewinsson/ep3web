import { getReviewsData, type Review } from "@/lib/reviews";
import theme from "@/theme.json";

const { navy, yellow } = theme.colors;

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={s <= rating ? "#FFCC00" : "none"}
          stroke={s <= rating ? "#FFCC00" : "#cbd5e1"}
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </span>
  );
}

function AuthorAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const colors = [
    "#e63946", "#2a9d8f", "#e9c46a", "#264653", "#f4a261",
    "#457b9d", "#a8dadc", "#6d6875", "#b5838d", "#0077b6",
  ];
  const bg = colors[name.charCodeAt(0) % colors.length];

  return (
    <div
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ background: bg }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

function ReviewCard({ review, mapsUrl }: { review: Review; mapsUrl: string }) {
  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Ver reseña de ${review.author} en Google Maps`}
      className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-slate-200 hover:shadow-md sm:p-5"
    >
      <div className="flex items-start gap-3">
        <AuthorAvatar name={review.author} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-slate-900">{review.author}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StarRating rating={review.rating} size={14} />
            <span className="text-xs text-slate-400">{review.relativeTime}</span>
          </div>
        </div>
        <svg viewBox="0 0 24 24" className="hidden h-5 w-5 flex-shrink-0 opacity-40 sm:block" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      </div>
      {review.text && (
        <p className="text-sm leading-relaxed text-slate-600 lg:line-clamp-4">{review.text}</p>
      )}
    </a>
  );
}

function RatingSummary({
  rating,
  totalReviews,
  mapsUrl,
}: {
  rating: number;
  totalReviews: number;
  mapsUrl: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-2xl p-5 text-center text-white sm:flex-row sm:justify-between sm:gap-3 sm:p-6 sm:text-left"
      style={{ background: navy }}
    >
      <div className="w-full sm:w-auto">
        <p className="text-3xl font-extrabold sm:text-4xl">{rating.toFixed(1)}</p>
        <div className="mt-1 flex justify-center sm:justify-start">
          <StarRating rating={Math.round(rating)} size={20} />
        </div>
        <p className="mt-1 text-sm text-white/70">{totalReviews} reseñas en Google</p>
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition hover:brightness-110 sm:w-auto sm:py-2.5"
        style={{ background: yellow, color: navy }}
      >
        Ver todas las reseñas
        <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
        </svg>
      </a>
    </div>
  );
}

export function ReviewsSection() {
  const place = getReviewsData();
  if (!place) return null;

  return (
    <section id="resenas" className="scroll-mt-20 bg-slate-50 px-4 py-10 sm:py-12 md:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 sm:mt-2 sm:text-base">
            Opiniones reales de Google Maps
          </p>
        </div>

        <div className="mb-6 sm:mb-8">
          <RatingSummary
            rating={place.rating}
            totalReviews={place.totalReviews}
            mapsUrl={place.mapsUrl}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {place.reviews.map((review, i) => (
            <ReviewCard key={i} review={review} mapsUrl={place.mapsUrl} />
          ))}
        </div>
      </div>
    </section>
  );
}
