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
    const currentYear = localDate.getFullYear();
    const currentMonth = localDate.getMonth() + 1;
    const currentDay = localDate.getDate();
    const currentHour = localDate.getHours();
    const currentMinute = localDate.getMinutes();
    const currentWeekday = localDate.toLocaleDateString('en-US', { weekday: 'long' });

    if (!process.env.GEMINI_API_KEY) {
      // Fallback for demo purposes if no key is provided
      console.warn("No GEMINI_API_KEY found. Using mock categorization.");
      return NextResponse.json({ tasks: [{ text, category: "Uncategorized" }] });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an advanced AI task manager. Your goal is to process user input into structured tasks.
      
      **CURRENT CONTEXT (User's Local Time)**:
      - Full String: ${userLocalTime || new Date().toString()}
      - Year: ${currentYear}
      - Month: ${currentMonth}
      - Day: ${currentDay}
      - Time: ${currentHour}:${currentMinute}
      - Weekday: ${currentWeekday}
      - Analyze the input relative to this local time.

      **TASK**:
      1. **Check for Multiple Actions**: If the input contains multiple distinct actions (e.g., "buy apple and mango"), return them in the "tasks" array.
      2. **Check for Complexity (Decomposition)**: If the input is a SINGLE task but is broad/complex (e.g., "Plan a wedding", "Build a house", "Organize party"), you MUST decompose it.
         - Return the original task in "tasks" (optional, usually skipped if decomposing).
         - **CRITICAL**: Return 3-10 subtasks in the "decomposition" array.
         - *Example*: Input "Plan a wedding" -> decomposition: [{"text": "Book venue", ...}, {"text": "Send invites", ...}]
         - **NEW CATEGORIZATION RULE FOR DECOMPOSITION**:
           - Identify a specific **Project Name** from the input (e.g., "Plan a wedding" -> "Wedding", "Build a house" -> "House Build").
           - Assign this Project Name as the category for **ALL** decomposed subtasks.
           - Do NOT use generic categories like "Personal" or "Finance" for these subtasks. Group them under the Project Name.
      3. **NEW**: Extract any date and time mentioned in the input.
         - Use the "Current Context" above as the anchor.
         - Calculate the absolute ISO 8601 string for that date/time.
         - Example: If Context is "Day: 24, Time: 11:25" and input is "Meeting at 2pm", the dueDate should be "${currentYear}-${currentMonth}-${currentDay}T14:00:00.000" (formatted as ISO).
         - Return this ISO string in "dueDate". If no date is mentioned, set "dueDate" to null.
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
