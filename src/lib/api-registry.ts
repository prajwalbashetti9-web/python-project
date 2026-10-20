/* ------------------------------------------------------------------ */
/*  API registry — single source of truth.                             */
/*                                                                     */
/*  Every route is declared here once. From this registry we generate */
/*  the OpenAPI 3.1 document served at /api/openapi.json and render    */
/*  the interactive reference at /docs — mirroring FastAPI's           */
/*  auto-generated Swagger UI.                                         */
/* ------------------------------------------------------------------ */

export type Method = "GET" | "POST" | "PUT" | "DELETE";

export type ParamDef = {
  name: string;
  in: "query" | "path";
  type: "string" | "number" | "integer";
  required?: boolean;
  description: string;
  default?: string | number;
  example?: string | number;
  enum?: string[];
};

export type FieldDef = {
  name: string;
  type: "string" | "number" | "integer" | "boolean" | "object";
  required?: boolean;
  description: string;
  default?: unknown;
  example?: unknown;
};

export type ResponseDef = {
  status: number;
  description: string;
  schema?: string;
  example?: unknown;
};

export type EndpointDef = {
  id: string;
  method: Method;
  path: string;
  tag: "Books" | "Authentication" | "System";
  summary: string;
  description: string;
  /** none → public · user → Bearer required · owner-or-admin → Bearer + RBAC */
  auth: "none" | "user" | "owner-or-admin";
  queryParams?: ParamDef[];
  pathParams?: ParamDef[];
  body?: {
    contentType?: "application/json" | "application/x-www-form-urlencoded";
    fields: FieldDef[];
    example: Record<string, unknown>;
  };
  responses: ResponseDef[];
};

export const API_INFO = {
  title: "FOLIO — Bookstore REST API",
  version: "1.0.0",
  description:
    "Async CRUD REST API with JWT authentication, role-based access control, " +
    "schema-first validation and PostgreSQL persistence. Errors follow the " +
    "FastAPI contract: `{ detail: … }` envelopes and 422 validation arrays.",
};

/* ---------------------------- Book fields --------------------------- */

export const bookCreateFields: FieldDef[] = [
  { name: "title", type: "string", required: true, description: "Book title · 1–200 chars", example: "The Stone Atlas" },
  { name: "author", type: "string", required: true, description: "Author name · 1–120 chars", example: "Imogen Caird" },
  { name: "genre", type: "string", required: true, description: "Genre label · 1–60 chars", example: "Fantasy" },
  { name: "description", type: "string", description: "Synopsis · ≤ 2000 chars", default: "", example: "A cartographer maps a country that keeps moving." },
  { name: "isbn", type: "string", required: true, description: "ISBN-10 or ISBN-13 · digits only, unique", example: "9780316769488" },
  { name: "price", type: "number", required: true, description: "Unit price · 0 – 9999", example: 24.5 },
  { name: "stock", type: "integer", description: "Units on hand · 0 – 9999", default: 0, example: 12 },
  { name: "published_year", type: "integer", required: true, description: "Year of publication · 1450 – present", example: 2021 },
  { name: "cover", type: "string", description: "Cover palette key for generated artwork", default: "ink", example: "ember" },
];

const bookExample = {
  id: "3f52a7b1-9c41-4b8f-a3c1-9a11d0e2f201",
  title: "The Stone Atlas",
  author: "Imogen Caird",
  genre: "Fantasy",
  description: "A cartographer maps a country that keeps moving.",
  isbn: "9780316769488",
  price: 24.5,
  stock: 12,
  published_year: 2021,
  cover: "ember",
  created_by: "8d0c6f21-9a7b-4c3e-8f12-1a2b3c4d5e6f",
  created_by_name: "Eleanor Vance",
  created_at: "2026-01-19T10:24:11.000Z",
  updated_at: "2026-01-19T10:24:11.000Z",
};

