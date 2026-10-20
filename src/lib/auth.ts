import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { unauthorized } from "@/lib/errors";

/* ------------------------------------------------------------------ */
/*  Authentication primitives — passlib[bcrypt] + python-jose parity.  */
/*                                                                     */
/*  - Passwords are hashed with bcrypt (cost 12)                       */
/*  - Sessions are HS256-signed JWTs with sub / email / role claims    */
/*  - getAuthUser() is the route dependency injected into protected    */
/*    routes, exactly like Depends(get_current_user)                   */
/* ------------------------------------------------------------------ */

const encoder = new TextEncoder();

const secretKey = () =>
  encoder.encode(
    process.env.JWT_SECRET ??
      "folio-dev-secret-change-me-in-production-0123456789",
  );

export const TOKEN_TTL = "7d";
const ISSUER = "folio-bookstore-api";
const AUDIENCE = "folio-clients";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export type TokenClaims = {
  sub: string;
  email: string;
  name: string;
  role: "user" | "admin";
};

export async function issueToken(claims: TokenClaims): Promise<string> {
  return new SignJWT({
    email: claims.email,
    name: claims.name,
    role: claims.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(TOKEN_TTL)
    .sign(secretKey());
}

export async function verifyToken(token: string): Promise<TokenClaims> {
  const { payload } = await jwtVerify(token, secretKey(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  if (
    !payload.sub ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string"
  ) {
    throw unauthorized("Token claims are incomplete");
  }
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role === "admin" ? "admin" : "user",
  };
}

/**
 * The “Depend(get_current_user)” equivalent.
 * Extracts `Authorization: Bearer <jwt>` and resolves the claims,
 * throwing a FastAPI-parity 401 when anything is missing or invalid.
 */
export async function getAuthUser(req: Request): Promise<TokenClaims> {
  const header = req.headers.get("authorization");
  if (!header) {
    throw unauthorized("Not authenticated");
  }
  const [scheme, ...rest] = header.split(" ");
  if (scheme.toLowerCase() !== "bearer" || rest.length !== 1 || !rest[0]) {
    throw unauthorized("Invalid Authorization header — expected 'Bearer <token>'");
  }
  try {
    return await verifyToken(rest[0]);
  } catch {
    throw unauthorized("Could not validate credentials");
  }
}
