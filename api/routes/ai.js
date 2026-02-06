// AI Proxy Routes - Server-side AI generation to keep API keys secure
const { GoogleGenAI } = require("@google/genai");
const express = require("express");
const router = express.Router();

// POST /api/ai/generate - Proxy AI generation requests
router.post("/generate", async (req, res) => {
  try {
    const {
      prompt,
      type,
      provider = "openai",
      model,
      maxTokens = 2000,
      format,
      images = [],
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        data: null,
        fallbackUsed: false,
        message: "No prompt provided",
      });
    }

    // Handle Image Generation Requests
    if (type === 'image') {
      if (model.includes('dall-e')) {
        return await generateOpenAIImage(req, res, { prompt, model });
      } else if (model.includes('imagen')) {
        return await generateGeminiImage(req, res, { prompt, model });
      } else {
        // Default image fallback
        return await generateOpenAIImage(req, res, { prompt, model: 'dall-e-3' });
      }
    }

    // Route to appropriate provider
    switch (provider) {
      case "openai":
        return await generateOpenAI(req, res, {
          prompt,
          type,
          model,
          temperature, // Assuming this is defined in outer scope or passed in request
          maxTokens,
          format,
        });
      case "anthropic":
        return await generateAnthropic(req, res, {
          prompt,
          type,
          model,
          maxTokens,
          format,
        });
      case "gemini":
        return await generateGemini(req, res, {
          prompt,
          type,
          model,
          images,
          format,
          maxTokens,
        });
      case "ollama":
        return await generateOllama(req, res, { prompt, type, model });
      case "mock":
      default:
        return generateMock(res, { prompt, type });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      fallbackUsed: true,
      message: error.message,
    });
  }
});

async function generateOpenAI(req, res, options) {
  const apiKey = req.headers["x-openai-api-key"] || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return generateMock(res, options);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || "gpt-4o",
        messages: [{ role: "user", content: options.prompt }],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      data: data.choices[0]?.message?.content || "",
      fallbackUsed: false,
      message: "Generated successfully with OpenAI",
    });
  } catch (error) {
    console.warn(
      "OpenAI generation failed, falling back to mock:",
      error.message,
    );
    return generateMock(res, options);
  }
}

async function generateOpenAIImage(req, res, options) {
  const apiKey = req.headers["x-openai-api-key"] || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return generateMock(res, { ...options, type: 'image' });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || "dall-e-3",
        prompt: options.prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI Image API error: ${response.status}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      data: data.data[0]?.url || "",
      fallbackUsed: false,
      message: `Image generated with ${options.model}`,
    });
  } catch (error) {
    console.warn(
      "OpenAI image generation failed, falling back to mock:",
      error.message,
    );
    return generateMock(res, { ...options, type: 'image' });
  }
}

async function generateGeminiImage(req, res, options) {
  // Note: Gemini API image generation (Imagen) availability varies.
  // This is a placeholder structure for when it's fully available via standard SDK or REST.
  // Currently, Imagen via Vertex AI is common, but standard Gemini API support is preview.

  const apiKey = req.headers["x-gemini-api-key"] || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateMock(res, { ...options, type: 'image' });
  }

  // Placeholder: Gemini API Image Generation Logic
  // As of now, direct text-to-image via standard google-genai package might differ.
  // We will assume a hypothetical implementation or fallback to mock if SDK doesn't support it easily yet without Vertex.

  console.warn("Gemini Image generation requested. Note: This requires specific API access.");

  // For now, fall back to mock to prevent crashing, as Imagen integration requires specific Vertex AI setup often not present in simple keys.
  return generateMock(res, { ...options, type: 'image' });
}

async function generateAnthropic(req, res, options) {
  const apiKey =
    req.headers["x-anthropic-api-key"] || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return generateMock(res, options);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options.model || "claude-3-sonnet-20240229",
        max_tokens: options.maxTokens || 2000,
        messages: [{ role: "user", content: options.prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      data: data.content[0]?.text || "",
      fallbackUsed: false,
      message: "Generated successfully with Anthropic",
    });
  } catch (error) {
    console.warn(
      "Anthropic generation failed, falling back to mock:",
      error.message,
    );
    return generateMock(res, options);
  }
}

