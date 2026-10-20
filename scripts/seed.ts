import "dotenv/config";
import { db } from "../src/db";
import { books, users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";
import { eq } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*  Idempotent seed.                                                   */
/*  - Seeded users are looked up by email and skipped if present.      */
/*  - Seeded books are looked up by ISBN and skipped if present.       */
/* ------------------------------------------------------------------ */

const SEED_USERS = [
  {
    name: "Eleanor Vance",
    email: "admin@folio.dev",
    password: "shelf-admin",
    role: "admin",
  },
  {
    name: "Theo Marchetti",
    email: "demo@folio.dev",
    password: "reader-123",
    role: "user",
  },
];

const CATALOGUE: Array<{
  title: string;
  author: string;
  genre: string;
  description: string;
  isbn: string;
  price: number;
  stock: number;
  publishedYear: number;
  cover: string;
}> = [
  { title: "The Shadow of the Wind", author: "Carlos Ruiz Zafón", genre: "Fiction", description: "A boy in post-war Barcelona inherits a book destined for destruction — and someone is burning every copy.", isbn: "9781594200106", price: 17.5, stock: 14, publishedYear: 2001, cover: "ember" },
  { title: "Dune", author: "Frank Herbert", genre: "Science Fiction", description: "Spice, sand and empire on the desert planet Arrakis — the genre's defining political epic.", isbn: "9780441172719", price: 14.99, stock: 22, publishedYear: 1965, cover: "sand" },
  { title: "Klara and the Sun", author: "Kazuo Ishiguro", genre: "Fiction", description: "An Artificial Friend watches the sun and learns what it means to love a human being.", isbn: "9780593318171", price: 16.95, stock: 9, publishedYear: 2021, cover: "dawn" },
  { title: "The Name of the Wind", author: "Patrick Rothfuss", genre: "Fantasy", description: "A legendary arcanist recounts his youth, his music, and the myth he became.", isbn: "9780756404741", price: 19.99, stock: 17, publishedYear: 2007, cover: "crimson" },
  { title: "Sapiens", author: "Yuval Noah Harari", genre: "History", description: "A sweeping account of how Homo sapiens conquered the world with shared fictions.", isbn: "9780062316097", price: 18.99, stock: 25, publishedYear: 2011, cover: "bone" },
  { title: "Meditations", author: "Marcus Aurelius", genre: "Philosophy", description: "The private notebooks of a Roman emperor — Stoic counsel for turbulent times.", isbn: "9780812968255", price: 11.95, stock: 31, publishedYear: 180, cover: "stone" },
  { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", genre: "Science Fiction", description: "An envoy on a winter world where gender is fluid — Le Guin's anthropology of the possible.", isbn: "9780441478125", price: 15.99, stock: 11, publishedYear: 1969, cover: "frost" },
  { title: "Piranesi", author: "Susanna Clarke", genre: "Fantasy", description: "A man tends an infinite house of statues and tides, recording a world with only one other living soul.", isbn: "9781635575637", price: 16.99, stock: 13, publishedYear: 2020, cover: "mist" },
  { title: "The Midnight Library", author: "Matt Haig", genre: "Fiction", description: "Between life and death stands a library where every book is a life you could have lived.", isbn: "9780525559474", price: 15.5, stock: 19, publishedYear: 2020, cover: "night" },
  { title: "Project Hail Mary", author: "Andy Weir", genre: "Science Fiction", description: "A lone astronaut wakes with no memory; the fate of the sun rests on his science.", isbn: "9780593135204", price: 17.99, stock: 8, publishedYear: 2021, cover: "orbit" },
  { title: "Norwegian Wood", author: "Haruki Murakami", genre: "Fiction", description: "A student's quiet, devastating passage through love and loss in 1960s Tokyo.", isbn: "9780375704024", price: 14.95, stock: 12, publishedYear: 1987, cover: "moss" },
  { title: "The Remains of the Day", author: "Kazuo Ishiguro", genre: "Fiction", description: "A butler's motoring tour becomes an excavation of duty, dignity and regret.", isbn: "9780679731726", price: 15.95, stock: 10, publishedYear: 1989, cover: "sepia" },
  { title: "A Gentleman in Moscow", author: "Amor Towles", genre: "Fiction", description: "Sentenced to house arrest in a grand hotel, a count builds a life inside its walls.", isbn: "9780670026197", price: 16.99, stock: 15, publishedYear: 2016, cover: "burgundy" },
  { title: "The Three-Body Problem", author: "Liu Cixin", genre: "Science Fiction", description: "First contact refracted through the Cultural Revolution — hard SF on a cosmic scale.", isbn: "9780765377067", price: 16.99, stock: 16, publishedYear: 2008, cover: "void" },
  { title: "Circe", author: "Madeline Miller", genre: "Fantasy", description: "The witch of Aiaia claims her own story — exile, monsters, and the making of a goddess.", isbn: "9780316556347", price: 15.99, stock: 21, publishedYear: 2018, cover: "gold" },
  { title: "Educated", author: "Tara Westover", genre: "Non-Fiction", description: "A memoir of a childhood without school and the self-invention that followed.", isbn: "9780399590504", price: 17.0, stock: 18, publishedYear: 2018, cover: "rust" },
  { title: "The Poppy War", author: "R.F. Kuang", genre: "Fantasy", description: "A war orphan wins a place at an elite academy — then learns the cost of shamanic power.", isbn: "9780062662590", price: 17.99, stock: 7, publishedYear: 2018, cover: "poppy" },
  { title: "Atomic Habits", author: "James Clear", genre: "Non-Fiction", description: "Tiny changes, remarkable results — a systems-first anatomy of behaviour.", isbn: "9780735211292", price: 18.99, stock: 28, publishedYear: 2018, cover: "slate" },
  { title: "The Design of Everyday Things", author: "Don Norman", genre: "Non-Fiction", description: "Why doors confuse us and kettles delight — the canon of human-centred design.", isbn: "9780465050659", price: 19.99, stock: 12, publishedYear: 1988, cover: "ivory" },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", genre: "Non-Fiction", description: "Two systems drive the mind; one of them lies to you constantly.", isbn: "9780374533557", price: 19.95, stock: 20, publishedYear: 2011, cover: "ash" },
  { title: "The Overstory", author: "Richard Powers", genre: "Fiction", description: "Nine lives entwine with the ancient world of trees — a novel of ecological scale.", isbn: "9780393356687", price: 17.95, stock: 6, publishedYear: 2018, cover: "evergreen" },
  { title: "Beloved", author: "Toni Morrison", genre: "Fiction", description: "A haunting of memory and motherhood in the aftermath of American slavery.", isbn: "9781400033416", price: 15.0, stock: 14, publishedYear: 1987, cover: "wine" },
  { title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", genre: "Fiction", description: "Seven generations of the Buendía family in the mythic town of Macondo.", isbn: "9780060883287", price: 16.49, stock: 16, publishedYear: 1967, cover: "ochre" },
  { title: "The Master and Margarita", author: "Mikhail Bulgakov", genre: "Fiction", description: "The Devil visits Soviet Moscow with a talking cat — satire as black magic.", isbn: "9780679760801", price: 15.95, stock: 9, publishedYear: 1967, cover: "noir" },
];

async function main() {
  console.log("· seeding users…");
  const emailToId = new Map<string, string>();

  for (const seed of SEED_USERS) {
    const existing = await db.select().from(users).where(eq(users.email, seed.email));
    if (existing.length > 0) {
      emailToId.set(seed.email, existing[0].id);
      console.log(`  ↳ kept  ${seed.email}`);
      continue;
    }
    const [created] = await db
      .insert(users)
      .values({
        name: seed.name,
        email: seed.email,
        passwordHash: await hashPassword(seed.password),
        role: seed.role,
      })
      .returning();
    emailToId.set(seed.email, created.id);
    console.log(`  ↳ added ${seed.email} (${seed.role})`);
  }

  console.log("· seeding books…");
  const adminId = emailToId.get("admin@folio.dev");
  let added = 0;
  let kept = 0;
  for (const book of CATALOGUE) {
    const existing = await db.select({ id: books.id }).from(books).where(eq(books.isbn, book.isbn));
    if (existing.length > 0) {
      kept++;
      continue;
    }
    await db.insert(books).values({ ...book, createdById: adminId ?? null });
    added++;
  }
  console.log(`  ↳ ${added} added, ${kept} kept`);
  console.log("✓ seed complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});
