-- Run this whole file in Supabase SQL Editor.
create extension if not exists pgcrypto;
do $$ begin
  create type public.user_role as enum ('admin','teacher');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', email text, role public.user_role not null default 'teacher',
  avatar_url text, active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(), name text not null, section text not null, academic_year text not null default '2026-27', teacher_id uuid references public.profiles(id) on delete set null, room text, created_at timestamptz not null default now(), unique(name,section,academic_year)
);
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(), admission_no text unique not null, full_name text not null, class_id uuid references public.classes(id) on delete set null, roll_no integer, guardian_name text, guardian_phone text, active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(), name text not null, class_id uuid references public.classes(id) on delete cascade, description text, created_at timestamptz not null default now(), unique(name,class_id)
);
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade, class_id uuid not null references public.classes(id) on delete cascade, attendance_date date not null, status text not null check(status in ('present','absent','late')), marked_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), unique(student_id,attendance_date)
);
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(), title text not null, description text, class_id uuid references public.classes(id) on delete cascade, subject_id uuid references public.subjects(id) on delete set null, due_date date, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(), title text not null, body text not null, audience text not null default 'all', created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.timetable (
  id uuid primary key default gen_random_uuid(), class_id uuid references public.classes(id) on delete cascade, subject_id uuid references public.subjects(id) on delete set null, day_of_week int not null check(day_of_week between 1 and 7), start_time time not null, end_time time not null, room text
);

create table if not exists public.classroom_lessons (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text not null default '',
  slides jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists classroom_lessons_class_idx on public.classroom_lessons(class_id);
create index if not exists assignments_class_idx on public.assignments(class_id);
create index if not exists attendance_class_date_idx on public.attendance(class_id,attendance_date);


create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name,email,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.email,'teacher'); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and active=true); $$;
create or replace function public.is_teacher() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='teacher' and active=true); $$;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.attendance enable row level security;
alter table public.assignments enable row level security;
alter table public.notices enable row level security;
alter table public.timetable enable row level security;
alter table public.classroom_lessons enable row level security;

drop policy if exists profiles_self on public.profiles;
drop policy if exists profiles_admin on public.profiles;
create policy profiles_self on public.profiles for select using(id=auth.uid() or public.is_admin());
create policy profiles_admin on public.profiles for all using(public.is_admin()) with check(public.is_admin());

drop policy if exists classes_read on public.classes;
drop policy if exists classes_admin on public.classes;
create policy classes_read on public.classes for select using(public.is_admin() or (public.is_teacher() and teacher_id=auth.uid()));
create policy classes_admin on public.classes for all using(public.is_admin()) with check(public.is_admin());

drop policy if exists students_read on public.students;
drop policy if exists students_admin on public.students;
create policy students_read on public.students for select using(public.is_admin() or (public.is_teacher() and exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid())));
create policy students_admin on public.students for all using(public.is_admin()) with check(public.is_admin());

drop policy if exists subjects_read on public.subjects;
drop policy if exists subjects_admin on public.subjects;
create policy subjects_read on public.subjects for select using(public.is_admin() or (public.is_teacher() and exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid())));
create policy subjects_admin on public.subjects for all using(public.is_admin()) with check(public.is_admin());

drop policy if exists attendance_access on public.attendance;
create policy attendance_access on public.attendance for all using(public.is_admin() or (public.is_teacher() and exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid()))) with check(public.is_admin() or (public.is_teacher() and exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid())));

drop policy if exists assignments_access on public.assignments;
create policy assignments_access on public.assignments for all using(public.is_admin() or (public.is_teacher() and (created_by=auth.uid() or exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid())))) with check(public.is_admin() or (public.is_teacher() and exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid())));

drop policy if exists notices_access on public.notices;
create policy notices_access on public.notices for select using(public.is_admin() or public.is_teacher());
create policy notices_admin on public.notices for all using(public.is_admin()) with check(public.is_admin());

drop policy if exists timetable_access on public.timetable;
create policy timetable_access on public.timetable for select using(public.is_admin() or (public.is_teacher() and exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid())));
create policy timetable_admin on public.timetable for all using(public.is_admin()) with check(public.is_admin());

create or replace function public.teacher_id_is_owner(owner_id uuid, class_id_value uuid, teacher_id_value uuid) returns boolean language sql stable security definer set search_path=public as $$ select owner_id=teacher_id_value and exists(select 1 from public.classes where id=class_id_value and teacher_id=teacher_id_value); $$;

drop policy if exists classroom_lessons_teacher_read on public.classroom_lessons;
drop policy if exists classroom_lessons_teacher_write on public.classroom_lessons;
drop policy if exists classroom_lessons_admin on public.classroom_lessons;
create policy classroom_lessons_teacher_read on public.classroom_lessons for select using(public.is_admin() or (public.is_teacher() and exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid())));
create policy classroom_lessons_teacher_write on public.classroom_lessons for all using(public.teacher_id_is_owner(created_by, class_id, auth.uid())) with check(public.is_teacher() and created_by=auth.uid() and exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid()));
create policy classroom_lessons_admin on public.classroom_lessons for all using(public.is_admin()) with check(public.is_admin());

-- After registering the first account, make it an admin by replacing the email below:
-- update public.profiles set role='admin' where email='admin@your-school.com';
