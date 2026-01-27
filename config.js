// ============================================
// CONFIGURATION - ADD YOUR API KEYS HERE
// ============================================

const CONFIG = {
    // Stripe (READY TO USE)
    stripe: {
        publishableKey: 'pk_live_51Sm3Md7IUpwHpZ4wAZeVYeDJ2t8DFKHFnZAiNccEuIf300wp6lEfHlxYas62UdgSwXPq7oWEWVPPD2iujVL1lqww006J76MpI2'
    },
    
    // Backend API URL
    api: {
        baseUrl: 'https://tame-the-tangle-backend.onrender.com'  // For local testing
        // When ready for production, change to: 'https://your-production-backend.com'
    },
    
    // Firebase (ADD YOUR KEYS)
    firebase: {
        apiKey: "AIzaSyDKEm1AnfJn7ovvDLvVMl9shmSLL-PUUAo",
        authDomain: "tame-the-tangle-booking.firebaseapp.com",
        projectId: "tame-the-tangle-booking",
        storageBucket: "tame-the-tangle-booking.firebasestorage.app",
        messagingSenderId: "109713070835",
        appId: "G-D0W52DCFVF"
    },
    
    // EmailJS (ADD YOUR KEYS)
    emailjs: {
        publicKey: "CWcEa2jyhbPkl6_Su",
        serviceId: "service_abc123",
        templates: {
            confirmation: "template_igpeyry",
            notification: "template_3xhhl1m",
            reminder: "template_reminder",
            waitlist: "template_waitlist"
        }
    },
    
    
    // Pricing
    pricing: {
        depositAmount: 30, // Non-refundable deposit (part of total, not added)
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
            console.error('❌ Stripe.js not loaded!');
            alert('Unable to load payment system. Please refresh the page.');
            return false;
        }
        
        stripe = Stripe(CONFIG.stripe.publishableKey);
        console.log('✅ Stripe object created');
        
        const elements = stripe.elements();
        
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
        
        cardNumberElement = elements.create('cardNumber', { style, showIcon: true });
        cardExpiryElement = elements.create('cardExpiry', { style });
        cardCvcElement = elements.create('cardCvc', { style });
        
        cardNumberElement.mount('#card-number');
        cardExpiryElement.mount('#card-expiry');
        cardCvcElement.mount('#card-cvc');
        
        cardNumberElement.on('change', handleCardChange);
        cardExpiryElement.on('change', handleCardChange);
        cardCvcElement.on('change', handleCardChange);
        
        stripeInitialized = true;
        console.log('✅ Stripe initialized successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Stripe error:', error);
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

// Create payment method and charge $30 deposit via backend
async function chargeDeposit(bookingData) {
    try {
        // Create payment method
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
        
        // Call backend to charge the deposit
        const response = await fetch(`${CONFIG.api.baseUrl}/api/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: CONFIG.pricing.depositAmount * 100, // 3000 cents = $30
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
        console.log('✅ Payment successful!', result);
        
        return {
            paymentMethodId: paymentMethod.id,
            paymentIntentId: result.paymentIntentId,
            cardLast4: paymentMethod.card.last4,
            cardBrand: paymentMethod.card.brand,
            amountCharged: result.amountCharged
        };
        
    } catch (error) {
        console.error('❌ Payment error:', error);
        throw error;
    }
}

// ============================================
// FIREBASE INTEGRATION
// ============================================

let db;

function initializeFirebase() {
    if (CONFIG.firebase.apiKey === "YOUR_FIREBASE_API_KEY") {
        console.warn("Firebase not configured");
        return false;
    }
    firebase.initializeApp(CONFIG.firebase);
    db = firebase.firestore();
    return true;
}

async function saveBookingToFirebase(bookingData) {
    if (!db) {
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
        console.error("Firebase error:", error);
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
            approved: false
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
        console.warn("EmailJS not configured");
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
                remaining_balance: bookingData.balanceDue,
                estimated_total: bookingData.estimatedCost
            }
        );
        console.log("Confirmation email sent!");
    } catch (error) {
        console.error("Email error:", error);
    }
}

async function sendNotificationEmail(bookingData) {
    if (!emailjs || CONFIG.emailjs.publicKey === "YOUR_PUBLIC_KEY") {
        console.log("Would send notification about:", bookingData.dogName);
        return;
    }
    
    try {
        await emailjs.send(
            CONFIG.emailjs.serviceId,
            CONFIG.emailjs.templates.notification,
            {
                ...bookingData,
                to_email: 'tamethetangledoggrooming@gmail.com'
            }
        );
        console.log("Notification email sent!");
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
        console.error("Cloudinary error:", error);
        throw error;
    }
}

// ============================================
// BOOKING FORM HANDLER
// ============================================

async function handleBooking(event) {
    event.preventDefault();
    
    if (!stripeInitialized) {
        alert('Payment system not ready. Please refresh the page.');
        return;
    }
    
    const submitBtn = event.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    
    try {
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
        
        formData.getAll('addon').forEach(addon => {
            data.addons.push(addon);
        });
        
        // Calculate costs
        let duration = (data.size === 'large') ? 3 : 2;
        if (data.extraTime === 'yes') duration += 1;
        data.duration = duration;
        
        let estimatedCost = CONFIG.pricing[data.size] || 40;
        data.addons.forEach(addon => {
            estimatedCost += CONFIG.pricing.addons[addon] || 0;
        });
        
        const depositAmount = CONFIG.pricing.depositAmount;
        
        data.estimatedCost = estimatedCost;
        data.depositAmount = depositAmount;
        data.balanceDue = Math.max(0, estimatedCost - depositAmount);
        
        // Handle first-time client
        if (data.firstTime === 'yes') {
            data.aggressive = formData.get('aggressive');
            data.photoPermission = formData.get('photoPermission') === 'on';
            
            const vacFile = formData.get('vaccinations');
            if (vacFile && vacFile.size > 0) {
                const uploadResult = await uploadToCloudinary(vacFile);
                data.vaccinationUrl = uploadResult.secure_url;
            }
        }
        
        // Charge the $30 deposit
        submitBtn.textContent = 'Charging $30 deposit...';
        const paymentResult = await chargeDeposit(data);
        
        data.paymentMethodId = paymentResult.paymentMethodId;
        data.paymentIntentId = paymentResult.paymentIntentId;
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
• Balance Due at Appointment: $${data.balanceDue}

⚠️ Final price may vary based on coat condition, matting, and temperament.

📧 Confirmation email sent to: ${data.email}

We look forward to pampering ${data.dogName}!`);
        
        event.target.reset();
        
        if (cardNumberElement) cardNumberElement.clear();
        if (cardExpiryElement) cardExpiryElement.clear();
        if (cardCvcElement) cardCvcElement.clear();
        
        const waiverSection = document.getElementById('waiverSection');
        
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
            successMsg.textContent = `Thank you for your ${reviewData.rating}-star review!`;
            successMsg.classList.add('active');
            setTimeout(() => successMsg.classList.remove('active'), 5000);
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
    const firstTimeSelect = document.getElementById('firstTimeSelect');
    const firstTime = firstTimeSelect ? firstTimeSelect.value : null;
    const waiverSection = document.getElementById('waiverSection');
    const vaccinationUpload = document.getElementById('vaccinationUpload');
    
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
    console.log('🚀 Initializing booking system...');
    
    if (!window.Stripe) {
        console.error('❌ Stripe.js not loaded!');
        return;
    }
    
    initializeStripe();
    initializeFirebase();
    initializeEmailJS();
    
    const dateInput = document.querySelector('input[name="date"]');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
    
    const vacUpload = document.getElementById('vaccinationUpload');
    if (vacUpload) {
        vacUpload.addEventListener('change', function(e) {
            const fileName = e.target.files[0] ? e.target.files[0].name : null;
            const fileNameDisplay = document.getElementById('fileName');
            if (fileName && fileNameDisplay) {
                fileNameDisplay.textContent = '✓ Uploaded: ' + fileName;
            }
        });
    }
    
    console.log('✅ Booking system ready!');
    console.log('Backend URL:', CONFIG.api.baseUrl);
});

// ============================================
// BOOKING CALENDAR SYSTEM
// ============================================

// Calendar state
let currentCalendarDate = new Date();
let selectedDate = null;
let bookedDates = [];
let blockedDates = [];

// MANUALLY BLOCK DATES - Add your vacation/holiday dates here
const MANUALLY_BLOCKED_DATES = [
    // Example: '2026-02-14',  // Valentine's Day
    // Add your dates in YYYY-MM-DD format
];

// Maximum bookings per day (adjust based on your capacity)
const MAX_BOOKINGS_PER_DAY = 3;

// Load booked dates from Firebase
async function loadBookedDates() {
    try {
        if (!db) {
            console.log('Firebase not configured, using manual blocked dates only');
            blockedDates = [...MANUALLY_BLOCKED_DATES];
            renderCalendar();
            return;
        }
        
        const bookingsRef = collection(db, 'bookings');
        const snapshot = await getDocs(bookingsRef);
        
        bookedDates = [];
        const dateCount = {};
        
        snapshot.forEach((doc) => {
            const booking = doc.data();
            const date = booking.date;
            dateCount[date] = (dateCount[date] || 0) + 1;
            
            // If max bookings reached, mark as booked
            if (dateCount[date] >= MAX_BOOKINGS_PER_DAY) {
                if (!bookedDates.includes(date)) {
                    bookedDates.push(date);
                }
            }
        });
        
        // Check for blocked dates and times in Firebase
        try {
            const blockedRef = collection(db, 'blocked-dates');
            const blockedSnapshot = await getDocs(blockedRef);
            
            const wholeDayBlocks = [];
            blockedTimes = {}; // Reset
            
            blockedSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.time) {
                    // Time-specific block - don't block whole day
                    if (!blockedTimes[data.date]) {
                        blockedTimes[data.date] = [];
                    }
                    blockedTimes[data.date].push(data.time);
                } else {
                    // Whole day block
                    wholeDayBlocks.push(data.date);
                }
            });
            
            blockedDates = [...MANUALLY_BLOCKED_DATES, ...wholeDayBlocks];
            console.log(`📅 Calendar loaded: ${blockedDates.length} full-day blocks, ${Object.keys(blockedTimes).length} dates with time blocks`);
        } catch (error) {
            console.log('No blocked-dates collection yet, using manual only');
            blockedDates = [...MANUALLY_BLOCKED_DATES];
            blockedTimes = {};
        }
        
        renderCalendar();
        
    } catch (error) {
        console.error('Error loading booked dates:', error);
        blockedDates = [...MANUALLY_BLOCKED_DATES];
        renderCalendar();
    }
}