async function generateGemini(req, res, options) {
  const apiKey = req.headers["x-gemini-api-key"] || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateMock(res, options);
  }

  const modelName =
    options.model || process.env.GEMINI_MODEL || "gemini-1.5-flash";

  try {
    console.log(`Initializing Gemini V2 SDK with model: ${modelName}`);

    // Initialize V2 SDK
    const ai = new GoogleGenAI({ apiKey });

    // Prepare content parts
    const parts = [{ text: options.prompt }];

    if (
      options.images &&
      Array.isArray(options.images) &&
      options.images.length > 0
    ) {
      console.log(
        `Processing ${options.images.length} images for Gemini Vision`,
      );
      options.images.forEach((img) => {
        // Handle data:image/fmt;base64, prefix
        const match = img.match(/^data:(image\/\w+);base64,(.+)$/);
        const mimeType = match ? match[1] : "image/jpeg";
        const data = match ? match[2] : img;

        parts.push({
          inlineData: {
            mimeType,
            data,
          },
        });
      });
    }

    // Generate content using V2 API
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts }],
      config: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 8192,
        responseMimeType:
          options.format === "json" ? "application/json" : undefined,
      },
    });

    // V2 SDK Response handling - safely access text
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.json({
      success: true,
      data: text,
      fallbackUsed: false,
      message: "Generated successfully with Gemini V2 SDK",
    });
  } catch (error) {
    console.error("Gemini V2 SDK error:", error);
    // If specific model fails, try fallback to gemini-1.5-flash
    if (
      error.message &&
      error.message.includes("not found") &&
      modelName !== "gemini-1.5-flash"
    ) {
      console.log("Retrying with gemini-1.5-flash...");
      return generateGemini(req, res, {
        ...options,
        model: "gemini-1.5-flash",
      });
    }

    return generateMock(res, options);
  }
}

async function generateOllama(req, res, options) {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: options.model || "llama2",
        prompt: options.prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      data: data.response || "",
      fallbackUsed: false,
      message: "Generated successfully with Ollama",
    });
  } catch (error) {
    console.warn(
      "Ollama generation failed, falling back to mock:",
      error.message,
    );
    return generateMock(res, options);
  }
}

