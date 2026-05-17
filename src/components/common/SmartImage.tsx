import { useState } from "react";
import ImageFallback from "./ImageFallback";

type AspectRatio = "16:10" | "16:9" | "4:5" | "1:1" | "3:2";

interface SmartImageProps {
  src?: string | null;
  alt: string;
  aspectRatio: AspectRatio;
  sizes?: string;
  priority?: boolean;
  fallbackLabel: string;
  className?: string;
  objectPosition?: string;
}

const ASPECT_CSS: Record<AspectRatio, string> = {
  "16:10": "16 / 10",
  "16:9": "16 / 9",
  "4:5": "4 / 5",
  "1:1": "1 / 1",
  "3:2": "3 / 2",
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
}: SmartImageProps) => {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const showFallback = !src || errored;

  const retina = src && /\.(jpe?g|png|webp)$/i.test(src)
    ? src.replace(/(\.[a-z]+)$/i, "@2x$1")
    : undefined;

  return (
    <div
      className={`relative overflow-hidden bg-muted/30 ${className}`}
      style={{ aspectRatio: ASPECT_CSS[aspectRatio] }}
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
          className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          style={{ objectPosition }}
        />
      )}
      {(showFallback || !loaded) && (
        <ImageFallback label={fallbackLabel} />
      )}
    </div>
  );
};

export default SmartImage;
