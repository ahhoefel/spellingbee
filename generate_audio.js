import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const AUDIO_DIR = path.join(PUBLIC_DIR, 'audio');
const CSV_PATH = path.join(PUBLIC_DIR, 'lists.csv');

// Load environment variables from .env.local manually
const loadEnv = () => {
    const envPath = path.join(ROOT_DIR, '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim();
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    }
};

loadEnv();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('Error: GEMINI_API_KEY not found in environment variables or .env.local');
    process.exit(1);
}

const client = new GoogleGenAI({ apiKey: API_KEY });

if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    const words = new Set();
    // Skip header row (index 0)
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(cell => cell.trim());
        row.forEach(cell => {
            if (cell) words.add(cell);
        });
    }
    return Array.from(words);
};

const generateAudio = async (word) => {
    const filePath = path.join(AUDIO_DIR, `${word}.mp3`);

    console.log(`Generating: ${word}`);
    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: word }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const base64Audio = part?.inlineData?.data;

        if (base64Audio) {
            const buffer = Buffer.from(base64Audio, 'base64');
            fs.writeFileSync(filePath, buffer);
        } else {
            console.error(`Failed to generate audio for: ${word}`);
        }
    } catch (error) {
        console.error(`Error generating ${word}:`, error.message);
    }
};

const main = async () => {
    try {
        if (!fs.existsSync(CSV_PATH)) {
            throw new Error(`lists.csv not found at ${CSV_PATH}`);
        }
        const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
        const words = parseCSV(csvContent);
        console.log(`Found ${words.length} unique words.`);

        for (const word of words) {
            await generateAudio(word);
            // Rate limiting: wait 100ms between requests to be safe
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log('Audio generation complete!');
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
};

main();