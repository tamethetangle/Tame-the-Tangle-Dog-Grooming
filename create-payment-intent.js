// netlify/functions/create-payment-intent.js
// This file handles the actual $30 deposit charge

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { amount, bookingData } = JSON.parse(event.body);

    // Validate the amount (should be 3000 cents = $30)
    if (amount !== 3000) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid deposit amount' })
      };
    }

    // Create a PaymentIntent with the deposit amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents (3000 = $30.00)
      currency: 'usd',
      payment_method: bookingData.paymentMethodId,
      confirm: true, // Automatically confirm and charge
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      description: `Deposit for ${bookingData.dogName} - ${bookingData.date}`,
      metadata: {
        ownerName: bookingData.ownerName,
        email: bookingData.email,
        dogName: bookingData.dogName,
        appointmentDate: bookingData.date,
        appointmentTime: bookingData.time,
        estimatedTotal: bookingData.estimatedCost
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amountCharged: paymentIntent.amount / 100
      })
    };

  } catch (error) {
    console.error('Payment error:', error);
    
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: error.message || 'Payment failed'
      })
    };
  }
};
