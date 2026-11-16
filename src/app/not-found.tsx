import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <span>404</span>
      <h1>Bu yol burada bitiyor.</h1>
      <p>
        Aradığın sayfa bulunamadı. Yeni bir uygulama keşfederek devam
        edebilirsin.
      </p>
      <Link href="/" className="button button-primary">
        Keşfetmeye dön
      </Link>
    </main>
  );
}
