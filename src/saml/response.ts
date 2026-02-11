import { v4 as uuidv4 } from "uuid";
import { UserEntry, AppConfig, ServiceProvider } from "../config";

export interface SamlResponseParams {
  config: AppConfig;
  user: UserEntry;
  sp: ServiceProvider;
  inResponseTo?: string;
}

export function buildSamlResponse(params: SamlResponseParams): string {
  const { config, user, sp, inResponseTo } = params;
  const now = new Date();
  const notBefore = now.toISOString();
  const notAfter = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
  const issueInstant = now.toISOString();

  const responseId = `_${uuidv4()}`;
  const assertionId = `_${uuidv4()}`;

  const inResponseToAttr = inResponseTo
    ? ` InResponseTo="${inResponseTo}"`
    : "";

  const attributeStatements = user.attributes
    ? Object.entries(user.attributes)
        .map(
          ([name, value]) => `
        <saml:Attribute Name="${name}" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
          <saml:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">${value}</saml:AttributeValue>
        </saml:Attribute>`
        )
        .join("")
    : "";

  return `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                 xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                 ID="${responseId}"
                 Version="2.0"
                 IssueInstant="${issueInstant}"${inResponseToAttr}
                 Destination="${sp.acsUrl}">
  <saml:Issuer>${config.idp.entityId}</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success" />
  </samlp:Status>
  <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                  xmlns:xs="http://www.w3.org/2001/XMLSchema"
                  ID="${assertionId}"
                  Version="2.0"
                  IssueInstant="${issueInstant}">
    <saml:Issuer>${config.idp.entityId}</saml:Issuer>
    <saml:Subject>
      <saml:NameID Format="${config.idp.nameIdFormat}">${user.email}</saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData${inResponseToAttr}
                                      NotOnOrAfter="${notAfter}"
                                      Recipient="${sp.acsUrl}" />
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="${notBefore}" NotOnOrAfter="${notAfter}">
      <saml:AudienceRestriction>
        <saml:Audience>${sp.entityId}</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement AuthnInstant="${issueInstant}" SessionIndex="${assertionId}">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>${attributeStatements}
      <saml:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">${user.email}</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`;
}
