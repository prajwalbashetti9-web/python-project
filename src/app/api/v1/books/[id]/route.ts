import { db } from "@/db";
import { books, users } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import {
  ApiError,
  apiErrorResponse,
  conflict,
  forbidden,
  notFound,
  singleValidationError,
  validationErrorResponse,
} from "@/lib/errors";
import { NOT_FOUND_BOOK, parseJsonBody } from "@/lib/http";
import { bookToJSON } from "@/lib/serializers";
import { UUID_RE, bookCreateSchema } from "@/lib/validators";
import { isUniqueViolation } from "@/app/api/v1/books/route";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function validateId(id: string): Response | null {
  if (UUID_RE.test(id)) return null;
  return singleValidationError(
    ["path", "book_id"],
    "book_id must be a valid UUID",
    "uuid_parsing",
    id,
  );
}

async function fetchBook(id: string) {
  const rows = await db
    .select({ book: books, creatorName: users.name })
    .from(books)
    .leftJoin(users, eq(books.createdById, users.id))
    .where(eq(books.id, id));
  return rows[0] ?? null;
}

/** GET /api/v1/books/{book_id} — fetch one book (public). */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const bad = validateId(id);
  if (bad) return bad;
  const row = await fetchBook(id);
  if (!row) return apiErrorResponse(notFound(NOT_FOUND_BOOK));
  return Response.json(bookToJSON(row.book, row.creatorName));
}

/**
 * PUT /api/v1/books/{book_id} — full replace (protected).
 * The complete BookCreate payload is required; every editable field is
 * overwritten while id / created_by stay immutable.
 */
export async function PUT(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const bad = validateId(id);
    if (bad) return bad;
    await getAuthUser(req);

    const body = await parseJsonBody(req);
    const parsed = bookCreateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error, "body");
    const data = parsed.data;

    const existing = await fetchBook(id);
    if (!existing) throw notFound(NOT_FOUND_BOOK);

    try {
      const [updated] = await db
        .update(books)
        .set({
          title: data.title.trim(),
          author: data.author.trim(),
          genre: data.genre.trim(),
          description: data.description,
          isbn: data.isbn,
          price: data.price,
          stock: data.stock,
          publishedYear: data.published_year,
          cover: data.cover,
          updatedAt: new Date(),
        })
        .where(eq(books.id, id))
        .returning();

      return Response.json(bookToJSON(updated, existing.creatorName));
    } catch (err) {
      if (isUniqueViolation(err)) throw conflict("A book with this ISBN already exists");
      throw err;
    }
  } catch (err) {
    if (err instanceof ApiError) return apiErrorResponse(err);
    throw err;
  }
}

/**
 * DELETE /api/v1/books/{book_id} — RBAC guarded.
 * Owners may delete their own books; admins may delete any. A denied
 * caller receives 403, success is an empty 204 No Content.
 */
export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const bad = validateId(id);
    if (bad) return bad;
    const actor = await getAuthUser(_req);

    const [existing] = await db.select().from(books).where(eq(books.id, id));
    if (!existing) throw notFound(NOT_FOUND_BOOK);

    const isOwner = existing.createdById === actor.sub;
    const isAdmin = actor.role === "admin";
    if (!isOwner && !isAdmin) {
      throw forbidden("Forbidden — only the owner or an admin can delete this book");
    }

    await db.delete(books).where(eq(books.id, id));
    return new Response(null, { status: 204 });
  } catch (err) {
    if (err instanceof ApiError) return apiErrorResponse(err);
    throw err;
  }
}
