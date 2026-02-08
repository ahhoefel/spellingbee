import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const CSV_PATH = path.join(PUBLIC_DIR, 'lists.csv');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'sentences.csv');

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

const generateSentence = async (word) => {
    try {
        const response = await client.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ parts: [{ text: `Write a simple sentence using the word '${word}'. The sentence should clarify the meaning of the word. Replace the word '${word}' (and any variations like plurals if used) with a single underscore '_'. Output ONLY the sentence.` }] }],
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        return part?.text?.trim();
    } catch (error) {
        console.error(`Error generating sentence for ${word}:`, error);
        return null;
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

        let outputContent = 'word,sentence\n';

        for (const word of words) {
            console.log(`Generating sentence for: ${word}`);
            const sentence = await generateSentence(word);
            if (sentence) {
                // Escape quotes in sentence if necessary
                const escapedSentence = sentence.includes(',') ? `"${sentence.replace(/"/g, '""')}"` : sentence;
                outputContent += `${word},${escapedSentence}\n`;
            }
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        fs.writeFileSync(OUTPUT_PATH, outputContent);
        console.log(`Sentences saved to ${OUTPUT_PATH}`);
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
};

main();