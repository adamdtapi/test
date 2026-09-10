"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, Check } from "lucide-react";

type ToastKind = "success" | "error";
type ToastItem = { id: number; message: string; kind: ToastKind };

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-3), { id, message, kind }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            className="toast-enter flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-[#141b2b]/95 px-4 py-3 text-sm shadow-2xl backdrop-blur-xl"
          >
            {t.kind === "success" ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                <Check size={12} strokeWidth={3} />
              </span>
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-400/15 text-red-400">
                <AlertTriangle size={12} strokeWidth={3} />
              </span>
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
