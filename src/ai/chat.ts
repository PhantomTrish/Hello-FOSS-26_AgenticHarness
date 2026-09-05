import { openai, config } from './client.js'
import { ChatMessage } from '../types/chat.js'


export async function getAiResponse(messages: ChatMessage[]): Promise<string> {
    const response = await openai.chat.completions.create({
        model: config.model,
        messages: messages
    });
    return response.choices[0]?.message?.content ?? "";
}


if (false) { // this is for testing
    console.log('Testing Ai response..');
    const reply = await getAiResponse([{ role: 'user', content: 'Say hi and tell your name.' }])
    console.log('Response: \n', reply);
}

