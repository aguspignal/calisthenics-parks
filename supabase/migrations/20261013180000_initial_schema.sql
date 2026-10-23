-- Parks: initial schema.
--
-- Product rules (see docs/DECISIONS.md):
--   * Anyone can browse; contributing requires an account.
--   * There are no admins. New parks, edits and removals stay pending until other users
--     confirm or reject them (thresholds in app_settings).
--   * Adding, editing, voting, reviewing and uploading photos require the user to be within
--     app_settings.proximity_meters of the park. The app sends the device location; the
--     server checks it, which stops casual abuse but not GPS spoofing.
--   * Reviews and photos publish immediately; reports from other users hide them.
--
-- API roles can only read. Every write goes through the security definer functions in
-- the "Write API" section, which enforce the rules above.

create extension if not exists postgis with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.park_status as enum ('pending', 'approved', 'rejected', 'removed');
create type public.submission_kind as enum ('create', 'edit', 'remove');
create type public.submission_status as enum ('pending', 'approved', 'rejected');
create type public.vote_kind as enum ('confirm', 'reject');
create type public.equipment_condition as enum ('good', 'worn', 'broken');
create type public.amenity_category as enum ('amenity', 'accessibility');
create type public.report_target as enum ('review', 'photo');

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------

create table public.app_settings (
  key text primary key,
  value integer not null,
  description text not null
);

insert into public.app_settings (key, value, description) values
  ('confirmations_required', 2, 'Confirmations from other users that approve a pending park, edit or removal.'),
  ('rejections_required', 2, 'Rejections from other users that discard a pending park, edit or removal.'),
  ('proximity_meters', 250, 'Maximum distance between the user and the park to add, edit, vote, review or upload photos.'),
  ('duplicate_radius_meters', 30, 'A new park closer than this to a visible park is refused as a duplicate.'),
  ('report_hide_threshold', 3, 'Reports from different users that hide a review or photo.');

create function private.setting(setting_key text)
returns integer
language plpgsql
stable
set search_path = ''
as $$
declare
  result integer;
begin
  select s.value into result from public.app_settings as s where s.key = setting_key;
  if result is null then
    raise exception 'Missing app setting: %', setting_key;
  end if;
  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 50),
  avatar_url text check (char_length(avatar_url) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), 50), ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Catalogs (proposed lists; edit with a new migration)
-- ---------------------------------------------------------------------------

create table public.equipment_types (
  id text primary key check (id ~ '^[a-z0-9_]+$'),
  name text not null,
  sort_order smallint not null default 0
);

insert into public.equipment_types (id, name, sort_order) values
  ('pull_up_bar', 'Pull-up bar', 10),
  ('parallel_bars', 'Parallel bars', 20),
  ('dip_bars', 'Dip bars', 30),
  ('low_bar', 'Low bar', 40),
  ('monkey_bars', 'Monkey bars', 50),
  ('rings', 'Gymnastic rings', 60),
  ('wall_bars', 'Wall bars', 70),
  ('vertical_pole', 'Vertical pole', 80),
  ('parallettes', 'Parallettes', 90),
  ('sit_up_bench', 'Sit-up bench', 100),
  ('leg_raise_station', 'Leg raise station', 110),
  ('climbing_rope', 'Climbing rope', 120);

create table public.amenity_types (
  id text primary key check (id ~ '^[a-z0-9_]+$'),
  name text not null,
  category public.amenity_category not null,
  sort_order smallint not null default 0
);

insert into public.amenity_types (id, name, category, sort_order) values
  ('drinking_water', 'Drinking water', 'amenity', 10),
  ('toilets', 'Toilets nearby', 'amenity', 20),
  ('lighting', 'Night lighting', 'amenity', 30),
  ('shade', 'Shade', 'amenity', 40),
  ('benches', 'Benches', 'amenity', 50),
  ('soft_ground', 'Rubber flooring', 'amenity', 60),
  ('open_24h', 'Open 24/7', 'amenity', 70),
  ('wheelchair_accessible', 'Wheelchair accessible', 'accessibility', 10),
  ('public_transport', 'Public transport nearby', 'accessibility', 20),
  ('parking', 'Car parking', 'accessibility', 30),
  ('bike_parking', 'Bike parking', 'accessibility', 40);

-- ---------------------------------------------------------------------------
-- Parks
-- ---------------------------------------------------------------------------

