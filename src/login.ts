export function renderLoginPage(
  samlRequest: string,
  relayState: string,
  spEntityId: string,
  error?: string
): string {
  const errorHtml = error
    ? `<div style="color:#c0392b;margin-bottom:12px;font-weight:bold;">${escapeHtml(error)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JustSAML - Sign In</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
           background: #1a1a2e; color: #eee; display: flex; align-items: center;
           justify-content: center; min-height: 100vh; }
    .card { background: #16213e; border-radius: 12px; padding: 40px; width: 380px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
    h1 { font-size: 22px; margin-bottom: 6px; color: #e94560; }
    .sub { font-size: 13px; color: #888; margin-bottom: 24px; }
    label { display: block; font-size: 13px; margin-bottom: 4px; color: #aaa; }
    input[type="text"], input[type="password"] {
      width: 100%; padding: 10px 12px; border: 1px solid #333; border-radius: 6px;
      background: #0f3460; color: #eee; font-size: 14px; margin-bottom: 16px; }
    input:focus { outline: none; border-color: #e94560; }
    button { width: 100%; padding: 12px; border: none; border-radius: 6px;
             background: #e94560; color: #fff; font-size: 15px; font-weight: 600;
             cursor: pointer; transition: background 0.2s; }
    button:hover { background: #c0392b; }
    .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #555; }
  </style>
</head>
<body>
  <div class="card">
    <h1>JustSAML</h1>
    <div class="sub">Sign in to continue to <strong>${escapeHtml(spEntityId)}</strong></div>
    ${errorHtml}
    <form method="POST" action="/sso/login">
      <input type="hidden" name="SAMLRequest" value="${escapeAttr(samlRequest)}" />
      <input type="hidden" name="RelayState" value="${escapeAttr(relayState)}" />
      <input type="hidden" name="SPEntityId" value="${escapeAttr(spEntityId)}" />
      <label for="username">Username</label>
      <input type="text" id="username" name="username" autocomplete="username" required autofocus />
      <label for="password">Password</label>
      <input type="password" id="password" name="password" autocomplete="current-password" required />
      <button type="submit">Sign In</button>
    </form>
    <div class="footer">Lab-only SAML Identity Provider</div>
  </div>
</body>
</html>`;
}

export function renderAutoPostPage(acsUrl: string, samlResponse: string, relayState: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Redirecting...</title></head>
<body>
  <form id="samlForm" method="POST" action="${escapeAttr(acsUrl)}">
    <input type="hidden" name="SAMLResponse" value="${escapeAttr(samlResponse)}" />
    <input type="hidden" name="RelayState" value="${escapeAttr(relayState)}" />
    <noscript><button type="submit">Continue</button></noscript>
  </form>
  <script>document.getElementById("samlForm").submit();</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
