import {
  API_INFO,
  ENDPOINTS,
  bookCreateFields,
  type EndpointDef,
  type FieldDef,
} from "@/lib/api-registry";

/* ------------------------------------------------------------------ */
/*  OpenAPI 3.1 generator.                                             */
/*  The document is assembled programmatically from the API registry   */
/*  (src/lib/api-registry.ts) — the same “spec as code” pipeline that  */
/*  FastAPI derives from routes + Pydantic models.                    */
/* ------------------------------------------------------------------ */

type Json = Record<string, unknown>;

function propsFromFields(fields: FieldDef[]): Json {
  const properties: Json = {};
  const required: string[] = [];
  for (const f of fields) {
    properties[f.name] = {
      type: f.type === "integer" ? "integer" : f.type,
      description: f.description,
      ...(f.example !== undefined ? { example: f.example } : {}),
      ...(f.default !== undefined ? { default: f.default } : {}),
    };
    if (f.required) required.push(f.name);
  }
  return { type: "object", properties, ...(required.length ? { required } : {}) };
}

const bookSchema = () =>
  propsFromFields([
    { name: "id", type: "string", required: true, description: "UUID" },
    ...bookCreateFields.map((f) => ({ ...f, required: true })),
    { name: "created_by", type: "string", description: "UUID of the creating user (nullable)" },
    { name: "created_by_name", type: "string", description: "Joined creator display name (nullable)" },
    { name: "created_at", type: "string", required: true, description: "ISO-8601 timestamp" },
    { name: "updated_at", type: "string", required: true, description: "ISO-8601 timestamp" },
  ]);

const errorSchema: Json = {
  type: "object",
  properties: { detail: { type: "string", description: "Human-readable error" } },
  required: ["detail"],
};

const validationErrorSchema: Json = {
  type: "object",
  properties: {
    detail: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", description: "Pydantic-style error type" },
          loc: { type: "array", items: { type: ["string", "integer"] } },
          msg: { type: "string" },
        },
        required: ["type", "loc", "msg"],
      },
    },
  },
  required: ["detail"],
};

export function buildOpenAPISpec() {
  const paths: Json = {};

  for (const ep of ENDPOINTS) {
    const parameters = [
      ...(ep.pathParams ?? []),
      ...(ep.queryParams ?? []),
    ].map((p) => ({
      name: p.name,
      in: p.in,
      required: p.in === "path" ? true : Boolean(p.required),
      description: p.description,
      schema: {
        type: p.type,
        ...(p.enum ? { enum: p.enum } : {}),
        ...(p.default !== undefined ? { default: p.default } : {}),
      },
      ...(p.example !== undefined ? { example: p.example } : {}),
    }));

    const responses: Json = {};
    for (const r of ep.responses) {
      responses[String(r.status)] = {
        description: r.description,
        ...(r.example !== undefined || r.schema
          ? {
              content: {
                "application/json": {
                  schema: r.schema ? { $ref: `#/components/schemas/${r.schema}` } : {},
                  ...(r.example !== undefined ? { example: r.example } : {}),
                },
              },
            }
          : {}),
      };
    }

    const operation: Json = {
      operationId: ep.id.replace(/-/g, "_"),
      tags: [ep.tag],
      summary: ep.summary.replace(" · 🔒", ""),
      description: ep.description,
      ...(parameters.length ? { parameters } : {}),
      ...(ep.body
        ? {
            requestBody: {
              required: true,
              content: {
                [ep.body.contentType ?? "application/json"]: {
                  schema: propsFromFields(ep.body.fields),
                  example: ep.body.example,
                },
              },
            },
          }
        : {}),
      ...(ep.auth !== "none" ? { security: [{ BearerAuth: [] }] } : {}),
      responses,
    } satisfies Json;

    const pathItem = (paths[ep.path] ??= {});
    (pathItem as Json)[ep.method.toLowerCase()] = operation;
  }

  return {
    openapi: "3.1.0",
    info: API_INFO,
    servers: [{ url: "/", description: "This deployment" }],
    tags: ["Authentication", "Books", "System"].map((name) => ({ name })),
    paths,
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "HS256 JSON Web Token issued by /api/v1/auth/login",
        },
      },
      schemas: {
        Book: bookSchema(),
        BookCreate: propsFromFields(bookCreateFields),
        Error: errorSchema,
        HTTPValidationError: validationErrorSchema,
      },
    },
    "x-folio": {
      generated: "registry → spec",
      tasks: ["validation", "jwt-auth-rbac", "orm-persistence"],
    },
  };
}
