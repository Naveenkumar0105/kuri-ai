import { google } from "googleapis";

export async function addToGoogleCalendar(
    title: string,
    description: string,
    startTime: string,
    timeZone: string = "UTC",
    isAllDay: boolean = false
) {
    // 1. Check for Service Account Credentials
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const calendarId = process.env.GOOGLE_CALENDAR_ID; // e.g., 'primary' or a specific ID

    if (!key || !email || !calendarId) {
        throw new Error("Missing Google Calendar Credentials. Please check GOOGLE_SERVICE_ACCOUNT_KEY in settings.");
    }

    try {
        // 2. Authenticate
        const auth = new google.auth.JWT({
            email,
            key: key.replace(/\\n/g, "\n"),
            scopes: ["https://www.googleapis.com/auth/calendar"]
        });

        const calendar = google.calendar({ version: "v3", auth });

        // 3. Create Event
        let event: any = {
            summary: title,
            description: description,
        };

        if (isAllDay) {
            // For All Day, we use 'date' (YYYY-MM-DD) instead of 'dateTime'
            const dateStr = startTime.split('T')[0];
            event.start = { date: dateStr };
            event.end = { date: dateStr }; // Google treats same start/end date as 1 day
        } else {
            const startDateTime = new Date(startTime);
            const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default duration: 1 hour
            event.start = { dateTime: startDateTime.toISOString(), timeZone };
            event.end = { dateTime: endDateTime.toISOString(), timeZone };
        }

        const response = await calendar.events.insert({
            calendarId: calendarId,
            requestBody: event,
        });

        console.log("Calendar Event Created:", response.data.htmlLink);
        return response.data;
    } catch (error: any) {
        console.error("Error creating calendar event:", error);
        throw new Error(error.message || "Unknown Calendar API Error");
    }
}
