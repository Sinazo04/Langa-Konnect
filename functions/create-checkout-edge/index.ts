// Supabase Edge Function (Deno) - Create Stripe Checkout Session
// Deploy as an Edge Function. Expects JSON body with: { priceId, successUrl, cancelUrl, customerEmail }

import { serve } from 'std/server'
import Stripe from 'stripe'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2022-11-15' });

serve(async (req) => {
  try {
    const body = await req.json();
    const { priceId, successUrl, cancelUrl, customerEmail } = body;
    if (!priceId || !successUrl || !cancelUrl) return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400 });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
  }
});
