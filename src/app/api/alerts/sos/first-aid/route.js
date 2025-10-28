// app/api/alerts/sos/first-aid/route.js
import { GoogleGenAI } from "@google/genai";

export async function POST(request) {
  try {
    const { transcription } = await request.json();

    if (!transcription) {
      return Response.json({
        success: false,
        error: 'Transcription is required'
      }, { status: 400 });
    }

    let cleanTranscription = transcription;
    if (typeof transcription === 'string' && transcription.startsWith('{')) {
      try {
        const parsed = JSON.parse(transcription);
        cleanTranscription = parsed.text || parsed.transcription || transcription;
      } catch {
        cleanTranscription = transcription;
      }
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY
    });

    const prompt = `You are an emergency medical AI assistant.

Patient's emergency: "${cleanTranscription}"

Provide IMMEDIATE first aid instructions:

**Emergency Situation:** [Brief assessment]

**IMMEDIATE ACTIONS:**
1. [Critical action]
2. [Second action]
3. [Third action]
4. [Fourth action]
5. [Fifth action]

**WARNING:** [What NOT to do]

**CALL 102 IF:** [When to call emergency]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    return Response.json({
      success: true,
      firstAid: response.text
    });

  } catch (error) {
    return Response.json({
      success: true,
      firstAid: `**Emergency Situation:** Medical emergency requiring immediate attention.

**IMMEDIATE ACTIONS:**
1. Stay calm and ensure the patient is in a safe location
2. Call 102 immediately for emergency medical services
3. Do not move the patient unless there is immediate danger
4. Monitor breathing and pulse continuously
5. Keep the patient comfortable and warm

**WARNING:** Do not give food or water until medical help arrives.

**CALL 102 IF:** Condition worsens, difficulty breathing, loss of consciousness, severe bleeding.`
    });
  }
}
