-- print&pop · esquema v2
-- ATENCIÓN: borra las tablas de la versión anterior (estaban vacías). Ejecutalo completo en el SQL Editor.

drop view if exists sales_summary, low_materials, low_stock, product_costs, sales_share cascade;
drop table if exists sales, pack_items, stock_movements, product_materials, products, materials cascade;
drop function if exists apply_stock_movement() cascade;
drop function if exists fill_sale() cascade;
drop function if exists apply_sale() cascade;

-- Materias primas: papeles, tinta, packaging, etc.
-- costo_unitario es editable (la tinta se carga como $230 por "hoja").
-- precio_paquete y unidades_por_paquete sirven para saber cuánto comprar.
create table materials (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null default 'papel' check (categoria in ('papel','tinta','packaging','otro')),
  precio_paquete numeric(12,2) not null default 0 check (precio_paquete >= 0),
  unidades_por_paquete numeric(12,2) not null default 1 check (unidades_por_paquete > 0),
  costo_unitario numeric(14,4) not null default 0 check (costo_unitario >= 0),
  stock_actual numeric(12,2) not null default 0,
  stock_minimo numeric(12,2) not null default 0,
  stock_ideal numeric(12,2) not null default 0,
  created_at timestamptz default now()
);

-- Productos: sticker suelto, plancha entera, pack o pedido personalizado
create table products (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null default 'sticker' check (tipo in ('sticker','plancha','pack','personalizado')),
  descripcion text,
  imagen_url text,
  precio_venta numeric(12,2) not null default 0,
  stickers_por_hoja int not null default 1 check (stickers_por_hoja > 0),
  stock_actual int not null default 0,
  stock_minimo int not null default 5,
  destacado boolean not null default false,
  visible boolean not null default true,
  created_at timestamptz default now()
);

-- Receta: materiales que lleva el producto
--   sticker / plancha: cantidad por HOJA
--   pack / personalizado: cantidad por unidad vendida (cajita, bolsita, tarjeta...)
create table product_materials (
  product_id uuid references products on delete cascade,
  material_id uuid references materials on delete restrict,
  cantidad numeric(12,4) not null check (cantidad >= 0),
  primary key (product_id, material_id)
);

-- Qué productos trae cada pack
create table pack_items (
  pack_id uuid references products on delete cascade,
  item_id uuid references products on delete restrict,
  cantidad int not null default 1 check (cantidad > 0),
  primary key (pack_id, item_id)
);

-- Entradas de mercadería y ajustes de stock
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete cascade,
  tipo text not null check (tipo in ('entrada','ajuste')),
  cantidad int not null,
  nota text,
  created_at timestamptz default now()
);

-- Ventas (guardan el precio y el costo del momento, para que la ganancia no cambie si sube el papel)
create table sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete restrict,
  cantidad int not null check (cantidad > 0),
  precio_unitario numeric(12,2),
  costo_unitario numeric(12,2),
  created_at timestamptz default now()
);

-- Costo de cada producto
create view product_costs with (security_invoker = true) as
with base as (
  select p.id, coalesce(sum(pm.cantidad * m.costo_unitario), 0) as materiales
  from products p
  left join product_materials pm on pm.product_id = p.id
  left join materials m on m.id = pm.material_id
  group by p.id
),
unit as (
  select p.id,
    case when p.tipo = 'sticker' then b.materiales / p.stickers_por_hoja else b.materiales end as costo
  from products p join base b on b.id = p.id
  where p.tipo <> 'pack'
),
packs as (
  select p.id, b.materiales + coalesce(sum(pi.cantidad * u.costo), 0) as costo
  from products p
  join base b on b.id = p.id
  left join pack_items pi on pi.pack_id = p.id
  left join unit u on u.id = pi.item_id
  where p.tipo = 'pack'
  group by p.id, b.materiales
)
select p.id as product_id, p.nombre, p.tipo, p.precio_venta,
  round(coalesce(u.costo, k.costo, 0), 2) as costo,
  round(p.precio_venta - coalesce(u.costo, k.costo, 0), 2) as ganancia,
  case when p.precio_venta > 0
    then round(100 * (p.precio_venta - coalesce(u.costo, k.costo, 0)) / p.precio_venta, 1)
    else 0 end as margen_pct
from products p
left join unit u on u.id = p.id
left join packs k on k.id = p.id;

-- Productos con poco stock
create view low_stock with (security_invoker = true) as
select id, nombre, stock_actual, stock_minimo from products
where stock_actual <= stock_minimo and visible
order by stock_actual;

-- Materiales con poco stock
create view low_materials with (security_invoker = true) as
select id, nombre, stock_actual, stock_minimo from materials
where stock_minimo > 0 and stock_actual <= stock_minimo
order by nombre;

-- Ventas por producto: unidades, ingresos, ganancia y porcentaje (el de más unidades es el producto estrella)
create view sales_summary with (security_invoker = true) as
select p.id as product_id, p.nombre, p.destacado,
  coalesce(sum(s.cantidad), 0)::int as unidades,
  coalesce(sum(s.cantidad * s.precio_unitario), 0) as ingresos,
  coalesce(sum(s.cantidad * (s.precio_unitario - s.costo_unitario)), 0) as ganancia,
  round(100.0 * coalesce(sum(s.cantidad), 0) / nullif(sum(sum(s.cantidad)) over (), 0), 1) as porcentaje
from products p
left join sales s on s.product_id = p.id
group by p.id;

-- Triggers de stock y ventas
create function apply_stock_movement() returns trigger language plpgsql as $$
begin
  update products set stock_actual = stock_actual + new.cantidad where id = new.product_id;
  return new;
end $$;
create trigger trg_stock after insert on stock_movements
  for each row execute function apply_stock_movement();

create function fill_sale() returns trigger language plpgsql as $$
begin
  if new.precio_unitario is null then
    select precio_venta into new.precio_unitario from products where id = new.product_id;
  end if;
  select costo into new.costo_unitario from product_costs where product_id = new.product_id;
  return new;
end $$;
create trigger trg_fill_sale before insert on sales
  for each row execute function fill_sale();

create function apply_sale() returns trigger language plpgsql as $$
begin
  update products set stock_actual = stock_actual - new.cantidad where id = new.product_id;
  return new;
end $$;
create trigger trg_sale after insert on sales
  for each row execute function apply_sale();

-- Seguridad
-- OJO: estas políticas dejan leer y escribir a cualquiera que tenga la clave anon.
-- Sirven para probar en tu compu. ANTES de publicar la app hay que agregar login
-- y reemplazarlas por políticas "to authenticated".
alter table materials enable row level security;
alter table products enable row level security;
alter table product_materials enable row level security;
alter table pack_items enable row level security;
alter table stock_movements enable row level security;
alter table sales enable row level security;

create policy "dev abierto" on materials for all using (true) with check (true);
create policy "dev abierto" on products for all using (true) with check (true);
create policy "dev abierto" on product_materials for all using (true) with check (true);
create policy "dev abierto" on pack_items for all using (true) with check (true);
create policy "dev abierto" on stock_movements for all using (true) with check (true);
create policy "dev abierto" on sales for all using (true) with check (true);

-- Materiales de arranque (los precios de papel son de ejemplo: editalos desde la app)
insert into materials (nombre, categoria, precio_paquete, unidades_por_paquete, costo_unitario) values
  ('Tinta (por hoja)', 'tinta', 230, 1, 230),
  ('Papel común (hoja)', 'papel', 0, 100, 0),
  ('Papel fotográfico (hoja)', 'papel', 0, 20, 0),
  ('Papel sticker (hoja)', 'papel', 0, 20, 0);
