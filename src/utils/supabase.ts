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
  const url = (
    env.VITE_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.SUPABASE_URL ||
    ''
  ).trim();

  const anonKey = (
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();

  return { url, anonKey };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  try {
    if (!supabaseInstance) {
      supabaseInstance = createClient(config.url, config.anonKey);
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

-- 2. TRC-20 Orders & Blockchain Deposits Table
CREATE TABLE IF NOT EXISTS public.trc20_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.portal_users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  amount_usdt NUMERIC NOT NULL,
  tokens_to_credit INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  tx_hash TEXT,
  verified_amount NUMERIC,
  verification_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. System & Gateway Settings Table
CREATE TABLE IF NOT EXISTS public.portal_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_settings',
  deposit_address TEXT NOT NULL,
  usdt_contract TEXT NOT NULL,
  tokens_per_usdt INTEGER NOT NULL DEFAULT 1,
  packages JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Seed initial admin and client
INSERT INTO public.portal_users (id, email, role, token_balance)
VALUES 
  ('user-admin-1', 'smada.io', 'admin', 9999),
  ('user-client-1', 'client@test.com', 'client', 0)
ON CONFLICT (id) DO NOTHING;
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
      const { error } = await client
        .from('trc20_orders')
        .upsert(order);
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
    if (!client) return false;
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

      // Try portal_packages table first
      const { error: pkgErr } = await client
        .from('portal_packages')
        .upsert(formatted);

      // Also try portal_settings json
      await client
        .from('portal_settings')
        .upsert({
          id: 'global_settings',
          packages: packages,
          updated_at: new Date().toISOString()
        });

      return !pkgErr;
    } catch (err) {
      console.warn('Supabase upsertPackages fallback warning:', err);
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
