import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from '../config';

let instance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  return (instance ??= createClient(
    getConfig().supabaseUrl,
    getConfig().supabaseServiceRoleKey
  ));
}

export async function ensureDocumentsBucket() {
  const supabase = getSupabase();
  const { data } = await supabase.storage.getBucket('documents');
  if (!data) {
    const { error } = await supabase.storage.createBucket('documents', { public: false });
    if (error) throw new Error(`Failed to create "documents" bucket: ${error.message}`);
    console.log('Supabase bucket "documents" created (private)');
  }
}
