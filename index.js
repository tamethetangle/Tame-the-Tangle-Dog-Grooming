const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize EmailJS in Node.js environment
const fetch = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

// Your EmailJS credentials (same as in config.js)
const EMAILJS_CONFIG = {
    publicKey: "CWcEa2jyhbPkl6_Su",
    serviceId: "service_7psfawy",
    templateId: "template_reminder"  // Your reminder template ID
};

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Send reminder email via EmailJS
async function sendReminderEmail(booking) {
    try {
        const templateParams = {
            owner_name: booking.ownerName,
            email: booking.email,
            dog_name: booking.dogName,
            appointment_date: booking.date,
            appointment_time: booking.time,
            duration: booking.duration,
            estimated_total: booking.estimatedCost,
            balance_due: booking.balanceDue,
            phone: "336-582-2884"
        };

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                service_id: EMAILJS_CONFIG.serviceId,
                template_id: EMAILJS_CONFIG.templateId,
                user_id: EMAILJS_CONFIG.publicKey,
                template_params: templateParams
            })
        });

        if (response.ok) {
            console.log(`✅ Reminder sent to ${booking.ownerName} for ${booking.dogName}`);
            
            // Mark reminder as sent in Firebase
            await db.collection('bookings').doc(booking.id).update({
                reminderSent: true,
                reminderSentAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            console.error(`❌ Failed to send reminder to ${booking.email}`);
        }
    } catch (error) {
        console.error('Error sending reminder:', error);
    }
}

// Scheduled function - runs every day at 9 AM EST
exports.sendDailyReminders = functions.pubsub
    .schedule('0 9 * * *')  // Cron format: 9 AM daily
    .timeZone('America/New_York')
    .onRun(async (context) => {
        console.log('🔔 Running daily reminder check...');
        
        try {
            // Calculate tomorrow's date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = formatDate(tomorrow);
            
            console.log(`📅 Checking appointments for: ${tomorrowStr}`);
            
            // Query bookings for tomorrow that haven't had reminders sent
            const snapshot = await db.collection('bookings')
                .where('date', '==', tomorrowStr)
                .where('reminderSent', '!=', true)
                .get();
            
            if (snapshot.empty) {
                console.log('No appointments found for tomorrow');
                return null;
            }
            
            console.log(`Found ${snapshot.size} appointment(s) for tomorrow`);
            
            // Send reminder for each booking
            const promises = [];
            snapshot.forEach((doc) => {
                const booking = { id: doc.id, ...doc.data() };
                promises.push(sendReminderEmail(booking));
            });
            
            await Promise.all(promises);
            
            console.log('✅ All reminders processed');
            return null;
            
        } catch (error) {
            console.error('❌ Error in reminder function:', error);
            return null;
        }
    });

// Manual trigger function (for testing)
exports.sendRemindersManual = functions.https.onRequest(async (req, res) => {
    console.log('🔔 Manual reminder trigger...');
    
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = formatDate(tomorrow);
        
        const snapshot = await db.collection('bookings')
            .where('date', '==', tomorrowStr)
            .get();
        
        if (snapshot.empty) {
            res.send('No appointments found for tomorrow');
            return;
        }
        
        const promises = [];
        snapshot.forEach((doc) => {
            const booking = { id: doc.id, ...doc.data() };
            promises.push(sendReminderEmail(booking));
        });
        
        await Promise.all(promises);
        
        res.send(`✅ Sent ${snapshot.size} reminder(s)`);
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error: ' + error.message);
    }
});
