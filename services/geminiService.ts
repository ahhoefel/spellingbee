
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// PCM Decoding helpers as per instructions
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playWordTTS = async (word: string, audioContext: AudioContext) => {
  if (!API_KEY) {
    console.error("API Key not found");
    return;
  }

  // Create a new instance right before the call as per best practices for key management
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    // We use a very simple prompt to ensure the model focuses on audio generation.
    // The error "returned non-audio response" often occurs when the model tries to 
    // conversationally answer a complex prompt instead of synthesizing speech.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ 
        parts: [{ 
          text: word 
        }] 
      }],
      config: {
        // Using string literal 'AUDIO' as seen in multi-speaker examples for maximum reliability
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // Kore is a clear, standard voice for spelling tests
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    // Check if we actually got audio data back
    const part = response.candidates?.[0]?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;
    
    if (!base64Audio) {
      console.error("No audio data in response. Model might have returned text instead:", part?.text);
      throw new Error("No audio data received from Gemini");
    }

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000,
      1,
    );

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (error) {
    console.error("Error generating TTS:", error);
  }
};
