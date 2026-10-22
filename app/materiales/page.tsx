"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ars } from "@/lib/cost";
import type { MaterialDB } from "@/lib/types";
import SinDB from "@/components/SinDB";
import { useCantidad } from "@/components/useCantidad";

const CATS = ["papel", "tinta", "packaging", "otro"] as const;
const vacio = {
  nombre: "", categoria: "papel" as MaterialDB["categoria"],
  costo_unitario: 0, precio_paquete: 0, unidades_por_paquete: 1,
  stock_actual: 0, stock_minimo: 0, stock_ideal: 0,
};

export default function Materiales() {
  const [items, setItems] = useState<MaterialDB[]>([]);
  const [nuevo, setNuevo] = useState(vacio);
  const [msg, setMsg] = useState("");
  const { pedir, dialogo } = useCantidad();

  const cargar = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("materials").select("*").order("categoria").order("nombre");
    if (error) setMsg(error.message);
    else setItems((data ?? []) as MaterialDB[]);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const num = (v: string) => (v === "" ? 0 : Number(v));
  const cambiar = (id: string, c: Partial<MaterialDB>) =>
    setItems((xs) => xs.map((m) => (m.id === id ? { ...m, ...c } : m)));

  async function guardar(m: MaterialDB) {
    if (!supabase) return;
    const unidades = Math.max(m.unidades_por_paquete, 0.01);
    const { error } = await supabase.from("materials").update({
      nombre: m.nombre, categoria: m.categoria, costo_unitario: m.costo_unitario,
      unidades_por_paquete: unidades,
      precio_paquete: Math.round(m.costo_unitario * unidades * 100) / 100,
      stock_actual: m.stock_actual, stock_minimo: m.stock_minimo, stock_ideal: m.stock_ideal,
    }).eq("id", m.id);
    setMsg(error ? error.message : "");
  }

  async function mover(m: MaterialDB, signo: 1 | -1) {
    const n = await pedir(signo > 0 ? `¿Cuántas unidades de "${m.nombre}" compraste?` : `¿Cuántas unidades de "${m.nombre}" usaste?`);
    if (!n) return;
    const x = { ...m, stock_actual: Math.max(m.stock_actual + signo * n, 0) };
    cambiar(m.id, x);
    guardar(x);
  }

  // Ayuda: si se carga precio y unidades del paquete, el costo por unidad se calcula solo (y se puede corregir)
  function conPaquete(c: Partial<typeof vacio>) {
    const x = { ...nuevo, ...c };
    if (x.precio_paquete > 0 && x.unidades_por_paquete > 0) x.costo_unitario = Math.round((x.precio_paquete / x.unidades_por_paquete) * 10000) / 10000;
    setNuevo(x);
  }

  async function agregar() {
    if (!supabase || !nuevo.nombre.trim()) return;
    const { error } = await supabase.from("materials").insert({
      ...nuevo, nombre: nuevo.nombre.trim(),
      precio_paquete: nuevo.precio_paquete || nuevo.costo_unitario * nuevo.unidades_por_paquete,
    });
    if (error) return setMsg(error.message);
    setNuevo(vacio); setMsg(""); cargar();
  }

  async function borrar(m: MaterialDB) {
    if (!supabase || !confirm(`¿Borrar "${m.nombre}"?`)) return;
    const { error } = await supabase.from("materials").delete().eq("id", m.id);
    if (error) setMsg("No se puede borrar: algún producto lo usa en su receta.");
    else { setMsg(""); cargar(); }
  }

  if (!supabase) return <SinDB />;

  const compras = items
    .filter((m) => m.stock_minimo > 0 && m.stock_actual <= m.stock_minimo)
    .map((m) => {
      const hasta = Math.max(m.stock_ideal, m.stock_minimo);
      const comprar = Math.max(hasta - m.stock_actual, 0);
      return { m, comprar, paquetes: Math.ceil(comprar / Math.max(m.unidades_por_paquete, 0.01)), costo: comprar * m.costo_unitario };
    });
  const totalCompra = compras.reduce((a, c) => a + c.costo, 0);

  return (
    <>
      {dialogo}
      <h1>Materiales</h1>
      <p className="sub">
        El costo por unidad se edita directo y se usa para calcular el costo de los productos. El stock te dice qué
        tenés y qué falta comprar.
      </p>
      {msg && <div className="alert">{msg}</div>}

      <section className="card">
        <h2>Lista de compras</h2>
        {compras.length === 0 ? (
          <p className="ok">Nada por reponer. Cargá un stock mínimo en cada material para que te avise.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="cards">
                <thead><tr><th>Material</th><th>Tenés</th><th>Conviene comprar</th><th>Paquetes</th><th>Costo estimado</th></tr></thead>
                <tbody>
                  {compras.map(({ m, comprar, paquetes, costo }) => (
                    <tr key={m.id}>
                      <td className="titulo"><span className="badge" style={{ background: "var(--alert-bg)", color: "var(--alert)" }}>Poco stock</span> {m.nombre}</td>
                      <td data-label="Tenés">{m.stock_actual}</td>
                      <td data-label="Conviene comprar">{comprar > 0 ? comprar : "Definí “Comprar hasta”"}</td>
                      <td data-label="Paquetes">{comprar > 0 ? `≈ ${paquetes}` : "—"}</td>
                      <td data-label="Costo estimado">{ars(costo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p><strong>Total estimado: {ars(totalCompra)}</strong></p>
          </>
        )}
      </section>

      <section className="card">
        <h2>Stock y costos</h2>
        <div className="table-wrap">
          <table className="cards">
            <thead>
              <tr>
                <th>Material</th><th>Tipo</th><th>Costo por unidad</th><th>Unidades por paquete</th>
                <th>Stock</th><th>Mínimo</th><th>Comprar hasta</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => {
                const bajo = m.stock_minimo > 0 && m.stock_actual <= m.stock_minimo;
                return (
                  <tr key={m.id}>
                    <td className="titulo"><input aria-label="Nombre" value={m.nombre} onChange={(e) => cambiar(m.id, { nombre: e.target.value })} onBlur={() => guardar(m)} /></td>
                    <td data-label="Tipo">
                      <select aria-label="Tipo" value={m.categoria} onChange={(e) => { const x = { ...m, categoria: e.target.value as MaterialDB["categoria"] }; cambiar(m.id, x); guardar(x); }}>
                        {CATS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td data-label="Costo por unidad"><input aria-label="Costo por unidad" type="number" min={0} step="any" value={m.costo_unitario} onChange={(e) => cambiar(m.id, { costo_unitario: num(e.target.value) })} onBlur={() => guardar(m)} /></td>
                    <td data-label="Por paquete"><input aria-label="Unidades por paquete" type="number" min={1} step="any" value={m.unidades_por_paquete} onChange={(e) => cambiar(m.id, { unidades_por_paquete: num(e.target.value) })} onBlur={() => guardar(m)} /></td>
                    <td data-label="Stock"><input aria-label="Stock" type="number" min={0} step="any" style={bajo ? { borderColor: "var(--alert)", color: "var(--alert)", fontWeight: 700 } : undefined} value={m.stock_actual} onChange={(e) => cambiar(m.id, { stock_actual: num(e.target.value) })} onBlur={() => guardar(m)} /></td>
                    <td data-label="Mínimo"><input aria-label="Stock mínimo" type="number" min={0} step="any" value={m.stock_minimo} onChange={(e) => cambiar(m.id, { stock_minimo: num(e.target.value) })} onBlur={() => guardar(m)} /></td>
                    <td data-label="Comprar hasta"><input aria-label="Comprar hasta" type="number" min={0} step="any" value={m.stock_ideal} onChange={(e) => cambiar(m.id, { stock_ideal: num(e.target.value) })} onBlur={() => guardar(m)} /></td>
                    <td className="acciones">
                      <button className="btn ghost" onClick={() => mover(m, 1)}>Compré</button>{" "}
                      <button className="btn ghost" onClick={() => mover(m, -1)}>Usé</button>{" "}
                      <button className="btn x" onClick={() => borrar(m)}>Borrar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Agregar material</h2>
        <div className="row">
          <div><label htmlFor="n">Nombre</label><input id="n" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></div>
          <div><label htmlFor="c">Tipo</label>
            <select id="c" value={nuevo.categoria} onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value as MaterialDB["categoria"] })}>
              {CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label htmlFor="pp">Precio del paquete (opcional)</label><input id="pp" type="number" min={0} step="any" value={nuevo.precio_paquete} onChange={(e) => conPaquete({ precio_paquete: num(e.target.value) })} /></div>
          <div><label htmlFor="up">Unidades que trae</label><input id="up" type="number" min={1} step="any" value={nuevo.unidades_por_paquete} onChange={(e) => conPaquete({ unidades_por_paquete: num(e.target.value) })} /></div>
          <div><label htmlFor="cu">Costo por unidad</label><input id="cu" type="number" min={0} step="any" value={nuevo.costo_unitario} onChange={(e) => setNuevo({ ...nuevo, costo_unitario: num(e.target.value) })} /></div>
          <div><label htmlFor="sa">Stock actual</label><input id="sa" type="number" min={0} step="any" value={nuevo.stock_actual} onChange={(e) => setNuevo({ ...nuevo, stock_actual: num(e.target.value) })} /></div>
          <div><label htmlFor="sm">Stock mínimo</label><input id="sm" type="number" min={0} step="any" value={nuevo.stock_minimo} onChange={(e) => setNuevo({ ...nuevo, stock_minimo: num(e.target.value) })} /></div>
          <div><label htmlFor="si">Comprar hasta</label><input id="si" type="number" min={0} step="any" value={nuevo.stock_ideal} onChange={(e) => setNuevo({ ...nuevo, stock_ideal: num(e.target.value) })} /></div>
        </div>
        <p><button className="btn" onClick={agregar}>Agregar material</button></p>
      </section>
    </>
  );
}
