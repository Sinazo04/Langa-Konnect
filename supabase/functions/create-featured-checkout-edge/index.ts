// Supabase Edge Function (Deno) - Create Stripe Checkout Session for one-off payments (featured listing)
// Expects JSON body with: { amount, currency, name, successUrl, cancelUrl, customerEmail, metadata }

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
import Stripe from 'npm:stripe'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2022-11-15' });

serve(async (req) => {
  try {
    const body = await req.json();
    const { amount, currency = 'zar', name, successUrl, cancelUrl, customerEmail, metadata } = body;
    if (!amount || !name || !successUrl || !cancelUrl) return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400 });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency,
          product_data: { name },
          unit_amount: amount
        },
        quantity: 1
      }],
      metadata: metadata || {},
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
