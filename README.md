# print&pop · gestión

Aplicación web para administrar un emprendimiento de papelería creativa y stickers: calcula el costo de cada producto, lleva el stock de productos y materiales, registra ventas y muestra la ganancia y el producto estrella.

Hecha con **Next.js** (App Router), **TypeScript** y **Supabase** (PostgreSQL).

## Funciones

- **Productos**: sticker suelto, plancha entera, pack y pedido personalizado. Cada uno lleva una receta de materiales, y el costo, la ganancia y el margen se calculan solos.
- **Materiales**: papeles, tinta y packaging con costo por unidad editable.
- **Stock de materiales**: stock actual, mínimo y "comprar hasta", con una lista de compras que estima cuánto comprar y cuánto cuesta.
- **Stock de productos**: sumar stock y aviso cuando está por debajo del mínimo.
- **Ventas**: cada venta descuenta stock y guarda el precio y el costo del momento, para que la ganancia no cambie si después sube un insumo.
- **Panel**: total vendido, ganancia, avisos de poco stock (productos y materiales), producto estrella (el que más unidades vende) y productos destacados.
- **Catálogo**: vista para mostrar los productos visibles.
- **Calculadora** (`/costos`): herramienta suelta para simular costos sin guardar nada.

## Cómo calcula el costo

| Tipo | Costo |
|---|---|
| Sticker suelto | (materiales por hoja) ÷ stickers por hoja |
| Plancha entera | materiales por hoja |
| Pack | materiales del pack (caja, bolsita, tarjeta...) + costo de los productos que trae |
| Personalizado | materiales cargados en la receta |

Cada material aporta `cantidad × costo por unidad`. Por ejemplo, la tinta se carga como un material de $230 por hoja.

## Requisitos

- Node.js 18.18 o superior
- Una cuenta gratuita de [Supabase](https://supabase.com)

## Instalación

```bash
git clone <url-del-repositorio>
cd stickers-app
npm install
cp .env.example .env.local
```

1. Creá un proyecto en Supabase.
2. En **SQL Editor**, ejecutá `supabase/schema.sql` (crea tablas, vistas y triggers, y carga materiales de ejemplo).
3. En **Project Settings → API**, copiá la URL del proyecto y la clave `anon public` (o `publishable`) y pegalas en `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave
   ```

4. Iniciá la app:

   ```bash
   npm run dev
   ```

   Abrí http://localhost:3000.

> `schema.sql` borra las tablas existentes antes de crearlas. Si ya tenés datos de una versión anterior, usá `supabase/migracion-materiales.sql`, que solo agrega lo nuevo.

## Fotos de productos (Cloudinary)

Cada producto puede tener una foto de portada, que se ve en la lista de productos y en el catálogo.

1. Creá una cuenta gratuita en [Cloudinary](https://cloudinary.com).
2. En el *Dashboard* copiá el **Cloud name**, la **API Key** y el **API Secret**.
3. Pegalos en `.env.local` (mirá `.env.example`) y reiniciá `npm run dev`.

La foto se achica en el celular antes de subirse. El servidor solo firma la subida (`app/api/cloudinary-firma`), así que el API Secret nunca llega al navegador. Al desplegar (por ejemplo en Vercel), cargá las tres variables en la configuración del proyecto.

## Estructura

```
app/
  page.tsx          Panel
  productos/        Alta, costo, ganancia y stock de productos
  materiales/       Costos, stock y lista de compras
  ventas/           Registro de ventas
  costos/           Calculadora suelta
  catalogo/         Catálogo
lib/
  supabase.ts       Cliente de Supabase
  cost.ts           Funciones de la calculadora
  types.ts          Tipos compartidos
supabase/
  schema.sql                  Esquema completo
  migracion-materiales.sql    Migración incremental
```

## Seguridad: leer antes de publicar

Las políticas de Row Level Security incluidas están **abiertas a propósito** para poder probar en local: cualquiera que tenga la clave `anon` puede leer y escribir. No publiques la app así. Antes de desplegarla:

1. Agregá login con Supabase Auth, y que la ruta `/api/cloudinary-firma` exija sesión iniciada (hoy cualquiera podría pedir una firma de subida).
2. Reemplazá las políticas `dev abierto` por políticas `to authenticated`, dejando solo lectura pública para el catálogo.

## Pendiente

- Login y políticas definitivas.
- Descuento automático de materiales al registrar ventas.
- Borrar de Cloudinary las fotos reemplazadas o quitadas (hoy quedan guardadas en la cuenta).
- Edición de productos ya creados y de sus recetas.
