import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage } from '../types';

const getClient = () => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    // Note: For a frontend-only demo, we might need to use a proxy or "dangerouslyAllowBrowser: true" if the SDK supports it, 
    // or simple fetch calls if the SDK forces Node environment. 
    // The official SDK often requires Node.js, but let's see if it works with Vite or if we need a workaround.
    // Actually, for a pure client-side app without a backend, providing the key directly is risky in production but acceptable for this local tool.
    // We need to set dangerouslyAllowBrowser: true for the SDK to work in the browser.

    if (!apiKey) {
        console.error("ANTHROPIC_API_KEY not found");
        throw new Error("Anthropic API Key not found");
    }

    return new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage
    });
};

export const sendClaudeMessage = async (
    messages: ChatMessage[],
    systemInstruction: string,
    model: string
): Promise<string> => {
    const client = getClient();

    // Convert ChatMessage[] to Anthropic MessageParam[]
    // Anthropic messages must alternate user/assistant. 
    // We'll filter and map, and handle potentially consecutive messages by merging or just letting the API handle/error?
    // Anthropic API strictly requires alternating messages.

    const apiMessages: any[] = [];
    let lastRole = null;

    console.log(`[ClaudeService] Sending message to model: ${model}`); // Verification Log

    for (const msg of messages) {
        const role = msg.role === 'model' ? 'assistant' : 'user';

        if (role === lastRole) {
            // Merge with previous message to enforce alternation
            apiMessages[apiMessages.length - 1].content += "\n\n" + msg.text;
        } else {
            apiMessages.push({
                role: role,
                content: msg.text
            });
        }
        lastRole = role;
    }

    try {
        const response = await client.messages.create({
            model: model,
            max_tokens: 1024,
            system: systemInstruction,
            messages: apiMessages,
        });

        if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
            return response.content[0].text;
        }
        return "No text response generated.";

    } catch (error: any) {
        console.error("Claude API Error:", error);
        const errorMessage = error?.message || "Unknown error";
        return `Error generating response from Claude: ${errorMessage}. Please check your API key and connection.`;
    }
};
