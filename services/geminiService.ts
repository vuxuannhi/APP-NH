
import { GoogleGenAI } from "@google/genai";
import { GenerationOptions, GeneratedResult } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants/prompts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            } else {
                reject(new Error("Failed to convert file to base64"));
            }
        };
        reader.onerror = error => reject(error);
    });
};

export const generateImageWithNanoBanana = async (
    imageBase64: string,
    mimeType: string,
    options: GenerationOptions,
    secondImage?: { base64: string; mimeType: string } | null
): Promise<GeneratedResult> => {
    const isCouple = !!secondImage;
    const isCustom = options.theme === 'custom';

    // Construct a rich prompt based on user options
    let prompt = "";

    if (isCustom) {
        prompt = `Transform this input image into a premium photorealistic image based on the following user description:
        
        User Description: ${options.customPrompt}
        
        Subject Aesthetics:
        - Maintain the identity and facial features of the subject in the input image.
        - Ensure the result is a realistic photograph, not an illustration.
        `;
    } else if (isCouple) {
        prompt = `Transform these TWO input images into a premium photorealistic COUPLE portrait with the following style:
    
    Theme: ${options.theme.toUpperCase().replace('_', ' ')}
    Concept: ${options.concept}
    ${options.customPrompt ? `Additional Instructions: ${options.customPrompt}` : ''}
    
    Subject Aesthetics:
    - The image must feature TWO people corresponding to the two input images.
    - Posing: The couple must strike a romantic, high-fashion, or natural pose based on the concept. Interactions should be genuine (holding hands, looking at each other, leaning in, hugging).
    - Outfit: Matching or coordinated outfits as described in the concept.
    - Clothing Value: Ultra-luxury, high-end fabrics, detailed textures.
    - Composition: Balanced composition focusing on the connection between the two subjects.
    `;
    } else {
        prompt = `Transform this image into a premium photorealistic portrait with the following style:
    
    Theme: ${options.theme.toUpperCase().replace('_', ' ')}
    Concept: ${options.concept}
    ${options.customPrompt ? `Additional Instructions: ${options.customPrompt}` : ''}
    
    Subject Aesthetics:
    - Body: The model must have a slim, high-fashion figure with a defined waistline.
    - Posing: The model must strike a world-class, A-list supermodel pose. The pose should be DYNAMIC, ELEGANT, FLUID, and CONFIDENT.
    - Outfit Constraint: The outfit must be modest around the waist; absolutely NO exposed navel or midriff.
    - Clothing Value: The outfit must scream "ULTRA-LUXURY" and "BILLIONAIRE STYLE".
    `;
    }

    prompt += `
    Style Details:
    - Lighting: Cinematic, soft, professional studio lighting or atmospheric natural light matching the concept.
    - Camera: High-end DSLR, 85mm lens, f/1.8 aperture, sharp focus on eyes, bokeh background.
    - Quality: 8k resolution, highly detailed, HDR, masterpiece.
    `;

    if (options.faceConsistency) {
        if (isCouple) {
            prompt += `
    CRITICAL INSTRUCTION: Maintain the facial features and identity of BOTH subjects from the input images. The first person in the output should resemble the first input image, and the second person should resemble the second input image.`;
        } else {
            prompt += `
    CRITICAL INSTRUCTION: Maintain the facial features, identity, and expression of the person in the source image. The output person MUST look exactly like the input person, but wearing the clothes and in the environment described in the concept.`;
        }
    }

    if (options.quality === 'Ultra') {
        prompt += `
    - Texture: Ultra-realistic skin texture, fabric details, and environmental depth.`;
    }

    prompt += `
    Ensure the image is not a cartoon, not a drawing, but a real photograph.`;

    try {
        const parts: any[] = [
            {
                inlineData: {
                    mimeType: mimeType,
                    data: imageBase64
                }
            }
        ];

        if (secondImage) {
            parts.push({
                inlineData: {
                    mimeType: secondImage.mimeType,
                    data: secondImage.base64
                }
            });
        }

        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                // gemini-2.5-flash-image supports aspectRatio in config as per latest docs for image generation
                imageConfig: {
                    aspectRatio: options.aspectRatio
                }
            }
        });

        // Parse response to find the image
        // The API might return text (if it refused to generate) or image data
        let generatedImageBase64 = null;
        
        if (response.candidates && response.candidates.length > 0) {
            const content = response.candidates[0].content;
            if (content.parts) {
                for (const part of content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        generatedImageBase64 = part.inlineData.data;
                        break;
                    }
                }
            }
        }

        if (!generatedImageBase64) {
             // Fallback: Check if there is text explaining why it failed
             const textPart = response.text;
             if (textPart) {
                 throw new Error(`AI Refusal: ${textPart}`);
             }
             throw new Error("No image generated by the model.");
        }

        return {
            image: generatedImageBase64,
            prompt: prompt
        };

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};