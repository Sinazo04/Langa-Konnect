// scripts/create-session.js
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

(async () => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: process.env.PRICE_ID, quantity: 1 }],
      success_url: process.env.SUCCESS_URL || 'https://example.com/success',
      cancel_url: process.env.CANCEL_URL || 'https://example.com/cancel',
      customer_email: process.env.CUSTOMER_EMAIL || 'test@example.com'
    });
    console.log('Session URL:', session.url);
  } catch (err) {
    console.error('Error creating session:', err);
    process.exit(1);
  }
})();
