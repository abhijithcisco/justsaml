import * as fs from "fs";
import { SignedXml } from "xml-crypto";

export function signSamlResponse(xml: string, privateKeyPath: string, certPath: string): string {
  const privateKey = fs.readFileSync(privateKeyPath, "utf-8");
  const publicCert = fs.readFileSync(certPath, "utf-8");

  const sigOpts = {
    privateKey,
    publicCert,
    canonicalizationAlgorithm: "http://www.w3.org/2001/10/xml-exc-c14n#",
    signatureAlgorithm: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
    getKeyInfoContent: SignedXml.getKeyInfoContent,
  };

  // Step 1: Sign the Assertion
  const assertionSig = new SignedXml(sigOpts);
  assertionSig.addReference({
    xpath: "//*[local-name(.)='Assertion']",
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/2001/10/xml-exc-c14n#",
    ],
    digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
  });
  assertionSig.computeSignature(xml, {
    location: {
      reference: "//*[local-name(.)='Assertion']/*[local-name(.)='Issuer']",
      action: "after",
    },
  });
  const assertionSignedXml = assertionSig.getSignedXml();

  // Step 2: Sign the Response
  const responseSig = new SignedXml(sigOpts);
  responseSig.addReference({
    xpath: "//*[local-name(.)='Response']",
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/2001/10/xml-exc-c14n#",
    ],
    digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
  });
  responseSig.computeSignature(assertionSignedXml, {
    location: {
      reference: "//*[local-name(.)='Response']/*[local-name(.)='Issuer']",
      action: "after",
    },
  });

  return responseSig.getSignedXml();
}
