import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleAuth } from 'google-auth-library';

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

const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    clientId: '278221800868-96lge07ubg94g5j0mtmnhto8sip96h7l.apps.googleusercontent.com',
    projectId: 'spelling-bee-486623'
});

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
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();
        const projectId = await auth.getProjectId();

        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json',
                'x-goog-user-project': projectId,
            },
            body: JSON.stringify({
                input: { text: word },
                voice: { languageCode: 'en-US', name: 'en-US-Wavenet-D' },
                audioConfig: { audioEncoding: 'MP3', speakingRate: 0.75 },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        const base64Audio = data.audioContent;

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