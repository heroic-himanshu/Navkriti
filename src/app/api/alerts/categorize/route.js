// app/api/alerts/categorize/route.js
import Groq from "groq-sdk";

export async function POST(request) {
  try {
    const { transcription, age, sex, comorbidities, hospitalizations } = await request.json();
    
    // Initialize the Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    // Simplified, more structured prompt
    const prompt = `You are a medical triage AI. Analyze this emergency and respond with ONLY a valid JSON object.

PATIENT DETAILS:
- Message: "${transcription}"
- Age: ${age}
- Sex: ${sex}
- Comorbidities: ${comorbidities}
- Previous Hospitalizations: ${hospitalizations}

CATEGORIZATION RULES:
"high" = Life-threatening: chest pain, can't breathe, severe bleeding, unconscious, stroke, heart attack, choking, seizure, severe trauma
"medium" = Urgent care needed: moderate pain, high fever, injury, vomiting, dizziness, fainting, broken bone
"low" = Non-urgent: mild pain, low fever, minor discomfort, general unwellness
"ignore" = No medical concern: test message, false alarm, non-medical

RESPONSE FORMAT (respond with ONLY this JSON, no other text):
{"alert_type":"high","confidence":0.95,"reasoning":"brief explanation"}`;

    // Generate content with Groq
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a medical triage AI that responds only with valid JSON objects for emergency categorization."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile", // or "mixtral-8x7b-32768" or "llama-3.1-70b-versatile"
      temperature: 0.1,
      max_tokens: 500,
      top_p: 0.95,
      response_format: { type: "json_object" } // Ensures JSON response
    });
    
    let text = chatCompletion.choices[0]?.message?.content?.trim() || '{}';
    
    console.log('Raw AI Response:', text);
    
    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Extract JSON object if there's extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    // Parse the JSON
    const parsedResult = JSON.parse(text);
    
    // Validate the alert_type
    const validTypes = ['high', 'medium', 'low', 'ignore'];
    const alertType = validTypes.includes(parsedResult.alert_type) 
      ? parsedResult.alert_type 
      : 'medium';
    
    return Response.json({
      success: true,
      alert_type: alertType,
      confidence: parsedResult.confidence || 0.5,
      reasoning: parsedResult.reasoning || 'Categorized by AI'
    });
    
  } catch (error) {
    console.error('AI Categorization Error:', error);
    
    // Fallback: keyword-based analysis
    try {
      const { transcription } = await request.json();
      const text = (transcription || '').toLowerCase();
      
      // High priority keywords
      const highKeywords = [
        'chest pain', 'heart attack', 'can\'t breathe', 'cannot breathe',
        'not breathing', 'choking', 'unconscious', 'passed out',
        'severe bleeding', 'heavy bleeding', 'stroke', 'seizure',
        'convulsing', 'heart', 'cardiac'
      ];
      
      // Medium priority keywords
      const mediumKeywords = [
        'pain', 'hurt', 'injury', 'fever', 'temperature',
        'vomit', 'throw up', 'dizzy', 'faint', 'fell', 'fall',
        'broken', 'fracture', 'cut', 'burn', 'allergic'
      ];
      
      // Low priority keywords
      const lowKeywords = [
        'mild', 'slight', 'uncomfortable', 'unwell',
        'tired', 'weak', 'cough', 'cold', 'headache'
      ];
      
      // Check for high priority
      if (highKeywords.some(keyword => text.includes(keyword))) {
        return Response.json({
          success: true,
          alert_type: 'high',
          confidence: 0.8,
          reasoning: 'Keyword-based: life-threatening emergency detected'
        });
      }
      
      // Check for medium priority
      if (mediumKeywords.some(keyword => text.includes(keyword))) {
        return Response.json({
          success: true,
          alert_type: 'medium',
          confidence: 0.7,
          reasoning: 'Keyword-based: urgent medical attention needed'
        });
      }
      
      // Check for low priority
      if (lowKeywords.some(keyword => text.includes(keyword))) {
        return Response.json({
          success: true,
          alert_type: 'low',
          confidence: 0.6,
          reasoning: 'Keyword-based: non-urgent medical concern'
        });
      }
      
      // Default to medium for safety
      return Response.json({
        success: true,
        alert_type: 'medium',
        confidence: 0.5,
        reasoning: 'Unable to categorize, defaulting to medium for safety'
      });
      
    } catch (fallbackError) {
      console.error('Fallback Error:', fallbackError);
      return Response.json({
        success: true,
        alert_type: 'medium',
        confidence: 0.5,
        reasoning: 'Error in categorization, defaulting to medium'
      });
    }
  }
}