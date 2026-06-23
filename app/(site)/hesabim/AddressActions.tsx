"use client";

import { useTransition } from "react";
import { useRouter }     from "next/navigation";
import { deleteAddress, setDefaultAddress } from "@/lib/actions/address";

export default function AddressActions({ id, isDefault }: { id: string; isDefault: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("Bu adresi silmek istediğinizden emin misiniz?")) return;
    startTransition(async () => {
      await deleteAddress(id);
      router.refresh();
    });
  }

  function handleSetDefault() {
    startTransition(async () => {
      await setDefaultAddress(id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#F0EDE8]">
      {!isDefault && (
        <button
          onClick={handleSetDefault}
          disabled={pending}
          className="font-sans text-[10px] tracking-wide text-[#C4A882] hover:text-[#8B6F4E] transition-colors disabled:opacity-50"
        >
          Varsayılan Yap
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={pending}
        className="font-sans text-[10px] tracking-wide text-[#9A9A9A] hover:text-red-500 transition-colors disabled:opacity-50 ml-auto"
      >
        Sil
      </button>
    </div>
  );
}
