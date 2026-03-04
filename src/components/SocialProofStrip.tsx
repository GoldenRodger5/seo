const proofItems = [
  "⭐ 50+ Sites Reviewed",
  "🔄 Updated Monthly",
  "👁 Trusted by 10,000+ Readers",
  "🔒 100% Independent",
];

const SocialProofStrip = () => (
  <div className="border-y border-primary/10 bg-muted/30">
    {/* Desktop: static */}
    <div className="container hidden py-3 md:flex items-center justify-center gap-6">
      {proofItems.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{item}</span>
          {i < proofItems.length - 1 && <span className="text-muted-foreground/30">·</span>}
        </span>
      ))}
    </div>
    {/* Mobile: marquee */}
    <div className="overflow-hidden py-3 md:hidden">
      <div className="marquee-track">
        {[...proofItems, ...proofItems].map((item, i) => (
          <span key={i} className="mx-6 whitespace-nowrap text-sm text-muted-foreground">{item}</span>
        ))}
      </div>
    </div>
  </div>
);

export default SocialProofStrip;
