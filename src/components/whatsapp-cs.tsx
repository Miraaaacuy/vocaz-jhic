import { CS_WHATSAPP, CS_WHATSAPP_TEXT } from "@/lib/constants";

/** Floating "Customer Service" WhatsApp button, bottom-right on every page. */
export function WhatsAppCS() {
  const href = `https://wa.me/${CS_WHATSAPP}?text=${encodeURIComponent(CS_WHATSAPP_TEXT)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Butuh bantuan? Customer Service VocAZ via WhatsApp"
      className="wa-float group fixed right-4 bottom-4 z-40 flex items-center gap-2.5 rounded-full transition hover:-translate-y-0.5 sm:right-6 sm:bottom-6 sm:bg-white sm:py-1.5 sm:pr-5 sm:pl-1.5 sm:shadow-[0_12px_32px_-10px_rgb(13_31_28/0.35)] sm:ring-1 sm:ring-line"
    >
      {/* WhatsApp green stays on the icon only; the label is dark-on-white so it passes contrast */}
      <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgb(37_211_102/0.7)] ring-4 ring-white/70 transition group-hover:bg-[#1ebe5b] sm:h-10 sm:w-10 sm:shadow-none sm:ring-0">
        <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7 sm:h-6 sm:w-6" fill="currentColor">
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35ZM12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.32l-.35-.2-3.57.93.95-3.48-.22-.36a9.41 9.41 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44a9.4 9.4 0 0 1 6.68 2.77 9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44Zm8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.67 5.8.67 12.08c0 2 .52 3.96 1.52 5.69L.57 23.7l6.07-1.6a11.34 11.34 0 0 0 5.4 1.38h.01c6.27 0 11.38-5.1 11.38-11.38 0-3.04-1.18-5.9-3.34-8.05Z" />
        </svg>
      </span>
      <span className="hidden text-left leading-tight sm:block">
        <span className="block text-[11px] font-medium text-muted">Butuh bantuan?</span>{" "}
        <span className="block text-sm font-bold text-ink">Customer Service</span>
      </span>
    </a>
  );
}
