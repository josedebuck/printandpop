"use client";

// Sin tildes ni mayúsculas: "papel fotografico" encuentra "Papel fotográfico".
export const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Todas las palabras escritas tienen que aparecer en alguno de los campos.
export function coincide(q: string, ...campos: (string | null | undefined)[]) {
  const buscado = normalizar(q.trim());
  if (!buscado) return true;
  const texto = normalizar(campos.filter(Boolean).join(" "));
  return buscado.split(/\s+/).every((palabra) => texto.includes(palabra));
}

export default function Buscador({ valor, onChange, placeholder = "Buscar..." }: { valor: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="buscador">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
      </svg>
      <input type="search" inputMode="search" enterKeyHint="search" autoComplete="off" aria-label={placeholder} placeholder={placeholder} value={valor} onChange={(e) => onChange(e.target.value)} />
      {valor && <button type="button" onClick={() => onChange("")} aria-label="Borrar búsqueda">×</button>}
    </div>
  );
}
