import { ApiError } from "@/lib/errors";

/* ------------------------------------------------------------------ */
/*  Strict request-body parsing.                                       */
/*                                                                     */
/*  Mutation endpoints demand an explicit JSON Content-Type — a wrong  */
/*  or missing one is a 415, malformed JSON a 400, both rendered in    */
/*  the FastAPI `{ detail }` envelope.                                 */
/* ------------------------------------------------------------------ */

export async function parseJsonBody(req: Request): Promise<unknown> {
  const contentType = (req.headers.get("content-type") ?? "").toLowerCase();
  if (!contentType.includes("application/json")) {
    throw new ApiError(415, "Content-Type must be application/json");
  }
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Malformed JSON body");
  }
}

export const NOT_FOUND_BOOK = "Book not found";
