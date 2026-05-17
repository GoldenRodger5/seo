import { useState } from "react";
import ImageFallback from "./ImageFallback";

type AspectRatio = "16:10" | "16:9" | "4:5" | "1:1" | "3:2" | "banner-wide";

interface SmartImageProps {
  src?: string | null;
  alt: string;
  aspectRatio: AspectRatio;
  sizes?: string;
  priority?: boolean;
  fallbackLabel: string;
  className?: string;
  objectPosition?: string;
  /** Override style for an explicit aspect (e.g. for banner-wide variants
   *  that need to honor the source's actual ratio). */
  customAspect?: string;
  /**
   * fit mode for the inner <img>. Cards default to "cover" (crop to box);
   * banner-wide uses "contain" so the designed composition is preserved.
   */
  fit?: "cover" | "contain";
}

const ASPECT_CSS: Record<AspectRatio, string> = {
  "16:10": "16 / 10",
  "16:9": "16 / 9",
  "4:5": "4 / 5",
  "1:1": "1 / 1",
  "3:2": "3 / 2",
  "banner-wide": "5 / 1",
};

const SmartImage = ({
  src,
  alt,
  aspectRatio,
  sizes,
  priority = false,
  fallbackLabel,
  className = "",
  objectPosition = "center 20%",
  customAspect,
  fit,
}: SmartImageProps) => {
  const objectFit = fit ?? (aspectRatio === "banner-wide" ? "contain" : "cover");
  const containerBg = aspectRatio === "banner-wide" ? "bg-[hsl(240_15%_6%)]" : "bg-muted/30";
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const showFallback = !src || errored;

  const retina = src && /\.(jpe?g|png|webp)$/i.test(src)
    ? src.replace(/(\.[a-z]+)$/i, "@2x$1")
    : undefined;

  return (
    <div
      className={`relative overflow-hidden ${containerBg} ${className}`}
      style={{ aspectRatio: customAspect ?? ASPECT_CSS[aspectRatio] }}
    >
      {!showFallback && (
        <img
          src={src!}
          srcSet={retina ? `${src} 1x, ${retina} 2x` : undefined}
          sizes={sizes}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`h-full w-full transition-opacity duration-300 ${objectFit === "contain" ? "object-contain" : "object-cover"} ${loaded ? "opacity-100" : "opacity-0"}`}
          style={{ objectPosition: objectFit === "contain" ? "center" : objectPosition }}
        />
      )}
      {(showFallback || !loaded) && (
        <ImageFallback label={fallbackLabel} />
      )}
    </div>
  );
};

export default SmartImage;
