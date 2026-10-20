import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, apiErrorResponse, conflict, validationErrorResponse } from "@/lib/errors";
import { TOKEN_TTL, hashPassword, issueToken } from "@/lib/auth";
import { parseJsonBody } from "@/lib/http";
import { userToJSON } from "@/lib/serializers";
import { userRegisterSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** POST /api/v1/auth/register — create a user, return a signed JWT. */
export async function POST(req: Request) {
  try {
    const body = await parseJsonBody(req);
    const parsed = userRegisterSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error, "body");

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail));
    if (existing.length > 0) throw conflict("Email already registered");

    const [user] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
        role: "user",
      })
      .returning();

    const accessToken = await issueToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: "user",
    });

    return Response.json(
      {
        access_token: accessToken,
        token_type: "bearer",
        expires_in: TOKEN_TTL,
        user: userToJSON(user),
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ApiError) return apiErrorResponse(err);
    throw err;
  }
}
