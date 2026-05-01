import { useState, useEffect } from "react";

interface CountdownTimerProps {
  /** ISO datetime when the deal expires */
  expiresAt: string;
  /** Called when the timer reaches zero */
  onExpire?: () => void;
  className?: string;
}

const pad = (n: number): string => n.toString().padStart(2, "0");

const CountdownTimer = ({ expiresAt, onExpire, className = "" }: CountdownTimerProps) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(expiresAt).getTime();
  const diff = Math.max(0, target - now);

  useEffect(() => {
    if (diff === 0 && onExpire) onExpire();
  }, [diff, onExpire]);

  if (Number.isNaN(target)) return null;
  if (diff === 0) return <span className={`text-muted-foreground text-xs ${className}`}>Expired</span>;

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <span className={`tabular-nums font-mono text-destructive font-semibold ${className}`}>
      Ends in {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
};

export default CountdownTimer;
