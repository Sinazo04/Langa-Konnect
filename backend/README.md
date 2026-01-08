# Backend setup (Supabase) — Langa Konnect

This document shows the recommended quick steps to set up a Supabase backend for Langa Konnect. It includes the schema, storage, and Stripe integration notes.

1. Create a Supabase project
   - Go to https://app.supabase.com and create a project.
   - Choose a strong password and note the project URL and anon/public keys.

2. Run the SQL schema
   - Open the SQL editor in Supabase and run `backend/sql/schema.sql` (this will create tables and example plans).

3. Enable Storage for images
   - Go to Storage and create a bucket (e.g., `business-images`) with public or signed URL access.

4. Auth
   - Use Supabase Auth for sign-up/login (email + password). Sync profile data to `profiles` table via a server function or on-demand when a user first logs in.

5. Stripe (payments)
   - Create a Stripe account in South Africa and set default currency to ZAR.
   - Create products/plans in Stripe corresponding to `plans` in the database.
   - Create a webhook endpoint (example in `functions/stripe-webhook-example.js`) and register it in Stripe dashboard.

6. Webhooks & Server functions
   - Use Supabase Edge Functions or a small server (Node/Express) to receive webhooks from Stripe/PayPal and update your `subscriptions` and `payments` tables.

7. Connect frontend
   - Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your frontend environment (or in `index.html` as meta tags for local testing). Use `@supabase/supabase-js` in the client.

8. Storage security
   - Configure rules for the `business-images` bucket to allow uploads only for authenticated users (or use signed URL upload flow).

9. Deploy
   - Deploy frontend to Vercel/Netlify and connect backend to Supabase. Set webhook endpoints and production keys in env variables.

If you want, I can set up a Supabase project and wire it with this code, create the Stripe products and webhooks, and push an example integration next.
