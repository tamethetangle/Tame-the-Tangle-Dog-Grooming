# Tame the Tangle Dog Grooming - Payment System

This booking system charges a **$30 non-refundable deposit** when customers book appointments. The deposit is part of the total cost, not added on top.

## 💰 How Pricing Works

**Example 1: $60 Medium Dog Groom**
- Estimated total: $60
- Deposit charged today: $30
- Balance due at appointment: $30

**Example 2: $80 Large Dog + $10 Medicated Shampoo**
- Estimated total: $90
- Deposit charged today: $30
- Balance due at appointment: $60

**Important:** Final price may increase based on mats and temperament. This is communicated to customers in the booking confirmation.

## 🚀 Deployment to GitHub Pages + Netlify Functions

### Step 1: Get Your Stripe Secret Key

1. Go to https://dashboard.stripe.com/test/apikeys
2. Click "Reveal test key" under "Secret key"
3. Copy the key (starts with `sk_test_`)

### Step 2: Push to GitHub

1. Create a new GitHub repository called `tame-the-tangle-booking`
2. Upload these files to the repository:
   - `index.html`
   - `config.js`
   - `package.json`
   - `netlify.toml`
   - `netlify/functions/create-payment-intent.js`

```bash
# In your terminal:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/tame-the-tangle-booking.git
git push -u origin main
```

### Step 3: Deploy to Netlify (Free!)

1. Go to https://www.netlify.com/ and sign up (free)
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and select your `tame-the-tangle-booking` repository
4. Netlify will auto-detect the settings from `netlify.toml`
5. Click "Deploy site"

### Step 4: Add Your Stripe Secret Key to Netlify

1. In Netlify, go to your site
2. Click "Site configuration" → "Environment variables"
3. Click "Add a variable"
4. Name: `STRIPE_SECRET_KEY`
5. Value: Your Stripe secret key from Step 1 (paste `sk_test_...`)
6. Click "Save"
7. Go to "Deploys" and click "Trigger deploy" → "Clear cache and deploy site"

### Step 5: Update Your Custom Domain

1. In Netlify, go to "Domain management"
2. Click "Add custom domain"
3. Enter: `tamethetangledoggrooming.co`
4. Follow the instructions (your DNS is already configured!)
5. Enable HTTPS (it's automatic with Netlify)

## 🧪 Testing the Payment System

### Test Card Numbers (Stripe Test Mode):

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)

**Declined Card:**
- Card: `4000 0000 0000 0002`
- This will test error handling

**More test cards:** https://stripe.com/docs/testing#cards

### What Happens When Testing:
1. Customer fills out the form
2. Enters test card `4242 4242 4242 4242`
3. $30 is "charged" (test mode - no real money)
4. Booking is confirmed
5. Check your Stripe Dashboard to see the test payment

## 🔄 Switching to Live Mode

Once you're ready to accept real payments:

1. **Get your LIVE Stripe keys:**
   - Go to https://dashboard.stripe.com/apikeys (no /test/)
   - Copy your LIVE publishable key (`pk_live_...`)
   - Copy your LIVE secret key (`sk_live_...`)

2. **Update config.js:**
   ```javascript
   stripe: {
       publishableKey: 'pk_live_YOUR_LIVE_KEY_HERE'
   }
   ```

3. **Update Netlify environment variable:**
   - Go to Netlify → Site configuration → Environment variables
   - Edit `STRIPE_SECRET_KEY`
   - Replace with your LIVE secret key (`sk_live_...`)

4. **Redeploy:**
   - Commit and push changes to GitHub
   - Netlify will auto-deploy

## 📧 Email Notifications (Optional Setup)

To send confirmation emails, you need to configure EmailJS:

1. Go to https://www.emailjs.com/ and create a free account
2. Set up an email service (Gmail, Outlook, etc.)
3. Create email templates for:
   - Customer confirmation
   - Your notification
4. Get your Public Key, Service ID, and Template IDs
5. Update `config.js` with your EmailJS credentials

## 💾 Database Setup (Optional)

To save bookings to a database, set up Firebase:

1. Go to https://firebase.google.com/
2. Create a new project
3. Enable Firestore Database
4. Get your config from Project Settings
5. Update `config.js` with your Firebase credentials

## 🆘 Troubleshooting

### Credit card boxes not clickable?
1. Open browser console (F12)
2. Look for error messages
3. Check that Stripe.js loaded: `✅ Stripe.js library loaded`
4. Check that elements mounted: `✅ Card number mounted`

### Payment failing?
1. Check browser console for errors
2. Verify Netlify function is deployed: Visit `https://your-site.netlify.app/.netlify/functions/create-payment-intent`
3. Check Netlify function logs in Netlify dashboard
4. Verify `STRIPE_SECRET_KEY` environment variable is set

### DNS issues?
Your DNS is already configured correctly! If you have issues:
1. Wait 30 minutes for propagation
2. Clear your browser cache
3. Try incognito mode

## 📞 Support

- **Stripe Documentation:** https://stripe.com/docs
- **Netlify Documentation:** https://docs.netlify.com/
- **Test Cards:** https://stripe.com/docs/testing

## 🔐 Security Notes

- ✅ Never put your Stripe secret key in frontend code
- ✅ Always use environment variables for secrets
- ✅ Keep your secret keys private
- ✅ Use test mode until you're ready for real payments
- ✅ HTTPS is automatically enabled by Netlify

---

## File Structure

```
tame-the-tangle-booking/
├── index.html                                  # Main website
├── config.js                                   # Frontend configuration
├── package.json                                # Node.js dependencies
├── netlify.toml                                # Netlify configuration
├── netlify/
│   └── functions/
│       └── create-payment-intent.js           # Backend payment processing
└── README.md                                   # This file
```

## Quick Reference

**Test Card:** `4242 4242 4242 4242`  
**Deposit Amount:** $30  
**Netlify Functions Endpoint:** `/.netlify/functions/create-payment-intent`  
**Your Site:** https://tamethetangledoggrooming.co

---

Good luck with your grooming business! 🐕✨
