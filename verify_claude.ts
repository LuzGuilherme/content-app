
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

// Manually set key for testing if .env isn't loaded by ts-node automatically without config
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

        console.log(message.content);
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
