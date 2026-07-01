"use client";

import { useTransition, useState } from "react";
import { revokeB2B, addB2BByPhone } from "@/lib/actions/b2b";

type User = {
  id: string; name: string | null; phone: string; email: string | null;
  isB2B: boolean; isB2BApproved: boolean; b2bNote: string | null;
  referralCode: string | null;
  createdAt: Date; _count: { siteOrders: number; referrals: number };
};

function UserCard({ user, actions }: { user: User; actions: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e8ddd6] rounded-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-[#2c1810]">{user.name ?? "—"}</p>
          <p className="text-sm text-[#8b6f5e]">{user.phone}</p>
          {user.email && <p className="text-xs text-[#b8a89e]">{user.email}</p>}
          <p className="text-xs text-[#b8a89e] mt-1">
            Kayıt: {new Date(user.createdAt).toLocaleDateString("tr-TR")} · {user._count.siteOrders} sipariş
          </p>
          {user.referralCode && (
            <p className="text-xs text-[#8b6f5e] mt-1">
              Ref: <span className="font-mono font-bold">{user.referralCode}</span> · {user._count.referrals} referral
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">{actions}</div>
      </div>
    </div>
  );
}

export function BayiEkleButton() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isPending, startT] = useTransition();

  function handleAdd() {
    setError("");
    startT(async () => {
      const res = await addB2BByPhone(phone);
      if (res.error) { setError(res.error); return; }
      setOpen(false);
      setPhone("");
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-[#2c1810] text-white text-[11px] tracking-widest uppercase px-4 py-2 hover:bg-[#8b6f5e] transition-colors"
      >
        + Bayi Ekle
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Telefon numarası"
        className="border border-[#d4c5ba] px-3 py-2 text-sm outline-none focus:border-[#8b6f5e] w-44"
      />
      <button
        onClick={handleAdd}
        disabled={isPending || !phone}
        className="bg-[#2c1810] text-white text-[11px] tracking-widest uppercase px-4 py-2 hover:bg-[#8b6f5e] transition-colors disabled:opacity-50"
      >
        {isPending ? "..." : "Ekle"}
      </button>
      <button onClick={() => { setOpen(false); setError(""); }} className="text-xs text-[#8b6f5e] hover:text-[#2c1810]">İptal</button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function BayilerClient({
  approved,
}: {
  pending: User[];
  approved: User[];
}) {
  const [, startTransition] = useTransition();

  return (
    <div>
      <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-4">
        Onaylı Bayiler ({approved.length})
      </h3>
      {approved.length === 0 ? (
        <div className="bg-white border border-[#e8ddd6] rounded-sm py-10 text-center text-sm text-[#b8a89e]">
          Henüz onaylı bayi yok. Yukarıdan bayi ekleyin.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {approved.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              actions={
                <button
                  onClick={() => startTransition(() => revokeB2B(user.id))}
                  className="border border-[#d4c5ba] text-[#8b6f5e] text-xs tracking-wide px-4 py-2 hover:bg-[#f5f0eb] transition-colors"
                >
                  İptal Et
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
