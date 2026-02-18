-- Run this once in Supabase SQL Editor
-- Project: mrtc.kr 개선 프로젝트

create extension if not exists pgcrypto;

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null default '',
  subtitle text not null default '',
  body text not null default '',
  hero_image_url text not null default '',
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_site_content_updated_at on public.site_content;
create trigger trg_site_content_updated_at
before update on public.site_content
for each row execute function public.set_updated_at();

insert into public.site_content (key, title, subtitle, body, hero_image_url)
values (
  'home',
  'mrtc.kr',
  '환영합니다',
  '이 텍스트는 관리자 페이지에서 수정할 수 있습니다.',
  ''
)
on conflict (key) do nothing;
