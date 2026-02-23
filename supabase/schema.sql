-- SubTrack Pro - Database Schema for Supabase
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for profiles email lookup
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- ============================================
-- USER PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  stripe_current_period_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user plans lookup
CREATE INDEX IF NOT EXISTS user_plans_user_id_idx ON public.user_plans(user_id);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- price in cents
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  category TEXT NOT NULL,
  renewal_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_renewal_date_idx ON public.subscriptions(renewal_date);
CREATE INDEX IF NOT EXISTS subscriptions_category_idx ON public.subscriptions(category);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Profiles are viewable by owner" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User plans policies
CREATE POLICY "User plans are viewable by owner" ON public.user_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plan" ON public.user_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plan" ON public.user_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Subscriptions are viewable by owner" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- AUTO-CREATE PROFILE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- Insert into profiles table
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- Insert default free plan
  INSERT INTO public.user_plans (user_id, plan, is_active)
  VALUES (NEW.id, 'free', true)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STORAGE BUCKETS (Optional - for avatar uploads)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar upload for authenticated users"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar update for owner"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- FUNCTION TO GET SUBSCRIPTION COUNT
-- ============================================
CREATE OR REPLACE FUNCTION public.get_subscription_count(user_uuid UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT
  FROM public.subscriptions
  WHERE user_id = user_uuid AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION TO CHECK PLAN LIMIT
-- ============================================
CREATE OR REPLACE FUNCTION public.check_plan_limit(user_uuid UUID)
RETURNS TABLE(can_add BOOLEAN, current_count BIGINT, max_count INTEGER) AS $$
DECLARE
  user_plan TEXT;
  sub_count BIGINT;
  max_allowed INTEGER := 5; -- Default free plan limit
BEGIN
  -- Get user's plan
  SELECT plan INTO user_plan
  FROM public.user_plans
  WHERE user_id = user_uuid AND is_active = true
  LIMIT 1;

  -- Set max based on plan
  IF user_plan = 'pro' THEN
    max_allowed := 1000; -- Unlimited for pro
  END IF;

  -- Get current subscription count
  SELECT COUNT(*)::BIGINT INTO sub_count
  FROM public.subscriptions
  WHERE user_id = user_uuid AND is_active = true;

  can_add := sub_count < max_allowed;
  current_count := sub_count;
  max_count := max_allowed;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ANALYTICS VIEW
-- ============================================
CREATE OR REPLACE VIEW public.subscription_analytics AS
SELECT 
  s.user_id,
  COUNT(*) as total_subscriptions,
  SUM(CASE WHEN s.billing_cycle = 'monthly' THEN s.price 
           WHEN s.billing_cycle = 'yearly' THEN s.price / 12 
           ELSE 0 END) as mrr_cents,
  SUM(CASE WHEN s.billing_cycle = 'yearly' THEN s.price ELSE 0 END) as yearly_subscriptions,
  COUNT(DISTINCT s.category) as unique_categories
FROM public.subscriptions s
WHERE s.is_active = true
GROUP BY s.user_id;
