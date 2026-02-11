import * as fs from "fs";
import * as path from "path";

export interface UserEntry {
  username: string;
  password: string;
  email: string;
  attributes?: Record<string, string>;
}

export interface ServiceProvider {
  entityId: string;
  acsUrl: string;
  allowUnsolicited?: boolean;
}

export interface IdpConfig {
  entityId: string;
  signingCert: string;
  signingKey: string;
  nameIdFormat: string;
}

export interface ServerConfig {
  port: number;
  baseUrl: string;
  tls: {
    cert: string;
    key: string;
  };
}

export interface AppConfig {
  idp: IdpConfig;
  server: ServerConfig;
  users: UserEntry[];
  serviceProviders: ServiceProvider[];
}

const DEFAULT_CONFIG: AppConfig = {
  idp: {
    entityId: "https://localhost:8443/metadata",
    signingCert: "./certs/idp.crt",
    signingKey: "./certs/idp.key",
    nameIdFormat:
      "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  },
  server: {
    port: 8443,
    baseUrl: "https://localhost:8443",
    tls: {
      cert: "./certs/server.crt",
      key: "./certs/server.key",
    },
  },
  users: [
    {
      username: "alice",
      password: "alice",
      email: "alice@example.com",
      attributes: { role: "admin" },
    },
    {
      username: "bob",
      password: "bob",
      email: "bob@example.com",
      attributes: { role: "user" },
    },
  ],
  serviceProviders: [
    {
      entityId: "https://my-app.example.com",
      acsUrl: "https://my-app.example.com/saml/acs",
      allowUnsolicited: true,
    },
  ],
};

export function writeDefaultConfig(configPath: string): void {
  fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
}

export function loadConfig(configPath: string): AppConfig {
  const raw = fs.readFileSync(configPath, "utf-8");
  const config: AppConfig = JSON.parse(raw);

  const baseDir = path.dirname(path.resolve(configPath));
  const resolve = (p: string) =>
    path.isAbsolute(p) ? p : path.resolve(baseDir, p);

  config.idp.signingCert = resolve(config.idp.signingCert);
  config.idp.signingKey = resolve(config.idp.signingKey);
  config.server.tls.cert = resolve(config.server.tls.cert);
  config.server.tls.key = resolve(config.server.tls.key);

  return config;
}
