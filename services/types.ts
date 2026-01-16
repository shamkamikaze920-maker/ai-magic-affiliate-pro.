
export type ProductCategory = 'Fashion' | 'Aksesoris & Beg' | 'F&B' | 'Lainnya';

export type ModelSource = 'Tanpa Model' | 'Model AI' | 'Upload Sendiri';

export type ModelType = 
  | 'Gadis Berhijab' 
  | 'Gadis Non-Hijab' 
  | 'Lelaki Tua' 
  | 'Lelaki Remaja' 
  | 'Budak Perempuan' 
  | 'Budak Lelaki';

// Gemini 2.5 Flash Image supported aspect ratios: '1:1', '3:4', '4:3', '9:16', '16:9'
export type AspectRatio = '9:16' | '1:1' | '3:4' | '4:3';

export interface AppState {
  productImages: string[];
  category: ProductCategory;
  modelSource: ModelSource;
  modelType?: ModelType;
  customModelImage?: string;
  scene: string;
  vibe: string;
  cameraAngle: string;
  additionalPrompt: string;
  aspectRatio: AspectRatio;
}

export interface GenerationResult {
  url: string;
  id: string;
}
