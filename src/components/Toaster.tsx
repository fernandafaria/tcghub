"use client";

import { useEffect, useState, useCallback } from "react";
import { IconCheck } from "@/components/icons";

interface ToastData {
  id: number;
  msg: string;
  icon: string;
}

let toastId = 0;
const listeners: Set<(t: ToastData) => void> = new Set();

export function toast(msg: string, icon = "check") {
  const t: ToastData = { id: ++toastId, msg, icon };
  listeners.forEach((fn) => fn(t));
}

export function Toaster() {
  const [items, setItems] = useState<ToastData[]>([]);

  const add = useCallback((t: ToastData) => {
    setItems((prev) => [...prev, t]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== t.id));
    }, 3000);
  }, []);

  useEffect(() => {
    listeners.add(add);
    return () => { listeners.delete(add); };
  }, [add]);

  if (items.length === 0) return null;

  return (
    <div className="toast-wrap">
      {items.map((t) => (
        <div key={t.id} className="toast">
          {t.icon === "check" && <IconCheck className="ic" />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
