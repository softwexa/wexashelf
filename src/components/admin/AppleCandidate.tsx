"use client";
import {useI18n} from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";
import { Apple, ArrowUpRight, Download, Search } from "lucide-react";

type CandidateResult = {
  id: string;
  country: string;
  source: string;
  candidate: Record<string, unknown>;
  note: string;
};
export default function AppleCandidate() {
 const {t,intlLocale}=useI18n();

  const [id, setId] = useState("");
  const [country, setCountry] = useState("TR");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CandidateResult | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function fetchCandidate(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setResult(null);
    if (!/^\d{1,15}$/.test(id.trim()) || !/^[a-zA-Z]{2}$/.test(country)) {
      setError(t("Sayısal Apple kimliği ve iki harfli ülke kodu girin."));
      return;
    }
    setBusy(true);
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/admin/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id.trim(), country: country.toUpperCase() }),
        signal: controller.signal,
      });
      const value = await response.json();
      if (!response.ok)
        throw new Error(value.error || "Apple kaynağı okunamadı.");
      if (
        !value.candidate ||
        typeof value.candidate.name !== "string" ||
        typeof value.candidate.description !== "string" ||
        typeof value.source !== "string"
      )
        throw new Error("Apple aday yanıtı beklenen biçimde değil.");
      const source = new URL(value.source);
      if (
        source.protocol !== "https:" ||
        source.hostname !== "itunes.apple.com" ||
        source.username ||
        source.password
      )
        throw new Error("Apple kaynak adresi doğrulanamadı.");
      setResult({
        id: id.trim(),
        country: country.toUpperCase(),
        source: source.href,
        candidate: value.candidate,
        note:
          typeof value.note === "string"
            ? value.note
            : "Kaynak adayıdır; editör incelemesi gerekir.",
      });
    } catch (caught) {
      if (controller.signal.aborted)
        setError(t("İstek zaman aşımına uğradı. Yeniden deneyebilirsiniz."));
      else
        setError(
          caught instanceof Error ? caught.message : "Apple kaynağı okunamadı.",
        );
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
      request.current = null;
    }
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              source: result.source,
              candidate: result.candidate,
              note: result.note,
            },
            null,
            2,
          ) + "\n",
        ],
        { type: "application/json" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `apple-${result.id}-${result.country.toLowerCase()}-aday.json`;
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
  return (
    <section className="admin-panel admin-apple-candidate">
      <div className="admin-panel-heading">
        <div>
          <span className="admin-kicker">{t("Apple resmî kaynak adayı")}</span>
          <h2>{t("Mağaza bilgisinden başla.")}</h2>
        </div>
        <Apple size={25} />
      </div>
      <p>{t("App Store bağlantısındaki sayısal kimliği ve ülkeyi girin. Getirilen bilgiler yalnız önizlenir; kataloğa kaydedilmez ve otomatik yayımlanmaz.")}</p>
      <form
        className="admin-apple-form"
        onSubmit={(event) => void fetchCandidate(event)}
      >
        <label className="admin-field">
          <span>{t("Apple uygulama kimliği")}</span>
          <input
            value={id}
            inputMode="numeric"
            pattern="[0-9]{1,15}"
            maxLength={15}
            placeholder={t("Örnek: 1232780281")}
            required
            disabled={busy}
            onChange={(event) => setId(event.target.value)}
          />
        </label>
        <label className="admin-field">
          <span>{t("Apple mağaza ülkesi")}</span>
          <input
            value={country}
            maxLength={2}
            pattern="[A-Za-z]{2}"
            autoCapitalize="characters"
            required
            disabled={busy}
            onChange={(event) => setCountry(event.target.value.toUpperCase())}
          />
        </label>
        <button type="submit" className="admin-button" disabled={busy}>
          <Search size={15} />
          {busy ? t("Kaynak getiriliyor…") : t("Apple adayını getir")}
        </button>
      </form>
      {busy && <p role="status">{t("Apple kaynağı sorgulanıyor…")}</p>}
      {error && (
        <p className="admin-error" role="alert">
          {t(error)}
        </p>
      )}
      {result && (
        <div className="admin-apple-result">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-kicker">{t("Salt okunur önizleme ·")}{" "}{result.country}
              </span>
              <h3>{String(result.candidate.name)}</h3>
            </div>
            <span className="admin-badge">{t("Kaydedilmedi")}</span>
          </div>
          <dl>
            <div>
              <dt>{t("Yayıncı")}</dt>
              <dd>
                {typeof result.candidate.publisher === "string" &&
                result.candidate.publisher
                  ? result.candidate.publisher
                  : t("Kaynakta belirtilmedi")}
              </dd>
            </div>
            <div>
              <dt>{t("Kaynak")}</dt>
              <dd>
                <a
                  href={result.source}
                  target="_blank"
                  rel="noopener noreferrer"
                >{t("Apple kaynak yanıtı")}<ArrowUpRight size={13} />
                </a>
              </dd>
            </div>
          </dl>
          <div className="admin-apple-description">
            <h4>{t("Mağaza açıklaması")}</h4>
            <p>{String(result.candidate.description)}</p>
          </div>
          <p className="admin-apple-note">
            {result.note}{" "}{t("Bu JSON, doğrudan içe aktarılabilecek tam kayıt değildir. İçerikler bölümünde kimlik, yerel ikon, kategori ve kaynak alanlarını tamamlayıp inceleyin.")}</p>
          <button type="button" className="admin-button" onClick={download}>
            <Download size={15} />{t("Apple aday JSON dosyasını indir")}</button>
        </div>
      )}
    </section>
  );
}
