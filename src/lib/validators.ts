import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Request / response schemas — the Pydantic layer.                   */
/*  These Zod models mirror the documented Book, BookCreate,           */
/*  UserRegister & UserLogin contracts and power both runtime          */
/*  validation and the generated OpenAPI component schemas.            */
/* ------------------------------------------------------------------ */

const currentYear = new Date().getFullYear();

export const bookCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Field must not be empty")
    .max(200, "Title must be at most 200 characters"),
  author: z
    .string()
    .min(1, "Field must not be empty")
    .max(120, "Author must be at most 120 characters"),
  genre: z
    .string()
    .min(1, "Field must not be empty")
    .max(60, "Genre must be at most 60 characters"),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .default(""),
  isbn: z
    .string()
    .regex(
      /^\d{10}(\d{3})?$/,
      "ISBN must be 10 or 13 digits (no hyphens)",
    ),
  price: z
    .number()
    .gte(0, "Price must be greater than or equal to 0")
    .lte(9999, "Price must be less than or equal to 9999"),
  stock: z
    .number()
    .int("Stock must be a valid integer")
    .gte(0, "Stock must be greater than or equal to 0")
    .lte(9999, "Stock must be less than or equal to 9999")
    .default(0),
  published_year: z
    .number()
    .int("Published year must be a valid integer")
    .gte(1450, "Published year must be after 1450")
    .lte(currentYear, `Published year cannot be later than ${currentYear}`),
  cover: z
    .string()
    .min(1)
    .max(32, "Cover key must be at most 32 characters")
    .optional()
    .default("ink"),
});

export type BookCreateInput = z.infer<typeof bookCreateSchema>;

export const userRegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters"),
  email: z.email("Input should be a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters (bcrypt limit)"),
});

export const userLoginSchema = z.object({
  email: z.email("Input should be a valid email address"),
  password: z.string().min(1, "Field must not be empty"),
});

/* ----------------------------- Query parameters ------------------- */

const coerceInt = (label: string) =>
  z
    .string()
    .regex(/^-?\d+$/, `${label} must be a valid integer`)
    .transform(Number);

const coerceNumber = (label: string) =>
  z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, `${label} must be a valid number`)
    .transform(Number);

export const bookQuerySchema = z.object({
  q: z.string().max(200).optional(),
  genre: z.string().max(60).optional(),
  author: z.string().max(120).optional(),
  year_from: coerceInt("year_from").optional(),
  year_to: coerceInt("year_to").optional(),
  price_min: coerceNumber("price_min").optional(),
  price_max: coerceNumber("price_max").optional(),
  sort: z
    .enum(["title", "author", "price", "published_year", "created_at"])
    .default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: coerceInt("page").default(1),
  limit: coerceInt("limit").default(12),
});

export type BookQuery = z.infer<typeof bookQuerySchema>;

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
