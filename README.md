# YouTube Content OS

A personal-use web platform for planning, scripting, and producing YouTube content with defensive architecture - every external service has graceful fallbacks.

## Features

- **Data Ingestion**: Upload dashboard screenshots, CSV files, or enter metrics manually
- **Topic Intelligence**: AI-powered video topic suggestions with performance predictions
- **Script Studio**: Generate facecam or faceless video scripts with editing capabilities
- **Visual Storyboard**: Scene-by-scene planning with image generation prompts
- **Metadata Suite**: Title suggestions, SEO descriptions, and thumbnail concepts

## Architecture

### Circuit Breaker Pattern
Every external service implements graceful degradation:

| Service | Primary | Fallback 1 | Fallback 2 |
|---------|---------|------------|------------|
| Database | MongoDB | LocalStorage + Export | JSON File Download |
| Image Storage | Cloudinary | Base64 in localStorage | - |
| AI Text | OpenAI | Anthropic/Gemini | Mock Mode (Templates) |
| AI Images | DALL-E 3 | Prompt Display Only | Placeholder SVG |

### Tech Stack

**Frontend:**
- React + TypeScript + Vite
- Tailwind CSS with custom oklch theme
- shadcn/ui components
- react-dropzone for file uploads
- papaparse for CSV parsing

**Backend (Optional):**
- Express.js + Node.js
- MongoDB with Mongoose
- Cloudinary SDK

## Quick Start

### Running without external APIs (Standalone Mode)

The app works completely offline with template-based content generation:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will automatically detect missing API keys and switch to "Template Mode" with a banner notification.

### With AI Providers (Recommended)

1. Copy environment variables:
```bash
cp .env.example .env
```

2. Add your API keys to `.env`:
```env
VITE_OPENAI_API_KEY=sk-your-key-here
# or
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
# or
VITE_GEMINI_API_KEY=your-gemini-key
```

3. Start the app:
```bash
npm run dev
```

### With Full Backend

1. Start MongoDB (local or Atlas)
2. Configure Cloudinary (optional)
3. Start the backend:
```bash
cd server
npm install
npm start
```
4. Start the frontend with API URL:
```bash
VITE_API_URL=http://localhost:3001/api npm run dev
```

## Environment Variables

### Frontend (.env)
```env
# AI Providers (at least one recommended)
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GEMINI_API_KEY=...
VITE_OLLAMA_URL=http://localhost:11434

# Optional: Backend API
VITE_API_URL=http://localhost:3001/api

# Optional: Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_API_KEY=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

### Backend (server/.env)
```env
PORT=3001
MONGODB_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
OPENAI_API_KEY=sk-...
```

## Usage

### Workflow

1. **Data Ingestion**: Upload your YouTube Analytics data (images, CSV, or manual entry)
2. **Topic Intelligence**: Review 10 AI-generated topic suggestions, pin favorites, finalize one
3. **Script Studio**: Choose facecam/faceless format, generate scripts, edit and finalize
4. **Visual Storyboard**: Review scene breakdown with prompts, generate preview images
5. **Metadata Suite**: Select title, edit description, choose thumbnail concept
6. **Export**: Download complete project as JSON

### Pin vs Finalize

- **Pin (Bookmark)**: Saves item to persistent library for later use. Pinned items survive refresh.
- **Finalize (Commit)**: Selects item as THE choice and advances workflow. Going back and changing will clear downstream selections.

## Theme

The app uses a warm organic green color palette with oklch color space:

- **Primary**: `oklch(0.5329 0.1451 143.8751)` - Forest green
- **Background**: `oklch(0.9711 0.0074 80.7211)` - Warm off-white
- **Foreground**: `oklch(0.2989 0.0390 29.5037)` - Dark brown

Typography:
- **UI**: Montserrat (sans-serif)
- **Content**: Merriweather (serif)
- **Code**: Source Code Pro (monospace)

## Project Structure

```
├── src/
│   ├── sections/          # Main workflow modules
│   │   ├── DataIngestion.tsx
│   │   ├── TopicIntelligence.tsx
│   │   ├── ScriptStudio.tsx
│   │   ├── StoryboardEngine.tsx
│   │   ├── MetadataSuite.tsx
│   │   └── Navigation.tsx
│   ├── services/          # Service adapters
│   │   ├── ai-provider.ts
│   │   ├── storage-adapter.ts
│   │   └── db-adapter.ts
│   ├── store/             # Global state
│   │   └── index.ts
│   ├── types/             # TypeScript interfaces
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── server/                # Express backend (optional)
│   ├── routes/
│   ├── models/
│   └── index.js
└── public/
```

## License

MIT - Personal use only
