import { useEffect, useState } from "react";
import { LOW_SLOTS_THRESHOLD } from "@/config/site";
import { getSlots, onSlots, visibleRemainingSlots } from "@/lib/activity";

const ROTATE_MS = 3500;

const PHRASES = [
  "🎁 Ofertas exclusivas!",
  "✅ Grupo VIP gratuito",
  "🎟️ Cupons e descontos para trilheiros",
  "⚡ Promoções podem acabar rápido",
];

const LOW_SLOTS_PHRASES = ["🔥 Grupo quase lotado!", "⏰ Últimas vagas!"];

export function TopBanner() {
  const [slots, setSlots] = useState(getSlots);
  const [index, setIndex] = useState(0);
  useEffect(() => onSlots(setSlots), []);

  const remaining = visibleRemainingSlots(slots);
  const low = remaining !== null && remaining > 0 && remaining <= LOW_SLOTS_THRESHOLD;
  const phrases = low ? [LOW_SLOTS_PHRASES[0]!, ...PHRASES, LOW_SLOTS_PHRASES[1]!] : PHRASES;

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setIndex((current) => current + 1);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const phrase = phrases[index % phrases.length];

  return (
    <div
      aria-live="off"
      className="w-full border-b border-brand/30 bg-brand/15 px-4 py-2.5 text-center text-sm font-bold tracking-wide text-highlight"
    >
      <span key={phrase} className="inline-block animate-in duration-500 fade-in">
        <span className="animate-pulse">{phrase}</span>
      </span>
    </div>
  );
}
