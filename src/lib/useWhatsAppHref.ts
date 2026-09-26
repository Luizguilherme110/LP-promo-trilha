import { useEffect, useState } from "react";
import { WHATSAPP_GROUP_URL } from "@/config/site";
import { withParams } from "./tracking";

/** Link do WhatsApp com as UTMs da sessão anexadas após a hidratação. */
export function useWhatsAppHref() {
  const [href, setHref] = useState(WHATSAPP_GROUP_URL);
  useEffect(() => {
    setHref(withParams(WHATSAPP_GROUP_URL));
  }, []);
  return href;
}
