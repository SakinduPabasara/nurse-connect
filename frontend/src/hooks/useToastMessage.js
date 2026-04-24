import { useEffect } from "react";
import { notify } from "../utils/toast";

export default function useToastMessage(msg) {
  useEffect(() => {
    if (!msg?.text) return;
    if (msg.type === "error") {
      notify.error(msg.text, { id: `error-${msg.text}` });
      return;
    }
    if (msg.type === "success") {
      notify.success(msg.text, { id: `success-${msg.text}` });
      return;
    }
    notify.info(msg.text, { id: `info-${msg.text}` });
  }, [msg]);
}
