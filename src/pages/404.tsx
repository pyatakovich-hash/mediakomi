import Head from "next/head";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Страница не найдена — Медиакоми</title>
      </Head>
      <div className="mx-auto flex h-dvh max-w-md flex-col justify-center px-3">
        <main className="rounded-[28px] bg-white px-6 py-8">
          <h1 className="text-3xl font-black text-night">Такой страницы нет</h1>
          <p className="mt-2 text-mist">Игра живёт на главной странице.</p>
          <Link href="/" className="btn-primary mt-6 grid place-items-center">
            Перейти к игре
          </Link>
        </main>
      </div>
    </>
  );
}
