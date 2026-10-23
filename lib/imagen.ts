// Utilidades para fotos de productos (Cloudinary).

// Achica la foto antes de subirla: las del celular pesan varios MB y no hace falta tanto.
async function comprimir(file: File, max = 1600, calidad = 0.85): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const escala = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * escala);
  const h = Math.round(bmp.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.fillStyle = "#fff"; // los PNG con fondo transparente quedan sobre blanco
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo procesar la imagen."))), "image/jpeg", calidad)
  );
}

export async function subirImagen(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("El archivo tiene que ser una imagen.");

  const resFirma = await fetch("/api/cloudinary-firma", { method: "POST" });
  const f = await resFirma.json();
  if (!resFirma.ok) throw new Error(f.error ?? "No se pudo preparar la subida.");

  let blob: Blob;
  try {
    blob = await comprimir(file);
  } catch {
    throw new Error("No se pudo leer esa imagen. Probá con una foto en JPG o PNG.");
  }

  const fd = new FormData();
  fd.append("file", blob, "foto.jpg");
  fd.append("api_key", f.apiKey);
  fd.append("timestamp", String(f.timestamp));
  fd.append("signature", f.firma);
  fd.append("folder", f.folder);
  fd.append("allowed_formats", f.allowed_formats);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${f.cloudName}/image/upload`, { method: "POST", body: fd });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error?.message ?? "Cloudinary no aceptó la imagen.");
  return j.secure_url as string;
}

// Pide a Cloudinary una versión liviana y del tamaño justo (formato y calidad automáticos).
export function optimizada(url: string, ancho: number) {
  return url.includes("/upload/") ? url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${ancho}/`) : url;
}
