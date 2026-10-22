import { supabase } from "@/lib/supabase";
import { ars } from "@/lib/cost";

export const dynamic = "force-dynamic";

type Bajo = { id: string; nombre: string; stock_actual: number; stock_minimo: number };
type Resumen = { nombre: string; destacado: boolean; unidades: number; ingresos: number; ganancia: number; porcentaje: number | null };

async function cargar() {
  if (!supabase) return null;
  const [b, r, mb] = await Promise.all([
    supabase.from("low_stock").select("*"),
    supabase.from("sales_summary").select("nombre,destacado,unidades,ingresos,ganancia,porcentaje").order("unidades", { ascending: false }),
    supabase.from("low_materials").select("*"),
  ]);
  return { bajos: (b.data ?? []) as Bajo[], resumen: (r.data ?? []) as Resumen[], matsBajos: (mb.data ?? []) as Bajo[] };
}

export default async function Panel() {
  const d = await cargar();
  if (!d) {
    return (
      <>
        <h1>Panel</h1>
        <div className="card">Falta conectar Supabase. Completá <code>.env.local</code> y reiniciá <code>npm run dev</code>.</div>
      </>
    );
  }
  const vendidos = d.resumen.filter((x) => x.unidades > 0);
  const estrella = vendidos[0];
  const destacados = d.resumen.filter((x) => x.destacado);
  const ingresos = d.resumen.reduce((a, x) => a + Number(x.ingresos), 0);
  const ganancia = d.resumen.reduce((a, x) => a + Number(x.ganancia), 0);

  return (
    <>
      <h1>Panel</h1>
      <p className="sub">Lo que necesita atención hoy y cómo viene el negocio.</p>

      <section className="result" style={{ marginBottom: 20 }}>
        <div className="cols">
          <div><div className="label">Vendido en total</div><div className="big">{ars(ingresos)}</div></div>
          <div><div className="label">Ganancia en total</div><div className="big">{ars(ganancia)}</div></div>
        </div>
      </section>

      <div className="grid2">
        <section className="card">
          <h2>Stock bajo</h2>
          {d.bajos.length === 0 ? <p className="ok">Ningún producto por debajo del mínimo.</p> :
            d.bajos.map((p) => (
              <div className="alert" key={p.id}>{p.nombre}: quedan {p.stock_actual} (mínimo {p.stock_minimo})</div>
            ))}
        </section>

        <section className="card">
          <h2>Materiales por reponer</h2>
          {d.matsBajos.length === 0 ? <p className="ok">Todo en orden. Cargá el stock mínimo de cada material en <a href="/materiales">Materiales</a>.</p> :
            d.matsBajos.map((m) => (
              <div className="alert" key={m.id}>{m.nombre}: quedan {m.stock_actual} (mínimo {m.stock_minimo})</div>
            ))}
        </section>

        <section className="card">
          <h2>Producto estrella</h2>
          {estrella ? (
            <div className="star">
              <div className="pct">{estrella.porcentaje ?? 0}%</div>
              <div>de las unidades vendidas son de <strong>{estrella.nombre}</strong> ({estrella.unidades} unidades, ganancia {ars(Number(estrella.ganancia))})</div>
            </div>
          ) : <p className="ok">Registrá ventas para ver cuál es el producto que más se vende.</p>}
        </section>
      </div>

      {destacados.length > 0 && (
        <section className="card">
          <h2>Productos destacados</h2>
          <table className="cards">
            <thead><tr><th>Producto</th><th>Unidades</th><th>% de ventas</th><th>Ganancia</th></tr></thead>
            <tbody>
              {destacados.map((x) => (
                <tr key={x.nombre}><td className="titulo">{x.nombre}</td><td data-label="Unidades">{x.unidades}</td><td data-label="% de ventas">{x.porcentaje ?? 0}%</td><td data-label="Ganancia">{ars(Number(x.ganancia))}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
