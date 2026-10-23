"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ars } from "@/lib/cost";
import { TIPOS, type Costo, type MaterialDB, type Producto, type Tipo } from "@/lib/types";
import SinDB from "@/components/SinDB";
import Buscador, { coincide } from "@/components/Buscador";
import SubirImagen from "@/components/SubirImagen";
import { optimizada } from "@/lib/imagen";
import { useCantidad } from "@/components/useCantidad";

type LineaMat = { material_id: string; cantidad: number };
type LineaItem = { item_id: string; cantidad: number };
const formVacio = { nombre: "", tipo: "sticker" as Tipo, precio_venta: 0, stickers_por_hoja: 1, stock_minimo: 5, destacado: false };

export default function Productos() {
  const [prods, setProds] = useState<Producto[]>([]);
  const [costos, setCostos] = useState<Record<string, Costo>>({});
  const [mats, setMats] = useState<MaterialDB[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState(formVacio);
  const [rec, setRec] = useState<LineaMat[]>([]);
  const [items, setItems] = useState<LineaItem[]>([]);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [imagen, setImagen] = useState<string | null>(null);
  const { pedir, dialogo } = useCantidad();

  const cargar = useCallback(async () => {
    if (!supabase) return;
    const [p, c, m] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("product_costs").select("product_id,costo,ganancia,margen_pct"),
      supabase.from("materials").select("*").order("nombre"),
    ]);
    const err = p.error ?? c.error ?? m.error;
    if (err) return setMsg(err.message);
    setProds((p.data ?? []) as Producto[]);
    setCostos(Object.fromEntries(((c.data ?? []) as Costo[]).map((x) => [x.product_id, x])));
    setMats((m.data ?? []) as MaterialDB[]);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const num = (v: string) => (v === "" ? 0 : Number(v));

  function abrir() {
    const tinta = mats.find((m) => m.categoria === "tinta");
    const papel = mats.find((m) => m.categoria === "papel");
    setRec([tinta, papel].filter(Boolean).map((m) => ({ material_id: m!.id, cantidad: 1 })));
    setItems([]); setF(formVacio); setImagen(null); setAbierto(true); setMsg("");
  }

  async function guardar() {
    if (!supabase || !f.nombre.trim()) return setMsg("Poné un nombre para el producto.");
    const { data, error } = await supabase.from("products")
      .insert({ ...f, nombre: f.nombre.trim(), stickers_por_hoja: f.tipo === "sticker" ? Math.max(f.stickers_por_hoja, 1) : 1, imagen_url: imagen })
      .select("id").single();
    if (error || !data) return setMsg(error?.message ?? "No se pudo guardar.");
    const lm = rec.filter((r) => r.material_id && r.cantidad > 0).map((r) => ({ product_id: data.id, ...r }));
    const li = f.tipo === "pack" ? items.filter((i) => i.item_id && i.cantidad > 0).map((i) => ({ pack_id: data.id, ...i })) : [];
    if (lm.length) { const e = await supabase.from("product_materials").insert(lm); if (e.error) setMsg(e.error.message); }
    if (li.length) { const e = await supabase.from("pack_items").insert(li); if (e.error) setMsg(e.error.message); }
    setAbierto(false); cargar();
  }

  async function sumarStock(p: Producto) {
    if (!supabase) return;
    const n = await pedir(`¿Cuántas unidades de "${p.nombre}" entran al stock?`);
    if (!n) return;
    const { error } = await supabase.from("stock_movements").insert({ product_id: p.id, tipo: "entrada", cantidad: Math.round(n) });
    if (error) setMsg(error.message); else cargar();
  }

  async function cambiarFoto(p: Producto, url: string | null) {
    if (!supabase) return;
    const { error } = await supabase.from("products").update({ imagen_url: url }).eq("id", p.id);
    if (error) setMsg(error.message); else cargar();
  }

  async function destacar(p: Producto) {
    if (!supabase) return;
    await supabase.from("products").update({ destacado: !p.destacado }).eq("id", p.id);
    cargar();
  }

  async function borrar(p: Producto) {
    if (!supabase || !confirm(`¿Borrar "${p.nombre}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) setMsg("No se puede borrar: tiene ventas registradas o está dentro de un pack.");
    else cargar();
  }

  if (!supabase) return <SinDB />;
  const sueltos = prods.filter((p) => p.tipo !== "pack");
  const visibles = prods.filter((p) => coincide(q, p.nombre, TIPOS.find((t) => t.v === p.tipo)?.label));

  return (
    <>
      {dialogo}
      <h1>Productos</h1>
      <p className="sub">Cada producto lleva su receta de materiales; el costo y la ganancia se calculan solos.</p>
      {msg && <div className="alert">{msg}</div>}
      <p><button className="btn" onClick={abrir}>Agregar producto</button></p>

      {abierto && (
        <section className="card">
          <h2>Nuevo producto</h2>
          <div className="row">
            <div><label htmlFor="pn">Nombre</label><input id="pn" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></div>
            <div><label htmlFor="pt">Tipo</label>
              <select id="pt" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as Tipo })}>
                {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
              </select>
            </div>
            <div><label htmlFor="pp">Precio de venta</label><input id="pp" type="number" min={0} value={f.precio_venta} onChange={(e) => setF({ ...f, precio_venta: num(e.target.value) })} /></div>
            {f.tipo === "sticker" && (
              <div><label htmlFor="ps">Stickers por hoja</label><input id="ps" type="number" min={1} value={f.stickers_por_hoja} onChange={(e) => setF({ ...f, stickers_por_hoja: num(e.target.value) })} /></div>
            )}
            <div><label htmlFor="pm">Avisar con stock de</label><input id="pm" type="number" min={0} value={f.stock_minimo} onChange={(e) => setF({ ...f, stock_minimo: num(e.target.value) })} /></div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label>Foto de portada (opcional)</label>
            <SubirImagen valor={imagen} onChange={setImagen} />
          </div>

          <h2 style={{ marginTop: 20 }}>{f.tipo === "pack" || f.tipo === "personalizado" ? "Materiales por unidad (caja, bolsita, tarjeta...)" : "Materiales por hoja"}</h2>
          {rec.map((r, i) => (
            <div className="row" key={i} style={{ marginBottom: 8 }}>
              <select aria-label="Material" value={r.material_id} onChange={(e) => setRec(rec.map((x, j) => (j === i ? { ...x, material_id: e.target.value } : x)))}>
                <option value="">Elegí un material</option>
                {mats.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
              <input aria-label="Cantidad" type="number" min={0} step="0.01" value={r.cantidad} onChange={(e) => setRec(rec.map((x, j) => (j === i ? { ...x, cantidad: num(e.target.value) } : x)))} />
              <button className="btn x" onClick={() => setRec(rec.filter((_, j) => j !== i))}>Quitar</button>
            </div>
          ))}
          <button className="btn ghost" onClick={() => setRec([...rec, { material_id: "", cantidad: 1 }])}>Agregar material</button>

          {f.tipo === "pack" && (
            <>
              <h2 style={{ marginTop: 20 }}>Qué trae el pack</h2>
              {items.map((it, i) => (
                <div className="row" key={i} style={{ marginBottom: 8 }}>
                  <select aria-label="Producto" value={it.item_id} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, item_id: e.target.value } : x)))}>
                    <option value="">Elegí un producto</option>
                    {sueltos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  <input aria-label="Cantidad" type="number" min={1} value={it.cantidad} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, cantidad: num(e.target.value) } : x)))} />
                  <button className="btn x" onClick={() => setItems(items.filter((_, j) => j !== i))}>Quitar</button>
                </div>
              ))}
              <button className="btn ghost" onClick={() => setItems([...items, { item_id: "", cantidad: 1 }])}>Agregar producto al pack</button>
            </>
          )}

          <p style={{ marginTop: 20 }}>
            <label style={{ display: "inline-flex", gap: 8, alignItems: "center", marginRight: 20 }}>
              <input type="checkbox" style={{ width: "auto" }} checked={f.destacado} onChange={(e) => setF({ ...f, destacado: e.target.checked })} /> Destacado
            </label>
            <button className="btn" onClick={guardar}>Guardar producto</button>{" "}
            <button className="btn ghost" onClick={() => setAbierto(false)}>Cancelar</button>
          </p>
        </section>
      )}

      <section className="card">
        {prods.length > 0 && <Buscador valor={q} onChange={setQ} placeholder="Buscar producto o tipo" />}
        {prods.length === 0 ? <p className="ok">Todavía no hay productos. Agregá el primero.</p> : visibles.length === 0 ? <p className="ok">No hay productos que coincidan con “{q}”.</p> : (
          <div className="table-wrap">
            <table className="cards">
              <thead><tr><th>Producto</th><th>Tipo</th><th>Costo</th><th>Precio</th><th>Ganancia</th><th>Stock</th><th></th></tr></thead>
              <tbody>
                {visibles.map((p) => {
                  const c = costos[p.id];
                  const bajo = p.stock_actual <= p.stock_minimo;
                  return (
                    <tr key={p.id}>
                      <td className="titulo">{p.imagen_url && /* eslint-disable-next-line @next/next/no-img-element */ <img className="thumb" src={optimizada(p.imagen_url, 120)} alt="" />}{p.destacado && <span className="badge">Destacado</span>} {p.nombre}</td>
                      <td data-label="Tipo">{TIPOS.find((t) => t.v === p.tipo)?.label}</td>
                      <td data-label="Costo">{ars(c?.costo ?? 0)}</td>
                      <td data-label="Precio">{ars(p.precio_venta)}</td>
                      <td data-label="Ganancia">{ars(c?.ganancia ?? 0)} <span className="ok">({c?.margen_pct ?? 0}%)</span></td>
                      <td data-label="Stock" style={bajo ? { color: "var(--alert)", fontWeight: 700 } : undefined}>{p.stock_actual}</td>
                      <td className="acciones">
                        <button className="btn ghost" onClick={() => sumarStock(p)}>Sumar stock</button>{" "}
                        <SubirImagen compacto etiqueta={p.imagen_url ? "Cambiar foto" : "Subir foto"} onChange={(url) => cambiarFoto(p, url)} />{" "}
                        <button className="btn ghost" onClick={() => destacar(p)}>{p.destacado ? "Quitar destacado" : "Destacar"}</button>{" "}
                        <button className="btn x" onClick={() => borrar(p)}>Borrar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
