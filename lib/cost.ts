export type Material = {
  id: string;
  nombre: string;
  precioPaquete: number;       // lo que cuesta el paquete / cartucho / rollo
  unidadesPorPaquete: number;  // hojas, usos o lo que rinda
};

export type Linea = { materialId: string; cantidadPorHoja: number };

export const costoUnitario = (m: Material) =>
  m.unidadesPorPaquete > 0 ? m.precioPaquete / m.unidadesPorPaquete : 0;

export function calcularCosto(
  materiales: Material[],
  lineas: Linea[],
  stickersPorHoja: number,
  margenPct: number
) {
  const detalle = lineas.map((l) => {
    const m = materiales.find((x) => x.id === l.materialId);
    return { materialId: l.materialId, costo: m ? costoUnitario(m) * l.cantidadPorHoja : 0 };
  });
  const porHoja = detalle.reduce((acc, d) => acc + d.costo, 0);
  const porSticker = stickersPorHoja > 0 ? porHoja / stickersPorHoja : 0;
  return {
    detalle,
    porHoja,
    porSticker,
    precioSugeridoSticker: porSticker * (1 + margenPct / 100),
    precioSugeridoHoja: porHoja * (1 + margenPct / 100),
  };
}

export const ars = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(n);
