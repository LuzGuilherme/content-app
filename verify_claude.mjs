
import Anthropic from '@anthropic-ai/sdk';

// Manually set key for testing
const apiKey = process.env.ANTHROPIC_API_KEY || "";

const client = new Anthropic({
    apiKey: apiKey,
});

async function main() {
    try {
        const message = await client.messages.create({
            max_tokens: 1024,
            messages: [{ role: 'user', content: 'Hello, are you working?' }],
            model: 'claude-sonnet-4-5-20250929',
        });

        if (message.content[0].type === 'text') {
            console.log("Success:", message.content[0].text);
        } else {
            console.log("Success (non-text response):", message.content);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
