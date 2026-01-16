
import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

export const generateMagicImage = async (state: AppState): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const modelName = 'gemini-2.5-flash-image';
  
  // Construct a high-end prompt based on user selections
  const prompt = `
    Create a luxury, high-end professional commercial photoshoot for a ${state.category} product.
    
    Product Context:
    The main subject is the product shown in the provided reference images. It must be rendered clearly and be the central focus.
    
    Scene & Model:
    ${state.modelSource === 'Tanpa Model' ? 'The product is presented standalone as a high-end still life.' : 
      state.modelSource === 'Upload Sendiri' ? 'The scene features the specific model provided in the model reference image interacting with the product.' :
      `The scene features a ${state.modelType || 'professional model'} interacting with the product.`}
    Location: ${state.scene}
    Visual Atmosphere: ${state.vibe}, luxury, editorial, sharp focus, 8k resolution, cinematic lighting.
    Camera Perspective: ${state.cameraAngle}
    
    Additional artistic details: ${state.additionalPrompt}
    
    Ensure the lighting is professional and the composition follows high-end advertising standards. 
    The product brand and details must be crisp and recognizable.
  `.trim();

  const generateOne = async () => {
    const parts: any[] = [];

    // Add product image reference
    if (state.productImages.length > 0) {
      parts.push({
        inlineData: {
          data: state.productImages[0].split(',')[1],
          mimeType: 'image/png',
        },
      });
    }

    // Add custom model image reference if applicable
    if (state.modelSource === 'Upload Sendiri' && state.customModelImage) {
      parts.push({
        inlineData: {
          data: state.customModelImage.split(',')[1],
          mimeType: 'image/png',
        },
      });
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: state.aspectRatio as any,
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from AI");
  };

  // Generate 2 variations as requested
  const [img1, img2] = await Promise.all([generateOne(), generateOne()]);
  return [img1, img2];
};
