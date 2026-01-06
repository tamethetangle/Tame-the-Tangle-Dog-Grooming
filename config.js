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

// Initialize Stripe
function initializeStripe() {
    stripe = Stripe(CONFIG.stripe.publishableKey);
    const elements = stripe.elements();
    
    // Style for all card elements
    const style = {
        base: {
            fontSize: '16px',
            color: '#32325d',
            fontFamily: '"Segoe UI", sans-serif',
            '::placeholder': {
                color: '#aab7c4'
            }
        },
        invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
        }
    };
    
    // Create separate elements for card number, expiry, and CVC
    cardNumberElement = elements.create('cardNumber', { style });
    cardExpiryElement = elements.create('cardExpiry', { style });
    cardCvcElement = elements.create('cardCvc', { style });
    
    // Mount each element to its respective div
    cardNumberElement.mount('#card-number');
    cardExpiryElement.mount('#card-expiry');
    cardCvcElement.mount('#card-cvc');
    
    // Add error handling for all elements
    cardNumberElement.on('change', handleCardChange);
    cardExpiryElement.on('change', handleCardChange);
    cardCvcElement.on('change', handleCardChange);
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

// Create payment method (saves card without charging)
async function createPaymentMethod() {
    const {paymentMethod, error} = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
    });
    
    if (error) {
        throw new Error(error.message);
    }
    
    return paymentMethod;
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
                estimated_cost: bookingData.estimatedCost
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
    
    const submitBtn = event.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    
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
        
        let cost = CONFIG.pricing[data.size] || 40;
        data.addons.forEach(addon => {
            cost += CONFIG.pricing.addons[addon] || 0;
        });
        data.estimatedCost = cost;
        
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
        
        // Create Stripe payment method (saves card)
        const paymentMethod = await createPaymentMethod();
        data.paymentMethodId = paymentMethod.id;
        data.cardLast4 = paymentMethod.card.last4;
        
        // Save to Firebase
        const booking = await saveBookingToFirebase(data);
        data.bookingId = booking.id;
        
        // Send emails
        await sendConfirmationEmail(data);
        await sendNotificationEmail(data);
        
        // Success!
        alert(`✅ Appointment Confirmed!

Thank you, ${data.ownerName}!

Appointment Details:
• Dog: ${data.dogName} (${data.breed})
• Date: ${data.date}
• Time: ${data.time}
• Duration: ${duration} hours
• Estimated Cost: $${cost}

📧 Confirmation email sent to: ${data.email}
📱 You'll receive a reminder 24 hours before

💳 Card ending in ${data.cardLast4} is on file for no-show protection

We look forward to pampering ${data.dogName}!`);
        
        event.target.reset();
        
        // Clear all card elements
        if (cardNumberElement) cardNumberElement.clear();
        if (cardExpiryElement) cardExpiryElement.clear();
        if (cardCvcElement) cardCvcElement.clear();
        
        document.getElementById('waiverSection')?.style.display = 'none';
        
    } catch (error) {
        console.error('Booking error:', error);
        alert('Error processing booking: ' + error.message + '\n\nPlease try again or call 336-582-2884');
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
    console.log('DOM Content Loaded - Initializing...');
    
    // Initialize services
    initializeStripe();
    initializeFirebase();
    initializeEmailJS();
    
    // Set minimum date to today
    const dateInput = document.querySelector('input[name="date"]');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
    
    // File upload display (if element exists)
    const vacUpload = document.getElementById('vaccinationUpload');
    if (vacUpload) {
        vacUpload.addEventListener('change', function(e) {
            const fileName = e.target.files[0]?.name;
            const fileNameDisplay = document.getElementById('fileName');
            if (fileName && fileNameDisplay) {
                fileNameDisplay.textContent = '✓ Uploaded: ' + fileName;
            }
        });
    }
    
    console.log('✅ Booking system initialized!');
    console.log('✅ Stripe: Ready (separate card fields)');
    console.log('   Firebase:', db ? 'Ready' : 'Not configured');
    console.log('   EmailJS:', emailjs ? 'Ready' : 'Not configured');
});
