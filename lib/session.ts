import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { syncSiteUserFromCustomerPhone } from "@/lib/site-user-sync";

const COOKIE = "site_session";

function getSecret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET env variable is required");
  return new TextEncoder().encode(s);
}

export interface SessionPayload {
  userId:  string;
  phone:   string;
  name:    string | null;
  segment: string | null;
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 30,
    path:     "/",
  });
}

/**
 * JWT'yi doğrula, ardından DB'den güncel segment + name oku.
 * Admin segment değiştirince oturum yenilenmeden hemen yansır.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const jar   = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret());
    const jwt = payload as unknown as SessionPayload;

    // DB'den güncel segment ve isim oku
    const { prisma } = await import("@/lib/prisma");
    let user = await prisma.siteUser.findUnique({
      where:  { id: jwt.userId },
      select: { id: true, phone: true, name: true, segment: true },
    });
    if (!user) return null;

    if (!user.name || !user.segment) {
      const synced = await syncSiteUserFromCustomerPhone(user.phone);
      if (synced) user = synced;
    }

    return {
      userId:  user.id,
      phone:   user.phone,
      name:    user.name,
      segment: user.segment ?? null,
    };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
