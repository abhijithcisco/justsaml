import * as http from "http";
import * as fs from "fs";
import * as querystring from "querystring";
import * as zlib from "zlib";
import { AppConfig, UserEntry, ServiceProvider } from "./config";
import { generateMetadataXml } from "./saml/metadata";
import { buildSamlResponse } from "./saml/response";
import { signSamlResponse } from "./saml/sign";
import { renderLoginPage, renderAutoPostPage } from "./login";

function parseBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function send(res: http.ServerResponse, status: number, contentType: string, body: string): void {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
}

function parseSamlRequestId(samlRequestB64: string): string | undefined {
  try {
    const buf = Buffer.from(samlRequestB64, "base64");
    let xml: string;
    try {
      xml = zlib.inflateRawSync(buf).toString("utf-8");
    } catch {
      xml = buf.toString("utf-8");
    }
    const match = xml.match(/ID="([^"]+)"/);
    return match ? match[1] : undefined;
  } catch {
    return undefined;
  }
}

export function createRequestHandler(config: AppConfig): (req: http.IncomingMessage, res: http.ServerResponse) => void {
  const metadataXml = generateMetadataXml(config);

  const handler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = new URL(req.url || "/", `https://localhost:${config.server.port}`);
    const method = req.method?.toUpperCase() || "GET";

    try {
      // GET / — home page with links
      if (url.pathname === "/" && method === "GET") {
        const spList = config.serviceProviders
          .map((sp) => `<li><a href="/sso/idp-init?sp=${encodeURIComponent(sp.entityId)}">${sp.entityId}</a></li>`)
          .join("");
        return send(res, 200, "text/html", `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>JustSAML</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#1a1a2e;color:#eee;display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{background:#16213e;border-radius:12px;padding:40px;width:480px;box-shadow:0 8px 32px rgba(0,0,0,0.4)}
    h1{font-size:24px;margin-bottom:8px;color:#e94560}
    .sub{font-size:13px;color:#888;margin-bottom:24px}
    h2{font-size:16px;margin:16px 0 8px;color:#ccc}
    a{color:#5dade2;text-decoration:none}
    a:hover{text-decoration:underline}
    ul{list-style:none;padding:0}
    li{padding:6px 0;font-size:14px}
    .sep{border-top:1px solid #333;margin:16px 0}
    code{background:#0f3460;padding:2px 6px;border-radius:4px;font-size:13px}
  </style>
</head>
<body>
  <div class="card">
    <h1>JustSAML</h1>
    <div class="sub">Lab SAML Identity Provider</div>
    <h2>Endpoints</h2>
    <ul>
      <li><a href="/metadata">/metadata</a> — IdP Metadata XML</li>
      <li><a href="/sso">/sso</a> — SSO Endpoint (login form)</li>
      <li><a href="/health">/health</a> — Health Check</li>
    </ul>
    <div class="sep"></div>
    <h2>IdP-Initiated Login</h2>
    <ul>${spList || "<li>No Service Providers configured</li>"}</ul>
    <div class="sep"></div>
    <div style="font-size:12px;color:#555;margin-top:8px">
      Users: ${config.users.map((u) => "<code>" + u.username + "</code>").join(", ")}
    </div>
  </div>
</body>
</html>`);
      }

      // GET /health
      if (url.pathname === "/health" && method === "GET") {
        return send(res, 200, "application/json", JSON.stringify({ ok: true }));
      }

      // GET /metadata
      if (url.pathname === "/metadata" && method === "GET") {
        return send(res, 200, "application/xml", metadataXml);
      }

      // GET /sso — SP-initiated via redirect binding
      if (url.pathname === "/sso" && method === "GET") {
        const samlRequest = url.searchParams.get("SAMLRequest") || "";
        const relayState = url.searchParams.get("RelayState") || "";
        const spEntityId = findSpEntityId(config, samlRequest) || url.searchParams.get("SPEntityId") || "";
        return send(res, 200, "text/html", renderLoginPage(samlRequest, relayState, spEntityId));
      }

      // POST /sso — SP-initiated via POST binding
      if (url.pathname === "/sso" && method === "POST") {
        const body = await parseBody(req);
        const params = querystring.parse(body);
        const samlRequest = (params.SAMLRequest as string) || "";
        const relayState = (params.RelayState as string) || "";
        const spEntityId = findSpEntityId(config, samlRequest) || "";
        return send(res, 200, "text/html", renderLoginPage(samlRequest, relayState, spEntityId));
      }

      // GET /sso/idp-init — IdP-initiated login page
      if (url.pathname === "/sso/idp-init" && method === "GET") {
        const spEntityId = url.searchParams.get("sp") || "";
        return send(res, 200, "text/html", renderLoginPage("", "", spEntityId));
      }

      // POST /sso/login — authenticate and respond
      if (url.pathname === "/sso/login" && method === "POST") {
        const body = await parseBody(req);
        const params = querystring.parse(body);

        const username = (params.username as string) || "";
        const password = (params.password as string) || "";
        const samlRequest = (params.SAMLRequest as string) || "";
        const relayState = (params.RelayState as string) || "";
        const spEntityId = (params.SPEntityId as string) || "";

        // Authenticate
        const user = config.users.find(
          (u: UserEntry) => u.username === username && u.password === password
        );
        if (!user) {
          return send(
            res, 200, "text/html",
            renderLoginPage(samlRequest, relayState, spEntityId, "Invalid username or password")
          );
        }

        // Find SP
        const sp = config.serviceProviders.find(
          (s: ServiceProvider) => s.entityId === spEntityId
        );
        if (!sp) {
          return send(res, 400, "text/html",
            `<h1>Unknown Service Provider</h1><p>Entity ID: ${spEntityId}</p><p>Register it in config.json.</p>`
          );
        }

        // Parse InResponseTo from SAMLRequest
        const inResponseTo = samlRequest ? parseSamlRequestId(samlRequest) : undefined;

        // Build + sign SAML response
        const rawResponse = buildSamlResponse({ config, user, sp, inResponseTo });
        const signedResponse = signSamlResponse(rawResponse, config.idp.signingKey, config.idp.signingCert);
        const encodedResponse = Buffer.from(signedResponse, "utf-8").toString("base64");

        return send(res, 200, "text/html", renderAutoPostPage(sp.acsUrl, encodedResponse, relayState));
      }

      // 404
      send(res, 404, "text/plain", "Not Found");
    } catch (err: any) {
      console.error("Request error:", err);
      send(res, 500, "text/plain", `Internal Server Error: ${err.message}`);
    }
  };

  return handler;
}

function findSpEntityId(config: AppConfig, samlRequestB64: string): string | undefined {
  if (!samlRequestB64) return undefined;
  try {
    const buf = Buffer.from(samlRequestB64, "base64");
    let xml: string;
    try {
      xml = zlib.inflateRawSync(buf).toString("utf-8");
    } catch {
      xml = buf.toString("utf-8");
    }
    // Try to extract Issuer from the AuthnRequest
    const issuerMatch = xml.match(/<(?:saml[p2]?:)?Issuer[^>]*>([^<]+)<\//);
    if (issuerMatch) {
      const issuer = issuerMatch[1];
      const sp = config.serviceProviders.find((s) => s.entityId === issuer);
      if (sp) return sp.entityId;
    }
  } catch {
    // ignore parse errors
  }
  // Fallback: return first SP
  return config.serviceProviders.length > 0 ? config.serviceProviders[0].entityId : undefined;
}
