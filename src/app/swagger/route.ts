export const dynamic = "force-dynamic";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FOLIO Bookstore API — Swagger UI</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/favicon-32x32.png" />
  <style>
    body {
      margin: 0;
      background-color: #0d0f12;
      color: #e6edf3;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .swagger-ui {
      max-width: 1300px;
      margin: 0 auto;
      padding: 24px 20px 60px;
    }
    .topbar {
      display: none !important;
    }
    .swagger-ui .info {
      margin: 20px 0 30px;
    }
    .swagger-ui .info .title {
      color: #e6edf3 !important;
    }
    .swagger-ui .info p, .swagger-ui .info li {
      color: #8b949e !important;
    }
    .swagger-ui .scheme-container {
      background: #161b22 !important;
      box-shadow: none !important;
      border: 1px solid #30363d !important;
      border-radius: 8px !important;
      padding: 15px 20px !important;
      margin-bottom: 25px !important;
    }
    .swagger-ui .opblock {
      border-radius: 8px !important;
      margin-bottom: 14px !important;
    }
    .swagger-ui .opblock .opblock-summary {
      padding: 10px 16px !important;
    }
    .swagger-ui .btn.authorize {
      color: #2ea043 !important;
      border-color: #2ea043 !important;
    }
    .swagger-ui .btn.authorize svg {
      fill: #2ea043 !important;
    }
    /* Quick back-link bar */
    .top-nav {
      background: #161b22;
      border-bottom: 1px solid #30363d;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .top-nav a {
      color: #58a6ff;
      text-decoration: none;
      font-weight: 500;
    }
    .top-nav a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="top-nav">
    <div>
      <strong style="color: #f0f6fc;">FOLIO Bookstore</strong>
      <span style="color: #8b949e; margin-left: 8px;">Swagger UI (OpenAPI 3.1)</span>
    </div>
    <div style="display: flex; gap: 16px;">
      <a href="/">&larr; Back to Home</a>
      <a href="/docs">Custom API Reference</a>
      <a href="/catalog">Catalogue</a>
      <a href="/api/openapi.json" target="_blank">Raw JSON</a>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        displayRequestDuration: true,
        persistAuthorization: true
      });
    };
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
