// YouTube Content OS - TypeScript Interfaces

export type WorkflowStage = 'ingestion' | 'topics' | 'script' | 'storyboard' | 'metadata' | 'shorts' | 'complete' | 'imagegen';

export type DataSourceType = 'csv' | 'images' | 'manual';

export type ScriptFormat = 'facecam' | 'faceless';

export type StorageType = 'cloudinary' | 'base64_mongo' | 'indexeddb_ref';

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'mock';

export type PinItemType = 'topic' | 'script' | 'storyboard' | 'title' | 'description' | 'thumbnail_concept' | 'shorts';

export interface ShortsExtract {
  id: string;
  sourceScriptId: string;
  title: string;
  duration: number;
  timestampStart: string;
  timestampEnd: string;
  hookText: string;
  hookReason: string;
  fullContent: string;
  engagementScore: number;
  viralPotential: 'low' | 'medium' | 'high' | 'viral';
  contentType: 'hook' | 'twist' | 'reveal' | 'emotion' | 'value_bomb' | 'controversy';
  targetAudience: string;
  suggestedThumbnail: string;
  suggestedTitle: string[];
  hashtags: string[];
  bestPostingTime: string;
  crossPlatformAdaptation: {
    instagram: string;
    tiktok: string;
  };
}

export interface CreatorProfile {
  id: string;
  name: string;
  niche: string;
  toneOfVoice: string[];
  contentPillars: string[];
  audiencePersona: string;
  brandKeywords: string[];
  postingSchedule: {
    preferredDays: string[];
    preferredTimes: string[];
    shortsFrequency: string;
  };
  contentGoals: string[];
  uniqueSellingPoint: string;
}

// Data Ingestion Types
export interface DashboardData {
  videoTitle?: string;
  views?: number;
  ctr?: number;
  duration?: string;
  impressions?: number;
  watchTime?: number;
  avgViewDuration?: string;
  [key: string]: string | number | undefined;
}

export interface DataSource {
  type: DataSourceType;
  rawData: DashboardData[] | File[] | DashboardData;
  processedAt?: Date;
}

// Topic Intelligence Types
export interface TopicSuggestion {
  id: string;
  title: string;
  rationale: string;
  predictedScore: number;
  targetAudience?: string;
  contentAngle?: string;
}

// Script Studio Types
export interface ScriptVariant {
  id: string;
  content: string;
  format: ScriptFormat;
  wordCount: number;
  estimatedDuration: string;
}

// Storyboard Types
export type SceneType = 'A-roll' | 'B-roll' | 'ScreenCap' | 'Graphic';

export interface StoryboardScene {
  sceneNumber: number;
  timestampStart: string;
  timestampEnd: string;
  duration: number;
  type: SceneType;
  scriptSegment: string;
  visualDescription: string;
  imagePrompt: string;
  manimSnippet?: string;
  recordingInstructions?: string;
  audioNote?: string;
  generatedImageUrl?: string;
}

// Metadata Types
export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  thumbnailPrompt: string;
  thumbnailConcept?: string;
  thumbnailLayout?: string;
}

export interface ThumbnailConcept {
  id: string;
  title: string;
  description: string;
  layout: string;
  textOverlay: string;
  colorScheme: string;
}

// Project Types
export interface Project {
  id: string;
  stage: WorkflowStage;
  dataSource: DataSource | null;
  selectedTopic: {
    id: string;
    title: string;
    finalizedAt: Date;
  } | null;
  topicSuggestions?: TopicSuggestion[];
  scriptVariants?: ScriptVariant[];
  titleSuggestions?: string[];
  thumbnailConcepts?: ThumbnailConcept[];
  selectedScript: {
    id: string;
    content: string;
    format: ScriptFormat;
  } | null;
  selectedStoryboard: {
    scenes: StoryboardScene[];
    format: ScriptFormat;
  } | null;
  selectedMetadata: VideoMetadata | null;
  shortsExtracts?: ShortsExtract[];
  creatorProfile?: CreatorProfile;
  createdAt: Date;
  updatedAt: Date;
}

// Pin Types
export interface PinnedItem {
  id: string;
  userId: string;
  itemType: PinItemType;
  content: TopicSuggestion | ScriptVariant | StoryboardScene[] | string | ShortsExtract;
  sourceProjectId: string;
  pinnedAt: Date;
}

// Asset Types
export interface Asset {
  id: string;
  storageType: StorageType;
  url: string;
  metadata: {
    width?: number;
    height?: number;
    size?: number;
    mimeType?: string;
  };
  createdAt: Date;
}

// AI Types
export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  images?: string[];
  format?: 'json' | 'text';
}

export interface AIGenerateRequest {
  prompt: string;
  type: 'text' | 'image';
  images?: string[];
  format?: 'json' | 'text';
  config?: Partial<AIConfig>;
}

export interface AIGenerateResponse {
  success: boolean;
  data: string;
  fallbackUsed: boolean;
  message: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  fallbackUsed: boolean;
  message: string;
}

// Service Status Types
export interface ServiceStatus {
  mongodb: 'connected' | 'disconnected' | 'unknown';
  cloudinary: 'connected' | 'disconnected' | 'unknown';
  ai: 'connected' | 'disconnected' | 'mock' | 'unknown';
}

// UI State Types
export interface UIState {
  currentStage: WorkflowStage;
  isGenerating: boolean;
  showPinnedLibrary: boolean;
  serviceStatus: ServiceStatus;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}
