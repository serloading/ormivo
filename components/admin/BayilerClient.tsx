"use client";

import { useTransition } from "react";
import { approveB2B, rejectB2B, revokeB2B } from "@/lib/actions/b2b";

type User = {
  id: string; name: string | null; phone: string; email: string | null;
  isB2B: boolean; isB2BApproved: boolean; b2bNote: string | null;
  createdAt: Date; _count: { siteOrders: number };
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
          {user.b2bNote && (
            <div className="mt-2 bg-[#faf8f6] border border-[#e8ddd6] rounded-sm px-3 py-2">
              <p className="text-[11px] text-[#5c4033] uppercase tracking-wide mb-1">Başvuru Notu</p>
              <p className="text-sm text-[#2c1810]">{user.b2bNote}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">{actions}</div>
      </div>
    </div>
  );
}

export default function BayilerClient({
  pending,
  approved,
}: {
  pending: User[];
  approved: User[];
}) {
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      {/* Bekleyen başvurular */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-xs tracking-widest text-[#5c4033] uppercase">Bekleyen Başvurular</h3>
          {pending.length > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {pending.length}
            </span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="bg-white border border-[#e8ddd6] rounded-sm py-10 text-center text-sm text-[#b8a89e]">
            Bekleyen başvuru yok.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pending.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                actions={
                  <>
                    <button
                      onClick={() => startTransition(() => approveB2B(user.id))}
                      className="bg-green-700 text-white text-xs tracking-wide px-4 py-2 hover:bg-green-800 transition-colors"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => startTransition(() => rejectB2B(user.id))}
                      className="border border-red-300 text-red-600 text-xs tracking-wide px-4 py-2 hover:bg-red-50 transition-colors"
                    >
                      Reddet
                    </button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Onaylı bayiler */}
      <div>
        <h3 className="text-xs tracking-widest text-[#5c4033] uppercase mb-4">
          Onaylı Bayiler ({approved.length})
        </h3>
        {approved.length === 0 ? (
          <div className="bg-white border border-[#e8ddd6] rounded-sm py-10 text-center text-sm text-[#b8a89e]">
            Henüz onaylı bayi yok.
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
    </div>
  );
}
