# YouTube Content OS

A personal-use web platform for planning, scripting, and producing YouTube content with defensive architecture. External AI, database, and storage services have graceful fallbacks so the workflow remains usable when a provider is unavailable.

## Features

- **Data Ingestion**: Upload dashboard screenshots, CSV files, or enter metrics manually
- **Topic Intelligence**: AI-powered video topic suggestions with performance predictions
- **Script Studio**: Generate facecam or faceless video scripts with editing capabilities
- **Visual Storyboard**: Scene-by-scene planning with image generation prompts
- **Metadata Suite**: Title suggestions, SEO descriptions, and thumbnail concepts
- **Multi-provider AI**: Select current Gemini or OpenAI models for content and image generation
- **Custom Appearance**: Light/dark/system mode, color presets, and shared shadcn radius controls

## AI Models

The model catalog is centralized in `src/lib/ai-models.ts`. Settings automatically migrate old/deprecated saved model IDs to current defaults.

### Content generation

**Google Gemini**
- `gemini-3.8-flash` — default Gemini model
- `gemini-3.5-flash`
- `gemini-3.1-flash-lite`

**OpenAI**
- `gpt-6-astra`
- `gpt-6-sol`
- `gpt-6-luna`

### Image generation

**OpenAI**
- `gpt-image-2.5-sunburst`
- `gpt-image-2.5-flare` — default image model
- `gpt-image-2`

**Google Gemini**
- `gemini-3.1-flash-image`
- `gemini-3.1-flash-lite-image`
- `gemini-3-pro-image`

The selected model determines the provider automatically. Deprecated preview IDs and shut-down Gemini 2.0 models are intentionally not offered.

## Architecture

### Graceful fallback pattern

| Service | Primary choices | Fallback |
|---------|-----------------|----------|
| Database | MongoDB | LocalStorage + export |
| Image Storage | Cloudinary | Base64/local browser storage |
| AI Text | Gemini 3.8 / GPT-6 family | Template mode |
| AI Images | GPT Image 2.5 / Gemini 3 image models | Placeholder/template fallback |

### Tech Stack

**Frontend:**
- React + TypeScript + Vite
- Tailwind CSS
- shadcn/ui components
- TanStack Query
- Zustand
- react-dropzone and PapaParse

**Backend:**
- Express.js + Node.js
- MongoDB with Mongoose
- Cloudinary SDK
- Google GenAI SDK
- OpenAI REST APIs

## Quick Start

### Standalone / Template Mode

The app can run without external AI credentials using built-in templates:

```bash
npm install
npm run dev
```

### Full backend

Install and run the API server:

```bash
cd api
npm install
npm run dev
```

Then run the frontend from the repository root:

```bash
npm run dev
```

By default the frontend uses `http://localhost:3001/api` during local development. Set `VITE_API_URL` to override it.

## AI Configuration

You can enter API credentials from **Settings → AI Mode**, or configure server-side environment variables.

Copy the backend example file:

```bash
cp api/.env.example api/.env
```

Current model defaults:

```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-6-sol
OPENAI_IMAGE_MODEL=gpt-image-2.5-flare

# Gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.8-flash
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
GEMINI_API_TYPE=ai-studio
```

For Vertex AI, set `GEMINI_API_TYPE=vertex-ai` and configure Vertex credentials/project settings as described in `api/.env.example`.

## Usage

### Workflow

1. **Data Ingestion**: Upload YouTube Analytics data or enter it manually
2. **Topic Intelligence**: Generate and review topic suggestions
3. **Script Studio**: Generate, edit, and finalize scripts
4. **Visual Storyboard**: Build scene breakdowns and image prompts
5. **Metadata Suite**: Generate titles, descriptions, and thumbnail concepts
6. **Shorts Extractor**: Create short-form candidates from the project
7. **Project Complete**: Review and export the finished project

### Pin vs Finalize

- **Pin** saves an item to the persistent library for later use.
- **Finalize** selects the active choice and advances the workflow. Changing an upstream finalized item can clear dependent downstream selections.

## Theme

The UI uses shadcn-style semantic CSS tokens and supports persisted appearance settings:

- Light / Dark / System mode
- Forest, Blue, Violet, Rose, and Orange color presets
- Compact, Default, and Rounded radius presets

Because components consume semantic tokens such as `--primary`, `--accent`, `--popover`, and `--radius`, theme changes propagate across the application rather than being implemented as per-component color overrides.

## Project Structure

```text
├── api/                    # Express backend and API routes
├── src/
│   ├── components/         # Shared UI and settings
│   ├── hooks/              # Generation/query hooks
│   ├── lib/                # Shared helpers and AI model catalog
│   ├── sections/           # Main workflow modules
│   ├── services/           # AI/storage/database adapters
│   ├── state/              # Application state
│   ├── types/              # TypeScript interfaces
│   ├── App.tsx
│   └── main.tsx
└── public/
```

## License

MIT - Personal use only
