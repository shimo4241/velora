"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";

type ToastTone = "error" | "success" | "info";

interface ToastInput {
  title?: string;
  message: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface ToastMessage extends Required<Omit<ToastInput, "durationMs">> {
  id: string;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title = "Notice", message, tone = "info", durationMs = 5200 }: ToastInput) => {
      const id = createToastId();
      setToasts((current) => [...current.slice(-2), { id, title, message, tone }]);
      const timer = window.setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed left-0 right-0 top-[max(1rem,env(safe-area-inset-top))] z-[500] mx-auto flex w-full max-w-md flex-col gap-2 px-4"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const Icon = toast.tone === "error" ? AlertTriangle : toast.tone === "success" ? Check : Info;
  const toneClass = {
    error: "border-velora-rose/35 bg-velora-rose/14 text-velora-rose",
    success: "border-velora-emerald/35 bg-velora-emerald/14 text-velora-emerald",
    info: "border-velora-gold/35 bg-velora-gold/14 text-velora-gold",
  }[toast.tone];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-[var(--radius-md)] border p-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl ${toneClass}`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-[0.12em]">{toast.title}</div>
        <div className="mt-1 text-sm leading-5 text-velora-text">{toast.message}</div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-velora-text-muted transition-colors hover:text-velora-text"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
