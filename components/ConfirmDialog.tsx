"use client";

import { X, AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  primaryColor?: string;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
  primaryColor = "#FF6B00",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 w-full max-w-sm shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-700">
          <div className="flex items-start gap-3">
            {isDangerous && (
              <AlertTriangle size={24} className="text-red-400 shrink-0 mt-0.5" />
            )}
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white transition disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message */}
        <div className="p-6">
          <p className="text-zinc-300 text-sm">{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6 border-t border-zinc-700">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg text-zinc-300 font-medium transition border border-zinc-600 hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition border cursor-pointer disabled:opacity-50 ${
              isDangerous
                ? "bg-red-500/10 border-red-500/50 hover:bg-red-500/20"
                : "hover:bg-zinc-800/50"
            }`}
            style={
              !isDangerous
                ? {
                    borderColor: primaryColor,
                    boxShadow: `0 0 12px ${primaryColor}30`,
                  }
                : undefined
            }
          >
            {isLoading ? "Processando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
