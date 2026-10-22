import Link from "next/link";

export default function Mas() {
  return (
    <>
      <h1>Más</h1>
      <p className="sub">Otras herramientas.</p>
      <Link href="/costos" className="card linkcard">
        <strong>Calculadora de costos</strong>
        <span className="ok">Simulá el costo de una hoja o un sticker sin guardar nada.</span>
      </Link>
      <Link href="/catalogo" className="card linkcard">
        <strong>Catálogo</strong>
        <span className="ok">Cómo se ven tus productos para mostrar a los clientes.</span>
      </Link>
    </>
  );
}
