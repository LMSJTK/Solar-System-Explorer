
import { GoogleGenAI } from "@google/genai";
import { PREGENERATED_DESCRIPTIONS, PREGENERATED_FUN_FACTS, PREGENERATED_SCALE_FACTS } from "../pregeneratedContent";

let ai: GoogleGenAI | null = null;

// Initialize safely
try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    console.warn("Gemini API Key is missing. AI features will be disabled.");
  }
} catch (error) {
  console.error("Failed to initialize Gemini client", error);
}

const PERSONAS = [
  "a cautious Safety Officer assessing environmental hazards (radiation, gravity, temperature)",
  "an enthusiastic Exobiologist scanning for potential biosignatures or habitability",
  "a stoic Geologist analyzing surface composition and tectonic activity",
  "a holographic Tour Guide focused on scenic views and aesthetic beauty",
  "a quirky Ship Historian recounting the discovery or mythology of the body",
  "a pragmatic Mining AI assessing mineral resource potential",
  "a sarcastic Navigation Computer annoyed by the detour"
];

const FALLBACK_MESSAGES = [
    "Long-range sensors are recalibrating.",
    "Solar flare interference detected. Database unreachable.",
    "Uplink packet loss. Retrying connection...",
    "Cosmic background radiation obscuring data stream."
];

// Track which pre-generated descriptions have been shown for each planet
const usageHistory: Record<string, number> = {};

/**
 * Fetches a description of a celestial body.
 * @param planetName The name of the body
 * @param forceAI If true, bypasses pre-generated content and calls the API directly
 */
export const getPlanetDescription = async (planetName: string, forceAI: boolean = false): Promise<string> => {
  
  // 1. Standard / Passive Scan (Pre-generated only)
  if (!forceAI) {
      if (usageHistory[planetName] === undefined) {
        usageHistory[planetName] = 0;
      }
      
      const scientific = PREGENERATED_DESCRIPTIONS[planetName] || [];
      const funFacts = PREGENERATED_FUN_FACTS[planetName] || [];
      const scaleFacts = PREGENERATED_SCALE_FACTS[planetName] || [];
      
      // Combine lists by interleaving them to provide variety (Science, Fun, Scale, Science...)
      const combined: string[] = [];
      const maxLength = Math.max(scientific.length, funFacts.length, scaleFacts.length);
      
      for (let i = 0; i < maxLength; i++) {
        if (i < scientific.length) combined.push(scientific[i]);
        if (i < funFacts.length) combined.push(funFacts[i]);
        if (i < scaleFacts.length) combined.push(scaleFacts[i]);
      }

      if (combined.length > 0) {
           // Cycle through pregens endlessly using modulo
           const index = usageHistory[planetName] % combined.length;
           usageHistory[planetName]++; // Increment for next time
           
           // Simulate a small network delay for realism ("Scanning...")
           await new Promise(resolve => setTimeout(resolve, 800));
           return combined[index];
      }
      return "No data available in local database.";
  }

  // 2. Deep Scan (Gemini API)
  if (!ai) {
    return "Ship computer offline. Unable to access neural network.";
  }

  try {
    const modelId = 'gemini-2.5-flash';
    
    // Select a random persona for this interaction
    const persona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];

    const prompt = `You are the ship's computer on a futuristic spaceship. 
    We are currently approaching ${planetName}.
    
    Adopt the persona of ${persona}.
    
    Provide a single, unique, and dynamic observation about ${planetName} (max 2 sentences).
    The fact should reflect your current persona's specific interests.
    Keep it immersive and sci-fi.
    Do not use markdown formatting.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "No data available.";
  } catch (error: any) {
    console.error("Error fetching planet description:", error);
    
    // Detect Rate Limiting (429)
    const isRateLimit = 
        error?.status === 429 || 
        error?.code === 429 ||
        error?.message?.includes('429') || 
        error?.message?.includes('quota') ||
        error?.message?.includes('RESOURCE_EXHAUSTED');

    if (isRateLimit) {
        return "Warning: Neural network bandwidth exceeded. Sensors cooling down.";
    }

    return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
  }
};

/**
 * Chat with the ship's AI computer
 * @param message User's question
 * @param currentPlanet The planet currently near (for context)
 * @param conversationHistory Previous messages in the conversation
 */
export const chatWithShipComputer = async (
  message: string,
  currentPlanet: string | null,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> => {
  if (!ai) {
    return "Ship computer offline. Unable to establish communications.";
  }

  try {
    const modelId = 'gemini-2.5-flash';

    const systemContext = currentPlanet
      ? `You are the ship's AI computer. We are currently near ${currentPlanet}.`
      : `You are the ship's AI computer. We are in deep space.`;

    // Build conversation context
    let conversationContext = '';
    conversationHistory.slice(-6).forEach(msg => {
      conversationContext += `${msg.role === 'user' ? 'Pilot' : 'Computer'}: ${msg.content}\n`;
    });

    const prompt = `${systemContext}

${conversationContext ? `Recent conversation:\n${conversationContext}\n` : ''}Pilot: ${message}
Computer:

Instructions:
- Respond in character as a knowledgeable, slightly formal AI ship computer
- Keep responses concise (1-3 sentences)
- If asked about the current planet, provide interesting facts
- Be helpful but maintain a professional tone
- Do not use markdown formatting
- Stay immersive and sci-fi themed`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "Communications error.";
  } catch (error: any) {
    console.error("Error in ship computer chat:", error);

    const isRateLimit =
      error?.status === 429 ||
      error?.code === 429 ||
      error?.message?.includes('429') ||
      error?.message?.includes('quota') ||
      error?.message?.includes('RESOURCE_EXHAUSTED');

    if (isRateLimit) {
      return "Communications bandwidth exceeded. Please wait before sending another message.";
    }

    return "Communications interference detected. Unable to process query.";
  }
};
