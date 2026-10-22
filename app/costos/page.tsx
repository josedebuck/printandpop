"use client";

import { useState } from "react";
import { ars, calcularCosto, costoUnitario, type Linea, type Material } from "@/lib/cost";

const uid = () => Math.random().toString(36).slice(2, 9);

const inicial: Material[] = [
  { id: "papel", nombre: "Papel fotográfico (paquete)", precioPaquete: 8000, unidadesPorPaquete: 20 },
  { id: "tinta", nombre: "Tinta (cartucho)", precioPaquete: 12000, unidadesPorPaquete: 150 },
  { id: "cinta", nombre: "Cinta (rollo)", precioPaquete: 2500, unidadesPorPaquete: 100 },
];

export default function Costos() {
  const [materiales, setMateriales] = useState<Material[]>(inicial);
  const [lineas, setLineas] = useState<Linea[]>(
    inicial.map((m) => ({ materialId: m.id, cantidadPorHoja: 1 }))
  );
  const [stickersPorHoja, setStickersPorHoja] = useState(12);
  const [margen, setMargen] = useState(100);

  const r = calcularCosto(materiales, lineas, stickersPorHoja, margen);
  const n = (v: string) => (v === "" ? 0 : Number(v));

  const editarMaterial = (id: string, cambio: Partial<Material>) =>
    setMateriales((ms) => ms.map((m) => (m.id === id ? { ...m, ...cambio } : m)));

  const agregarMaterial = () => {
    const id = uid();
    setMateriales((ms) => [...ms, { id, nombre: "Nuevo material", precioPaquete: 0, unidadesPorPaquete: 1 }]);
    setLineas((ls) => [...ls, { materialId: id, cantidadPorHoja: 1 }]);
  };

  const quitarMaterial = (id: string) => {
    setMateriales((ms) => ms.filter((m) => m.id !== id));
    setLineas((ls) => ls.filter((l) => l.materialId !== id));
  };

  const editarLinea = (id: string, cantidadPorHoja: number) =>
    setLineas((ls) => ls.map((l) => (l.materialId === id ? { ...l, cantidadPorHoja } : l)));

  return (
    <>
      <h1>Calculadora de costos</h1>
      <p className="sub">
        Cargá lo que pagaste por cada paquete y cuántas hojas o usos rinde. Después indicá cuánto de cada cosa
        lleva una hoja y te dice cuánto cuesta cada sticker.
      </p>

      <section className="card">
        <h2>1. Materias primas</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Material</th><th>Precio del paquete</th><th>Rinde (hojas o usos)</th>
                <th>Costo por unidad</th><th>Lleva cada hoja</th><th></th>
              </tr>
            </thead>
            <tbody>
              {materiales.map((m) => {
                const l = lineas.find((x) => x.materialId === m.id);
                return (
                  <tr key={m.id}>
                    <td><input aria-label="Nombre" value={m.nombre} onChange={(e) => editarMaterial(m.id, { nombre: e.target.value })} /></td>
                    <td><input aria-label="Precio del paquete" type="number" min={0} value={m.precioPaquete} onChange={(e) => editarMaterial(m.id, { precioPaquete: n(e.target.value) })} /></td>
                    <td><input aria-label="Rinde" type="number" min={1} value={m.unidadesPorPaquete} onChange={(e) => editarMaterial(m.id, { unidadesPorPaquete: n(e.target.value) })} /></td>
                    <td>{ars(costoUnitario(m))}</td>
                    <td><input aria-label="Cantidad por hoja" type="number" min={0} step="0.01" value={l?.cantidadPorHoja ?? 0} onChange={(e) => editarLinea(m.id, n(e.target.value))} /></td>
                    <td><button className="btn x" onClick={() => quitarMaterial(m.id)} aria-label={`Quitar ${m.nombre}`}>Quitar</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p><button className="btn ghost" onClick={agregarMaterial}>Agregar material</button></p>
      </section>

      <section className="card">
        <h2>2. Producto</h2>
        <div className="row">
          <div>
            <label htmlFor="spp">Stickers por hoja</label>
            <input id="spp" type="number" min={1} value={stickersPorHoja} onChange={(e) => setStickersPorHoja(n(e.target.value))} />
          </div>
          <div>
            <label htmlFor="mg">Ganancia deseada (%)</label>
            <input id="mg" type="number" min={0} value={margen} onChange={(e) => setMargen(n(e.target.value))} />
          </div>
        </div>
      </section>

      <section className="result" aria-live="polite">
        <div className="cols">
          <div><div className="label">Costo por sticker</div><div className="big">{ars(r.porSticker)}</div></div>
          <div><div className="label">Precio sugerido por sticker</div><div className="big">{ars(r.precioSugeridoSticker)}</div></div>
          <div><div className="label">Costo por hoja</div><div className="big">{ars(r.porHoja)}</div></div>
          <div><div className="label">Precio sugerido por hoja</div><div className="big">{ars(r.precioSugeridoHoja)}</div></div>
        </div>
      </section>
    </>
  );
}
