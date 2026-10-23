import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Сборка для GitHub Pages: статический экспорт в папку out/ с префиксом /mediakomi.
// Включается переменной GITHUB_PAGES=true (см. .github/workflows/pages.yml).
const isPages = process.env.GITHUB_PAGES === "true";
const basePath = isPages ? (process.env.PAGES_BASE_PATH ?? "/mediakomi") : "";

// Строгий CSP: в продакшене страница не содержит inline-скриптов (Pages Router),
// поэтому script-src 'self' без nonce. В dev Next нужны eval и HMR по websocket.
const csp = [
  "default-src 'self'",
  `script-src 'self'${isDev ? " 'unsafe-eval' 'unsafe-inline'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    MK_BASE_PATH: basePath,
    MK_STATIC_EXPORT: isPages ? "1" : "",
  },
  ...(isPages
    ? { output: "export" as const, basePath, trailingSlash: true }
    : {
        async headers() {
          return [{ source: "/:path*", headers: securityHeaders }];
        },
      }),
};

export default nextConfig;
