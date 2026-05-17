interface ImageFallbackProps {
  label: string;
  className?: string;
}

const ImageFallback = ({ label, className = "" }: ImageFallbackProps) => {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center px-4 text-center ${className}`}
      style={{
        background:
          "linear-gradient(135deg, hsl(240 15% 8%) 0%, hsl(240 15% 4%) 100%)",
      }}
      aria-hidden="true"
    >
      <span
        className="font-heading text-foreground/70"
        style={{ fontSize: "clamp(14px, 2.2vw, 20px)", lineHeight: 1.2 }}
      >
        {label}
      </span>
    </div>
  );
};

export default ImageFallback;
