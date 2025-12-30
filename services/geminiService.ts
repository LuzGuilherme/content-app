import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

// Helper to get client
const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const createChatSession = (model: string, systemInstruction: string) => {
  const client = getClient();
  return client.chats.create({
    model: model,
    config: {
      systemInstruction: systemInstruction,
      thinkingConfig: model.includes("pro") ? { thinkingBudget: 1024 } : undefined,
    },
  });
};

export const sendMessage = async (chat: Chat, message: string): Promise<string> => {
  try {
    // Note: The chat object itself doesn't easily expose the model name synchronously after creation in the SDK wrapper,
    // but we can assume if this is called, it's the Gemini service.
    // In a real app we might store the model in the chat wrapper.
    console.log(`[GeminiService] Sending message to Gemini`);

    const response: GenerateContentResponse = await chat.sendMessage({
      message: message,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating response. Please check your API key and try again.";
  }
};