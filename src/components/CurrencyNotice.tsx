import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { detectLocale } from "@/lib/locale";

const STORAGE_KEY = "tv_currency_notice_dismissed";

/**
 * One-time notice when we're displaying non-USD prices. Sets expectation that
 * conversion is approximate and billing happens in USD. Dismissible per session.
 */
const CurrencyNotice = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const { currency } = detectLocale();
    if (currency === "USD") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="border-b border-border/40 bg-muted/30">
      <div className="container py-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Prices shown are approximate, converted from USD. All billing is processed in USD by the site you subscribe to.
        </p>
        <button
          onClick={() => {
            sessionStorage.setItem(STORAGE_KEY, "1");
            setShow(false);
          }}
          aria-label="Dismiss currency notice"
          className="text-muted-foreground hover:text-foreground p-1 -m-1 shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default CurrencyNotice;
