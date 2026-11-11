import jsQR, { type QRCode } from "jsqr";

/** Ensure an SVG element serializes to a drawable data URL with explicit size. */
export function svgElementToDataUrl(svg: SVGElement, size = 320) {
  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(size));
  clone.setAttribute("height", String(size));
  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${size} ${size}`);
  }
  const svgText = new XMLSerializer().serializeToString(clone);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
}

export async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not load image"));
    image.src = url;
  });
  return image;
}

export async function rasterizeSvgElementToPng(
  svg: SVGElement,
  options?: { qrSize?: number; padding?: number },
): Promise<string> {
  const qrSize = options?.qrSize ?? 320;
  const padding = options?.padding ?? 32;
  const dataUrl = svgElementToDataUrl(svg, qrSize);
  const image = await loadImageFromUrl(dataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = qrSize + padding * 2;
  canvas.height = qrSize + padding * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, padding, padding, qrSize, qrSize);
  return canvas.toDataURL("image/png");
}

function tryDecode(imageData: ImageData): QRCode | null {
  return jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });
}

/**
 * Decode a QR from canvas ImageData.
 * Set `tryScales` for file uploads / screenshots; keep it false for camera frames.
 */
export function decodeQrFromImageData(
  source: ImageData,
  options?: { tryScales?: boolean },
): string | null {
  const first = tryDecode(source);
  if (first?.data) return first.data;
  if (!options?.tryScales) return null;

  const scales = [1.5, 2, 3];
  for (const scale of scales) {
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));
    if (width === source.width && height === source.height) continue;
    if (width * height > 4_000_000) continue;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) continue;

    const tmp = document.createElement("canvas");
    tmp.width = source.width;
    tmp.height = source.height;
    const tmpCtx = tmp.getContext("2d");
    if (!tmpCtx) continue;
    tmpCtx.putImageData(source, 0, 0);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, width, height);
    const scaled = ctx.getImageData(0, 0, width, height);
    const decoded = tryDecode(scaled);
    if (decoded?.data) return decoded.data;
  }

  return null;
}

export async function decodeQrFromFile(file: File): Promise<string | null> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageFromUrl(objectUrl);
    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;

    // SVG / vector uploads often report 0×0 until we force a render size.
    const isSvg =
      file.type === "image/svg+xml" ||
      file.name.toLowerCase().endsWith(".svg") ||
      width === 0 ||
      height === 0;
    if (isSvg && (width < 64 || height < 64)) {
      width = 512;
      height = 512;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return decodeQrFromImageData(ctx.getImageData(0, 0, width, height), { tryScales: true });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
