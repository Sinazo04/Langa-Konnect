// scripts/create-prices.js
// Creates Basic and Pro monthly + yearly prices in ZAR using Stripe
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

(async () => {
  try {
    const products = [
      { key: 'basic', name: 'Basic Plan', amountMonthly: 4900 },
      { key: 'pro', name: 'Pro Plan', amountMonthly: 14900 },
    ];

    const result = {};
    for (const p of products) {
      const prod = await stripe.products.create({ name: p.name });
      const priceMonth = await stripe.prices.create({
        product: prod.id,
        unit_amount: p.amountMonthly,
        currency: 'zar',
        recurring: { interval: 'month' },
      });
      const priceYear = await stripe.prices.create({
        product: prod.id,
        unit_amount: p.amountMonthly * 12,
        currency: 'zar',
        recurring: { interval: 'year' },
      });
      result[p.key] = { productId: prod.id, priceMonthly: priceMonth.id, priceYearly: priceYear.id };
      console.log(`Created ${p.name}: product=${prod.id}, month=${priceMonth.id}, year=${priceYear.id}`);
    }
    console.log('\nAll created prices:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error creating prices:', err.message || err);
    process.exit(1);
  }
})();
