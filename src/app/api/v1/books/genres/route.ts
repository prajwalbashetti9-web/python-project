import { db } from "@/db";
import { books } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/v1/books/genres — distinct genre histogram. */
export async function GET() {
  const rows = await db
    .select({ genre: books.genre, count: sql<number>`count(*)::int` })
    .from(books)
    .groupBy(books.genre)
    .orderBy(desc(sql`count(*)`), books.genre);

  return Response.json({ data: rows });
}
