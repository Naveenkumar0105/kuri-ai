require('dotenv').config();
const { google } = require('googleapis');

async function testSync() {
    console.log("1. Reading Env...");
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    console.log(`Email: ${email}`);
    console.log(`Calendar ID: ${calendarId}`);
    console.log(`Key Length: ${key ? key.length : 'MISSING'}`);

    if (!key || !email || !calendarId) {
        console.error("❌ Missing variables!");
        return;
    }

    try {
        console.log("2. Authorizing...");
        // Replicating logic from src/lib/calendar.ts
        const auth = new google.auth.JWT({
            email,
            key: key.replace(/\\n/g, "\n"),
            scopes: ["https://www.googleapis.com/auth/calendar"]
        });

        const calendar = google.calendar({ version: "v3", auth });

        console.log("3. Inserting Test Event...");
        const event = {
            summary: "Test Event from Kuri Debugger",
            description: "Checking if credentials work.",
            start: { date: new Date().toISOString().split("T")[0] },
            end: { date: new Date().toISOString().split("T")[0] },
        };

        const res = await calendar.events.insert({
            calendarId,
            requestBody: event,
        });

        console.log("✅ SUCCESS!");
        console.log("Link:", res.data.htmlLink);
    } catch (error) {
        console.error("❌ FAILED:");
        console.error(error.message);
        if (error.response) {
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

testSync();
