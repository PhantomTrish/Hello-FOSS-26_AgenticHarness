import 'dotenv/config'
import OpenAI from 'openai'


type Provider = 'openrouter' | 'gemini';
const router: Provider = 'gemini';

const PROVIDER_CONFIG = {
    openrouter: {
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
        model: 'openrouter/free'
    },
    gemini: {
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-flash-lite-latest'
    },
} as const;

export const config = PROVIDER_CONFIG[router];

if (config.apiKey == null) console.warn('API KEY is not set!');

export const openai = new OpenAI(config);

