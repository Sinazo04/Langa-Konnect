// Supabase Edge Function (Deno) - Stripe Webhook Handler
// Expects Stripe signature header 'stripe-signature' and STRIPE_WEBHOOK_SECRET env.
// Use explicit Deno standard lib import to satisfy bundler
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
// Use npm imports so Deno bundler can include these packages
import Stripe from 'npm:stripe'
import { createClient } from 'npm:@supabase/supabase-js'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2022-11-15' });
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
// NOTE: Supabase CLI reserves env names starting with 'SUPABASE_' so we read
// the service role key from 'SERVICE_ROLE_KEY' instead when setting via CLI.
const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SERVICE_ROLE_KEY') || '');

serve(async (req) => {
  const sig = req.headers.get('stripe-signature') || '';
  const buf = await req.arrayBuffer();
  const rawBody = new Uint8Array(buf);
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return new Response('Signature mismatch', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Create payment record in Supabase
        await supabase.from('payments').insert([{ provider: 'stripe', amount: session.amount_total || 0, currency: session.currency || 'ZAR', status: 'completed', metadata: session }]);
        // If this was a featured listing (metadata.bizId), mark the business as featured
        try {
          const meta = session.metadata || {};
          if (meta.bizId && meta.featureOption) {
            const days = meta.featureOption === 'premium' ? 30 : 7;
            const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
            await supabase.from('businesses').update({ featured_until: expiresAt }).eq('id', meta.bizId);
          }
        } catch (err) {
          console.error('Could not mark business as featured', err);
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // you may update subscription records here
        await supabase.from('payments').insert([{ provider: 'stripe', amount: invoice.amount_paid || 0, currency: invoice.currency || 'ZAR', status: 'completed', metadata: invoice }]);
        break;
      }
      default:
        console.log('Unhandled event', event.type);
    }
  } catch (err) {
    console.error('Error handling webhook', err);
    return new Response('Webhook handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
