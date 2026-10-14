import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { formatPrice } from '@/lib/format';
export default function Countdown({
  endsAt,
  status,
  compact = false,
  totalBids,
  currentBid,
}) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.parse(endsAt) - Date.now()) / 1000))
  );
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds(
        Math.max(0, Math.floor((Date.parse(endsAt) - Date.now()) / 1000))
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);
  const isEnded = status === 'ENDED' || status === 'CANCELLED' || seconds <= 0;
  if (isEnded) {
    let endedText = 'Ended';
    if (totalBids !== undefined) {
      endedText =
        totalBids > 0 && currentBid !== undefined
          ? `Ended · Sold for ${formatPrice(currentBid)}`
          : 'Ended · No bids';
    }
    return (
      <span
        data-testid="countdown-timer"
        className={`inline-flex items-center gap-1.5 rounded-full font-medium tabular-nums border border-gray-200 bg-gray-100/95 text-gray-700 backdrop-blur-xs ${compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}
      >
        <Clock3 className="size-3.5 text-gray-400" />
        {endedText}
      </span>
    );
  }
  // Active formats: "4d 4h", "4h 14m", "mm:ss"
  let label = '';
  if (seconds >= 86400) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    label = `${days}d ${hours}h`;
  } else if (seconds >= 300) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    label = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    label = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  // Styling: neutral by default, amber under 1 hour, raspberry and pulsing under 5 minutes (reduced-motion safe)
  const isUnder5m = seconds < 300;
  const isUnder1h = seconds < 3600;
  const pillClass = isUnder5m
    ? 'bg-[#fdf0f3] text-[#d23657] border border-[#d23657]/30 motion-safe:animate-pulse'
    : isUnder1h
      ? 'bg-amber-50 text-amber-800 border border-amber-200/90'
      : 'bg-white/95 text-gray-700 border border-gray-200/90 shadow-2xs';
  const iconClass = isUnder5m
    ? 'text-[#d23657]'
    : isUnder1h
      ? 'text-amber-700'
      : 'text-gray-400';
  return (
    <span
      data-testid="countdown-timer"
      className={`inline-flex items-center gap-1.5 rounded-full font-medium tabular-nums backdrop-blur-xs ${compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'} ${pillClass}`}
    >
      <Clock3 className={`size-3.5 ${iconClass}`} />
      {label}
    </span>
  );
}
