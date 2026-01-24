"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ToastItem, Toast, ToastType } from "./toast";

interface ToastContextType {
  toasts: Toast[];
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, message };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const success = useCallback((message: string) => {
    toast(message, "success");
  }, [toast]);

  const error = useCallback((message: string) => {
    toast(message, "error");
  }, [toast]);

  const info = useCallback((message: string) => {
    toast(message, "info");
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, info, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
