export type Tipo = "sticker" | "plancha" | "pack" | "personalizado";

export const TIPOS: { v: Tipo; label: string }[] = [
  { v: "sticker", label: "Sticker suelto" },
  { v: "plancha", label: "Plancha entera" },
  { v: "pack", label: "Pack" },
  { v: "personalizado", label: "Personalizado" },
];

export type MaterialDB = {
  id: string;
  nombre: string;
  categoria: "papel" | "tinta" | "packaging" | "otro";
  precio_paquete: number;
  unidades_por_paquete: number;
  costo_unitario: number;
  stock_actual: number;
  stock_minimo: number;
  stock_ideal: number;
};

export type Producto = {
  id: string;
  nombre: string;
  tipo: Tipo;
  descripcion: string | null;
  imagen_url: string | null;
  precio_venta: number;
  stickers_por_hoja: number;
  stock_actual: number;
  stock_minimo: number;
  destacado: boolean;
  visible: boolean;
};

export type Costo = { product_id: string; costo: number; ganancia: number; margen_pct: number };
