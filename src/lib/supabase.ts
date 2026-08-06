import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from '../config';
import { MAX_DOCUMENT_BYTES } from './validation';

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
  // ponytail: authoritative 2MB cap lives on the bucket (files bypass the API via signed PUT)
  const { error } = await supabase.storage.updateBucket('documents', {
    public: false,
    fileSizeLimit: MAX_DOCUMENT_BYTES
  });
  if (error) throw new Error(`Failed to set "documents" size limit: ${error.message}`);
}

export async function ensureAvatarsBucket() {
  const supabase = getSupabase();
  const { data } = await supabase.storage.getBucket('avatars');
  if (!data) {
    const { error } = await supabase.storage.createBucket('avatars', { public: false });
    if (error) throw new Error(`Failed to create "avatars" bucket: ${error.message}`);
    console.log('Supabase bucket "avatars" created (private)');
  }
  const { error } = await supabase.storage.updateBucket('avatars', {
    public: false,
    fileSizeLimit: MAX_DOCUMENT_BYTES
  });
  if (error) throw new Error(`Failed to set "avatars" size limit: ${error.message}`);
}
