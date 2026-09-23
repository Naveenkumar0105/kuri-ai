import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export async function addToGoogleCalendar(
    userId: string,
    title: string,
    description: string,
    startTime: string,
    timeZone: string = "UTC",
    isAllDay: boolean = false
) {
    // 1. Fetch user's Google Account from Prisma
    const account = await prisma.account.findFirst({
        where: {
            userId: userId,
            provider: "google",
        },
    });

    if (!account || !account.access_token || !account.refresh_token) {
        throw new Error("Google Calendar is not linked. Please sign in with Google.");
    }

    try {
        // 2. Initialize OAuth2 Client
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        // Set the credentials
        oauth2Client.setCredentials({
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expiry_date: account.expires_at ? account.expires_at * 1000 : null,
        });

        // Optional: Listen for token refresh and update DB
        oauth2Client.on("tokens", async (tokens) => {
            if (tokens.access_token) {
                await prisma.account.update({
                    where: { id: account.id },
                    data: {
                        access_token: tokens.access_token,
                        refresh_token: tokens.refresh_token || account.refresh_token,
                        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
                    },
                });
            }
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        // 3. Create Event
        const event: any = {
            summary: title,
            description: description,
        };

        if (isAllDay) {
            const dateStr = startTime.split('T')[0];
            event.start = { date: dateStr };
            event.end = { date: dateStr };
        } else {
            const startDateTime = new Date(startTime);
            const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration
            event.start = { dateTime: startDateTime.toISOString(), timeZone };
            event.end = { dateTime: endDateTime.toISOString(), timeZone };
        }

        const response = await calendar.events.insert({
            calendarId: "primary", // Uses the authenticated user's primary calendar
            requestBody: event,
        });

        console.log("Calendar Event Created:", response.data.htmlLink);
        return response.data;
    } catch (error: any) {
        console.error("Error creating calendar event:", error);
        throw new Error(error.message || "Unknown Calendar API Error");
    }
}
