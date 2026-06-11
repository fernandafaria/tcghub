"use client";

import { useState, useRef, useCallback } from "react";
import type {
  BatchScanResponse,
  BatchCardResult,
  ApiCard,
} from "@/types";
import { batchIdentify, fileToDataUrl, compressImage, gradeLabel } from "@/lib/vision";
import { IconSpark, IconPlus, IconMinus, IconCheck, IconCart, IconSearch } from "@/components/icons";
import { TagUI, fmt0 } from "@/components/ui";

interface Props {
  onAddToCollection?: (card: ApiCard | null, quantity: number) => void;
  onAddToBuylist?: (cards: BatchCardResult[]) => void;
}

type BatchStatus = "idle" | "scanning" | "success" | "failed";

export default function BatchScanner({ onAddToCollection, onAddToBuylist }: Props) {
  // Photo capture
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  // Batch state
  const [status, setStatus] = useState<BatchStatus>("idle");
  const [result, setResult] = useState<BatchScanResponse | null>(null);
  const [error, setError] = useState("");
  const [verifyGraded, setVerifyGraded] = useState(false);

  // Per-card quantities
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  // ─── Capture photo ──────────────────────────────────────────────────────

  const handleFilePick = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setResult(null);
      const dataUrl = await fileToDataUrl(file);
      const compressed = await compressImage(dataUrl, 2048, 0.85);
      setImageDataUrl(compressed);
      setImageUrl(URL.createObjectURL(file));
    } catch {
      setError("Erro ao carregar imagem. Tente novamente.");
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    try {
      setError("");
      setResult(null);
      const dataUrl = await fileToDataUrl(file);
      const compressed = await compressImage(dataUrl, 2048, 0.85);
      setImageDataUrl(compressed);
      setImageUrl(URL.createObjectURL(file));
    } catch {
      setError("Erro ao carregar imagem.");
    }
  }, []);

  // ─── Execute batch scan ─────────────────────────────────────────────────

  const handleBatchScan = async () => {
    if (!imageDataUrl) return;
    setStatus("scanning");
    setError("");

    try {
      const res = await batchIdentify(imageDataUrl, {
        verify_graded: verifyGraded,
      });

      setResult(res);

      // Initialize quantities (1 per card) and selected (all selected)
      const qty: Record<number, number> = {};
      const sel: Record<number, boolean> = {};
      res.cards.forEach((_, idx) => {
        qty[idx] = 1;
        sel[idx] = true;
      });
      setQuantities(qty);
      setSelected(sel);

      setStatus(res.meta.total_cards > 0 ? "success" : "failed");
      if (res.meta.total_cards === 0) {
        setError("Nenhuma carta identificada. Tente melhor iluminação ou reenquadre.");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao escanear binder");
      setStatus("failed");
    }
  };

  // ─── Quantity / selection helpers ────────────────────────────────────────

  const updateQty = (idx: number, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [idx]: Math.max(1, (prev[idx] || 1) + delta),
    }));
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const selectAll = () => {
    const all: Record<number, boolean> = {};
    result?.cards.forEach((_, idx) => {
      all[idx] = true;
    });
    setSelected(all);
  };

  const deselectAll = () => {
    setSelected({});
  };

  // ─── Import actions ──────────────────────────────────────────────────────

  const handleImportAll = () => {
    if (!result) return;
    const selectedCards = result.cards
      .filter((_, idx) => selected[idx])
      .map((c) => c);

    if (selectedCards.length === 0) return;

    if (onAddToBuylist) {
      onAddToBuylist(selectedCards);
    } else {
      // Default: add to collection with quantities
      selectedCards.forEach((c) => {
        const qty = quantities[result.cards.indexOf(c)] || 1;
        onAddToCollection?.(c.card, qty);
      });
    }
  };

  const reset = () => {
    setStatus("idle");
    setImageUrl(null);
    setImageDataUrl(null);
    setResult(null);
    setError("");
    setVerifyGraded(false);
  };

  // ─── Computed ────────────────────────────────────────────────────────────

  const selectedCount = result
    ? result.cards.filter((_, idx) => selected[idx]).length
    : 0;
  const totalQty = result
    ? result.cards
        .filter((_, idx) => selected[idx])
        .reduce((sum, _, idx) => sum + (quantities[idx] || 1), 0)
    : 0;

  const gradedCount = result?.meta?.graded_cards || 0;
  const verifiedCount = result?.meta?.verified_graded_cards || 0;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Step 1: Capture binder page photo */}
      {status === "idle" && !imageUrl && (
        <div
          className="card card-pad"
          style={{
            textAlign: "center",
            cursor: "pointer",
            border: "2px dashed var(--gold-bd)",
            minHeight: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <IconSpark />
          <div>
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
              Escanear binder / página
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              Tire uma foto da página do seu binder com até 9-12 cartas.
            </p>
            <p style={{ fontSize: 12, color: "var(--gold)", marginTop: 4 }}>
              R$0,01 por página • Identifica todas as cartas de uma vez
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFilePick}
            style={{ display: "none" }}
          />
        </div>
      )}

      {/* Step 2: Preview + batch options */}
      {imageUrl && (status === "idle" || status === "failed") && (
        <div className="col gap-16">
          {/* Preview */}
          <div className="card card-pad" style={{ textAlign: "center" }}>
            <img
              src={imageUrl}
              alt="Binder page preview"
              style={{
                maxWidth: "100%",
                maxHeight: 400,
                borderRadius: "var(--r-sm)",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Options */}
          <div className="row center" style={{ gap: 12, flexWrap: "wrap" }}>
            <label className="row center" style={{ gap: 6, cursor: "pointer", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={verifyGraded}
                onChange={(e) => setVerifyGraded(e.target.checked)}
              />
              Verificar cartas slabadas (R$0.25/carta extra)
            </label>
          </div>

          {/* Actions */}
          <div className="row center" style={{ gap: 12 }}>
            <button className="btn btn-gold btn-lg" onClick={handleBatchScan}>
              <IconSpark /> Escanear binder
            </button>
            <button className="btn btn-sm" onClick={reset} style={{ color: "var(--muted)" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Scanning */}
      {status === "scanning" && (
        <div className="card card-pad" style={{ textAlign: "center", padding: 48 }}>
          <IconSpark />
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 16, color: "var(--gold)" }}>
            Identificando cartas...
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            Claude Vision analisando a binder page
          </p>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Scanning"
              style={{
                maxWidth: 200,
                maxHeight: 280,
                marginTop: 16,
                borderRadius: "var(--r-sm)",
                opacity: 0.6,
              }}
            />
          )}
        </div>
      )}

      {/* Results */}
      {status === "success" && result && (
        <div>
          {/* Meta bar */}
          <div className="row between" style={{ marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
            <div className="row center" style={{ gap: 16 }}>
              <div>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Cartas</span>
                <p style={{ fontWeight: 600, fontSize: 18 }}>
                  {result.meta.found_cards}/{result.meta.total_cards}
                </p>
              </div>
              {gradedCount > 0 && (
                <div>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Slabadas</span>
                  <p style={{ fontWeight: 600, fontSize: 18 }}>
                    {verifiedCount}/{gradedCount}
                    <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 4 }}>
                      verificadas
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="row center" style={{ gap: 8 }}>
              <button className="btn btn-sm" onClick={selectAll} style={{ fontSize: 11 }}>
                Todos
              </button>
              <button className="btn btn-sm" onClick={deselectAll} style={{ fontSize: 11 }}>
                Nenhum
              </button>
              <button
                className="btn btn-gold"
                onClick={handleImportAll}
                disabled={selectedCount === 0}
              >
                <IconCart /> Importar {selectedCount > 0 ? `${totalQty} cartas` : ""}
              </button>
              <button className="btn btn-sm" onClick={reset} style={{ color: "var(--muted)", fontSize: 11 }}>
                Nova página
              </button>
            </div>
          </div>

          {/* Cost info */}
          <div style={{
            fontSize: 12,
            color: "var(--muted)",
            marginBottom: 16,
            display: "flex",
            gap: 16,
          }}>
            <span>Custo: R$ {result.meta.cost_brl}</span>
            {result.meta.cost_graded_brl !== "0.00" && (
              <span>Verificação graded: R$ {result.meta.cost_graded_brl}</span>
            )}
            <span>{result.meta.processing_ms}ms</span>
          </div>

          {/* Cards grid */}
          <div className="col gap-8">
            {result.cards.map((item, idx) => (
              <BatchCardRow
                key={`${item.position.row}-${item.position.col}`}
                item={item}
                idx={idx}
                selected={selected[idx] ?? false}
                quantity={quantities[idx] ?? 1}
                onToggle={() => toggleSelect(idx)}
                onQtyChange={(d) => updateQty(idx, d)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: "10px 16px",
          background: "var(--down-bg)",
          border: "1px solid var(--down)",
          borderRadius: "var(--r-sm)",
          color: "var(--down)",
          fontSize: 13,
          marginTop: 16,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Single card row in results ────────────────────────────────────────────

function BatchCardRow({
  item,
  idx,
  selected,
  quantity,
  onToggle,
  onQtyChange,
}: {
  item: BatchCardResult;
  idx: number;
  selected: boolean;
  quantity: number;
  onToggle: () => void;
  onQtyChange: (delta: number) => void;
}) {
  const { identification, card, found } = item;
  const isGraded = identification.is_graded && identification.grading_company;

  return (
    <div
      className="card card-pad row between"
      style={{
        gap: 12,
        opacity: selected ? 1 : 0.45,
        borderColor: selected && found ? "var(--gold-bd)" : undefined,
      }}
    >
      {/* Select checkbox */}
      <div style={{ flex: "0 0 auto" }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          style={{ cursor: "pointer", accentColor: "var(--gold)" }}
        />
      </div>

      {/* Card image thumbnail */}
      {card?.image_url ? (
        <img
          src={card.image_url}
          alt={identification.card_name}
          style={{
            width: 48,
            height: 67,
            borderRadius: 4,
            objectFit: "cover",
            flex: "0 0 auto",
          }}
        />
      ) : (
        <div style={{
          width: 48,
          height: 67,
          borderRadius: 4,
          background: "var(--card-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
        }}>
          <IconSearch />
        </div>
      )}

      {/* Card info */}
      <div className="col gap-2" style={{ flex: 1, minWidth: 0 }}>
        <div className="row center" style={{ gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            {identification.card_name}
          </span>
          {identification.card_version && (
            <span style={{ color: "var(--muted)", fontSize: 12 }}>
              {identification.card_version}
            </span>
          )}
        </div>
        <div className="row center" style={{ gap: 6 }}>
          {identification.game_id && (
            <TagUI variant="neutral">{identification.game_id}</TagUI>
          )}
          {identification.set_code && (
            <TagUI variant="neutral">{identification.set_code} · #{identification.collector_number}</TagUI>
          )}
          {identification.rarity && (
            <TagUI variant="neutral">{identification.rarity}</TagUI>
          )}
          {identification.variant && identification.variant !== "normal" && (
            <TagUI variant="gold">{identification.variant}</TagUI>
          )}
          {!found && (
            <TagUI variant="down">Não encontrada</TagUI>
          )}
          {identification.best_guess && (
            <TagUI variant="violet">Estimativa</TagUI>
          )}
        </div>
        {isGraded && (
          <div className="row center" style={{ gap: 4, marginTop: 2 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--gold)",
              background: "var(--gold-bg)",
              padding: "1px 6px",
              borderRadius: 4,
            }}>
              🛡️ {identification.grading_company} {identification.grading_grade}
            </span>
            {identification.grading_grade && (
              <span style={{ fontSize: 10, color: "var(--muted)" }}>
                {gradeLabel(identification.grading_grade)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Price */}
      {card && (card.price_brl_mid || card.price_brl_low) && (
        <div className="col" style={{ alignItems: "flex-end", gap: 2, flex: "0 0 auto" }}>
          <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: "var(--gold-2)" }}>
            {fmt0(card.price_brl_mid || card.price_brl_low || 0)}
          </span>
          <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
            {fmt0((card.price_brl_mid || card.price_brl_low || 0) * quantity)} total
          </span>
        </div>
      )}

      {/* Quantity controls */}
      <div className="row center" style={{ gap: 4, flex: "0 0 auto" }}>
        <button className="qbtn" onClick={() => onQtyChange(-1)} disabled={quantity <= 1}>
          <IconMinus />
        </button>
        <span className="mono" style={{ fontWeight: 700, fontSize: 14, minWidth: 24, textAlign: "center" }}>
          {quantity}
        </span>
        <button className="qbtn add" onClick={() => onQtyChange(1)}>
          <IconPlus />
        </button>
      </div>

      {/* Confidence */}
      {identification.confidence > 0 && (
        <div style={{
          flex: "0 0 auto",
          width: 36,
          height: 36,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
          background: identification.confidence >= 80
            ? "var(--up-bg)"
            : identification.confidence >= 50
              ? "var(--gold-bg)"
              : "var(--down-bg)",
          color: identification.confidence >= 80
            ? "var(--up)"
            : identification.confidence >= 50
              ? "var(--gold-2)"
              : "var(--down)",
        }}>
          {identification.confidence}%
        </div>
      )}
    </div>
  );
}