create table public.parks (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 1000),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  location extensions.geography(point, 4326) generated always as (
    extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography
  ) stored,
  status public.park_status not null default 'pending',
  created_by uuid references public.profiles (id) on delete set null,
  -- Review aggregates, maintained by the reviews trigger.
  review_count integer not null default 0,
  rating_overall numeric(3, 2),
  rating_equipment numeric(3, 2),
  rating_environment numeric(3, 2),
  rating_cleanliness numeric(3, 2),
  rating_safety numeric(3, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index parks_lat_lng_idx on public.parks (lat, lng);
create index parks_location_idx on public.parks using gist (location);

create table public.park_equipment (
  park_id uuid not null references public.parks (id) on delete cascade,
  equipment_type_id text not null references public.equipment_types (id),
  condition public.equipment_condition not null default 'good',
  primary key (park_id, equipment_type_id)
);

create index park_equipment_type_idx on public.park_equipment (equipment_type_id);

create table public.park_amenities (
  park_id uuid not null references public.parks (id) on delete cascade,
  amenity_type_id text not null references public.amenity_types (id),
  primary key (park_id, amenity_type_id)
);

create index park_amenities_type_idx on public.park_amenities (amenity_type_id);

-- ---------------------------------------------------------------------------
-- Community verification
-- ---------------------------------------------------------------------------

-- A proposed change to a park. 'create' submissions describe a new park (the park row
-- already exists with status 'pending'); 'edit' submissions carry a diff in `changes`:
--   name, description, lat + lng, equipment_upsert [{type, condition}], equipment_remove [type],
--   amenities_add [id], amenities_remove [id].
create table public.park_submissions (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references public.parks (id) on delete cascade,
  kind public.submission_kind not null,
  changes jsonb not null default '{}'::jsonb check (jsonb_typeof(changes) = 'object'),
  note text check (char_length(note) <= 500),
  status public.submission_status not null default 'pending',
  confirmations integer not null default 0,
  rejections integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index park_submissions_pending_idx on public.park_submissions (park_id) where status = 'pending';
create unique index park_submissions_one_create_per_park on public.park_submissions (park_id) where kind = 'create';
create unique index park_submissions_one_pending_per_user on public.park_submissions (park_id, created_by) where status = 'pending';

create table public.submission_votes (
  submission_id uuid not null references public.park_submissions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  vote public.vote_kind not null,
  created_at timestamptz not null default now(),
  primary key (submission_id, user_id)
);

create index submission_votes_user_idx on public.submission_votes (user_id);

-- ---------------------------------------------------------------------------
-- Reviews, photos and reports
-- ---------------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references public.parks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating_overall smallint not null check (rating_overall between 1 and 5),
  rating_equipment smallint not null check (rating_equipment between 1 and 5),
  rating_environment smallint not null check (rating_environment between 1 and 5),
  rating_cleanliness smallint not null check (rating_cleanliness between 1 and 5),
  rating_safety smallint not null check (rating_safety between 1 and 5),
  body text check (char_length(body) <= 2000),
  is_hidden boolean not null default false,
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_one_per_user unique (park_id, user_id)
);

create index reviews_park_idx on public.reviews (park_id, created_at desc);
create index reviews_user_idx on public.reviews (user_id);

create table public.park_photos (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references public.parks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  review_id uuid references public.reviews (id) on delete set null,
  storage_path text not null unique,
  width integer check (width > 0),
  height integer check (height > 0),
  is_hidden boolean not null default false,
  report_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index park_photos_park_idx on public.park_photos (park_id, created_at desc);
create index park_photos_user_idx on public.park_photos (user_id);
create index park_photos_review_idx on public.park_photos (review_id);

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  target_type public.report_target not null,
  target_id uuid not null,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text check (char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  constraint content_reports_once_per_user unique (target_type, target_id, reporter_id)
);

create index content_reports_reporter_idx on public.content_reports (reporter_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger parks_set_updated_at before update on public.parks
  for each row execute function private.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
  for each row execute function private.set_updated_at();

create function private.refresh_park_ratings(target_park_id uuid)
returns void
language sql
set search_path = ''
as $$
  update public.parks as p
  set review_count = stats.review_count,
      rating_overall = stats.rating_overall,
      rating_equipment = stats.rating_equipment,
      rating_environment = stats.rating_environment,
      rating_cleanliness = stats.rating_cleanliness,
      rating_safety = stats.rating_safety
  from (
    select count(*)::integer as review_count,
           round(avg(r.rating_overall), 2) as rating_overall,
           round(avg(r.rating_equipment), 2) as rating_equipment,
           round(avg(r.rating_environment), 2) as rating_environment,
           round(avg(r.rating_cleanliness), 2) as rating_cleanliness,
           round(avg(r.rating_safety), 2) as rating_safety
    from public.reviews as r
    where r.park_id = target_park_id and not r.is_hidden
  ) as stats
  where p.id = target_park_id;
$$;

-- Security definer: authors may delete their own review, which must update the park.
create function private.on_review_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform private.refresh_park_ratings(old.park_id);
  end if;
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.park_id <> old.park_id) then
    perform private.refresh_park_ratings(new.park_id);
  end if;
  return null;
end;
$$;

create trigger reviews_refresh_park_ratings
  after insert or update or delete on public.reviews
  for each row execute function private.on_review_change();

-- ---------------------------------------------------------------------------
-- Rule helpers
-- ---------------------------------------------------------------------------
-- Errors use SQLSTATE PTxxx so the API answers with HTTP status xxx and the message.

create function private.require_user()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception using errcode = 'PT401', message = 'Sign in to contribute.';
  end if;
  return uid;
end;
$$;

create function private.assert_near(
  target_lat double precision,
  target_lng double precision,
  user_lat double precision,
  user_lng double precision
)
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  max_meters integer := private.setting('proximity_meters');
begin
  if user_lat is null or user_lng is null then
    raise exception using errcode = 'PT400', message = 'Your location is needed for this.';
  end if;
  if extensions.st_distance(
    extensions.st_setsrid(extensions.st_makepoint(target_lng, target_lat), 4326)::extensions.geography,
    extensions.st_setsrid(extensions.st_makepoint(user_lng, user_lat), 4326)::extensions.geography
  ) > max_meters then
    raise exception using errcode = 'PT403', message = format('You need to be within %s m of the park.', max_meters);
  end if;
end;
$$;

create function private.validate_equipment(items jsonb)
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
end;
$$;

-- `catalog` is 'equipment' or 'amenity'.
create function private.validate_type_ids(ids jsonb, catalog text)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if ids is null or jsonb_typeof(ids) <> 'array' then
    raise exception using errcode = 'PT400', message = format('The %s changes must be a list.', catalog);
  end if;
  if exists (
    select 1
    from jsonb_array_elements(ids) as item
    where jsonb_typeof(item) <> 'string'
       or (catalog = 'equipment' and not exists (select 1 from public.equipment_types as t where t.id = item #>> '{}'))
       or (catalog = 'amenity' and not exists (select 1 from public.amenity_types as t where t.id = item #>> '{}'))
  ) then
    raise exception using errcode = 'PT400', message = format('Unknown %s.', catalog);
  end if;
end;
$$;

create function private.upsert_park_equipment(target_park_id uuid, items jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform private.validate_equipment(items);
  insert into public.park_equipment (park_id, equipment_type_id, condition)
  select distinct on (item ->> 'type')
         target_park_id, item ->> 'type', coalesce(item ->> 'condition', 'good')::public.equipment_condition
  from jsonb_array_elements(items) as item
  on conflict (park_id, equipment_type_id) do update set condition = excluded.condition;
end;
$$;

create function private.validate_park_changes(
  changes jsonb,
  user_lat double precision,
  user_lng double precision
)
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  allowed constant text[] := array[
    'name', 'description', 'lat', 'lng',
    'equipment_upsert', 'equipment_remove', 'amenities_add', 'amenities_remove'
  ];
  field text;
begin
  if changes is null or jsonb_typeof(changes) <> 'object' or changes = '{}'::jsonb then
    raise exception using errcode = 'PT400', message = 'Describe at least one change.';
  end if;

  for field in select jsonb_object_keys(changes) loop
    if not field = any (allowed) then
      raise exception using errcode = 'PT400', message = format('Unknown field: %s.', field);
    end if;
  end loop;

  if changes ? 'name' and (
    jsonb_typeof(changes -> 'name') <> 'string'
    or char_length(btrim(changes ->> 'name')) not between 2 and 80
  ) then
    raise exception using errcode = 'PT400', message = 'The name must be 2 to 80 characters.';
  end if;

  if changes ? 'description' and (
    jsonb_typeof(changes -> 'description') not in ('string', 'null')
    or char_length(changes ->> 'description') > 1000
  ) then
    raise exception using errcode = 'PT400', message = 'The description must be up to 1000 characters.';
  end if;

  if (changes ? 'lat') <> (changes ? 'lng') then
    raise exception using errcode = 'PT400', message = 'A new location needs both lat and lng.';
  end if;

  if changes ? 'lat' then
    if jsonb_typeof(changes -> 'lat') <> 'number'
       or jsonb_typeof(changes -> 'lng') <> 'number'
       or (changes ->> 'lat')::double precision not between -90 and 90
       or (changes ->> 'lng')::double precision not between -180 and 180 then
      raise exception using errcode = 'PT400', message = 'Invalid location.';
    end if;
    -- The new spot must also be near the user.
    perform private.assert_near(
      (changes ->> 'lat')::double precision, (changes ->> 'lng')::double precision, user_lat, user_lng
    );
  end if;

  if changes ? 'equipment_upsert' then
    perform private.validate_equipment(changes -> 'equipment_upsert');
  end if;
  if changes ? 'equipment_remove' then
    perform private.validate_type_ids(changes -> 'equipment_remove', 'equipment');
  end if;
  if changes ? 'amenities_add' then
    perform private.validate_type_ids(changes -> 'amenities_add', 'amenity');
  end if;
  if changes ? 'amenities_remove' then
    perform private.validate_type_ids(changes -> 'amenities_remove', 'amenity');
  end if;
end;
$$;

create function private.apply_submission(submission public.park_submissions)
returns void
language plpgsql
set search_path = ''
as $$
declare
  c jsonb := submission.changes;
begin
  case submission.kind
    when 'create' then
      update public.parks as p set status = 'approved' where p.id = submission.park_id;

    when 'edit' then
      update public.parks as p
      set name = case when c ? 'name' then btrim(c ->> 'name') else p.name end,
          description = case when c ? 'description' then nullif(btrim(c ->> 'description'), '') else p.description end,
          lat = case when c ? 'lat' then (c ->> 'lat')::double precision else p.lat end,
          lng = case when c ? 'lng' then (c ->> 'lng')::double precision else p.lng end
      where p.id = submission.park_id;

      if c ? 'equipment_upsert' then
        perform private.upsert_park_equipment(submission.park_id, c -> 'equipment_upsert');
      end if;
      if c ? 'equipment_remove' then
        delete from public.park_equipment as pe
        where pe.park_id = submission.park_id
          and pe.equipment_type_id in (select jsonb_array_elements_text(c -> 'equipment_remove'));
      end if;
      if c ? 'amenities_add' then
        insert into public.park_amenities (park_id, amenity_type_id)
        select submission.park_id, added
        from jsonb_array_elements_text(c -> 'amenities_add') as added
        on conflict do nothing;
      end if;
      if c ? 'amenities_remove' then
        delete from public.park_amenities as pa
        where pa.park_id = submission.park_id
          and pa.amenity_type_id in (select jsonb_array_elements_text(c -> 'amenities_remove'));
      end if;

    when 'remove' then
      update public.parks as p set status = 'removed' where p.id = submission.park_id;
      -- Other pending changes to a removed park can no longer apply.
      update public.park_submissions as ps
      set status = 'rejected', resolved_at = now()
      where ps.park_id = submission.park_id and ps.status = 'pending' and ps.id <> submission.id;
  end case;
end;
$$;

-- ---------------------------------------------------------------------------
-- Read API (security invoker: row level security applies)
-- ---------------------------------------------------------------------------

-- Parks inside a map viewport. A park must have every requested equipment and amenity.
create function public.parks_in_view(
  min_lat double precision,
  min_lng double precision,
  max_lat double precision,
  max_lng double precision,
  equipment_ids text[] default '{}',
  amenity_ids text[] default '{}',
  min_rating numeric default null,
  verified_only boolean default false,
  max_results integer default 300
)
returns table (
  id uuid,
  name text,
  lat double precision,
  lng double precision,
  status public.park_status,
  rating_overall numeric,
  review_count integer
)
language sql
stable
set search_path = ''
as $$
  select p.id, p.name, p.lat, p.lng, p.status, p.rating_overall, p.review_count
  from public.parks as p
  where p.lat between parks_in_view.min_lat and parks_in_view.max_lat
    and p.lng between parks_in_view.min_lng and parks_in_view.max_lng
    and (p.status = 'approved' or (p.status = 'pending' and not parks_in_view.verified_only))
    and (parks_in_view.min_rating is null or p.rating_overall >= parks_in_view.min_rating)
    and not exists (
      select 1
      from unnest(parks_in_view.equipment_ids) as wanted (type_id)
      where not exists (
        select 1 from public.park_equipment as pe
        where pe.park_id = p.id and pe.equipment_type_id = wanted.type_id
      )
    )
    and not exists (
      select 1
      from unnest(parks_in_view.amenity_ids) as wanted (type_id)
      where not exists (
        select 1 from public.park_amenities as pa
        where pa.park_id = p.id and pa.amenity_type_id = wanted.type_id
      )
    )
  order by p.review_count desc, p.created_at desc
  limit least(greatest(parks_in_view.max_results, 1), 500);
$$;

-- Parks within contribution range of the user, closest first.
create function public.nearby_parks(user_lat double precision, user_lng double precision)
returns table (
  id uuid,
  name text,
  lat double precision,
  lng double precision,
  status public.park_status,
  distance_meters double precision,
  pending_submissions integer
)
language sql
stable
set search_path = ''
as $$
  with origin as (
    select
      extensions.st_setsrid(extensions.st_makepoint(nearby_parks.user_lng, nearby_parks.user_lat), 4326)::extensions.geography as point,
      (select s.value from public.app_settings as s where s.key = 'proximity_meters') as radius
  )
  select
    p.id,
    p.name,
    p.lat,
    p.lng,
    p.status,
    extensions.st_distance(p.location, origin.point) as distance_meters,
    (
      select count(*)::integer
      from public.park_submissions as ps
      where ps.park_id = p.id and ps.status = 'pending'
    ) as pending_submissions
  from public.parks as p
  cross join origin
  where p.status in ('pending', 'approved')
    and extensions.st_dwithin(p.location, origin.point, origin.radius)
  order by distance_meters
  limit 50;
$$;

-- ---------------------------------------------------------------------------
-- Write API (security definer, signed-in users only)
-- ---------------------------------------------------------------------------

-- Adds a park as 'pending' and opens its 'create' submission.
-- equipment: [{"type": "pull_up_bar", "condition": "good"}, ...]
create function public.create_park(
  name text,
  lat double precision,
  lng double precision,
  user_lat double precision,
  user_lng double precision,
  description text default null,
  equipment jsonb default '[]'::jsonb,
  amenity_ids text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  uid uuid := private.require_user();
  clean_name text := btrim(create_park.name);
  clean_description text := nullif(btrim(create_park.description), '');
  new_park_id uuid;
begin
  perform private.assert_near(create_park.lat, create_park.lng, create_park.user_lat, create_park.user_lng);

  if char_length(clean_name) not between 2 and 80 then
    raise exception using errcode = 'PT400', message = 'The name must be 2 to 80 characters.';
  end if;
  if char_length(clean_description) > 1000 then
    raise exception using errcode = 'PT400', message = 'The description must be up to 1000 characters.';
  end if;
  perform private.validate_equipment(create_park.equipment);
  perform private.validate_type_ids(to_jsonb(create_park.amenity_ids), 'amenity');

  if exists (
    select 1
    from public.parks as p
    where p.status in ('pending', 'approved')
      and extensions.st_dwithin(
        p.location,
        extensions.st_setsrid(extensions.st_makepoint(create_park.lng, create_park.lat), 4326)::extensions.geography,
        private.setting('duplicate_radius_meters')
      )
  ) then
    raise exception using errcode = 'PT409', message = 'There is already a park at this spot.';
  end if;

  insert into public.parks (name, description, lat, lng, created_by)
  values (clean_name, clean_description, create_park.lat, create_park.lng, uid)
  returning id into new_park_id;

  perform private.upsert_park_equipment(new_park_id, create_park.equipment);

  insert into public.park_amenities (park_id, amenity_type_id)
  select new_park_id, wanted.type_id
  from unnest(create_park.amenity_ids) as wanted (type_id)
  on conflict do nothing;

  insert into public.park_submissions (park_id, kind, changes, created_by)
  values (
    new_park_id,
    'create',
    jsonb_build_object(
      'name', clean_name,
      'description', clean_description,
      'lat', create_park.lat,
      'lng', create_park.lng,
      'equipment', create_park.equipment,
      'amenity_ids', to_jsonb(create_park.amenity_ids)
    ),
    uid
  );

  return new_park_id;
end;
$$;

-- Proposes a change to a verified park. See park_submissions for the `changes` format.
create function public.propose_park_edit(
  park_id uuid,
  changes jsonb,
  user_lat double precision,
  user_lng double precision,
  note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  uid uuid := private.require_user();
  target public.parks;
  new_submission_id uuid;
begin
  select * into target from public.parks as p where p.id = propose_park_edit.park_id;
  if not found or target.status <> 'approved' then
    raise exception using errcode = 'PT404', message = 'Only verified parks can be edited.';
  end if;
  perform private.assert_near(target.lat, target.lng, propose_park_edit.user_lat, propose_park_edit.user_lng);
  perform private.validate_park_changes(propose_park_edit.changes, propose_park_edit.user_lat, propose_park_edit.user_lng);

  insert into public.park_submissions (park_id, kind, changes, note, created_by)
  values (target.id, 'edit', propose_park_edit.changes, nullif(btrim(propose_park_edit.note), ''), uid)
  returning id into new_submission_id;

  return new_submission_id;
exception
  when unique_violation then
    raise exception using errcode = 'PT409', message = 'You already have a pending change for this park.';
end;
$$;

-- Proposes removing a verified park that no longer exists.
create function public.propose_park_removal(
  park_id uuid,
  user_lat double precision,
  user_lng double precision,
  note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  uid uuid := private.require_user();
  target public.parks;
  new_submission_id uuid;
begin
  select * into target from public.parks as p where p.id = propose_park_removal.park_id;
  if not found or target.status <> 'approved' then
    raise exception using errcode = 'PT404', message = 'Only verified parks can be removed.';
  end if;
  perform private.assert_near(target.lat, target.lng, propose_park_removal.user_lat, propose_park_removal.user_lng);

  insert into public.park_submissions (park_id, kind, note, created_by)
  values (target.id, 'remove', nullif(btrim(propose_park_removal.note), ''), uid)
  returning id into new_submission_id;

  return new_submission_id;
exception
  when unique_violation then
    raise exception using errcode = 'PT409', message = 'You already have a pending change for this park.';
end;
$$;

-- Confirms or rejects someone else's pending submission. Returns the submission's status
-- after the vote; the change is applied when it reaches the confirmation threshold.
create function public.vote_on_submission(
  submission_id uuid,
  vote public.vote_kind,
  user_lat double precision,
  user_lng double precision
)
returns public.submission_status
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  uid uuid := private.require_user();
  submission public.park_submissions;
  target public.parks;
begin
  select * into submission
  from public.park_submissions as ps
  where ps.id = vote_on_submission.submission_id
  for update;

  if not found then
    raise exception using errcode = 'PT404', message = 'Submission not found.';
  end if;
  if submission.status <> 'pending' then
    raise exception using errcode = 'PT409', message = 'This change was already decided.';
  end if;
  if submission.created_by = uid then
    raise exception using errcode = 'PT403', message = 'You can''t vote on your own change.';
  end if;

  select * into target from public.parks as p where p.id = submission.park_id;
  perform private.assert_near(target.lat, target.lng, vote_on_submission.user_lat, vote_on_submission.user_lng);

  begin
    insert into public.submission_votes (submission_id, user_id, vote)
    values (submission.id, uid, vote_on_submission.vote);
  exception
    when unique_violation then
      raise exception using errcode = 'PT409', message = 'You already voted on this change.';
  end;

  if vote_on_submission.vote = 'confirm' then
    submission.confirmations := submission.confirmations + 1;
  else
    submission.rejections := submission.rejections + 1;
  end if;

  if submission.confirmations >= private.setting('confirmations_required') then
    submission.status := 'approved';
    perform private.apply_submission(submission);
  elsif submission.rejections >= private.setting('rejections_required') then
    submission.status := 'rejected';
    if submission.kind = 'create' then
      update public.parks as p set status = 'rejected' where p.id = submission.park_id;
    end if;
  end if;

  update public.park_submissions as ps
  set confirmations = submission.confirmations,
      rejections = submission.rejections,
      status = submission.status,
      resolved_at = case when submission.status <> 'pending' then now() end
  where ps.id = submission.id;

  return submission.status;
end;
$$;

-- Creates or updates the user's review of a verified park.
create function public.upsert_review(
  park_id uuid,
  rating_overall integer,
  rating_equipment integer,
  rating_environment integer,
  rating_cleanliness integer,
  rating_safety integer,
  user_lat double precision,
  user_lng double precision,
  body text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  uid uuid := private.require_user();
  target public.parks;
  saved_review_id uuid;
begin
  select * into target from public.parks as p where p.id = upsert_review.park_id;
  if not found or target.status <> 'approved' then
    raise exception using errcode = 'PT404', message = 'Only verified parks can be reviewed.';
  end if;
  perform private.assert_near(target.lat, target.lng, upsert_review.user_lat, upsert_review.user_lng);

  insert into public.reviews as r (
    park_id, user_id, rating_overall, rating_equipment, rating_environment,
    rating_cleanliness, rating_safety, body
  )
  values (
    target.id, uid, upsert_review.rating_overall, upsert_review.rating_equipment,
    upsert_review.rating_environment, upsert_review.rating_cleanliness, upsert_review.rating_safety,
    nullif(btrim(upsert_review.body), '')
  )
  on conflict on constraint reviews_one_per_user do update
  set rating_overall = excluded.rating_overall,
      rating_equipment = excluded.rating_equipment,
      rating_environment = excluded.rating_environment,
      rating_cleanliness = excluded.rating_cleanliness,
      rating_safety = excluded.rating_safety,
      body = excluded.body
  returning r.id into saved_review_id;

  return saved_review_id;
end;
$$;

-- Registers a photo the user already uploaded to storage at
-- park-photos/<park_id>/<user_id>/<file>.
create function public.add_park_photo(
  park_id uuid,
  storage_path text,
  user_lat double precision,
  user_lng double precision,
  review_id uuid default null,
  width integer default null,
  height integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  uid uuid := private.require_user();
  target public.parks;
  new_photo_id uuid;
begin
  select * into target from public.parks as p where p.id = add_park_photo.park_id;
  if not found or target.status not in ('pending', 'approved') then
    raise exception using errcode = 'PT404', message = 'Park not found.';
  end if;
  perform private.assert_near(target.lat, target.lng, add_park_photo.user_lat, add_park_photo.user_lng);

  if add_park_photo.storage_path !~ ('^' || target.id::text || '/' || uid::text || '/[^/]+$') then
    raise exception using errcode = 'PT400', message = 'Upload the photo to your folder for this park first.';
  end if;
  if not exists (
    select 1 from storage.objects as o
    where o.bucket_id = 'park-photos' and o.name = add_park_photo.storage_path
  ) then
    raise exception using errcode = 'PT400', message = 'Photo not found in storage.';
  end if;
  if add_park_photo.review_id is not null and not exists (
    select 1 from public.reviews as r
    where r.id = add_park_photo.review_id and r.user_id = uid and r.park_id = target.id
  ) then
    raise exception using errcode = 'PT400', message = 'Review not found.';
  end if;

  insert into public.park_photos (park_id, user_id, review_id, storage_path, width, height)
  values (target.id, uid, add_park_photo.review_id, add_park_photo.storage_path, add_park_photo.width, add_park_photo.height)
  returning id into new_photo_id;

  return new_photo_id;
end;
$$;

-- Reports a review or photo; it is hidden once enough different users report it.
create function public.report_content(
  target_type public.report_target,
  target_id uuid,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  uid uuid := private.require_user();
  author_id uuid;
begin
  if report_content.target_type = 'review' then
    select r.user_id into author_id from public.reviews as r where r.id = report_content.target_id;
  else
    select ph.user_id into author_id from public.park_photos as ph where ph.id = report_content.target_id;
  end if;

  if author_id is null then
    raise exception using errcode = 'PT404', message = 'Content not found.';
  end if;
  if author_id = uid then
    raise exception using errcode = 'PT403', message = 'You can''t report your own content.';
  end if;

  begin
    insert into public.content_reports (target_type, target_id, reporter_id, reason)
    values (report_content.target_type, report_content.target_id, uid, nullif(btrim(report_content.reason), ''));
  exception
    when unique_violation then
      raise exception using errcode = 'PT409', message = 'You already reported this.';
  end;

  if report_content.target_type = 'review' then
    update public.reviews as r
    set report_count = r.report_count + 1,
        is_hidden = r.is_hidden or r.report_count + 1 >= private.setting('report_hide_threshold')
    where r.id = report_content.target_id;
  else
    update public.park_photos as ph
    set report_count = ph.report_count + 1,
        is_hidden = ph.is_hidden or ph.report_count + 1 >= private.setting('report_hide_threshold')
    where ph.id = report_content.target_id;
  end if;
end;
$$;

-- Deletes the signed-in user's account (Google Play requires in-app deletion). Their
-- reviews, photo records and votes are deleted; parks and submissions they created stay.
-- The app must remove the user's files from the park-photos bucket first (Storage API).
create function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := private.require_user();
begin
  delete from auth.users as u where u.id = uid;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges and row level security
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema private from public;
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.parks_in_view to anon, authenticated;
grant execute on function public.nearby_parks to anon, authenticated;
grant execute on function public.create_park to authenticated;
grant execute on function public.propose_park_edit to authenticated;
grant execute on function public.propose_park_removal to authenticated;
grant execute on function public.vote_on_submission to authenticated;
grant execute on function public.upsert_review to authenticated;
grant execute on function public.add_park_photo to authenticated;
grant execute on function public.report_content to authenticated;
grant execute on function public.delete_account to authenticated;

revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;
grant delete on public.reviews, public.park_photos to authenticated;

alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.equipment_types enable row level security;
alter table public.amenity_types enable row level security;
alter table public.parks enable row level security;
alter table public.park_equipment enable row level security;
alter table public.park_amenities enable row level security;
alter table public.park_submissions enable row level security;
alter table public.submission_votes enable row level security;
alter table public.reviews enable row level security;
alter table public.park_photos enable row level security;
alter table public.content_reports enable row level security;

create policy "Settings are public" on public.app_settings
  for select to anon, authenticated using (true);
create policy "Equipment types are public" on public.equipment_types
  for select to anon, authenticated using (true);
create policy "Amenity types are public" on public.amenity_types
  for select to anon, authenticated using (true);

create policy "Profiles are public" on public.profiles
  for select to anon, authenticated using (true);
create policy "Users update their own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Pending and verified parks are public" on public.parks
  for select to anon, authenticated using (status in ('pending', 'approved'));
-- The subqueries below are filtered by the parks policy, so they follow park visibility.
create policy "Equipment of visible parks is public" on public.park_equipment
  for select to anon, authenticated
  using (exists (select 1 from public.parks as p where p.id = park_id));
create policy "Amenities of visible parks are public" on public.park_amenities
  for select to anon, authenticated
  using (exists (select 1 from public.parks as p where p.id = park_id));
create policy "Submissions of visible parks are public" on public.park_submissions
  for select to anon, authenticated
  using (exists (select 1 from public.parks as p where p.id = park_id));

create policy "Users see their own votes" on public.submission_votes
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Visible reviews are public" on public.reviews
  for select to anon, authenticated
  using (not is_hidden or (select auth.uid()) = user_id);
create policy "Users delete their own reviews" on public.reviews
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Visible photos are public" on public.park_photos
  for select to anon, authenticated
  using (not is_hidden or (select auth.uid()) = user_id);
create policy "Users delete their own photos" on public.park_photos
  for delete to authenticated using ((select auth.uid()) = user_id);

-- content_reports has no policies: only report_content() writes it and nobody reads it via the API.

-- ---------------------------------------------------------------------------
-- Storage: park-photos/<park_id>/<user_id>/<file>, publicly readable
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('park-photos', 'park-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Users upload park photos to their own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'park-photos' and (storage.foldername(name))[2] = (select auth.uid()::text));
create policy "Users see their own park photo files" on storage.objects
  for select to authenticated
  using (bucket_id = 'park-photos' and owner_id = (select auth.uid()::text));
create policy "Users delete their own park photo files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'park-photos' and owner_id = (select auth.uid()::text));
