-- New parks must be at least 50 m (was 30 m) from a visible park. Decided 2026-10-23.

update public.app_settings
set value = 50
where key = 'duplicate_radius_meters';
