# Fallback Matrix - YouTube Content OS

This document outlines the defensive architecture of the platform. External services degrade gracefully so missing credentials or provider outages do not make the application unusable.

## Service Fallback Chain

| Service | Primary | Fallback | User Indicator |
|---------|---------|----------|----------------|
| **Database** | MongoDB | LocalStorage + export | Service status |
| **Image Storage** | Cloudinary | Base64/browser storage | Service status |
| **AI Text** | Selected Gemini 3 / GPT-6 model | Template mode | AI / Template mode selector |
| **AI Images** | Selected GPT Image 2.5 / Gemini 3 image model | Placeholder/template fallback | Image generation status |

The current model catalog lives in `src/lib/ai-models.ts`. Deprecated preview models and shut-down model IDs are not part of the selectable catalog.

## Current AI Defaults

```text
Content: gemini-3.8-flash
Images:  gpt-image-2.5-flare
```

Available content providers include current Gemini models and the GPT-6 Astra/Sol/Luna family. Image generation supports GPT Image 2.5 Sunburst/Flare, GPT Image 2, and current Gemini 3 image models.

## Database Adapter (`src/services/db-adapter.ts`)

When MongoDB is unavailable, project data can continue using browser persistence and export flows. This keeps local work available without requiring a database connection.

## Storage Adapter (`src/services/storage-adapter.ts`)

Cloudinary is optional. If it is not configured or an upload fails, the application can retain image data using its local fallback path.

## AI Provider Adapter (`src/services/ai-provider.ts`)

The selected model determines the provider automatically:

- model IDs beginning with `gpt-` route to OpenAI;
- Gemini model IDs route to Google Gemini;
- missing credentials or provider failures fall back to structured template responses where supported.

The browser can supply provider keys from Settings, or the backend can use server-side `OPENAI_API_KEY` / `GEMINI_API_KEY` values.

### Template-mode responses

| Request Type | Fallback Response |
|--------------|-------------------|
| Topics | Pre-written topic templates with scores |
| Scripts | Structured script template |
| Storyboard | Generic scene template |
| Titles / metadata | Built-in metadata templates |
| Images | Placeholder image response |

## UI Indicators

The sidebar and Settings surface whether AI mode is enabled. Image generation also reports whether the image-generation feature is enabled before sending a request.

## Configuration Examples

### Minimal, no external APIs

```env
# No AI configuration required.
# Run the app in Template Mode.
```

### Gemini

```env
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-3.8-flash
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
GEMINI_API_TYPE=ai-studio
```

### OpenAI

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-6-sol
OPENAI_IMAGE_MODEL=gpt-image-2.5-flare
```

### Full stack

```env
MONGODB_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GEMINI_API_KEY=...
OPENAI_API_KEY=...
```

## Testing Fallbacks

1. **Database fallback**: remove `MONGODB_URI` from `api/.env`.
2. **Cloudinary fallback**: remove Cloudinary credentials.
3. **AI fallback**: remove Gemini/OpenAI credentials and use Template Mode.
4. **Complete offline path**: disconnect external services and verify browser/template behavior remains available.

## Cost Guards

Generation is initiated explicitly by the user. Image generation is one request per generation action, while content-generation workflows batch related output where practical.

## Data Export / Import

When running in local mode, project data can be exported as JSON for backup and later restoration. Browser persistence remains the first local fallback.

## Error Handling

Service adapters return structured results with `success`, `data`, and `fallbackUsed` fields. A provider failure should therefore produce a controlled fallback response rather than an unhandled UI crash.
