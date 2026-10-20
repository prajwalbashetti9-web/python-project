import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/*  users — authentication & RBAC (hashed credentials, role claims)    */
/* ------------------------------------------------------------------ */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    email: varchar("email", { length: 254 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 16 }).notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("users_email_idx").on(t.email)],
);

/* ------------------------------------------------------------------ */
/*  books — the catalogue. Relational FK → users (created_by)          */
/* ------------------------------------------------------------------ */
export const books = pgTable(
  "books",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    author: varchar("author", { length: 120 }).notNull(),
    genre: varchar("genre", { length: 60 }).notNull(),
    description: text("description").notNull().default(""),
    isbn: varchar("isbn", { length: 13 }).notNull().unique(),
    price: doublePrecision("price").notNull(),
    stock: integer("stock").notNull().default(0),
    publishedYear: integer("published_year").notNull(),
    cover: varchar("cover", { length: 32 }).notNull().default("ink"),
    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("books_genre_idx").on(t.genre),
    index("books_author_idx").on(t.author),
    index("books_created_by_idx").on(t.createdById),
  ],
);

/* ------------------------------------------------------------------ */
/*  relations — Users → Books join                                     */
/* ------------------------------------------------------------------ */
export const usersRelations = relations(users, ({ many }) => ({
  books: many(books),
}));

export const booksRelations = relations(books, ({ one }) => ({
  createdBy: one(users, {
    fields: [books.createdById],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
