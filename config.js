// ============================================
// CONFIGURATION - ADD YOUR API KEYS HERE
// ============================================

const CONFIG = {
    // Stripe (READY TO USE)
    stripe: {
        publishableKey: 'pk_test_51Sm3Mm6CQjAUzRawX9ObAubSCQlEBtRaVtSKHGa6wRRqZ4RFPx17VYFg4b3ZsHs01j2kPhu7nVkceuNayjh2Xkwj00xwOE8ceK'
    },
    
    // Firebase (ADD YOUR KEYS)
    firebase: {
        apiKey: "YOUR_FIREBASE_API_KEY",
        authDomain: "your-project.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project.appspot.com",
        messagingSenderId: "123456789",
        appId: "YOUR_APP_ID"
    },
    
    // EmailJS (ADD YOUR KEYS)
    emailjs: {
        publicKey: "YOUR_PUBLIC_KEY",
        serviceId: "service_xxxxx",
        templates: {
            confirmation: "template_confirmation",
            notification: "template_notification",
            reminder: "template_reminder",
            waitlist: "template_waitlist"
        }
    },
    
    // Cloudinary (ADD YOUR KEYS)
    cloudinary: {
        cloudName: "your-cloud-name",
        uploadPreset: "tame_the_tangle_vaccinations"
    },
    
    // Pricing
    pricing: {
        depositAmount: 30, // Non-refundable deposit
        small: 40,
        medium: 60,
        large: 80,
        addons: {
            medicated: 10,
            conditioning: 10,
            flea: 10
        }
    }
};

// ============================================
// STRIPE INTEGRATION
// ============================================

let stripe, cardNumberElement, cardExpiryElement, cardCvcElement;
let stripeInitialized = false;

// Initialize Stripe
function initializeStripe() {
    try {
        console.log('🔧 Initializing Stripe...');
        
        if (!window.Stripe) {
            console.error('❌ Stripe.js not loaded! Check internet connection.');
            alert('Unable to load payment system. Please refresh the page or check your internet connection.');
            return false;
        }
        
        stripe = Stripe(CONFIG.stripe.publishableKey);
        console.log('✅ Stripe object created');
        
        const elements = stripe.elements();
        console.log('✅ Stripe Elements created');
        
        // Style for all card elements
        const style = {
            base: {
                fontSize: '16px',
                color: '#32325d',
                fontFamily: '"Segoe UI", sans-serif',
                '::placeholder': {
                    color: '#aab7c4'
                },
                padding: '12px'
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
            }
        };
        
        // Create separate elements for card number, expiry, and CVC
        cardNumberElement = elements.create('cardNumber', { 
            style: style,
            showIcon: true
        });
        cardExpiryElement = elements.create('cardExpiry', { style: style });
        cardCvcElement = elements.create('cardCvc', { style: style });
        
        console.log('✅ Card elements created');
        
        // Check if mounting divs exist
        const cardNumberDiv = document.getElementById('card-number');
        const cardExpiryDiv = document.getElementById('card-expiry');
        const cardCvcDiv = document.getElementById('card-cvc');
        
        if (!cardNumberDiv || !cardExpiryDiv || !cardCvcDiv) {
            console.error('❌ Card element divs not found in DOM!');
            return false;
        }
        
        console.log('✅ Found all card element divs');
        
        // Mount each element to its respective div
        cardNumberElement.mount('#card-number');
        console.log('✅ Card number mounted');
        
        cardExpiryElement.mount('#card-expiry');
        console.log('✅ Card expiry mounted');
        
        cardCvcElement.mount('#card-cvc');
        console.log('✅ Card CVC mounted');
        
        // Add error handling for all elements
        cardNumberElement.on('change', handleCardChange);
        cardExpiryElement.on('change', handleCardChange);
        cardCvcElement.on('change', handleCardChange);
        
        // Add focus event to verify interactivity
        cardNumberElement.on('focus', () => {
            console.log('✅ Card number field focused - it\'s working!');
        });
        
        stripeInitialized = true;
        console.log('✅ Stripe initialization complete!');
        return true;
        
    } catch (error) {
        console.error('❌ Stripe initialization error:', error);
        alert('Error loading payment system: ' + error.message);
        return false;
    }
}

function handleCardChange(event) {
    const displayError = document.getElementById('card-errors');
    if (event.error) {
        displayError.textContent = event.error.message;
        displayError.style.color = '#fa755a';
        displayError.style.marginTop = '10px';
    } else {
        displayError.textContent = '';
    }
}

