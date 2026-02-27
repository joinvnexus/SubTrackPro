-- Fix schema drift between older camelCase columns and current snake_case code.
-- Run this in Supabase SQL Editor before local/dev or Vercel deploy.

begin;

create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique,
  created_at timestamptz default now()
);

create table if not exists public.user_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  plan text not null default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  stripe_current_period_end timestamptz,
  is_active boolean default true not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  name text,
  description text,
  price integer default 0 not null,
  billing_cycle text,
  category text,
  renewal_date timestamptz,
  is_active boolean default true not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================
-- subscriptions
-- =========================
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'userId'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'user_id'
  ) then
    execute 'alter table public.subscriptions rename column "userId" to user_id';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'billingCycle'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'billing_cycle'
  ) then
    execute 'alter table public.subscriptions rename column "billingCycle" to billing_cycle';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'renewalDate'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'renewal_date'
  ) then
    execute 'alter table public.subscriptions rename column "renewalDate" to renewal_date';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'isActive'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'is_active'
  ) then
    execute 'alter table public.subscriptions rename column "isActive" to is_active';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'createdAt'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'created_at'
  ) then
    execute 'alter table public.subscriptions rename column "createdAt" to created_at';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'updatedAt'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'updated_at'
  ) then
    execute 'alter table public.subscriptions rename column "updatedAt" to updated_at';
  end if;
end $$;

alter table public.subscriptions
  add column if not exists description text,
  add column if not exists user_id uuid,
  add column if not exists billing_cycle text,
  add column if not exists renewal_date timestamptz,
  add column if not exists is_active boolean,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.subscriptions
set is_active = true
where is_active is null;

update public.subscriptions
set created_at = now()
where created_at is null;

update public.subscriptions
set updated_at = now()
where updated_at is null;

alter table public.subscriptions
  alter column is_active set default true,
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'subscriptions_user_id_idx'
  ) then
    execute 'create index subscriptions_user_id_idx on public.subscriptions(user_id)';
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'subscriptions_renewal_date_idx'
  ) then
    execute 'create index subscriptions_renewal_date_idx on public.subscriptions(renewal_date)';
  end if;
end $$;

-- =========================
-- user_plans
-- =========================
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'userId'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'user_id'
  ) then
    execute 'alter table public.user_plans rename column "userId" to user_id';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'stripeCustomerId'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'stripe_customer_id'
  ) then
    execute 'alter table public.user_plans rename column "stripeCustomerId" to stripe_customer_id';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'stripeSubscriptionId'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'stripe_subscription_id'
  ) then
    execute 'alter table public.user_plans rename column "stripeSubscriptionId" to stripe_subscription_id';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'stripePriceId'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'stripe_price_id'
  ) then
    execute 'alter table public.user_plans rename column "stripePriceId" to stripe_price_id';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'stripeCurrentPeriodEnd'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'stripe_current_period_end'
  ) then
    execute 'alter table public.user_plans rename column "stripeCurrentPeriodEnd" to stripe_current_period_end';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'isActive'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'is_active'
  ) then
    execute 'alter table public.user_plans rename column "isActive" to is_active';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'createdAt'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'created_at'
  ) then
    execute 'alter table public.user_plans rename column "createdAt" to created_at';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'updatedAt'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_plans' and column_name = 'updated_at'
  ) then
    execute 'alter table public.user_plans rename column "updatedAt" to updated_at';
  end if;
end $$;

alter table public.user_plans
  add column if not exists user_id uuid,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists stripe_current_period_end timestamptz,
  add column if not exists is_active boolean,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.user_plans
set is_active = true
where is_active is null;

update public.user_plans
set created_at = now()
where created_at is null;

update public.user_plans
set updated_at = now()
where updated_at is null;

alter table public.user_plans
  alter column is_active set default true,
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'user_plans_user_id_idx'
  ) then
    execute 'create index user_plans_user_id_idx on public.user_plans(user_id)';
  end if;
end $$;

commit;
