-- Supabase schema for Langa Konnect (Postgres)
-- Run these commands in your Supabase SQL editor or via psql

-- Users: if using Supabase Auth, store extra profile in 'profiles'
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'business-owner', -- 'business-owner' | 'customer' | 'admin'
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- Business listings
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner uuid references profiles(id) on delete set null,
  name text not null,
  category text,
  description text,
  contact text,
  location text,
  hours jsonb,
  social jsonb,
  tags text[],
  featured_until timestamptz,
  created_at timestamptz default now()
);

-- Business images (can also use Supabase Storage)
create table if not exists business_images (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  url text not null,
  alt text,
  ordinal int default 0,
  created_at timestamptz default now()
);

-- Reviews
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  author uuid references profiles(id) on delete set null,
  rating int check (rating >=1 and rating <=5),
  comment text,
  created_at timestamptz default now()
);

-- Events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Plans for subscriptions
create table if not exists plans (
  id text primary key,
  title text not null,
  description text,
  price_monthly numeric default 0,
  price_yearly numeric default 0,
  features jsonb,
  currency text default 'ZAR'
);

-- Insert example plans
insert into plans (id, title, description, price_monthly, price_yearly, features) values
('basic', 'Basic', 'Free listing with limited reach', 0, 0, '["1 photo","public listing"]') ON CONFLICT DO NOTHING;
insert into plans (id, title, description, price_monthly, price_yearly, features) values
('pro', 'Pro', 'Featured listing, gallery, analytics', 99, 999, '["featured","gallery","analytics"]') ON CONFLICT DO NOTHING;

-- Subscriptions and payments
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  plan_id text references plans(id),
  provider text, -- 'stripe' | 'paypal'
  provider_subscription_id text,
  status text,
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  provider text,
  amount numeric,
  currency text default 'ZAR',
  status text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Analytics (event log for aggregation)
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  event_type text not null, -- 'view' | 'contact' | 'lead'
  payload jsonb,
  created_at timestamptz default now()
);

-- Ads / sponsors
create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id),
  image_url text,
  target_url text,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz default now()
);

-- Basic indexes
create index if not exists idx_businesses_category on businesses(category);
create index if not exists idx_businesses_owner on businesses(owner);
create index if not exists idx_analytics_business_time on analytics_events(business_id, created_at);

-- Note: Supabase Auth provides an 'auth.users' table and lifecycle triggers may be needed to keep profiles in sync.
