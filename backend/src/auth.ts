import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import type { PrismaClient, User, Prisma } from "@prisma/client";
import { config } from "./config.js";
import { ApiError } from "./errors.js";
const secret = new TextEncoder().encode(config.JWT_SECRET);
export const hashToken = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const userSelect = {
  id: true,
  email: true,
  name: true,
  avatar_url: true,
  created_at: true,
} as const;
export const publicUser = (u: User) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  avatar_url: u.avatar_url,
  created_at: u.created_at,
});
async function accessToken(user: Pick<User, "id" | "email" | "name">) {
  return new SignJWT({ email: user.email, name: user.name, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer("pomodoro-api")
    .setAudience("pomodoro-mobile")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}
export async function issueTokens(
  db: PrismaClient | Prisma.TransactionClient,
  user: User,
) {
  const refresh = randomBytes(48).toString("base64url");
  await db.refreshToken.create({
    data: {
      user_id: user.id,
      token_hash: hashToken(refresh),
      expires_at: new Date(Date.now() + 30 * 86400000),
    },
  });
  return {
    access_token: await accessToken(user),
    refresh_token: refresh,
    expires_in: 900,
  };
}
export async function rotateToken(db: PrismaClient, token: string) {
  return db.$transaction(async (tx) => {
    // DELETE ... RETURNING behavior is emulated with deleteMany's atomic count.
    const row = await tx.refreshToken.findUnique({
      where: { token_hash: hashToken(token) },
      include: { user: true },
    });
    if (!row || row.expires_at.getTime() <= Date.now())
      throw new ApiError(401, "authentication-error", "Invalid refresh token");
    const deleted = await tx.refreshToken.deleteMany({ where: { id: row.id } });
    if (deleted.count !== 1)
      throw new ApiError(
        401,
        "authentication-error",
        "Refresh token already used",
      );
    return issueTokens(tx, row.user);
  });
}
export async function verifyAccess(token?: string) {
  if (!token)
    throw new ApiError(401, "authentication-error", "Authentication required");
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: "pomodoro-api",
      audience: "pomodoro-mobile",
    });
    if (!payload.sub || payload.type !== "access")
      throw new Error("Invalid token");
    return payload.sub;
  } catch {
    throw new ApiError(
      401,
      "authentication-error",
      "Invalid or expired access token",
    );
  }
}
const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
const appleKeys = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);
export async function verifyOAuth(provider: "google" | "apple", token: string) {
  const audience =
    provider === "google" ? config.GOOGLE_CLIENT_ID : config.APPLE_CLIENT_ID;
  if (!audience)
    throw new ApiError(
      503,
      "service-unavailable",
      "OAuth provider is not configured",
    );
  try {
    const { payload } = await jwtVerify(
      token,
      provider === "google" ? googleKeys : appleKeys,
      {
        audience,
        issuer:
          provider === "google"
            ? ["https://accounts.google.com", "accounts.google.com"]
            : "https://appleid.apple.com",
        algorithms: ["RS256"],
      },
    );
    if (
      !payload.sub ||
      typeof payload.email !== "string" ||
      ![true, "true"].includes(payload.email_verified as boolean | string)
    )
      throw new Error("Email unverified");
    return {
      id: payload.sub,
      email: payload.email.toLowerCase(),
      name: typeof payload.name === "string" ? payload.name : "Người học",
    };
  } catch {
    throw new ApiError(
      401,
      "authentication-error",
      "Invalid provider identity token",
    );
  }
}
