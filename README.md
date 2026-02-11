# JustSAML

The simplest SAML Identity Provider (IdP) for lab and testing purposes.

## Features

- **Single config file** — users, SPs, and certs all in `config.json`
- **HTTPS** — built-in TLS with self-signed certificate generation
- **Certificate signing** — SAML assertions signed with X.509 certificates
- **Cross-platform** — runs on Windows, macOS, and Linux
- **Zero database** — everything lives in config
- **SP-initiated & IdP-initiated SSO**

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Generate certs + default config
npm run init-certs

# Start the IdP
npm start
```

The server starts at **https://localhost:8443**.

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

## Integrating with a Service Provider

1. Point your SP's IdP metadata URL to `https://localhost:8443/metadata`
2. Or manually configure:
   - **SSO URL**: `https://localhost:8443/sso`
   - **Entity ID**: `https://localhost:8443/metadata`
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
