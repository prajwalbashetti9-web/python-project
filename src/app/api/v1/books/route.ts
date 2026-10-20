import { db } from "@/db";
import { books, users } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { ApiError, apiErrorResponse, conflict, validationErrorResponse } from "@/lib/errors";
import { parseJsonBody } from "@/lib/http";
import { bookToJSON } from "@/lib/serializers";
import { bookCreateSchema, bookQuerySchema } from "@/lib/validators";
import { and, asc, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";

export const dynamic = "force-dynamic";

const SORT_COLUMNS = {
  title: books.title,
  author: books.author,
  price: books.price,
  published_year: books.publishedYear,
  created_at: books.createdAt,
} as const;

/**
 * GET /api/v1/books — list with filtering, sorting and pagination.
 * All query parameters are validated by the BookQuery schema; invalid
 * input produces a FastAPI-style 422 describing each offender.
 */
export async function GET(req: Request) {
  try {
    const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parsed = bookQuerySchema.safeParse(raw);
    if (!parsed.success) return validationErrorResponse(parsed.error, "query");

    const query = parsed.data;
    const conditions: (SQL | undefined)[] = [];

    if (query.q) {
      const needle = `%${query.q}%`;
      conditions.push(or(ilike(books.title, needle), ilike(books.author, needle)));
    }
    if (query.genre) conditions.push(ilike(books.genre, query.genre));
    if (query.author) conditions.push(ilike(books.author, `%${query.author}%`));
    if (query.year_from !== undefined) conditions.push(gte(books.publishedYear, query.year_from));
    if (query.year_to !== undefined) conditions.push(lte(books.publishedYear, query.year_to));
    if (query.price_min !== undefined) conditions.push(gte(books.price, query.price_min));
    if (query.price_max !== undefined) conditions.push(lte(books.price, query.price_max));

    const where = and(...conditions);
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(books)
      .where(where);
    const total = countRow?.count ?? 0;
    const pages = Math.max(1, Math.ceil(total / limit));

    const sortColumn = SORT_COLUMNS[query.sort];
    const rows = await db
      .select({ book: books, creatorName: users.name })
      .from(books)
      .leftJoin(users, eq(books.createdById, users.id))
      .where(where)
      .orderBy(query.order === "asc" ? asc(sortColumn) : desc(sortColumn))
      .limit(limit)
      .offset((page - 1) * limit);

    return Response.json({
      data: rows.map((row) => bookToJSON(row.book, row.creatorName)),
      meta: {
        total,
        page,
        limit,
        pages,
        has_prev: page > 1,
        has_next: page < pages,
      },
    });
  } catch (err) {
    if (err instanceof ApiError) return apiErrorResponse(err);
    throw err;
  }
}

/**
 * POST /api/v1/books — create (protected).
 * The caller's identity is stamped onto created_by, materialising the
 * Users → Books relation. Duplicate ISBNs surface as 409 Conflict.
 */
export async function POST(req: Request) {
  try {
    const actor = await getAuthUser(req);
    const body = await parseJsonBody(req);
    const parsed = bookCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error, "body");

    const data = parsed.data;
    try {
      const [book] = await db
        .insert(books)
        .values({
          title: data.title.trim(),
          author: data.author.trim(),
          genre: data.genre.trim(),
          description: data.description,
          isbn: data.isbn,
          price: data.price,
          stock: data.stock,
          publishedYear: data.published_year,
          cover: data.cover,
          createdById: actor.sub,
        })
        .returning();

      return Response.json(bookToJSON(book, actor.name), { status: 201 });
    } catch (err) {
      if (isUniqueViolation(err)) throw conflict("A book with this ISBN already exists");
      throw err;
    }
  } catch (err) {
    if (err instanceof ApiError) return apiErrorResponse(err);
    throw err;
  }
}

export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}
