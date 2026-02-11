import * as fs from "fs";
import { SignedXml } from "xml-crypto";

export function signSamlResponse(xml: string, privateKeyPath: string, certPath: string): string {
  const privateKey = fs.readFileSync(privateKeyPath, "utf-8");
  const publicCert = fs.readFileSync(certPath, "utf-8");

  const sig = new SignedXml({
    privateKey,
    publicCert,
    canonicalizationAlgorithm: "http://www.w3.org/2001/10/xml-exc-c14n#",
    signatureAlgorithm: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
    getKeyInfoContent: SignedXml.getKeyInfoContent,
  });

  sig.addReference({
    xpath: "//*[local-name(.)='Assertion']",
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/2001/10/xml-exc-c14n#",
    ],
    digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
  });

  sig.computeSignature(xml, {
    location: {
      reference: "//*[local-name(.)='Issuer']",
      action: "after",
    },
  });

  return sig.getSignedXml();
}
