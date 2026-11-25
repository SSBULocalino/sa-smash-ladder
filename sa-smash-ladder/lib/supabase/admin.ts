import { createClient } from '@supabase/supabase-js';
/** Solo en Server Actions. Nunca importar desde componentes cliente. */
export const createAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
