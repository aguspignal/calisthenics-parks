-- How many of each equipment type a park has.
--
-- Equipment items are now {"type", "condition", "quantity"}. `quantity` is optional (default 1)
-- and must be a whole number from 1 to 20. One condition covers every unit of a type.
-- An edit's equipment_upsert replaces both the condition and the quantity of the listed types.

alter table public.park_equipment
  add column quantity smallint not null default 1 check (quantity between 1 and 20);

create or replace function private.validate_equipment(items jsonb)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if items is null or jsonb_typeof(items) <> 'array' then
    raise exception using errcode = 'PT400', message = 'Equipment must be a list.';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(items) as item
    where jsonb_typeof(item) <> 'object'
       or not exists (select 1 from public.equipment_types as t where t.id = item ->> 'type')
       or coalesce(item ->> 'condition', 'good') not in ('good', 'worn', 'broken')
  ) then
    raise exception using errcode = 'PT400', message = 'Unknown equipment or condition.';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(items) as item
    where item ? 'quantity'
      -- The case makes sure only numbers reach the cast.
      and case
        when jsonb_typeof(item -> 'quantity') <> 'number' then true
        else (item ->> 'quantity')::numeric not between 1 and 20 or (item ->> 'quantity')::numeric % 1 <> 0
      end
  ) then
    raise exception using errcode = 'PT400', message = 'Equipment quantity must be a whole number from 1 to 20.';
  end if;
end;
$$;

create or replace function private.upsert_park_equipment(target_park_id uuid, items jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform private.validate_equipment(items);
  insert into public.park_equipment (park_id, equipment_type_id, condition, quantity)
  select distinct on (item ->> 'type')
         target_park_id,
         item ->> 'type',
         coalesce(item ->> 'condition', 'good')::public.equipment_condition,
         coalesce((item ->> 'quantity')::numeric::smallint, 1)
  from jsonb_array_elements(items) as item
  on conflict (park_id, equipment_type_id) do update
    set condition = excluded.condition, quantity = excluded.quantity;
end;
$$;
