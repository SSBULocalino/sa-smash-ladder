# SA Smash Ladder
1. `npm i` · copia `.env.example` → `.env.local` y completa las 3 claves.
2. En Supabase SQL Editor: tu esquema original, luego `supabase/002_extensions_and_rls.sql`.
3. Auth → Providers → Discord (Client ID/Secret). Redirect URL: `<SUPABASE_URL>/auth/v1/callback`; añade `http://localhost:3000/auth/callback` a las Redirect URLs de Supabase.
4. `npm run dev`