const bookCreateExample = {
  title: "The Stone Atlas",
  author: "Imogen Caird",
  genre: "Fantasy",
  description: "A cartographer maps a country that keeps moving.",
  isbn: "9780316769488",
  price: 24.5,
  stock: 12,
  published_year: 2021,
  cover: "ember",
};

const validationErrorExample = {
  detail: [
    {
      type: "greater_than_equal",
      loc: ["body", "price"],
      msg: "Price must be greater than or equal to 0",
    },
  ],
};

const unauthorizedExample = { detail: "Not authenticated" };
const invalidTokenExample = { detail: "Could not validate credentials" };
const forbiddenExample = {
  detail: "Forbidden — only the owner or an admin can delete this book",
};
const notFoundExample = { detail: "Book not found" };

/* ---------------------------- Endpoints ----------------------------- */

export const ENDPOINTS: EndpointDef[] = [
  {
    id: "health",
    method: "GET",
    path: "/api/health",
    tag: "System",
    summary: "Service liveness probe",
    description:
      "Lightweight heartbeat that also executes a database round-trip (`SELECT 1`). Returns 500 when the PostgreSQL pool is unreachable.",
    auth: "none",
    responses: [
      { status: 200, description: "Service and database are healthy", example: { ok: true } },
      { status: 500, description: "Database unreachable", example: { ok: false } },
    ],
  },
  {
    id: "stats",
    method: "GET",
    path: "/api/v1/stats",
    tag: "System",
    summary: "Storefront telemetry",
    description:
      "Aggregate counters over the books and users tables — total titles, distinct authors & genres, average price and stock valuation. Powers the landing page metrics.",
    auth: "none",
    responses: [
      {
        status: 200,
        description: "Aggregate statistics",
        example: {
          books_total: 24,
          users_total: 2,
          authors_total: 24,
          genres_total: 8,
          avg_price: 18.74,
          inventory_value: 5231.4,
        },
      },
    ],
  },
  {
    id: "register",
    method: "POST",
    path: "/api/v1/auth/register",
    tag: "Authentication",
    summary: "Register a new reader",
    description:
      "Creates a user with a **bcrypt-hashed** password (cost 12) and immediately returns a signed JWT — no second login round-trip needed. Emails are unique.",
    auth: "none",
    body: {
      fields: [
        { name: "name", type: "string", required: true, description: "Display name · 2–80 chars", example: "Theo Marchetti" },
        { name: "email", type: "string", required: true, description: "Valid email address · unique", example: "theo@inkwell.io" },
        { name: "password", type: "string", required: true, description: "8–72 characters (bcrypt limit)", example: "correct-horse-42" },
      ],
      example: { name: "Theo Marchetti", email: "theo@inkwell.io", password: "correct-horse-42" },
    },
    responses: [
      {
        status: 201,
        description: "User created — access token issued",
        schema: "Token",
        example: {
          access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…",
          token_type: "bearer",
          expires_in: "7d",
          user: { id: "…", name: "Theo Marchetti", email: "theo@inkwell.io", role: "user", created_at: "2026-01-19T10:24:11.000Z" },
        },
      },
      { status: 409, description: "Email already registered", example: { detail: "Email already registered" } },
      { status: 422, description: "Validation Error", example: validationErrorExample },
    ],
  },
  {
    id: "login",
    method: "POST",
    path: "/api/v1/auth/login",
    tag: "Authentication",
    summary: "Log in (OAuth2 password flow)",
    description:
      "Verifies credentials against the stored bcrypt hash and issues an HS256 JWT. Accepts `application/json` **or** `application/x-www-form-urlencoded` (`username` + `password`) for full OAuth2PasswordBearer compatibility.",
    auth: "none",
    body: {
      contentType: "application/x-www-form-urlencoded",
      fields: [
        { name: "email (or username)", type: "string", required: true, description: "Account email — the OAuth2 `username` alias is also accepted", example: "demo@folio.dev" },
        { name: "password", type: "string", required: true, description: "Account password", example: "reader-123" },
      ],
      example: { email: "demo@folio.dev", password: "reader-123" },
    },
    responses: [
      {
        status: 200,
        description: "Authenticated — access token issued",
        schema: "Token",
        example: { access_token: "eyJhbGciOiJIUzI1NiIs…", token_type: "bearer", expires_in: "7d", user: { id: "…", name: "Theo Marchetti", email: "demo@folio.dev", role: "user" } },
      },
      { status: 401, description: "Incorrect credentials", example: { detail: "Incorrect email or password" } },
      { status: 422, description: "Validation Error", example: validationErrorExample },
    ],
  },
  {
    id: "me",
    method: "GET",
    path: "/api/v1/auth/me",
    tag: "Authentication",
    summary: "Resolve the current user",
    description:
      "Decodes the Bearer JWT and returns the caller's profile — the live demonstration of the `Depends(get_current_user)` route dependency.",
    auth: "user",
    responses: [
      { status: 200, description: "Current user profile", example: { id: "…", name: "Theo Marchetti", email: "demo@folio.dev", role: "user", created_at: "2026-01-19T10:24:11.000Z" } },
      { status: 401, description: "Missing or invalid token", example: unauthorizedExample },
    ],
  },
  {
    id: "books-list",
    method: "GET",
    path: "/api/v1/books",
    tag: "Books",
    summary: "List books with filtering & pagination",
    description:
      "Query the catalogue with composable filters. `q` performs a case-insensitive match across **title and author**, genre/author filter by equality, price and year accept inclusive ranges. Results are paginated and sortable.",
    auth: "none",
    queryParams: [
      { name: "q", in: "query", type: "string", description: "Full-text-ish search over title & author", example: "dune" },
      { name: "genre", in: "query", type: "string", description: "Exact genre match (case-insensitive)", example: "Science Fiction" },
      { name: "author", in: "query", type: "string", description: "Partial author match", example: "Le Guin" },
      { name: "year_from", in: "query", type: "integer", description: "Earliest publication year (inclusive)", example: 1950 },
      { name: "year_to", in: "query", type: "integer", description: "Latest publication year (inclusive)", example: 2024 },
      { name: "price_min", in: "query", type: "number", description: "Minimum price (inclusive)", example: 10 },
      { name: "price_max", in: "query", type: "number", description: "Maximum price (inclusive)", example: 30 },
      { name: "sort", in: "query", type: "string", description: "Sort field", default: "created_at", enum: ["title", "author", "price", "published_year", "created_at"] },
      { name: "order", in: "query", type: "string", description: "Sort direction", default: "desc", enum: ["asc", "desc"] },
      { name: "page", in: "query", type: "integer", description: "Page number (1-based)", default: 1, example: 1 },
      { name: "limit", in: "query", type: "integer", description: "Items per page · 1–100", default: 12, example: 12 },
    ],
    responses: [
      {
        status: 200,
        description: "Paginated book collection",
        example: {
          data: [bookExample],
          meta: { total: 24, page: 1, limit: 12, pages: 2, has_prev: false, has_next: true },
        },
      },
      { status: 422, description: "Validation Error", example: validationErrorExample },
    ],
  },
  {
    id: "books-create",
    method: "POST",
    path: "/api/v1/books",
    tag: "Books",
    summary: "Shelve a new book · 🔒 auth",
    description:
      "Validates the payload against the **BookCreate** schema and persists a row. The caller's user id is stamped on `created_by`, establishing the Users → Books relation. ISBNs are unique — duplicates are rejected with 409.",
    auth: "user",
    body: { fields: bookCreateFields, example: bookCreateExample },
    responses: [
      { status: 201, description: "Book created", schema: "Book", example: bookExample },
      { status: 401, description: "Not authenticated", example: unauthorizedExample },
      { status: 409, description: "ISBN already shelved", example: { detail: "A book with this ISBN already exists" } },
      { status: 415, description: "Unsupported Media Type", example: { detail: "Content-Type must be application/json" } },
      { status: 422, description: "Validation Error", example: validationErrorExample },
    ],
  },
  {
    id: "books-genres",
    method: "GET",
    path: "/api/v1/books/genres",
    tag: "Books",
    summary: "List distinct genres",
    description: "Distinct genre labels with title counts — designed to power filter dropdowns.",
    auth: "none",
    responses: [
      {
        status: 200,
        description: "Genre histogram",
        example: { data: [{ genre: "Fantasy", count: 5 }, { genre: "Science Fiction", count: 4 }] },
      },
    ],
  },
  {
    id: "books-read",
    method: "GET",
    path: "/api/v1/books/{book_id}",
    tag: "Books",
    summary: "Fetch a single book",
    description: "Resolves one row by UUID, joined with its creator's name. Malformed UUIDs yield a **422 path-validation error**, unknown ids a 404.",
    auth: "none",
    pathParams: [
      { name: "book_id", in: "path", type: "string", required: true, description: "Book UUID", example: "3f52a7b1-9c41-4b8f-a3c1-9a11d0e2f201" },
    ],
    responses: [
      { status: 200, description: "The requested book", schema: "Book", example: bookExample },
      { status: 404, description: "Not found", example: notFoundExample },
      { status: 422, description: "Validation Error", example: { detail: [{ type: "uuid_parsing", loc: ["path", "book_id"], msg: "book_id must be a valid UUID" }] } },
    ],
  },
  {
    id: "books-update",
    method: "PUT",
    path: "/api/v1/books/{book_id}",
    tag: "Books",
    summary: "Replace a book (full update) · 🔒 auth",
    description:
      "Full-resource replace — the complete **BookCreate** payload is required and every editable field is overwritten. `created_by` and `id` are immutable; `updated_at` is refreshed.",
    auth: "user",
    pathParams: [
      { name: "book_id", in: "path", type: "string", required: true, description: "Book UUID", example: "3f52a7b1-9c41-4b8f-a3c1-9a11d0e2f201" },
    ],
    body: { fields: bookCreateFields, example: bookCreateExample },
    responses: [
      { status: 200, description: "Book replaced", schema: "Book", example: bookExample },
      { status: 401, description: "Not authenticated", example: unauthorizedExample },
      { status: 404, description: "Not found", example: notFoundExample },
      { status: 409, description: "ISBN already shelved", example: { detail: "A book with this ISBN already exists" } },
      { status: 422, description: "Validation Error", example: validationErrorExample },
    ],
  },
  {
    id: "books-delete",
    method: "DELETE",
    path: "/api/v1/books/{book_id}",
    tag: "Books",
    summary: "Delete a book · 🔒 owner / admin",
    description:
      "**RBAC-guarded**: a caller may delete only books they created; users with the `admin` role may delete anything. Responds `204 No Content` on success.",
    auth: "owner-or-admin",
    pathParams: [
      { name: "book_id", in: "path", type: "string", required: true, description: "Book UUID", example: "3f52a7b1-9c41-4b8f-a3c1-9a11d0e2f201" },
    ],
    responses: [
      { status: 204, description: "Deleted — empty response body" },
      { status: 401, description: "Not authenticated", example: invalidTokenExample },
      { status: 403, description: "Forbidden — RBAC denial", example: forbiddenExample },
      { status: 404, description: "Not found", example: notFoundExample },
    ],
  },
];

export const TAG_ORDER = ["Authentication", "Books", "System"] as const;

export function endpointsByTag() {
  const groups = new Map<string, EndpointDef[]>();
  for (const tag of TAG_ORDER) groups.set(tag, []);
  for (const ep of ENDPOINTS) groups.get(ep.tag)!.push(ep);
  return [...groups.entries()].map(([tag, endpoints]) => ({ tag, endpoints }));
}
