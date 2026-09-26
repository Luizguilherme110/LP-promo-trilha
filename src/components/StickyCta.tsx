import { useEffect, useState, type RefObject } from "react";
import { trackWhatsAppClick } from "@/lib/tracking";
import { useWhatsAppHref } from "@/lib/useWhatsAppHref";

/**
 * Botão fixo no mobile. Some quando um CTA principal está visível na tela.
 */
export function StickyCta({ watch }: { watch: RefObject<HTMLElement | null>[] }) {
  const [hidden, setHidden] = useState(true);
  const href = useWhatsAppHref();

  useEffect(() => {
    const elements = watch.map((r) => r.current).filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        setHidden(visible.size > 0);
      },
      { threshold: 0.35 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [watch]);

  return (
    <div
      aria-hidden={hidden}
      className={`safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur-sm transition-all duration-200 md:hidden ${
        hidden ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={hidden ? -1 : 0}
        onClick={() => trackWhatsAppClick("sticky_mobile")}
        className="flex min-h-12 items-center justify-center rounded-lg bg-brand px-4 font-display text-lg font-bold tracking-wide text-brand-foreground uppercase transition-colors hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        Entrar no grupo
      </a>
    </div>
  );
}
