"use client";

import { useTransition, useState } from "react";
import { revokeB2B, addB2BByPhone, updateB2BMarkup } from "@/lib/actions/b2b";

type User = {
  id: string; name: string | null; phone: string; email: string | null;
  isB2B: boolean; isB2BApproved: boolean; b2bNote: string | null;
  referralCode: string | null; b2bMarkup: number | null; segment: string | null;
  createdAt: Date; _count: { siteOrders: number; referrals: number };
};

function MarkupEditor({ user }: { user: User }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(user.b2bMarkup ?? ""));
  const [saved, setSaved] = useState(false);
  const [pending, startT] = useTransition();

  function handleSave() {
    const n = Number(value);
    if (isNaN(n) || n < 0) return;
    startT(async () => {
      await updateB2BMarkup(user.id, n);
      setSaved(true);
      setTimeout(() => { setSaved(false); setEditing(false); }, 1000);
    });
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 text-xs text-[#5c4033] hover:text-[#2c1810] group"
      >
        <span className="text-[10px] uppercase tracking-widest text-[#b8a89e]">Markup</span>
        <span className="font-semibold text-[#2c1810]">
          {user.b2bMarkup != null ? `+${Number(user.b2bMarkup).toLocaleString("tr-TR")} ₺` : "—"}
        </span>
        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-[#8b6f5e]">✏</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-[#8b6f5e]">+</span>
      <input
        type="number" min="0" value={value} autoFocus
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
        className="w-20 border border-[#d4c5ba] rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-[#8b6f5e] text-right"
      />
      <span className="text-xs text-[#8b6f5e]">₺</span>
      <button onClick={handleSave} disabled={pending}
        className={`text-[10px] px-2 py-1 rounded-sm font-medium ${saved ? "bg-green-600 text-white" : "bg-[#2c1810] text-white hover:bg-[#3d2418]"} disabled:opacity-50`}>
        {saved ? "✓" : pending ? "..." : "Kaydet"}
      </button>
      <button onClick={() => setEditing(false)} className="text-[10px] text-[#8b6f5e] hover:text-[#2c1810]">İptal</button>
    </div>
  );
}

function UserCard({ user, actions }: { user: User; actions: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e8ddd6] rounded-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-[#2c1810]">{user.name ?? "—"}</p>
            {user.segment === "DIAMOND" && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-cyan-600 text-white tracking-wide">Diamond</span>
            )}
          </div>
          <p className="text-sm text-[#8b6f5e]">{user.phone}</p>
          {user.email && <p className="text-xs text-[#b8a89e]">{user.email}</p>}
          <p className="text-xs text-[#b8a89e]">
            Kayıt: {new Date(user.createdAt).toLocaleDateString("tr-TR")} · {user._count.siteOrders} sipariş
          </p>
          {user.referralCode && (
            <p className="text-xs text-[#8b6f5e]">
              Ref: <span className="font-mono font-bold">{user.referralCode}</span> · {user._count.referrals} referral
            </p>
          )}
          <div className="pt-1">
            <MarkupEditor user={user} />
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">{actions}</div>
      </div>
    </div>
  );
}

export function BayiEkleButton() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [markup, setMarkup] = useState("500");
  const [error, setError] = useState("");
  const [isPending, startT] = useTransition();

  function handleAdd() {
    setError("");
    startT(async () => {
      const res = await addB2BByPhone(phone, Number(markup) || 500);
      if (res.error) { setError(res.error); return; }
      setOpen(false);
      setPhone("");
      setMarkup("500");
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
    <div className="flex items-center gap-2 flex-wrap">
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Telefon numarası"
        className="border border-[#d4c5ba] px-3 py-2 text-sm outline-none focus:border-[#8b6f5e] w-44"
      />
      <div className="flex items-center gap-1">
        <span className="text-xs text-[#8b6f5e]">Markup +</span>
        <input
          type="number" min="0" value={markup}
          onChange={(e) => setMarkup(e.target.value)}
          className="border border-[#d4c5ba] px-2 py-2 text-sm outline-none focus:border-[#8b6f5e] w-20 text-right"
        />
        <span className="text-xs text-[#8b6f5e]">₺</span>
      </div>
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
              user={{ ...user, b2bMarkup: user.b2bMarkup != null ? Number(user.b2bMarkup) : null }}
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
