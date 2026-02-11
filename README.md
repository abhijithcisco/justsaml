# JustSAML

The simplest SAML Identity Provider (IdP) for lab and testing purposes.

## Features

- **Single config file** — users, SPs, and certs all in `config.json`
- **HTTPS** — built-in TLS with self-signed certificate generation
- **Certificate signing** — SAML assertions signed with X.509 certificates
- **Cross-platform** — runs on Windows, macOS, and Linux
- **Zero database** — everything lives in config
- **SP-initiated & IdP-initiated SSO**

## Prerequisites

- **Node.js** (v18 or later) — [Download from nodejs.org](https://nodejs.org/)
  - npm comes bundled with Node.js, no separate install needed
  - Verify installation: `node -v && npm -v`

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Generate self-signed certs + default config (optional — see note below)
npm run init-certs

# Start the IdP
npm start
```

The server starts at the `baseUrl` configured in `config.json` (default: **https://localhost:8443**).

> **Tip:** `npm run init-certs` is only needed to generate self-signed certificates and a default `config.json`. If you already have your own certificates and a manually created `config.json`, you can skip it and go straight to `npm start`.

## Endpoints

| Method     | Path           | Description                              |
|------------|----------------|------------------------------------------|
| `GET`      | `/metadata`    | IdP metadata XML                         |
| `GET/POST` | `/sso`        | SSO endpoint (receives SAMLRequest)      |
| `GET`      | `/sso/idp-init`| IdP-initiated login (`?sp=<entityId>`)  |
| `POST`     | `/sso/login`   | Processes login form                     |
| `GET`      | `/health`      | Health check                             |

## Configuration

Edit `config.json` after running `init`:

```json
{
  "idp": {
    "entityId": "https://localhost:8443/metadata",
    "signingCert": "./certs/idp.crt",
    "signingKey": "./certs/idp.key",
    "nameIdFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
  },
  "server": {
    "port": 8443,
    "baseUrl": "https://localhost:8443",
    "tls": {
      "cert": "./certs/server.crt",
      "key": "./certs/server.key"
    }
  },
  "users": [
    {
      "username": "alice",
      "password": "alice",
      "email": "alice@example.com",
      "attributes": { "role": "admin" }
    }
  ],
  "serviceProviders": [
    {
      "entityId": "https://my-app.example.com",
      "acsUrl": "https://my-app.example.com/saml/acs",
      "allowUnsolicited": true
    }
  ]
}
```

> **Note:** `baseUrl` defaults to `https://localhost:8443`. Change it to your machine's IP or hostname (e.g. `https://192.168.1.26:8443`) if the IdP needs to be reachable from other devices on the network. Update `idp.entityId` accordingly.

## Integrating with a Service Provider

1. Point your SP's IdP metadata URL to `<baseUrl>/metadata`
2. Or manually configure:
   - **SSO URL**: `<baseUrl>/sso`
   - **Entity ID**: `<baseUrl>/metadata`
   - **Certificate**: contents of `certs/idp.crt`
3. Add your SP's entity ID and ACS URL to `config.json`
4. Restart JustSAML

## CLI Usage

```bash
# Using npm scripts
npm run init-certs    # Generate certs + default config
npm start             # Start server

# Using the CLI directly (after npm link or global install)
justsaml init         # Generate certs + default config
justsaml start        # Start server
justsaml help         # Show help

# Custom config path
justsaml start --config /path/to/config.json
```

## License

MIT
