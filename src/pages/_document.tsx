import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ru">
      <Head>
        <meta
          name="description"
          content="Медиакоми — симулятор покупателя: угадайте цену квартиры в Инте по фото из настоящего объявления."
        />
        <meta name="theme-color" content="#4b0082" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
