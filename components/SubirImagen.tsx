"use client";

import { useRef, useState } from "react";
import { optimizada, subirImagen } from "@/lib/imagen";

type Props = {
  valor?: string | null;
  onChange: (url: string | null) => void;
  compacto?: boolean; // solo el botón, para usar dentro de una lista
  etiqueta?: string;
};

export default function SubirImagen({ valor, onChange, compacto = false, etiqueta }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(true);
    setError("");
    try {
      onChange(await subirImagen(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <>
      <input ref={ref} type="file" accept="image/*" hidden onChange={elegir} />
      {!compacto && valor && (
        <div style={{ marginBottom: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="preview" src={optimizada(valor, 600)} alt="Portada del producto" />
        </div>
      )}
      <button type="button" className="btn ghost" disabled={subiendo} onClick={() => ref.current?.click()}>
        {subiendo ? "Subiendo..." : etiqueta ?? (valor ? "Cambiar foto" : "Subir foto")}
      </button>
      {!compacto && valor && !subiendo && (
        <>{" "}<button type="button" className="btn x" onClick={() => onChange(null)}>Quitar foto</button></>
      )}
      {error && <div className="alert" style={{ marginTop: 8 }}>{error}</div>}
    </>
  );
}
