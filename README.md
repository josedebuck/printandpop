# print&pop · gestión

Next.js (App Router) + Supabase.

## Si ya tenés la versión anterior (con datos)
Ejecutá `supabase/migracion-materiales.sql` en el SQL Editor (no borra nada) y reemplazá los archivos.
Costo por unidad editable y stock de materiales vienen en esa migración.

## Instalación desde cero
`schema.sql` ya incluye todo. Si lo ejecutás, borra las tablas anteriores.

## Primera versión
1. En Supabase → SQL Editor, pegar y ejecutar TODO `supabase/schema.sql` (borra las tablas viejas y crea las nuevas).
2. Reemplazar los archivos del proyecto por estos y reiniciar `npm run dev`.

## Pantallas
- `/` Panel: ventas totales, ganancia, stock bajo, producto estrella y destacados.
- `/productos` Agregar producto (sticker, plancha, pack, personalizado), ver costo y ganancia, sumar stock, destacar.
- `/materiales` Papeles, tinta ($230 por hoja de entrada), packaging.
- `/ventas` Registrar ventas (descuenta stock y guarda la ganancia).
- `/costos` Calculadora suelta (no guarda nada).
- `/catalogo` Catálogo para mostrar.

## Pendiente antes de publicar
Las políticas de Supabase están abiertas para probar en local. Hay que agregar login
(Supabase Auth) y cambiarlas a `to authenticated`.
