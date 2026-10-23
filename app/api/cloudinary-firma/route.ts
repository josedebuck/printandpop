import crypto from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Firma una subida para que el navegador envíe la foto directo a Cloudinary.
// El API secret nunca sale del servidor.
export async function POST() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Falta configurar Cloudinary en .env.local" }, { status: 500 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "printandpop/productos";
  const allowed_formats = "jpg,png,webp";
  // Los parámetros se firman en orden alfabético
  const aFirmar = `allowed_formats=${allowed_formats}&folder=${folder}&timestamp=${timestamp}`;
  const firma = crypto.createHash("sha1").update(aFirmar + apiSecret).digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder, allowed_formats, firma });
}