// Create payment intent and charge the $30 deposit
async function createPaymentIntentAndCharge(amount, bookingData) {
    try {
        // First, create a payment method with the card details
        const {paymentMethod, error} = await stripe.createPaymentMethod({
            type: 'card',
            card: cardNumberElement,
            billing_details: {
                name: bookingData.ownerName,
                email: bookingData.email,
                phone: bookingData.phone
            }
        });
        
        if (error) {
            throw new Error(error.message);
        }
        
        console.log('✅ Payment method created:', paymentMethod.id);
        
        // Call your backend to actually charge the card
        const response = await fetch('/.netlify/functions/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount, // Amount in cents (3000 = $30)
                bookingData: {
                    paymentMethodId: paymentMethod.id,
                    ownerName: bookingData.ownerName,
                    email: bookingData.email,
                    dogName: bookingData.dogName,
                    date: bookingData.date,
                    time: bookingData.time,
                    estimatedCost: bookingData.estimatedCost
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Payment failed');
        }
        
        const result = await response.json();
        
        console.log('✅ Payment successful:', result);
        
        return {
            paymentMethodId: paymentMethod.id,
            paymentIntentId: result.paymentIntentId,
            cardLast4: paymentMethod.card.last4,
            cardBrand: paymentMethod.card.brand,
            amountCharged: result.amountCharged
        };
        
    } catch (error) {
        console.error('Payment error:', error);
        throw error;
    }
}

// ============================================
// FIREBASE INTEGRATION
// ============================================

let db;

function initializeFirebase() {
    if (CONFIG.firebase.apiKey === "YOUR_FIREBASE_API_KEY") {
        console.warn("Firebase not configured yet");
        return false;
    }
    
    firebase.initializeApp(CONFIG.firebase);
    db = firebase.firestore();
    return true;
}

async function saveBookingToFirebase(bookingData) {
    if (!db) {
        console.log("Firebase not initialized - saving to console instead");
        console.log("Booking data:", bookingData);
        return { id: 'demo-' + Date.now() };
    }
    
    try {
        const docRef = await db.collection('bookings').add({
            ...bookingData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'confirmed'
        });
        return { id: docRef.id };
    } catch (error) {
        console.error("Error saving to Firebase:", error);
        throw error;
    }
}

async function saveReviewToFirebase(reviewData) {
    if (!db) {
        console.log("Review data:", reviewData);
        return { id: 'demo-review-' + Date.now() };
    }
    
    try {
        const docRef = await db.collection('reviews').add({
            ...reviewData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            approved: false // You can manually approve reviews
        });
        return { id: docRef.id };
    } catch (error) {
        console.error("Error saving review:", error);
        throw error;
    }
}

// ============================================
// EMAILJS INTEGRATION
// ============================================

function initializeEmailJS() {
    if (CONFIG.emailjs.publicKey === "YOUR_PUBLIC_KEY") {
        console.warn("EmailJS not configured yet");
        return false;
    }
    
    emailjs.init(CONFIG.emailjs.publicKey);
    return true;
}

async function sendConfirmationEmail(bookingData) {
    if (!emailjs || CONFIG.emailjs.publicKey === "YOUR_PUBLIC_KEY") {
        console.log("Would send confirmation email to:", bookingData.email);
        return;
    }
    
    try {
        await emailjs.send(
            CONFIG.emailjs.serviceId,
            CONFIG.emailjs.templates.confirmation,
            {
                owner_name: bookingData.ownerName,
                email: bookingData.email,
                dog_name: bookingData.dogName,
                appointment_date: bookingData.date,
                appointment_time: bookingData.time,
                duration: bookingData.duration,
                deposit_paid: bookingData.depositAmount,
                remaining_balance: bookingData.remainingBalance,
                total_cost: bookingData.totalCost
            }
        );
        console.log("Confirmation email sent!");
    } catch (error) {
        console.error("Email error:", error);
    }
}

async function sendNotificationEmail(bookingData) {
    if (!emailjs || CONFIG.emailjs.publicKey === "YOUR_PUBLIC_KEY") {
        console.log("Would send notification to you about:", bookingData.dogName);
        return;
    }
    
    try {
        await emailjs.send(
            CONFIG.emailjs.serviceId,
            CONFIG.emailjs.templates.notification,
            {
                ...bookingData,
                to_email: 'arielthemermaid@gmail.com'
            }
        );
        console.log("Notification email sent to you!");
    } catch (error) {
        console.error("Email error:", error);
    }
}

// ============================================
// CLOUDINARY INTEGRATION
// ============================================

async function uploadToCloudinary(file) {
    if (CONFIG.cloudinary.cloudName === "your-cloud-name") {
        console.log("Would upload file:", file.name);
        return { secure_url: 'demo-url-' + file.name };
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CONFIG.cloudinary.uploadPreset);
    
    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/auto/upload`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
}

// ============================================
// BOOKING FORM HANDLER
// ============================================

async function handleBooking(event) {
    event.preventDefault();
    
    if (!stripeInitialized) {
        alert('Payment system not ready. Please refresh the page and try again.');
        return;
    }
    
    const submitBtn = event.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing Payment...';
    
    try {
        // Get form data
        const formData = new FormData(event.target);
        const data = {
            ownerName: formData.get('ownerName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            dogName: formData.get('dogName'),
            breed: formData.get('breed'),
            size: formData.get('size'),
            date: formData.get('date'),
            time: formData.get('time'),
            extraTime: formData.get('extraTime'),
            firstTime: formData.get('firstTime'),
            notes: formData.get('notes') || '',
            addons: []
        };
        
        // Get add-ons
        formData.getAll('addon').forEach(addon => {
            data.addons.push(addon);
        });
        
        // Calculate duration and cost
        let duration = (data.size === 'large') ? 3 : 2;
        if (data.extraTime === 'yes') duration += 1;
        data.duration = duration;
        
        let estimatedCost = CONFIG.pricing[data.size] || 40;
        data.addons.forEach(addon => {
            estimatedCost += CONFIG.pricing.addons[addon] || 0;
        });
        
        // $30 deposit is PART OF the total, not added to it
        const depositAmount = CONFIG.pricing.depositAmount;
        
        data.estimatedCost = estimatedCost;
        data.depositAmount = depositAmount;
        data.balanceDue = estimatedCost - depositAmount; // What they owe at appointment
        
        // Handle first-time client
        if (data.firstTime === 'yes') {
            data.aggressive = formData.get('aggressive');
            data.photoPermission = formData.get('photoPermission') === 'on';
            
            // Upload vaccination file
            const vacFile = formData.get('vaccinations');
            if (vacFile && vacFile.size > 0) {
                const uploadResult = await uploadToCloudinary(vacFile);
                data.vaccinationUrl = uploadResult.secure_url;
            }
        }
        
        // Charge the $30 deposit immediately
        submitBtn.textContent = 'Charging $30 deposit...';
        const paymentResult = await createPaymentIntentAndCharge(depositAmount * 100, data);
        
        data.paymentMethodId = paymentResult.paymentMethodId;
        data.cardLast4 = paymentResult.cardLast4;
        data.cardBrand = paymentResult.cardBrand;
        data.depositPaid = true;
        data.depositChargedAt = new Date().toISOString();
        
        // Save to Firebase
        submitBtn.textContent = 'Saving booking...';
        const booking = await saveBookingToFirebase(data);
        data.bookingId = booking.id;
        
        // Send emails
        submitBtn.textContent = 'Sending confirmation...';
        await sendConfirmationEmail(data);
        await sendNotificationEmail(data);
        
        // Success!
        alert(`✅ Appointment Confirmed!

Thank you, ${data.ownerName}!

💳 DEPOSIT CHARGED: $${depositAmount}
Card: ${data.cardBrand} ending in ${data.cardLast4}

Appointment Details:
• Dog: ${data.dogName} (${data.breed})
• Date: ${data.date}
• Time: ${data.time}
• Duration: ${duration} hours

Pricing (Starting Estimate):
• Estimated Total: $${estimatedCost}
• Deposit Paid Today: $${depositAmount}
• Estimated Balance Due: $${data.balanceDue}

⚠️ Final price may vary based on coat condition, matting, and temperament.
Any adjustments will be discussed before grooming begins.

📧 Confirmation email sent to: ${data.email}
📱 You'll receive a reminder 24 hours before

We look forward to pampering ${data.dogName}!`);
        
        event.target.reset();
        
        // Clear all card elements
        if (cardNumberElement) cardNumberElement.clear();
        if (cardExpiryElement) cardExpiryElement.clear();
        if (cardCvcElement) cardCvcElement.clear();
        
        document.getElementById('waiverSection')?.style.display = 'none';
        
    } catch (error) {
        console.error('Booking error:', error);
        alert('Error processing booking: ' + error.message + '\n\nYour card was not charged. Please try again or call 336-582-2884');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Book Appointment';
    }
}

// ============================================
// REVIEW FORM HANDLER
// ============================================

async function handleReview(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const reviewData = {
        name: formData.get('reviewName'),
        rating: parseInt(formData.get('rating')),
        text: formData.get('reviewText'),
        date: new Date().toISOString()
    };
    
    try {
        await saveReviewToFirebase(reviewData);
        
        const successMsg = document.getElementById('reviewSuccess');
        if (successMsg) {
            successMsg.textContent = 
                `Thank you for your ${reviewData.rating}-star review! It will be posted after approval.`;
            successMsg.classList.add('active');
            
            setTimeout(() => {
                successMsg.classList.remove('active');
            }, 5000);
        }
        
        event.target.reset();
        
    } catch (error) {
        const errorMsg = document.getElementById('reviewError');
        if (errorMsg) {
            errorMsg.textContent = 'Error submitting review. Please try again.';
            errorMsg.classList.add('active');
        }
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function toggleWaiverSection() {
    const firstTime = document.getElementById('firstTimeSelect')?.value;
    const waiverSection = document.getElementById('waiverSection');
    const vaccinationUpload = document.getElementById('vaccinationUpload');
    const agreeWaiverCheck = document.getElementById('agreeWaiverCheck');
    
    if (firstTime === 'yes') {
        if (waiverSection) waiverSection.style.display = 'block';
        if (vaccinationUpload) vaccinationUpload.required = true;
        if (agreeWaiverCheck) agreeWaiverCheck.required = true;
    } else {
        if (waiverSection) waiverSection.style.display = 'none';
        if (vaccinationUpload) vaccinationUpload.required = false;
        if (agreeWaiverCheck) agreeWaiverCheck.required = false;
    }
}

function openModal(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    if (modal) modal.style.display = 'block';
    if (modalImg) modalImg.src = src;
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) modal.style.display = 'none';
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Initializing booking system...');
    console.log('📍 Current URL:', window.location.href);
    
    // Check if Stripe.js loaded
    if (!window.Stripe) {
        console.error('❌ Stripe.js failed to load from CDN!');
        alert('Unable to load payment system. Please check your internet connection and refresh the page.');
        return;
    }
    
    console.log('✅ Stripe.js library loaded');
    
    // Initialize services
    const stripeOk = initializeStripe();
    const firebaseOk = initializeFirebase();
    const emailjsOk = initializeEmailJS();
    
    if (!stripeOk) {
        console.error('❌ Stripe failed to initialize!');
        document.getElementById('card-errors').textContent = 
            '⚠️ Payment system unavailable. Please refresh the page.';
        document.getElementById('card-errors').style.color = '#fa755a';
    }
    
    // Set minimum date to today
    const dateInput = document.querySelector('input[name="date"]');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        console.log('✅ Date picker configured');
    }
    
    // File upload display
    const vacUpload = document.getElementById('vaccinationUpload');
    if (vacUpload) {
        vacUpload.addEventListener('change', function(e) {
            const fileName = e.target.files[0]?.name;
            const fileNameDisplay = document.getElementById('fileName');
            if (fileName && fileNameDisplay) {
                fileNameDisplay.textContent = '✓ Uploaded: ' + fileName;
            }
        });
        console.log('✅ File upload handler attached');
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log('📊 INITIALIZATION SUMMARY:');
    console.log('═══════════════════════════════════════');
    console.log('✅ Stripe:', stripeOk ? 'Ready (with $30 deposit)' : '❌ Failed');
    console.log('   Firebase:', firebaseOk ? 'Ready' : 'Not configured');
    console.log('   EmailJS:', emailjsOk ? 'Ready' : 'Not configured');
    console.log('═══════════════════════════════════════\n');
    
    // Test card field interactivity after a short delay
    setTimeout(() => {
        const cardNumberDiv = document.getElementById('card-number');
        if (cardNumberDiv) {
            const iframe = cardNumberDiv.querySelector('iframe');
            if (iframe) {
                console.log('✅ Stripe iframe detected in card-number div');
            } else {
                console.warn('⚠️ No iframe found in card-number div - Stripe may not have mounted correctly');
            }
        }
    }, 1000);
});
