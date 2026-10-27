import { mediaUrl, thumbUrl } from "@/lib/media";
import { cx } from "@/components/ui";

type Props = {
  imageKey: string | null | undefined;
  alt: string;
  /** Cards and thumbnails use the 480 px variant. */
  size?: "thumb" | "full";
  className?: string;
  /** CSS object-position for cover crops. */
  position?: string;
  loading?: "lazy" | "eager";
  /** What to show when there is no image yet. */
  fallback?: React.ReactNode;
};

/**
 * An uploaded image by its storage key. Plain <img> on purpose: files are
 * served from our own /media route with immutable caching, already sized by
 * the upload pipeline (src/lib/images.ts).
 */
export function MediaImage({ imageKey, alt, size = "full", className, position, loading = "lazy", fallback }: Props) {
  if (!imageKey) {
    return (
      <div className={cx("flex items-center justify-center bg-paper text-center text-sm font-semibold text-muted", className)} aria-hidden>
        {fallback ?? "Photo coming soon"}
      </div>
    );
  }
  const src = size === "thumb" ? thumbUrl(imageKey) : mediaUrl(imageKey);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={loading} decoding="async" className={className} style={position ? { objectPosition: position } : undefined} />;
}
