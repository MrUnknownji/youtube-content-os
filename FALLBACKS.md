# Fallback Matrix - YouTube Content OS

This document outlines the defensive architecture of the platform - every external service has graceful fallbacks to ensure the system never crashes due to missing API keys or service outages.

## Service Fallback Chain

| Service | Primary | Fallback 1 | Fallback 2 | User Indicator |
|---------|---------|------------|------------|----------------|
| **Database** | MongoDB | LocalStorage + Export | JSON File Download | Banner: "Local Mode" |
| **Image Storage** | Cloudinary | Base64 in localStorage | - | Banner: "Limited Storage" |
| **AI Text** | OpenAI | Anthropic/Gemini | Mock Mode (Templates) | Banner: "Template Mode" |
| **AI Vision** | GPT-4V | Tesseract.js (local) | Manual Input | Banner: "Manual OCR" |
| **AI Images** | DALL-E 3 | Prompt Display Only | Placeholder SVG | Banner: "Text Prompts Only" |

## Implementation Details

### Database Adapter (`/services/db-adapter.ts`)

```typescript
class DatabaseGateway {
  async saveProject(data) {
    // Priority 1: MongoDB (if MONGODB_URI configured)
    if (process.env.MONGODB_URI) {
      try {
        return await mongoSave(data);
      } catch (error) {
        console.warn('MongoDB failed, falling back to localStorage');
      }
    }
    // Fallback: localStorage
    return localStorageSave(data);
  }
}
```

**Behavior:**
- If `MONGODB_URI` is missing: System boots in "Solo Mode" (local only)
- Data persists in browser's localStorage
- Export functionality available for backup
- 5MB storage limit per domain

### Storage Adapter (`/services/storage-adapter.ts`)

```typescript
class StorageGateway {
  async uploadImage(file) {
    // Priority 1: Cloudinary (if keys configured)
    if (this.isCloudinaryAvailable()) {
      try {
        return await this.uploadToCloudinary(file);
      } catch (error) {
        console.warn('Cloudinary failed, falling back to base64');
      }
    }
    // Fallback: Base64 in localStorage
    return this.uploadToBase64(file);
  }
}
```

**Behavior:**
- Max 2MB per image in base64 mode
- Total localStorage quota: ~5MB
- Warning shown at 80% capacity

### AI Provider Adapter (`/services/ai-provider.ts`)

```typescript
class AIGateway {
  async generate(config, prompt, type) {
    // Detect available provider
    const provider = this.detectProvider();
    
    // If no API key, use mock mode
    if (!config.apiKey) {
      return this.generateMock(request);
    }
    
    // Try primary provider
    try {
      return await this.generateWithProvider(provider, request);
    } catch (error) {
      // Fallback to mock mode
      return this.generateMock(request);
    }
  }
}
```

**Mock Mode Responses:**

| Request Type | Mock Response |
|--------------|---------------|
| Topics | 10 pre-written topic templates with scores |
| Scripts | Template with placeholders for customization |
| Storyboard | 5-scene template with generic prompts |
| Titles | 10 high-performing title formulas |
| Thumbnails | SVG placeholder with instructions |

## UI Indicators

### Service Status Bar

Located in the left sidebar, shows real-time status:

```
🟢 MongoDB Connected
🟡 Cloudinary Not Configured  
🟡 AI: Template Mode
```

### Banner Notifications

When fallbacks are active:

```
┌─────────────────────────────────────────┐
│  ⚠️  Template Mode Active               │
│  Add API key in Settings for AI content │
└─────────────────────────────────────────┘
```

## Configuration Examples

### Minimal (No APIs)

```env
# No configuration needed
# App runs entirely in browser with templates
```

### With OpenAI

```env
VITE_OPENAI_API_KEY=sk-your-key-here
```

### Full Stack

```env
# Frontend
VITE_API_URL=http://localhost:3001/api
VITE_OPENAI_API_KEY=sk-...

# Backend
MONGODB_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Testing Fallbacks

To test each fallback scenario:

1. **Database Fallback**: Remove `MONGODB_URI` from server/.env
2. **Cloudinary Fallback**: Remove Cloudinary credentials
3. **AI Fallback**: Remove all `*_API_KEY` variables
4. **Complete Offline**: Disconnect internet and remove all API keys

## Cost Guards

Built-in protections to prevent accidental API overuse:

| Feature | Limit | Behavior |
|---------|-------|----------|
| Image Generation | 1 per click | Confirmation dialog required |
| Topic Generation | 10 per batch | Single API call for all 10 |
| Script Variants | 3 per generation | Batched in one request |
| Thumbnail Preview | 1 per session | Max 1 generated image |

## Data Export/Import

When running in fallback mode, users can:

1. **Export**: Download all projects as JSON file
2. **Import**: Upload JSON to restore projects
3. **Auto-save**: All changes saved to localStorage automatically

Export format:
```json
{
  "projects": [...],
  "pins": [...],
  "exportedAt": "2024-01-01T00:00:00Z"
}
```

## Error Handling

All service calls follow this pattern:

```typescript
try {
  const result = await primaryService.call();
  return { success: true, data: result, fallbackUsed: false };
} catch (primaryError) {
  console.warn('Primary failed:', primaryError);
  try {
    const fallback = await fallbackService.call();
    return { 
      success: true, 
      data: fallback, 
      fallbackUsed: true,
      message: 'Using fallback mode'
    };
  } catch (fallbackError) {
    return { 
      success: false, 
      data: null, 
      fallbackUsed: true,
      message: fallbackError.message 
    };
  }
}
```

This ensures the UI always receives a response, even if both primary and fallback fail.
