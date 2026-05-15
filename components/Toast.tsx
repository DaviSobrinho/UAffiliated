"use client";

import { useEffect } from "react";
import { X, Check, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-green-500/10" : "bg-red-500/10";
  const borderColor = isSuccess ? "border-green-500/30" : "border-red-500/30";
  const textColor = isSuccess ? "text-green-300" : "text-red-300";
  const Icon = isSuccess ? Check : AlertCircle;

  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColor} ${borderColor} ${textColor} max-w-sm z-[999] animate-in fade-in slide-in-from-bottom-4 duration-300`}>
      <Icon size={20} className="shrink-0" />
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-current hover:opacity-70 transition shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
