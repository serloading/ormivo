"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-lg",
}: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-white border border-[#e8ddd6] rounded-sm w-full ${width} max-h-[90vh] overflow-y-auto shadow-xl`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8ddd6]">
          <h3 className="text-sm font-medium tracking-wide text-[#2c1810]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-[#b8a89e] hover:text-[#2c1810] transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
