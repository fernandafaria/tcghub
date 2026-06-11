"use client";

import { useState, useRef, useCallback } from "react";
import { identifyCard, fileToDataUrl, compressImage, gradeLabel } from "@/lib/vision";
import { fmt0 } from "@/components/ui";
import {
  IconSearch,
  IconCheck,
  IconPlus,
  IconTrash,
  IconCart,
  IconTag,
  IconCards,
  IconShield,
  IconSpark,
  IconUp,
} from "@/components/icons";
import type { VisionScanResult, VisionCardIdentification, ApiCard } from "@/types";

// ─── Props ──────────────────────────────────────────────────────────────────

interface CameraScannerProps {
  onAddToCollection?: (card: ApiCard | null, identification: VisionCardIdentification | null) => void;
  onAddToBuylist?: (card: ApiCard | null, identification: VisionCardIdentification | null) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CameraScanner({ onAddToCollection, onAddToBuylist }: CameraScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<VisionScanResult | null>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  // ─── File selection ─────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    setError("");
    setScanning(true);
    setResult(null);

    try {
      // Read + compress
      let dataUrl = await fileToDataUrl(file);
      dataUrl = await compressImage(dataUrl);

      // Set preview immediately
      setResult({
        imageDataUrl: dataUrl,
        identification: null,
        card: null,
        graded: null,
        found: false,
        creditsUsedBrl: "0",
        status: "scanning",
      });

      // Call Vision API
      const response = await identifyCard(dataUrl);

      setResult({
        imageDataUrl: dataUrl,
        identification: response.identification,
        card: response.card,
        graded: response.graded,
        found: response.found,
        creditsUsedBrl: response.credits_used_brl,
        status: response.found ? "success" : "failed",
        error: response.error,
      });
    } catch (err: any) {
      setError(err.message || "Erro ao escanear carta");
      setResult((prev) =>
        prev
          ? { ...prev, status: "failed", error: err.message }
          : null
      );
    } finally {
      setScanning(false);
    }
  }, []);

  const handleCameraCapture = () => fileInputRef.current?.click();

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) handleFile(file);
    },
    [handleFile]
  );

  const reset = () => {
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Capture area ───────────────────────────────────────────────── */}
      {(!result || result.status === "scanning") && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="card card-pad"
          style={{
            border: "2px dashed var(--gold-bd)",
            borderRadius: "var(--r-lg)",
            textAlign: "center",
            padding: "48px 24px",
            cursor: "pointer",
            background: scanning
              ? "var(--gold-bg)"
              : "var(--surface)",
            transition: "background 0.2s",
          }}
          onClick={!scanning ? handleCameraCapture : undefined}
        >
          {scanning ? (
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  margin: "0 auto 16px",
                  border: "3px solid var(--gold)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p style={{ fontWeight: 600, fontSize: 15, color: "var(--gold-2)" }}>
                Identificando carta...
              </p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                Enviando imagem para o Scrydex Vision
              </p>
              {result?.imageDataUrl && (
                <img
                  src={result.imageDataUrl}
                  alt="Preview"
                  style={{
                    maxWidth: 200,
                    maxHeight: 280,
                    margin: "16px auto 0",
                    borderRadius: "var(--r-sm)",
                    border: "1px solid var(--gold-bd)",
                    display: "block",
                  }}
                />
              )}
            </div>
          ) : (
            <div>
              <div
                style={{
                  width: 64,
                  height: 64,
                  margin: "0 auto 16px",
                  borderRadius: "50%",
                  background: "var(--gold-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--gold)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                Escanear carta
              </p>
              <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 320, margin: "0 auto" }}>
                Toque para tirar uma foto da carta. Funciona com qualquer TCG e detecta cartas graded (PSA, BGS, CGC, TAG).
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  marginTop: 10,
                  fontFamily: "var(--fmono)",
                }}
              >
                R$0,25 por scan · 5 créditos
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            style={{ display: "none" }}
          />
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--down-bg)",
            border: "1px solid var(--down)",
            borderRadius: "var(--r-sm)",
            color: "var(--down)",
            fontSize: 13,
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{error}</span>
          <button onClick={reset} style={{ color: "var(--down)", fontWeight: 600, fontSize: 13 }}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* ── Result ────────────────────────────────────────────────────────── */}
      {result && result.status === "success" && result.identification && (
        <div style={{ marginTop: 24 }}>
          <ResultCard
            result={result}
            onReset={reset}
            onAddToCollection={onAddToCollection}
            onAddToBuylist={onAddToBuylist}
          />
        </div>
      )}

      {result && result.status === "failed" && !scanning && (
        <div style={{ marginTop: 24 }}>
          <div
            className="card card-pad"
            style={{ textAlign: "center", borderColor: "var(--down-bd)" }}
          >
            <p style={{ fontWeight: 600, color: "var(--down)", marginBottom: 8 }}>
              Não foi possível identificar a carta
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              {result.error || "Tente novamente com uma foto mais nítida e bem iluminada."}
            </p>
            {result.imageDataUrl && (
              <img
                src={result.imageDataUrl}
                alt="Foto enviada"
                style={{
                  maxWidth: 150,
                  maxHeight: 210,
                  margin: "0 auto 16px",
                  borderRadius: "var(--r-sm)",
                  border: "1px solid var(--down-bd)",
                  display: "block",
                  opacity: 0.6,
                }}
              />
            )}
            <button className="btn btn-gold" onClick={reset}>
              <IconSpark /> Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Spinner keyframe */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Result Card ────────────────────────────────────────────────────────────

function ResultCard({
  result,
  onReset,
  onAddToCollection,
  onAddToBuylist,
}: {
  result: VisionScanResult;
  onReset: () => void;
  onAddToCollection?: (card: ApiCard | null, identification: VisionCardIdentification | null) => void;
  onAddToBuylist?: (card: ApiCard | null, identification: VisionCardIdentification | null) => void;
}) {
  const { identification, card, graded, imageDataUrl } = result;
  if (!identification) return null;

  const hasGraded = identification.is_graded && graded?.company;

  return (
    <div className="card card-pad" style={{ borderColor: "var(--teal-bd)" }}>
      {/* Header */}
      <div className="row between" style={{ marginBottom: 16 }}>
        <div className="row center gap-8">
          <IconCheck />
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--teal)" }}>
            Carta identificada
          </span>
          {hasGraded && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                background: "var(--gold-bg)",
                color: "var(--gold-2)",
                border: "1px solid var(--gold-bd)",
              }}
            >
              {graded!.company} {graded!.grade}
            </span>
          )}
        </div>
        <button onClick={onReset} style={{ fontSize: 13, color: "var(--muted)" }}>
          Escanear outra
        </button>
      </div>

      {/* Card info row */}
      <div className="row gap-16" style={{ flexWrap: "wrap" }}>
        {/* Image */}
        <div style={{ flex: "0 0 auto" }}>
          {card?.image_url ? (
            <img
              src={card.image_url}
              alt={identification.card_name}
              style={{
                width: 140,
                height: "auto",
                borderRadius: "var(--r-sm)",
                border: "1px solid var(--border)",
              }}
            />
          ) : imageDataUrl ? (
            <img
              src={imageDataUrl}
              alt="Foto escaneada"
              style={{
                width: 140,
                height: "auto",
                borderRadius: "var(--r-sm)",
                border: "1px solid var(--border)",
              }}
            />
          ) : null}
        </div>

        {/* Details */}
        <div className="col gap-6" style={{ flex: 1, minWidth: 200 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
              }}
            >
              {identification.game_id}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--fdisplay)" }}>
              {identification.card_name}
            </h3>
            {identification.card_version && (
              <p style={{ fontSize: 14, color: "var(--text-2)" }}>
                {identification.card_version}
              </p>
            )}
          </div>

          <div className="row center gap-6" style={{ flexWrap: "wrap" }}>
            <Tag variant="neutral">
              {identification.set_code} · #{identification.collector_number}
            </Tag>
            <Tag variant="neutral">{identification.rarity}</Tag>
            {identification.variant !== "normal" && (
              <Tag variant="gold">{variantLabel(identification.variant)}</Tag>
            )}
            {identification.confidence_pct > 0 && (
              <Tag variant="teal">
                {identification.confidence_pct}% match
              </Tag>
            )}
          </div>

          {/* Price if available */}
          {card && (card.price_brl_mid || card.price_brl_low) && (
            <div className="row center gap-8" style={{ marginTop: 4 }}>
              <span
                className="mono"
                style={{ fontWeight: 700, fontSize: 20, color: "var(--gold-2)" }}
              >
                {fmt0(card.price_brl_mid || card.price_brl_low || 0)}
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                {card.price_brl_source ? `via ${card.price_brl_source}` : "preço médio"}
              </span>
            </div>
          )}

          {/* Graded slab details */}
          {hasGraded && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 12px",
                background: "var(--gold-bg)",
                borderRadius: "var(--r-sm)",
                border: "1px solid var(--gold-bd)",
              }}
            >
              <div className="row center gap-6" style={{ flexWrap: "wrap" }}>
                <IconShield />
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  {graded!.company} {graded!.grade}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                  {gradeLabel(graded!.grade || "")}
                </span>
              </div>
              {graded!.cert_number && (
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  Cert: {graded!.cert_number}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="row gap-8" style={{ marginTop: 12 }}>
            {onAddToCollection && (
              <button
                className="btn btn-teal btn-sm"
                onClick={() => onAddToCollection(card, identification)}
              >
                <IconCards /> Adicionar à coleção
              </button>
            )}
            {onAddToBuylist && (
              <button
                className="btn btn-gold btn-sm"
                onClick={() => onAddToBuylist(card, identification)}
              >
                <IconCart /> Vender
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scan meta */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: "1px solid var(--border)",
          fontSize: 11,
          color: "var(--muted)",
          display: "flex",
          gap: 16,
        }}
      >
        <span>Créditos usados: R$ {result.creditsUsedBrl}</span>
        {identification.notes && <span>{identification.notes}</span>}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function Tag({
  variant = "neutral",
  children,
}: {
  variant?: "neutral" | "gold" | "teal";
  children: React.ReactNode;
}) {
  const colors: Record<string, { bg: string; fg: string; bd: string }> = {
    neutral: { bg: "var(--bg-2)", fg: "var(--text-2)", bd: "var(--border)" },
    gold: { bg: "var(--gold-bg)", fg: "var(--gold-2)", bd: "var(--gold-bd)" },
    teal: { bg: "var(--teal-bg)", fg: "var(--teal)", bd: "var(--teal-bd)" },
  };
  const c = colors[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.bd}`,
      }}
    >
      {children}
    </span>
  );
}

function variantLabel(v: string): string {
  const map: Record<string, string> = {
    foil: "Foil",
    cold_foil: "Cold Foil",
    holo: "Holo",
    reverse_holo: "Reverse Holo",
    promo: "Promo",
    enchanted: "Enchanted",
    first_edition: "1st Ed",
  };
  return map[v] || v;
}
