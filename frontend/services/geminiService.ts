import { GoogleGenAI, Type } from "@google/genai";
import { Message, Customer } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not defined in process.env");
    // Fallback or error handling logic could go here, but for this strict example we assume it exists.
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

// --- Scent Concierge (Chat) ---

export const getConciergeResponse = async (
  history: Message[],
  newMessage: string
): Promise<string> => {
  const ai = getClient();
  
  // Format history for context
  const conversationContext = history
    .map(m => `${m.sender.toUpperCase()}: ${m.content}`)
    .join('\n');

  const prompt = `
    You are 'Aura', a highly sophisticated and poetic fragrance concierge for a luxury perfume brand called 'Aura Parfumerie'.
    
    Previous Conversation:
    ${conversationContext}

    Customer: ${newMessage}

    Your goal is to guide the customer to find their perfect scent. 
    - Be elegant, warm, and professional.
    - Ask clarifying questions about their mood, memories, or favorite natural scents if you don't have enough info.
    - Recommend notes like "Bergamot", "Oud", "Jasmine", "Vetiver" based on their inputs.
    - Keep responses concise (under 80 words) but evocative.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed over depth for chat
      }
    });
    return response.text || "I apologize, I am momentarily lost in thought. Please tell me more about what you desire.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I am having trouble connecting to the sensory network. Please try again.";
  }
};

// --- CRM Intelligence (Analysis) ---

interface CustomerAnalysis {
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  statusSuggestion: 'Lead' | 'Active' | 'VIP' | 'At Risk';
  extractedPreferences: string[];
  summary: string;
  nextAction: string;
}

export const analyzeCustomerInteraction = async (
  messages: Message[]
): Promise<CustomerAnalysis> => {
  const ai = getClient();

  const transcript = messages.map(m => `${m.sender}: ${m.content}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following customer service transcript for a luxury perfume brand.
      
      Transcript:
      ${transcript}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'] },
            statusSuggestion: { type: Type.STRING, enum: ['Lead', 'Active', 'VIP', 'At Risk'] },
            extractedPreferences: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of scent notes or product types the user likes"
            },
            summary: { type: Type.STRING, description: "A concise summary of the customer's profile and recent interactions." },
            nextAction: { type: Type.STRING, description: "A specific recommended action for the sales agent (e.g., 'Suggest Bergamot sample', 'Send apology gift')." }
          },
          required: ['sentiment', 'statusSuggestion', 'extractedPreferences', 'summary', 'nextAction']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as CustomerAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      sentiment: 'Neutral',
      statusSuggestion: 'Active',
      extractedPreferences: [],
      summary: "Analysis failed.",
      nextAction: "Review manually"
    };
  }
};

// --- Campaign Generation ---

export const generateCampaignContent = async (
  topic: string,
  targetSegment: string
): Promise<{ subject: string; body: string }> => {
  const ai = getClient();
  const prompt = `
    You are the marketing director for 'Aura Parfumerie', a luxury fragrance brand.
    Write a short, elegant email campaign.
    
    Target Audience Segment: ${targetSegment}
    Campaign Goal/Topic: ${topic}
    
    Tone: Sophisticated, sensory, exclusive, slightly mysterious.
    
    Return the response as a JSON object with 'subject' and 'body' fields.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING }
          },
          required: ['subject', 'body']
        }
      }
    });
    
    return JSON.parse(response.text || '{"subject": "", "body": ""}');
  } catch (error) {
    console.error("Gemini Campaign Error:", error);
    return { 
      subject: "Exclusive Invitation", 
      body: "We invite you to experience the latest from Aura Parfumerie." 
    };
  }
};

// --- Product Description Generation ---

export const generateProductDescription = async (
  name: string,
  notes: string[]
): Promise<string> => {
  const ai = getClient();
  const prompt = `
    Write a captivating, luxury product description for a new fragrance or home scent called "${name}".
    
    Key Notes/Ingredients: ${notes.join(', ')}.
    
    Tone: Poetic, evocative, high-end fashion, sensory.
    Length: 2 sentences max.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "A unique olfactory experience.";
  } catch (error) {
    console.error("Gemini Product Gen Error:", error);
    return "A unique olfactory experience.";
  }
};