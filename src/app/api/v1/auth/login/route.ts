import { db } from "@/db";
import { users } from "@/db/schema";
import { TOKEN_TTL, issueToken, verifyPassword } from "@/lib/auth";
import { ApiError, apiErrorResponse, validationErrorResponse } from "@/lib/errors";
import { userToJSON } from "@/lib/serializers";
import { userLoginSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function unauthenticated(detail: string) {
  return new ApiError(401, detail, { "WWW-Authenticate": "Bearer" });
}

/**
 * POST /api/v1/auth/login — OAuth2 password flow.
 * Accepts application/json OR application/x-www-form-urlencoded payloads
 * (`username` aliases `email`, mirroring FastAPI's /token contract).
 */
export async function POST(req: Request) {
  try {
    const contentType = (req.headers.get("content-type") ?? "").toLowerCase();
    let raw: unknown;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(await req.text());
      raw = { email: params.get("username") ?? "", password: params.get("password") ?? "" };
    } else if (contentType.includes("application/json")) {
      try {
        raw = await req.json();
      } catch {
        throw new ApiError(400, "Malformed JSON body");
      }
    } else {
      throw new ApiError(415, "Content-Type must be application/json or application/x-www-form-urlencoded");
    }

    const parsed = userLoginSchema.safeParse(raw);
    if (!parsed.success) return validationErrorResponse(parsed.error, "body");

    const email = parsed.data.email.trim().toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, email));

    // When the user is absent, still run one bcrypt compare against a
    // throwaway hash — keeps response timing constant against enumeration.
    const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZBnhgDZKkbIhFhNzBHgcfGFyZJ3nUK";
    const candidate = user?.passwordHash ?? DUMMY_HASH;
    const passwordOk = await verifyPassword(parsed.data.password, candidate);

    if (!passwordOk || !user) throw unauthenticated("Incorrect email or password");

    const role = user.role === "admin" ? "admin" : "user";
    const accessToken = await issueToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role,
    });

    return Response.json({
      access_token: accessToken,
      token_type: "bearer",
      expires_in: TOKEN_TTL,
      user: userToJSON(user),
    });
  } catch (err) {
    if (err instanceof ApiError) return apiErrorResponse(err);
    throw err;
  }
}
