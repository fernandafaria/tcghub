// Vision API client — Scrydex-powered card identification
import { apiFetch } from "./api";
import type {
  VisionScanRequest,
  VisionScanResponse,
  BatchScanRequest,
  BatchScanResponse,
} from "@/types";

const VISION_ENDPOINT = "/vision/v1/cards/identify";
const BATCH_ENDPOINT = "/vision/v1/cards/batch-identify";

export async function identifyCard(
  imageDataUrl: string,
  games?: string[]
): Promise<VisionScanResponse> {
  const body: VisionScanRequest = { image_data_url: imageDataUrl };
  if (games?.length) body.games = games;

  return apiFetch<VisionScanResponse>(VISION_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Batch identify — envia foto de binder page, recebe todas as cartas de uma vez.
 * Usa Claude Vision (barato) pra identificar todas e resolve no catálogo local.
 * Opcionalmente verifica cartas slabadas via Scrydex (custo extra de R$0.25/carta).
 */
export async function batchIdentify(
  imageDataUrl: string,
  options?: { games?: string[]; verify_graded?: boolean }
): Promise<BatchScanResponse> {
  const body: BatchScanRequest = {
    image_data_url: imageDataUrl,
    verify_graded: options?.verify_graded ?? false,
  };
  if (options?.games?.length) body.games = options.games;

  return apiFetch<BatchScanResponse>(BATCH_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Convert a File/Blob to a base64 data URL.
 * Resizes images > 2048px to stay under 5MB.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compress an image data URL to fit within maxBytes.
 * Uses canvas resize. Falls back to original if compression fails.
 */
export function compressImage(
  dataUrl: string,
  maxWidth: number = 2048,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxWidth) {
        resolve(dataUrl);
        return;
      }
      const ratio = maxWidth / width;
      width = maxWidth;
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl); // fallback
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl); // fallback
    img.src = dataUrl;
  });
}

export function gradeLabel(grade: string): string {
  const map: Record<string, string> = {
    "10": "Gem Mint",
    "9.5": "Gem Mint",
    "9": "Mint",
    "8.5": "NM-Mint+",
    "8": "NM-Mint",
    "7.5": "Near Mint+",
    "7": "Near Mint",
    "6": "Excellent",
    "5": "Very Good",
  };
  return map[grade] || `Grade ${grade}`;
}
