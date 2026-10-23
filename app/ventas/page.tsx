"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ars } from "@/lib/cost";
import SinDB from "@/components/SinDB";
import Buscador, { coincide } from "@/components/Buscador";

type Prod = { id: string; nombre: string; precio_venta: number; stock_actual: number };
type Venta = { id: string; cantidad: number; precio_unitario: number; costo_unitario: number; created_at: string; products: { nombre: string } | null };

export default function Ventas() {
  const [prods, setProds] = useState<Prod[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [pid, setPid] = useState("");
  const [cant, setCant] = useState(1);
  const [precio, setPrecio] = useState(0);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");

  const cargar = useCallback(async () => {
    if (!supabase) return;
    const [p, v] = await Promise.all([
      supabase.from("products").select("id,nombre,precio_venta,stock_actual").order("nombre"),
      supabase.from("sales").select("id,cantidad,precio_unitario,costo_unitario,created_at,products(nombre)").order("created_at", { ascending: false }).limit(20),
    ]);
    if (p.error || v.error) return setMsg((p.error ?? v.error)!.message);
    setProds((p.data ?? []) as Prod[]);
    setVentas((v.data ?? []) as unknown as Venta[]);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  function elegir(id: string) {
    setPid(id);
    setPrecio(prods.find((p) => p.id === id)?.precio_venta ?? 0);
  }

  async function registrar() {
    if (!supabase || !pid || cant < 1) return setMsg("Elegí un producto y una cantidad.");
    const p = prods.find((x) => x.id === pid);
    if (p && cant > p.stock_actual && !confirm(`Hay ${p.stock_actual} en stock y vendés ${cant}. ¿Registrar igual?`)) return;
    const { error } = await supabase.from("sales").insert({ product_id: pid, cantidad: cant, precio_unitario: precio });
    if (error) return setMsg(error.message);
    setMsg(""); setCant(1); cargar();
  }

  if (!supabase) return <SinDB />;

  const opciones = prods.filter((p) => p.id === pid || coincide(q, p.nombre));

  return (
    <>
      <h1>Ventas</h1>
      <p className="sub">Cada venta descuenta stock y guarda la ganancia del momento. Con esto se calcula el producto estrella.</p>
      {msg && <div className="alert">{msg}</div>}

      <section className="card">
        <Buscador valor={q} onChange={setQ} placeholder="Buscar producto" />
        <div className="row">
          <div><label htmlFor="vp">Producto</label>
            <select id="vp" value={pid} onChange={(e) => elegir(e.target.value)}>
              <option value="">Elegí un producto</option>
              {opciones.map((p) => <option key={p.id} value={p.id}>{p.nombre} (stock {p.stock_actual})</option>)}
            </select>
          </div>
          <div><label htmlFor="vc">Cantidad</label><input id="vc" type="number" min={1} value={cant} onChange={(e) => setCant(Number(e.target.value))} /></div>
          <div><label htmlFor="vpr">Precio unitario</label><input id="vpr" type="number" min={0} value={precio} onChange={(e) => setPrecio(Number(e.target.value))} /></div>
        </div>
        <p><button className="btn" onClick={registrar}>Registrar venta</button></p>
      </section>

      <section className="card">
        <h2>Últimas ventas</h2>
        {ventas.length === 0 ? <p className="ok">Todavía no hay ventas registradas.</p> : (
          <div className="table-wrap">
            <table className="cards">
              <thead><tr><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Total</th><th>Ganancia</th></tr></thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id}>
                    <td data-label="Fecha">{new Date(v.created_at).toLocaleDateString("es-AR")}</td>
                    <td className="titulo">{v.products?.nombre}</td>
                    <td data-label="Cantidad">{v.cantidad}</td>
                    <td data-label="Total">{ars(v.cantidad * v.precio_unitario)}</td>
                    <td data-label="Ganancia">{ars(v.cantidad * (v.precio_unitario - v.costo_unitario))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
