import { supabase } from "@/lib/supabase";
import { ars } from "@/lib/cost";
import { TIPOS } from "@/lib/types";

export const dynamic = "force-dynamic";

type Item = { id: string; nombre: string; tipo: string; descripcion: string | null; precio_venta: number; stock_actual: number; destacado: boolean };

export default async function Catalogo() {
  let items: Item[] = [];
  if (supabase) {
    const { data } = await supabase.from("products")
      .select("id,nombre,tipo,descripcion,precio_venta,stock_actual,destacado")
      .eq("visible", true).order("destacado", { ascending: false }).order("nombre");
    items = (data ?? []) as Item[];
  }
  return (
    <>
      <h1>Catálogo</h1>
      <p className="sub">Papelería creativa y personalizada. Stickers, etiquetas y packs.</p>
      {items.length === 0 ? <div className="card">Todavía no hay productos para mostrar.</div> : (
        <div className="grid2">
          {items.map((p) => (
            <article className="card" key={p.id}>
              {p.destacado && <span className="badge">Destacado</span>}
              <h2 style={{ marginTop: p.destacado ? 8 : 0 }}>{p.nombre}</h2>
              <p className="ok" style={{ margin: "0 0 8px" }}>{TIPOS.find((t) => t.v === p.tipo)?.label}</p>
              {p.descripcion && <p>{p.descripcion}</p>}
              <strong style={{ fontSize: 22 }}>{ars(p.precio_venta)}</strong>
              {p.stock_actual <= 0 && <p className="ok">Sin stock por ahora</p>}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
