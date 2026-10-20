import { db } from "@/db";
import { books, users } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/v1/stats — aggregate storefront telemetry (public). */
export async function GET() {
  const [bookStats] = await db
    .select({
      books_total: sql<number>`count(*)::int`,
      authors_total: sql<number>`count(distinct ${books.author})::int`,
      genres_total: sql<number>`count(distinct ${books.genre})::int`,
      avg_price: sql<number>`coalesce(round(avg(${books.price})::numeric, 2), 0)::float`,
      inventory_value: sql<number>`coalesce(round(sum(${books.price} * ${books.stock})::numeric, 2), 0)::float`,
      units_in_stock: sql<number>`coalesce(sum(${books.stock}), 0)::int`,
    })
    .from(books);

  const [userStats] = await db
    .select({ users_total: sql<number>`count(*)::int` })
    .from(users);

  return Response.json({
    ...bookStats,
    users_total: userStats?.users_total ?? 0,
  });
}
