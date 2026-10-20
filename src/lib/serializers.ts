import type { Book, User } from "@/db/schema";

/* ------------------------------------------------------------------ */
/*  Response DTOs — the schemas.py layer.                              */
/*  Model rows are projected into snake_case wire payloads,            */
/*  exactly as Pydantic response_model classes would render them.      */
/* ------------------------------------------------------------------ */

export function userToJSON(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.createdAt.toISOString(),
  };
}

export function bookToJSON(book: Book, creatorName?: string | null) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    genre: book.genre,
    description: book.description,
    isbn: book.isbn,
    price: book.price,
    stock: book.stock,
    published_year: book.publishedYear,
    cover: book.cover,
    created_by: book.createdById,
    created_by_name: creatorName ?? null,
    created_at: book.createdAt.toISOString(),
    updated_at: book.updatedAt.toISOString(),
  };
}
