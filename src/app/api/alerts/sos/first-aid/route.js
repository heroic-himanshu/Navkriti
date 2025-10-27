// app/api/first-aid/route.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { transcription, alertType } = await request.json();

    const systemPrompt = `You are an emergency medical AI assistant. Provide IMMEDIATE, life-saving first aid instructions based on the patient's emergency description.

CRITICAL RULES:
1. Keep instructions SHORT and ACTIONABLE (maximum 5-6 steps)
2. Focus on IMMEDIATE actions before professional help arrives
3. Use simple, clear language
4. Prioritize safety and stabilization
5. Always remind to call emergency services (102 in India)

Format your response as:
**Emergency Situation:** [Brief assessment]

**IMMEDIATE ACTIONS:**
1. [Most critical action]
2. [Second action]
3. [Third action]
...

**WARNING:** [What NOT to do]

**CALL 102 IF:** [Critical warning signs]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Emergency Alert Level: ${alertType.toUpperCase()}\n\nPatient's emergency message: "${transcription}"\n\nProvide immediate first aid instructions.`
        }
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const firstAid = completion.choices[0].message.content;

    return Response.json({
      success: true,
      firstAid,
    });

  } catch (error) {
    console.error('OpenAI Error:', error);
    
    // Fallback instructions
    return Response.json({
      success: true,
      firstAid: `**Emergency Situation:** Medical emergency requiring immediate attention.

**IMMEDIATE ACTIONS:**
1. Stay calm and ensure the patient is in a safe location
2. Call 102 immediately for emergency medical services
3. Do not move the patient unless there is immediate danger
4. Monitor breathing and pulse
5. Keep the patient comfortable and warm

**WARNING:** Do not give food or water until medical help arrives

**CALL 102 IF:** Condition worsens, difficulty breathing, loss of consciousness, severe bleeding`,
    });
  }
}
