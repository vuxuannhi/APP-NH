
export type Theme = 'korean' | 'entrepreneur' | 'hanoi_winter' | 'international_model' | 'flower_muse' | 'christmas' | 'princess_muse' | 'christmas_couple' | 'custom' | 'singer';

export type AspectRatio = '1:1' | '3:4' | '9:16';

export type Quality = 'Standard' | 'High' | 'Ultra';

export interface GenerationOptions {
    theme: Theme;
    concept: string;
    aspectRatio: AspectRatio;
    quality: Quality;
    faceConsistency: boolean;
    customPrompt?: string;
}

export interface GeneratedResult {
    image: string; // Base64
    prompt: string;
}