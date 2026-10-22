"use client";

import { useCallback, useRef, useState } from "react";

// Reemplazo de prompt(): una hoja inferior en el celular, con teclado numérico.
export function useCantidad() {
  const ref = useRef<HTMLDialogElement>(null);
  const resolver = useRef<((n: number | null) => void) | null>(null);
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState("");

  const pedir = useCallback(
    (t: string) =>
      new Promise<number | null>((res) => {
        resolver.current = res;
        setTitulo(t);
        setValor("");
        ref.current?.showModal();
      }),
    []
  );

  const cerrar = (n: number | null) => {
    ref.current?.close();
    resolver.current?.(n);
    resolver.current = null;
  };

  const dialogo = (
    <dialog ref={ref} className="sheet" onCancel={() => cerrar(null)}>
      <form onSubmit={(e) => { e.preventDefault(); const n = Number(valor); cerrar(n > 0 ? n : null); }}>
        <h2>{titulo}</h2>
        <input type="number" inputMode="decimal" min={0} step="any" autoFocus aria-label="Cantidad" value={valor} onChange={(e) => setValor(e.target.value)} />
        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={() => cerrar(null)}>Cancelar</button>
          <button type="submit" className="btn">Aceptar</button>
        </div>
      </form>
    </dialog>
  );

  return { pedir, dialogo };
}
