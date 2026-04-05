import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// 1. Client Reguler (Untuk operasional sehari-hari)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 2. Client Admin (Khusus untuk Bypass Auth seperti Create User)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false // Penting: Agar admin tidak ikut ter-logout/login
  }
})