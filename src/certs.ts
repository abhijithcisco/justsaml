import * as fs from "fs";
import * as path from "path";
import selfsigned from "selfsigned";

export interface CertPair {
  cert: string;
  key: string;
}

function generateCert(commonName: string, days: number = 365): CertPair {
  const attrs = [{ name: "commonName", value: commonName }];
  const opts = {
    keySize: 2048,
    days,
    algorithm: "sha256",
  };
  const pems = selfsigned.generate(attrs, opts);
  return { cert: pems.cert, key: pems.private };
}

export function initCerts(certsDir: string): void {
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  const idpCertPath = path.join(certsDir, "idp.crt");
  const idpKeyPath = path.join(certsDir, "idp.key");
  const serverCertPath = path.join(certsDir, "server.crt");
  const serverKeyPath = path.join(certsDir, "server.key");

  if (!fs.existsSync(idpCertPath)) {
    console.log("Generating IdP signing certificate...");
    const idp = generateCert("JustSAML IdP");
    fs.writeFileSync(idpCertPath, idp.cert, "utf-8");
    fs.writeFileSync(idpKeyPath, idp.key, "utf-8");
    console.log(`  -> ${idpCertPath}`);
    console.log(`  -> ${idpKeyPath}`);
  } else {
    console.log("IdP signing certificate already exists, skipping.");
  }

  if (!fs.existsSync(serverCertPath)) {
    console.log("Generating TLS server certificate...");
    const server = generateCert("localhost");
    fs.writeFileSync(serverCertPath, server.cert, "utf-8");
    fs.writeFileSync(serverKeyPath, server.key, "utf-8");
    console.log(`  -> ${serverCertPath}`);
    console.log(`  -> ${serverKeyPath}`);
  } else {
    console.log("TLS server certificate already exists, skipping.");
  }
}
