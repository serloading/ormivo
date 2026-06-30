"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMyCustomerAddress, updateMyCustomerAddress } from "@/lib/actions/address";

export default function AdminAddressActions({ currentAddress, city }: { currentAddress: string; city?: string | null }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(currentAddress);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("Bu adresi silmek istediğinizden emin misiniz?")) return;
    startTransition(async () => {
      await deleteMyCustomerAddress();
      router.refresh();
    });
  }

  function handleSave() {
    startTransition(async () => {
      await updateMyCustomerAddress(val);
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="mt-2">
      {editing ? (
        <div className="space-y-2">
          {city && <p className="font-sans text-xs text-[#6B6B6B]">{city}</p>}
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            rows={2}
            className="w-full border border-[#E8E4DE] focus:border-[#C4A882] outline-none px-2 py-1.5 font-sans text-xs resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={pending}
              className="font-sans text-[10px] tracking-wide text-white bg-[#1A1A1A] px-3 py-1 hover:bg-[#C4A882] transition-colors disabled:opacity-50">
              Kaydet
            </button>
            <button onClick={() => { setEditing(false); setVal(currentAddress); }}
              className="font-sans text-[10px] tracking-wide text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors">
              İptal
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-2 border-t border-[#F0EDE8] mt-2">
          <button onClick={() => setEditing(true)}
            className="font-sans text-[10px] tracking-wide text-[#C4A882] hover:text-[#8B6F4E] transition-colors">
            Düzenle
          </button>
          <button onClick={handleDelete} disabled={pending}
            className="font-sans text-[10px] tracking-wide text-[#9A9A9A] hover:text-red-500 transition-colors disabled:opacity-50 ml-auto">
            Sil
          </button>
        </div>
      )}
    </div>
  );
}
