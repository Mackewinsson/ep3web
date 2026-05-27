import reviewsData from "@/data/google-reviews.json";

export interface Review {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
}

export interface ReviewsData {
  name: string;
  rating: number;
  totalReviews: number;
  mapsUrl: string;
  reviews: Review[];
}

export function getReviewsData(): ReviewsData | null {
  const data = reviewsData as ReviewsData;
  if (!data.reviews?.length) return null;
  return data;
}
