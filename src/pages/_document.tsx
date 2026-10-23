import { Head, Html, Main, NextScript } from "next/document";
import { IS_STATIC_EXPORT, withBase } from "@/config";

// На GitHub Pages нельзя задать HTTP-заголовки, поэтому CSP и Referrer-Policy
// дублируем meta-тегами (frame-ancestors в meta не работает и не указывается).
const CSP_META = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export default function Document() {
  return (
    <Html lang="ru">
      <Head>
        {IS_STATIC_EXPORT && (
          <>
            <meta httpEquiv="Content-Security-Policy" content={CSP_META} />
            <meta name="referrer" content="strict-origin-when-cross-origin" />
          </>
        )}
        <meta
          name="description"
          content="Медиакоми — симулятор покупателя: угадайте цену квартиры в Инте по фото из настоящего объявления."
        />
        <meta name="theme-color" content="#4b0082" />
        <link rel="icon" href={withBase("/favicon.svg")} type="image/svg+xml" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
