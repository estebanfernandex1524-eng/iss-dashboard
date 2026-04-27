import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wxdpnoybhpuhlvhebybd.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_oThbxfF_bFwSq8K_3FFj9A_smcO_K-w'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
