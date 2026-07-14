-- 0005_unique_anchor_title.sql
-- Prevent duplicate anchors: at most one anchor per (user, title),
-- case-insensitive. This is the authoritative guard — the client-side check in
-- createAnchor() is only a friendly first line of defense and can't stop races.
--
-- IMPORTANT: creating this index FAILS if duplicate rows already exist. Run the
-- de-duplication first (e.g. the "Meditate" cleanup), then create the index.
--
-- Find existing duplicates:
--   select user_id, lower(title) as t, count(*)
--   from public.anchors
--   group by user_id, lower(title)
--   having count(*) > 1;
--
-- After removing the loser row(s) (keep the one with more sessions), run:

create unique index if not exists anchors_user_title_unique
  on public.anchors (user_id, lower(title));
