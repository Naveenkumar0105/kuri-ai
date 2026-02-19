import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  let text = "";
  try {
    const body = await req.json();
    text = body.text;
    const { userLocalTime } = body;

    const localDate = userLocalTime ? new Date(userLocalTime) : new Date();
    // We pass the raw string to the LLM so it can handle the Timezone Offset correctly.
    // relying on localDate.getHours() on the server would use the Server's Timezone (UTC on Vercel),
    // which would cause the LLM to think it's a different time than it really is for the user.

    if (!process.env.GEMINI_API_KEY) {
      // Fallback for demo purposes if no key is provided
      console.warn("No GEMINI_API_KEY found. Using mock categorization.");
      return NextResponse.json({ tasks: [{ text, category: "Uncategorized" }] });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an advanced AI task manager. Your goal is to process user input into structured tasks.
      
      **CURRENT USER CONTEXT**:
      - User's Local Time String: "${userLocalTime || new Date().toString()}"
      - Please use the above string to determine the current Year, Month, Day, Time, Weekday, AND **Timezone Offset** (e.g. -08:00, +05:30).

      **TASK**:
      1. **Check for Multiple Actions**: If the input contains multiple distinct actions (e.g., "buy apple and mango"), return them in the "tasks" array.
      2. **Check for Complexity (Decomposition)**: If the input is a SINGLE task but is broad/complex (e.g., "Plan a wedding"), decompose it.
         - Return 3-10 subtasks in "decomposition".
         - Assign a Project Name category.
      3. **NEW (CRITICAL)**: Extract date/time and formatted as **ISO 8601 WITH OFFSET**.
         - Use the "Current User Context" to find the Timezone Offset.
         - Calculate the target date/time based on the input.
         - Combine them into a full ISO string WITH the offset.
         - **Example**:
           - User Context: "Mon Feb 16 2026 19:00:00 GMT-0800 (Pacific Standard Time)"
           - Input: "Dinner at 8pm"
           - Result: "2026-02-16T20:00:00-08:00" (Note the -08:00 at the end).
         - Do NOT return a 'Z' (UTC) unless the user is actually in UTC.
         - Return this string in "dueDate".
         - **NEW**: Classify the type of date in "dateType":
           - "due": if the task implies a deadline (e.g., "by", "before", "deadline", "due", "finish").
           - "scheduled": if the task implies a specific event time (e.g., "at", "on", "meeting", "appointment").
           - Default to "scheduled" if ambiguous but a time is present.
      4. **CATEGORIZATION**:
         - Standard: "Work", "Personal", "Shopping", "Health".
         - **Dynamic**: If it doesn't fit firmly, CREATE a new 1-word category.
           - "Fix warp drive" -> "Space"
           - "Pay taxes" -> "Finance"
           - "Call mom" -> "Personal"
           - "Buy milk" -> "Shopping"
         - Avoid "Uncategorized" if possible.
      
      **OUTPUT JSON FORMAT**:
      {
        "tasks": [ { "text": "...", "category": "...", "dueDate": "...", "dateType": "..." } ],
        "decomposition": [ { "text": "...", "category": "..." } ]
      }

      **EXAMPLES**:
      Input: "finish report by 5pm"
      Output: { "tasks": [{ "text": "finish report", "category": "Work", "dueDate": "...", "dateType": "due" }] }

      Input: "Meeting at 2pm"
      Output: { "tasks": [{ "text": "Meeting", "category": "Work", "dueDate": "...", "dateType": "scheduled" }] }

      Input: "Plan a wedding"
      Output: { 
        "tasks": [{ "text": "Plan a wedding", "category": "Personal", "dueDate": null }], 
        "decomposition": [ ... ]
      }
      
      Input: "${text}"
      Return ONLY the JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();

    // Clean up markdown code blocks if present
    const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(jsonString);

    return NextResponse.json({
      tasks: parsedData.tasks,
      decomposition: parsedData.decomposition,
      source: "AI"
    });
  } catch (error) {
    console.error("Error categorizing task:", error);

    // Smart fallback if API fails
    let tasks = [{ text: text || "Uncategorized Task", category: "Uncategorized" }];

    // Simple fallback splitting by "and" or commas (without inferring verbs)
    if (text && (text.includes(" and ") || text.includes(","))) {
      const parts = text.split(/ and |,/);
      tasks = parts.map((part: string) => ({
        text: part.trim(),
        category: "Uncategorized",
        dueDate: null,
        dateType: null
      })).filter((t: any) => t.text.length > 0);
    }

    return NextResponse.json({ tasks, source: "fallback", error: String(error) });
  }
}
