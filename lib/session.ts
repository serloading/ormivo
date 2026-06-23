import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET env variable is required");
const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);
const COOKIE = "site_session";

export interface SessionPayload {
  userId: string;
  phone:  string;
  name:   string | null;
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 30,
    path:     "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const jar   = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
