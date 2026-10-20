import { db } from "@/db";
import { users } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { ApiError, apiErrorResponse, unauthorized } from "@/lib/errors";
import { userToJSON } from "@/lib/serializers";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/auth/me — protected by the getAuthUser() dependency.
 * Mirrors `current_user: User = Depends(get_current_user)`.
 */
export async function GET(req: Request) {
  try {
    const claims = await getAuthUser(req);
    const [user] = await db.select().from(users).where(eq(users.id, claims.sub));
    if (!user) throw unauthorized("Token subject no longer exists");
    return Response.json(userToJSON(user));
  } catch (err) {
    if (err instanceof ApiError) return apiErrorResponse(err);
    throw err;
  }
}
