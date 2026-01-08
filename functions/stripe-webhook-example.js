/*
  Example Stripe webhook handler (Node + Express)
  - Use this as a template for a small server or Supabase Edge Function
  - It verifies the Stripe signature and updates the Supabase DB via REST or client library
*/
const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Optional: initialize Supabase client to update DB
// const { createClient } = require('@supabase/supabase-js');
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // Handle relevant events
  switch (event.type) {
    case 'checkout.session.completed':
      // You can mark payment as completed and create a subscription record
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);
      // TODO: Update payments/subscriptions in Supabase
      break;
    case 'invoice.payment_succeeded':
      // Handle recurring subscription payment
      console.log('Invoice succeeded:', event.data.object.id);
      break;
    case 'customer.subscription.updated':
      console.log('Subscription updated:', event.data.object.id);
      break;
    default:
      console.log('Unhandled event type', event.type);
  }

  res.json({ received: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Stripe webhook listener running on ${port}`));
