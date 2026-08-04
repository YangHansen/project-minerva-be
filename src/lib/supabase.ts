import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from '../config';

let instance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  return (instance ??= createClient(
    getConfig().supabaseUrl,
    getConfig().supabaseServiceRoleKey
  ));
}
