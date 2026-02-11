import * as fs from "fs";
import * as https from "https";
import { loadConfig, AppConfig } from "./config";
import { createRequestHandler } from "./server";

export function startServer(configPath: string): void {
  const config: AppConfig = loadConfig(configPath);
  const handler = createRequestHandler(config);

  const tlsOptions = {
    key: fs.readFileSync(config.server.tls.key, "utf-8"),
    cert: fs.readFileSync(config.server.tls.cert, "utf-8"),
  };

  https.createServer(tlsOptions, handler).listen(config.server.port, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║            JustSAML IdP Running              ║
╠══════════════════════════════════════════════╣
║  URL:      https://localhost:${String(config.server.port).padEnd(16)}║
║  Metadata: https://localhost:${String(config.server.port).padEnd(1)}/metadata  ║
║  Users:    ${String(config.users.length).padEnd(34)}║
║  SPs:      ${String(config.serviceProviders.length).padEnd(34)}║
╚══════════════════════════════════════════════╝
`);
  });
}
