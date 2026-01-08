// scripts/create-webhook.js
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

(async () => {
  try {
    const url = process.env.WEBHOOK_URL;
    if (!url) throw new Error('WEBHOOK_URL env var not set');
    const wh = await stripe.webhookEndpoints.create({
      url,
      enabled_events: ['checkout.session.completed', 'invoice.payment_succeeded', 'customer.subscription.created', 'customer.subscription.updated']
    });
    console.log('Created webhook:', JSON.stringify({ id: wh.id, secret: wh.secret, url: wh.url }, null, 2));
  } catch (err) {
    console.error('Error creating webhook:', err);
    process.exit(1);
  }
})();
