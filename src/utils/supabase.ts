import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Order, SavedClientProfile } from '../types';
import { PortalSettings } from './portalStore';

// Supabase environment variables or localStorage overrides
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const env = (import.meta as any).env || {};
  let url = (
    env.VITE_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.SUPABASE_URL ||
    ''
  ).trim();

  let anonKey = (
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();

  // Allow admin runtime configuration via localStorage if env vars not provided
  if (!url && typeof localStorage !== 'undefined') {
    url = (localStorage.getItem('bryt_supabase_url') || '').trim();
  }
  if (!anonKey && typeof localStorage !== 'undefined') {
    anonKey = (localStorage.getItem('bryt_supabase_anon_key') || '').trim();
  }

  return { url, anonKey };
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): void {
  if (typeof localStorage !== 'undefined') {
    if (url.trim()) {
      localStorage.setItem('bryt_supabase_url', url.trim());
    } else {
      localStorage.removeItem('bryt_supabase_url');
    }
    if (anonKey.trim()) {
      localStorage.setItem('bryt_supabase_anon_key', anonKey.trim());
    } else {
      localStorage.removeItem('bryt_supabase_anon_key');
    }
  }
  supabaseInstance = null;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  try {
    if (!supabaseInstance) {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    }
    return supabaseInstance;
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

// Subscribe to real-time changes in portal_packages so all customers reflect new tiers instantly
export function subscribeToRemotePackageChanges(onUpdate: (packages: any[]) => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const channel = client
      .channel('realtime_packages_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portal_packages' },
        async () => {
          const fresh = await SupabaseService.fetchPackages();
          if (fresh && fresh.length > 0) {
            onUpdate(fresh);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime package subscription error:', err);
    return () => {};
  }
}

// SQL Schema for user reference to create Supabase tables
export const SUPABASE_SQL_SCHEMA = `
-- Supabase Database Migration for Bryt Barcode Tec
-- Run this in your Supabase SQL Editor:

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.portal_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'client',
  token_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Crypto Orders & Blockchain Deposits Table (USDT, BTC, LTC)
CREATE TABLE IF NOT EXISTS public.trc20_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.portal_users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  amount_usdt NUMERIC NOT NULL,
  tokens_to_credit INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  payment_method TEXT DEFAULT 'usdt',
  deposit_address TEXT,
  tx_hash TEXT,
  verified_amount NUMERIC,
  verification_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. System & Gateway Settings Table
CREATE TABLE IF NOT EXISTS public.portal_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_settings',
  deposit_address TEXT NOT NULL DEFAULT 'TNPeeC4p9C5aX6Kqf6Hh1mRz8KqF5aX6Kq',
  btc_deposit_address TEXT,
  ltc_deposit_address TEXT,
  usdt_contract TEXT NOT NULL DEFAULT 'TR7NHqjekKQxGTCi8q8ZY4pL8otSzgjLj6',
  tokens_per_usdt INTEGER NOT NULL DEFAULT 1,
  packages JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist if tables were created in a previous version
ALTER TABLE IF EXISTS public.portal_settings 
  ADD COLUMN IF NOT EXISTS btc_deposit_address TEXT,
  ADD COLUMN IF NOT EXISTS ltc_deposit_address TEXT,
  ALTER COLUMN deposit_address SET DEFAULT 'TNPeeC4p9C5aX6Kqf6Hh1mRz8KqF5aX6Kq';

ALTER TABLE IF EXISTS public.trc20_orders 
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'usdt',
  ADD COLUMN IF NOT EXISTS deposit_address TEXT;

-- 4. Barcode Packages Catalog Table
CREATE TABLE IF NOT EXISTS public.portal_packages (
  id TEXT PRIMARY KEY,
  usdt NUMERIC NOT NULL,
  tokens INTEGER NOT NULL,
  label TEXT NOT NULL,
  bonus TEXT,
  description TEXT,
  popular BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Saved Client Barcode Profiles
CREATE TABLE IF NOT EXISTS public.saved_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  cardholder_name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  aamva_version TEXT NOT NULL,
  compliance_score INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload_data JSONB NOT NULL
);

-- 6. Disable Row Level Security (RLS) so the web app can read/write without auth blocking
ALTER TABLE IF EXISTS public.portal_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portal_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trc20_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portal_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.saved_profiles DISABLE ROW LEVEL SECURITY;

-- Seed initial admin
INSERT INTO public.portal_users (id, email, role, token_balance)
VALUES 
  ('user-admin-1', 'smada.io', 'admin', 9999)
ON CONFLICT (id) DO UPDATE SET role = 'admin';
`;

// Supabase Async Synchronization Helpers
export const SupabaseService = {
  async fetchUsers(): Promise<User[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('portal_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as User[];
    } catch (err) {
      console.warn('Supabase fetchUsers fallback:', err);
      return null;
    }
  },

  async upsertUser(user: User): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client
        .from('portal_users')
        .upsert({
          id: user.id,
          email: user.email,
          role: user.role,
          token_balance: user.token_balance,
          created_at: user.created_at
        });
      return !error;
    } catch (err) {
      console.warn('Supabase upsertUser error:', err);
      return false;
    }
  },

  async deleteUser(userId: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client
        .from('portal_users')
        .delete()
        .eq('id', userId);
      return !error;
    } catch (err) {
      console.warn('Supabase deleteUser error:', err);
      return false;
    }
  },

  async fetchOrders(): Promise<Order[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('trc20_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    } catch (err) {
      console.warn('Supabase fetchOrders fallback:', err);
      return null;
    }
  },

  async upsertOrder(order: Order): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const dbPayload = {
        id: order.id,
        user_id: order.user_id,
        user_email: order.user_email,
        amount_usdt: order.amount_usdt,
        tokens_to_credit: order.tokens_to_credit,
        tx_hash: order.tx_hash || null,
        status: order.status,
        verified_amount: order.verified_amount || null,
        verification_note: order.verification_note || (order.payment_method ? `Method: ${order.payment_method.toUpperCase()}` : null),
        created_at: order.created_at,
        updated_at: order.updated_at
      };
      const { error } = await client
        .from('trc20_orders')
        .upsert(dbPayload);
      return !error;
    } catch (err) {
      console.warn('Supabase upsertOrder error:', err);
      return false;
    }
  },

  async fetchPackages(): Promise<any[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      // 1. Check portal_packages table
      const { data: pkgData, error: pkgErr } = await client
        .from('portal_packages')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!pkgErr && pkgData && pkgData.length > 0) {
        return pkgData.map(p => ({
          id: p.id,
          usdt: Number(p.usdt),
          tokens: Number(p.tokens),
          label: p.label,
          bonus: p.bonus || undefined,
          description: p.description || undefined,
          popular: Boolean(p.popular),
          enabled: p.enabled !== false
        }));
      }

      // 2. Check portal_settings packages column
      const { data: settingData, error: settingErr } = await client
        .from('portal_settings')
        .select('packages')
        .eq('id', 'global_settings')
        .maybeSingle();

      if (!settingErr && settingData && Array.isArray(settingData.packages) && settingData.packages.length > 0) {
        return settingData.packages;
      }

      return null;
    } catch (err) {
      console.warn('Supabase fetchPackages fallback:', err);
      return null;
    }
  },

  async upsertPackages(packages: any[]): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase client not initialized: Missing URL or Anon Key');
      return false;
    }
    try {
      const formatted = packages.map((p, idx) => ({
        id: p.id,
        usdt: p.usdt,
        tokens: p.tokens,
        label: p.label,
        bonus: p.bonus || null,
        description: p.description || null,
        popular: Boolean(p.popular),
        enabled: p.enabled !== false,
        sort_order: idx,
        updated_at: new Date().toISOString()
      }));

      // 1. Try portal_packages table
      const { error: pkgErr } = await client
        .from('portal_packages')
        .upsert(formatted, { onConflict: 'id' });

      if (pkgErr) {
        console.error('Supabase portal_packages upsert error:', pkgErr);
      }

      // Cleanup deleted tiers from remote table
      if (packages.length > 0) {
        const activeIds = packages.map(p => p.id);
        const { error: delErr } = await client
          .from('portal_packages')
          .delete()
          .not('id', 'in', `(${activeIds.map(id => `"${id}"`).join(',')})`);
        if (delErr) {
          console.warn('Supabase cleanup deleted packages warning:', delErr);
        }
      }

      // 2. Also sync to portal_settings with complete record to avoid NOT NULL constraint errors
      const { data: existingSettings } = await client
        .from('portal_settings')
        .select('*')
        .eq('id', 'global_settings')
        .maybeSingle();

      const { error: settingErr } = await client
        .from('portal_settings')
        .upsert({
          id: 'global_settings',
          deposit_address: existingSettings?.deposit_address || 'TNPeeC4p9C5aX6Kqf6Hh1mRz8KqF5aX6Kq',
          btc_deposit_address: existingSettings?.btc_deposit_address || null,
          ltc_deposit_address: existingSettings?.ltc_deposit_address || null,
          usdt_contract: existingSettings?.usdt_contract || 'TR7NHqjekKQxGTCi8q8ZY4pL8otSzgjLj6',
          tokens_per_usdt: existingSettings?.tokens_per_usdt || 1,
          packages: packages,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (settingErr) {
        console.error('Supabase portal_settings upsert error:', settingErr);
      }

      // Success if at least one target succeeded without critical blockage
      return !pkgErr || !settingErr;
    } catch (err) {
      console.error('Supabase upsertPackages exception:', err);
      return false;
    }
  },

  async deleteRemotePackage(pkgId: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      await client
        .from('portal_packages')
        .delete()
        .eq('id', pkgId);
      return true;
    } catch (err) {
      return false;
    }
  }
};