function generateMock(res, options) {
  const prompt = options.prompt.toLowerCase();

  // Generate contextual mock responses
  let mockData = "";

  if (options.type === "image") {
    mockData =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIFByZXZpZXc8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI2NSUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5BZGQgQVBJIGtleSBpbiBTZXR0aW5ncyB0byBnZW5lcmF0ZTwvdGV4dD48L3N2Zz4=";
  } else if (prompt.includes("topic") || prompt.includes("title")) {
    const topics = [
      {
        id: "topic-1",
        title: "The Hidden Truth About Productivity No One Talks About",
        rationale:
          "Addresses a curiosity gap while promising insider knowledge",
        predictedScore: 85,
      },
      {
        id: "topic-2",
        title: "Why Most People Fail at Building Habits (And How to Fix It)",
        rationale: "Identifies a common pain point with solution promise",
        predictedScore: 82,
      },
      {
        id: "topic-3",
        title:
          "I Tried This Morning Routine for 30 Days - Here's What Happened",
        rationale: "Personal story format with specific timeframe",
        predictedScore: 78,
      },
      {
        id: "topic-4",
        title: "The Science Behind Deep Work: What Research Actually Shows",
        rationale: "Authority-building with scientific backing",
        predictedScore: 75,
      },
      {
        id: "topic-5",
        title: "5 Mistakes That Are Killing Your Focus (Backed by Science)",
        rationale: "List format with negative framing (loss aversion)",
        predictedScore: 80,
      },
      {
        id: "topic-6",
        title: "How I 10x'd My Output Without Working More Hours",
        rationale: "Results-focused with counterintuitive promise",
        predictedScore: 88,
      },
      {
        id: "topic-7",
        title: "The Productivity System That Changed Everything for Me",
        rationale: "Personal transformation story",
        predictedScore: 76,
      },
      {
        id: "topic-8",
        title: "Why You're Always Busy But Never Productive",
        rationale: "Relatable problem identification",
        predictedScore: 79,
      },
      {
        id: "topic-9",
        title: "The Counterintuitive Approach to Getting More Done",
        rationale: "Curiosity gap with contradiction",
        predictedScore: 81,
      },
      {
        id: "topic-10",
        title: "What Successful Creators Do Differently Every Morning",
        rationale: "Social proof with daily routine appeal",
        predictedScore: 83,
      },
    ];
    mockData = JSON.stringify(topics);
  } else if (prompt.includes("script")) {
    mockData = `[HOOK - 0:00-0:15]
Hey everyone, welcome back! Today I'm going to share something that completely changed how I think about productivity. If you've been struggling to stay focused, this video is for you.

[PROBLEM - 0:15-0:45]
Here's the thing: most people approach productivity completely wrong. They try to multitask, and then wonder why they're not seeing results. I was there too, trust me.

[SOLUTION - 0:45-2:00]
But then I discovered time blocking. The key insight is single-tasking beats multitasking every time. Let me break this down into three simple steps:

Step 1: Identify your most important task
Step 2: Block 90 minutes of uninterrupted time
Step 3: Eliminate all distractions

[PROOF - 2:00-3:00]
I tested this approach for 30 days, and the results were incredible. My output doubled while working fewer hours. And I'm not the only one - thousands of creators have reported similar results.

[CTA - 3:00-3:30]
If you want to try this yourself, I've put together a free guide in the description. And if you found this helpful, hit that like button and subscribe for more content like this. See you in the next one!`;
  } else if (prompt.includes("storyboard") || prompt.includes("scene")) {
    const scenes = [
      {
        sceneNumber: 1,
        timestampStart: "0:00",
        timestampEnd: "0:15",
        duration: 15,
        type: "A-roll",
        scriptSegment:
          "Hey everyone, welcome back! Today I'm going to share something that completely changed how I think about productivity.",
        visualDescription:
          "Host speaking directly to camera with energetic expression",
        imagePrompt:
          "YouTube creator in home studio, bright lighting, confident expression, professional microphone visible, warm background",
        audioNote: "Upbeat intro music fading out",
      },
      {
        sceneNumber: 2,
        timestampStart: "0:15",
        timestampEnd: "0:45",
        duration: 30,
        type: "B-roll",
        scriptSegment:
          "Most people approach productivity completely wrong. They try to multitask...",
        visualDescription:
          "Montage of distracted workers, multiple browser tabs, phone notifications",
        imagePrompt:
          "Split screen showing distracted person with phone notifications, messy desk, multiple screens",
        audioNote: "Subtle tension music",
      },
      {
        sceneNumber: 3,
        timestampStart: "0:45",
        timestampEnd: "2:00",
        duration: 75,
        type: "ScreenCap",
        scriptSegment:
          "The key insight is single-tasking beats multitasking every time.",
        visualDescription:
          "Calendar app showing time blocks, timer app in focus mode",
        imagePrompt:
          "Clean calendar interface with color-coded time blocks, focus mode activated, minimalist design",
        recordingInstructions:
          "Open Google Calendar, zoom 150%, show time blocking technique",
      },
    ];
    mockData = JSON.stringify(scenes);
  } else if (prompt.includes("thumbnail")) {
    mockData = `A clean, high-contrast thumbnail showing a split-screen comparison: left side labeled "BEFORE" with a stressed, overwhelmed person surrounded by chaos; right side labeled "AFTER" with the same person calm and focused. Bold text overlay: "30 DAY TRANSFORMATION". Use bright, energetic colors with a subtle gradient background. Include a small clock icon and upward trending arrow graphic.`;
  } else {
    mockData =
      "Generated content would appear here. Configure an AI provider in settings for custom generations.";
  }

  res.json({
    success: true,
    data: mockData,
    fallbackUsed: true,
    message:
      "Template mode active: Using structured templates. Add API key in Settings for AI-generated content.",
  });
}

module.exports = router;
