import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || !audio.size) return NextResponse.json({ error: "No audio was recorded." }, { status: 400 });
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Voice transcription is not configured." }, { status: 503 });

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent([
            { inlineData: { data: Buffer.from(await audio.arrayBuffer()).toString("base64"), mimeType: audio.type || "audio/webm" } },
            { text: "Transcribe this spoken task exactly. Return only the transcription, with no labels or punctuation added." },
        ]);
        const text = result.response.text().trim();
        if (!text) throw new Error("No transcription returned.");
        return NextResponse.json({ text });
    } catch {
        return NextResponse.json({ error: "Kuri could not transcribe that. Try again or type it." }, { status: 502 });
    }
}
