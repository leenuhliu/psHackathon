import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

console.log('Starting Veo 3 generation...');

let operation = await ai.models.generateVideos({
  model: 'veo-3.0-fast-generate-001',
  prompt: 'A round purple cartoon creature with one wobbly antenna walks through a sunny meadow, hand-drawn doodle animation style, slow and gentle pacing',
  config: {
    aspectRatio: '16:9',
    durationSeconds: 8,
  },
});

while (!operation.done) {
  await new Promise(r => setTimeout(r, 5000));
  operation = await ai.operations.getVideosOperation({ operation });
  console.log('Still generating...');
}

const video = operation.response.generatedVideos[0];
await ai.files.download({ file: video.video, downloadPath: 'blobby-test.mp4' });
console.log('Done! Saved to blobby-test.mp4');
