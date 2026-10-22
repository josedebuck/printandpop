import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Devuelve null si todavía no configuraste las variables de entorno,
// así la app abre igual mientras armás Supabase.
export const supabase = url && key ? createClient(url, key) : null;
