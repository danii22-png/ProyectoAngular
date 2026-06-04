import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabase.com/dashboard/project/ukbhxvdbqotfykwbvxej';
const supabaseKey = 'sb_publishable_owzSElL6pHEJ7QFrJH1_WA_ApRMFy0T';

export const environment = {
    production: false,
    supabaseUrl: 'https://supabase.com/dashboard/project/ukbhxvdbqotfykwbvxej',
    supabaseAnonKey: 'sb_publishable_owzSElL6pHEJ7QFrJH1_WA_ApRMFy0T'
  };


export const supabase = createClient(
    'https://ukbhxvdbqotfykwbvxej.supabase.co',
    'https://ukbhxvdbqotfykwbvxej.supabase.co/rest/v1/usuarios01'
  );