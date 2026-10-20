import type { ZodError } from "zod";

/* ------------------------------------------------------------------ */
/*  FastAPI-parity error model.                                        */
/*                                                                     */
/*  FastAPI responds to HTTPException with: { "detail": "..." }        */
/*  and Pydantic validation failures with a 422 + loc/msg/type array.  */
/*  This module reproduces both shapes exactly.                        */
/* ------------------------------------------------------------------ */

export type ValidationErrorItem = {
  type: string;
  loc: (string | number)[];
  msg: string;
  input?: unknown;
};

export class ApiError extends Error {
  status: number;
  headers?: Record<string, string>;

  constructor(
    status: number,
    detail: string,
    headers?: Record<string, string>,
  ) {
    super(detail);
    this.status = status;
    this.headers = headers;
  }
}

/** 401 helper that mirrors FastAPI's OAuth2 WWW-Authenticate contract. */
export function unauthorized(detail = "Could not validate credentials") {
  return new ApiError(401, detail, {
    "WWW-Authenticate": "Bearer",
  });
}

export function forbidden(detail = "Not enough permissions") {
  return new ApiError(403, detail);
}

export function notFound(detail = "Not found") {
  return new ApiError(404, detail);
}

export function conflict(detail = "Conflict") {
  return new ApiError(409, detail);
}

/** Render the `{ detail }` envelope used by FastAPI. */
export function apiErrorResponse(err: ApiError): Response {
  return Response.json(
    { detail: err.message },
    { status: err.status, headers: err.headers },
  );
}

/* Map zod issue codes onto Pydantic-v2 style error type strings. */
function pydanticType(
  code: string,
  issue: { expected?: string; message?: string },
): string {
  switch (code) {
    case "invalid_type":
      /* Pydantic reports absent required keys as "missing", not parse errors */
      if (/received (undefined|null)$/.test(issue.message ?? "")) return "missing";
      return issue.expected === "number" || issue.expected === "int"
        ? `${issue.expected}_parsing`
        : `${issue.expected ?? "value"}_parsing`;
    case "too_small":
      return "greater_than_equal";
    case "too_big":
      return "less_than_equal";
    case "invalid_string":
      return "string_pattern_mismatch";
    case "invalid_format":
      return "string_pattern_mismatch";
    default:
      return "value_error";
  }
}

/** Convert a ZodError into FastAPI's 422 “HTTPValidationError” body. */
export function validationErrorResponse(
  error: ZodError,
  loc: "body" | "query" | "path" = "body",
): Response {
  const detail: ValidationErrorItem[] = error.issues.map((issue) => {
    const type = pydanticType(
      issue.code,
      issue as { expected?: string; message?: string },
    );
    return {
      type,
      loc: [loc, ...issue.path.map((p) => (typeof p === "number" ? p : String(p)))],
      msg: type === "missing" ? "Field required" : issue.message,
    };
  });
  return Response.json({ detail }, { status: 422 });
}

/** 422 for a single malformed field (used for bad path params etc.). */
export function singleValidationError(
  loc: (string | number)[],
  msg: string,
  type = "value_error",
  input?: unknown,
): Response {
  const detail: ValidationErrorItem[] = [{ type, loc, msg, input }];
  return Response.json({ detail }, { status: 422 });
}