// Render the calendar
function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    const calendarMonth = document.getElementById('calendarMonth');
    if (calendarMonth) {
        calendarMonth.textContent = `${monthNames[month]} ${year}`;
    }
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let html = '';
    
    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        const dateString = formatDate(date);
        
        let classes = ['calendar-day'];
        let clickable = true;
        
        // Check if past
        if (date < today) {
            classes.push('past');
            clickable = false;
        } else if (date.getTime() === today.getTime()) {
            classes.push('today');
        }
        
        // Check if Sunday (closed)
        if (date.getDay() === 0 && date >= today) {
            classes.push('booked');
            clickable = false;
        }
        // Check if booked or blocked
        else if (bookedDates.includes(dateString) || blockedDates.includes(dateString)) {
            classes.push('booked');
            clickable = false;
        } else if (date >= today) {
            classes.push('available');
        }
        
        // Check if selected
        if (selectedDate === dateString) {
            classes.push('selected');
        }
        
        const onclick = clickable ? `onclick="selectDate('${dateString}')"` : '';
        html += `<div class="${classes.join(' ')}" ${onclick}>${day}</div>`;
    }
    
    const calendarDays = document.getElementById('calendarDays');
    if (calendarDays) {
        calendarDays.innerHTML = html;
    }
}

// Select a date from calendar
function selectDate(dateString) {
    selectedDate = dateString;
    
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        dateInput.value = dateString;
        updateAvailableTimes();
    }
    
    renderCalendar();
}

// Navigate months
function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

// Format date helper
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Initialize calendar on page load
setTimeout(function() {
    console.log('📅 Initializing booking calendar...');
    renderCalendar();
    
    if (typeof db !== 'undefined' && db) {
        loadBookedDates();
        // Refresh every 5 minutes
        setInterval(loadBookedDates, 5 * 60 * 1000);
    } else {
        console.log('Using calendar without Firebase integration');
    }
}, 1000); // Wait 1 second for Firebase to initialize

