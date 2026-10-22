-- Migración: costo por unidad editable + stock de materiales
-- Ejecutar UNA vez en el SQL Editor de Supabase. No borra datos.

alter table materials add column if not exists costo_unitario numeric(14,4);
update materials set costo_unitario = precio_paquete / unidades_por_paquete where costo_unitario is null;
alter table materials alter column costo_unitario set default 0;
alter table materials alter column costo_unitario set not null;

alter table materials add column if not exists stock_actual numeric(12,2) not null default 0;
alter table materials add column if not exists stock_minimo numeric(12,2) not null default 0;
alter table materials add column if not exists stock_ideal numeric(12,2) not null default 0;

-- El costo de los productos ahora sale del costo por unidad editable
create or replace view product_costs with (security_invoker = true) as
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

-- Materiales con poco stock (solo los que tienen un mínimo cargado)
create or replace view low_materials with (security_invoker = true) as
select id, nombre, stock_actual, stock_minimo from materials
where stock_minimo > 0 and stock_actual <= stock_minimo
order by nombre;
