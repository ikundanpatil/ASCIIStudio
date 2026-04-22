// ASCII art generation utilities

export const CHAR_SETS = {
  detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  standard: "@%#*+=-:. ",
  minimal: "█▓▒░ ",
  blocks: "█▉▊▋▌▍▎▏ ",
  binary: "10 ",
  dots: "●◉○◌· ",
} as const;

export type CharSetKey = keyof typeof CHAR_SETS;

export interface ImageToAsciiOptions {
  width: number;
  charSet: string;
  invert: boolean;
  contrast: number; // -100..100
  brightness: number; // -100..100
}

export function imageToAscii(
  image: HTMLImageElement | HTMLCanvasElement,
  opts: ImageToAsciiOptions,
): string {
  const { width, charSet, invert, contrast, brightness } = opts;
  const aspect = image.height / image.width;
  // Characters are taller than wide — multiply by 0.5 for proportion
  const height = Math.max(8, Math.round(width * aspect * 0.5));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;

  const chars = invert ? charSet : charSet.split("").reverse().join("");
  const len = chars.length;

  // contrast factor formula
  const c = (259 * (contrast + 255)) / (255 * (259 - contrast));

  let out = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      // luminance
      let lum = 0.299 * r + 0.587 * g + 0.114 * b;
      lum = c * (lum - 128) + 128 + brightness;
      lum = Math.max(0, Math.min(255, lum));
      if (a < 32) lum = 255; // transparent → space
      const idx = Math.floor((lum / 255) * (len - 1));
      out += chars[idx] ?? " ";
    }
    out += "\n";
  }
  return out;
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function asciiToPng(ascii: string, dark: boolean): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const lines = ascii.split("\n");
    const fontSize = 12;
    const charWidth = fontSize * 0.6;
    const lineHeight = fontSize;
    const maxWidth = Math.max(...lines.map((l) => l.length));
    const width = Math.ceil(maxWidth * charWidth) + 40;
    const height = lines.length * lineHeight + 40;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("no ctx"));
    ctx.fillStyle = dark ? "#0a0f0a" : "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = dark ? "#1DB954" : "#0a0f0a";
    ctx.font = `${fontSize}px ui-monospace, Menlo, monospace`;
    ctx.textBaseline = "top";
    lines.forEach((line, i) => {
      ctx.fillText(line, 20, 20 + i * lineHeight);
    });
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("toBlob failed"));
    }, "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
