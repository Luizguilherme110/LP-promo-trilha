import { trackWhatsAppClick } from "@/lib/tracking";
import { useWhatsAppHref } from "@/lib/useWhatsAppHref";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      className={className}
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.17 8.17 0 0 1-1.26-4.35c0-4.53 3.7-8.22 8.25-8.22 2.2 0 4.27.86 5.83 2.41a8.16 8.16 0 0 1 2.41 5.82c0 4.54-3.7 8.21-8.24 8.21Zm4.52-6.15c-.25-.13-1.47-.72-1.69-.8-.23-.08-.39-.13-.56.13-.16.24-.64.79-.78.95-.14.17-.29.19-.54.06-.25-.12-1.05-.38-1.99-1.22-.74-.65-1.23-1.46-1.38-1.71-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.02 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}

type Props = {
  /** Identificador do local do clique para analytics. */
  location: string;
  children: React.ReactNode;
  className?: string;
};

export function WhatsAppCta({ location, children, className = "" }: Props) {
  const href = useWhatsAppHref();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsAppClick(location)}
      className={`inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-brand px-6 py-4 font-display text-xl font-bold tracking-wide text-brand-foreground uppercase transition-colors hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:bg-brand/80 ${className}`}
    >
      <WhatsAppIcon className="h-6 w-6 shrink-0" />
      <span>{children}</span>
    </a>
  );
}
