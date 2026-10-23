-- Sample parks for trying the map without adding them one by one in the app.
-- Set center_lat / center_lng to a spot near you, then run this in the Supabase SQL editor.
-- It creates three verified parks and one unverified park around that spot.
do $$
declare
  center_lat double precision := null; -- e.g. -34.6037
  center_lng double precision := null; -- e.g. -58.3816
  new_park_id uuid;
begin
  if center_lat is null or center_lng is null then
    raise notice 'Set center_lat and center_lng in supabase/seed.sql to create sample parks.';
    return;
  end if;

  insert into public.parks (name, description, lat, lng, status)
  values ('Sample Riverside Bars', 'Sample park. Delete it once real parks exist.', center_lat + 0.004, center_lng + 0.002, 'approved')
  returning id into new_park_id;
  insert into public.park_equipment (park_id, equipment_type_id, condition, quantity) values
    (new_park_id, 'pull_up_bar', 'good', 3), (new_park_id, 'parallel_bars', 'good', 2),
    (new_park_id, 'monkey_bars', 'worn', 1), (new_park_id, 'wall_bars', 'good', 4);
  insert into public.park_amenities (park_id, amenity_type_id) values
    (new_park_id, 'drinking_water'), (new_park_id, 'lighting'), (new_park_id, 'public_transport');

  insert into public.parks (name, description, lat, lng, status)
  values ('Sample Plaza Station', 'Sample park. Delete it once real parks exist.', center_lat - 0.003, center_lng + 0.005, 'approved')
  returning id into new_park_id;
  insert into public.park_equipment (park_id, equipment_type_id, condition) values
    (new_park_id, 'pull_up_bar', 'worn'), (new_park_id, 'dip_bars', 'good'), (new_park_id, 'low_bar', 'broken');
  insert into public.park_amenities (park_id, amenity_type_id) values
    (new_park_id, 'benches'), (new_park_id, 'wheelchair_accessible');

  insert into public.parks (name, description, lat, lng, status)
  values ('Sample Hilltop Rig', 'Sample park. Delete it once real parks exist.', center_lat + 0.001, center_lng - 0.006, 'approved')
  returning id into new_park_id;
  insert into public.park_equipment (park_id, equipment_type_id, condition) values
    (new_park_id, 'pull_up_bar', 'good'), (new_park_id, 'rings', 'good'),
    (new_park_id, 'vertical_pole', 'good'), (new_park_id, 'parallettes', 'good');
  insert into public.park_amenities (park_id, amenity_type_id) values
    (new_park_id, 'shade'), (new_park_id, 'toilets'), (new_park_id, 'parking'), (new_park_id, 'soft_ground');

  insert into public.parks (name, description, lat, lng, status)
  values ('Sample Unverified Bars', 'Sample park waiting for confirmations.', center_lat - 0.005, center_lng - 0.002, 'pending')
  returning id into new_park_id;
  insert into public.park_equipment (park_id, equipment_type_id) values (new_park_id, 'pull_up_bar');
  insert into public.park_submissions (park_id, kind, changes)
  values (new_park_id, 'create', '{"name": "Sample Unverified Bars"}'::jsonb);
end;
$$;
