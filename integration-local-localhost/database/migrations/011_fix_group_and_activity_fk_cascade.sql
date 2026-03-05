-- Ensure group/activity child rows are cleaned automatically when parent rows are deleted.
-- This migration is idempotent and safe for environments where some tables may be absent.

DO $$
BEGIN
  IF to_regclass('public.group_members') IS NOT NULL THEN
    ALTER TABLE public.group_members
      DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;

    ALTER TABLE public.group_members
      ADD CONSTRAINT group_members_group_id_fkey
      FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.activity_participants') IS NOT NULL THEN
    ALTER TABLE public.activity_participants
      DROP CONSTRAINT IF EXISTS activity_participants_activity_id_fkey;

    ALTER TABLE public.activity_participants
      ADD CONSTRAINT activity_participants_activity_id_fkey
      FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;
  END IF;
END $$;
