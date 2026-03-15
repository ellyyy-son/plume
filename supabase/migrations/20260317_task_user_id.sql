-- Add ownership field to tasks so each task is tied to the creator.
-- Existing rows remain unchanged; new/updated app writes should provide user_id.

alter table if exists public.task
add column if not exists user_id uuid;

alter table if exists public.task
add constraint if not exists task_user_id_fkey
foreign key (user_id) references auth.users (id) on delete cascade;

create index if not exists task_user_id_idx
on public.task (user_id);

