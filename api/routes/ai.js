const { GoogleGenAI } = require("@google/genai");
const express = require("express");
const router = express.Router();

const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
const DEFAULT_OPENAI_MODEL = "gpt-6-sol";
const DEFAULT_IMAGE_MODEL = "gpt-image-2.5-flare";
const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image";

function createGeminiClient(req) {
  const apiKey = req.headers["x-gemini-api-key"] || process.env.GEMINI_API_KEY;
  const apiType =
    req.headers["x-gemini-api-type"] ||
    process.env.GEMINI_API_TYPE ||
    "ai-studio";

  if (apiType === "vertex-ai") {
    if (apiKey) {
      return new GoogleGenAI({ apiKey, vertexai: true });
    }
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    return new GoogleGenAI({ vertexai: true, project, location });
  }

  return new GoogleGenAI({ apiKey });
}

function isOpenAIImageModel(model = "") {
  return model.startsWith("gpt-image-");
}

function isGeminiImageModel(model = "") {
  return model.startsWith("gemini-") && model.includes("-image");
}

// POST /api/ai/generate - Proxy AI generation requests
router.post("/generate", async (req, res) => {
  try {
    const {
      prompt,
      type,
      provider = "gemini",
      model,
      temperature = 0.7,
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

    if (type === "image") {
      if (isOpenAIImageModel(model)) {
        return await generateOpenAIImage(req, res, { prompt, model });
      }
      if (isGeminiImageModel(model)) {
        return await generateGeminiImage(req, res, { prompt, model });
      }
      return await generateOpenAIImage(req, res, {
        prompt,
        model: DEFAULT_IMAGE_MODEL,
      });
    }

    switch (provider) {
      case "openai":
        return await generateOpenAI(req, res, {
          prompt,
          type,
          model,
          temperature,
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
          temperature,
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

  const modelName =
    options.model || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        input: options.prompt,
        max_output_tokens: options.maxTokens || 8192,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`OpenAI API error: ${response.status}${body ? ` - ${body}` : ""}`);
    }

    const data = await response.json();
    const outputText =
      data.output_text ||
      (data.output || [])
        .filter((item) => item.type === "message")
        .flatMap((item) => item.content || [])
        .filter((part) => part.type === "output_text")
        .map((part) => part.text || "")
        .join("");

    return res.json({
      success: true,
      data: outputText || "",
      fallbackUsed: false,
      message: `Generated successfully with ${modelName}`,
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
    return generateMock(res, { ...options, type: "image" });
  }

  const modelName =
    options.model || process.env.OPENAI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;

  try {
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          prompt: options.prompt,
          n: 1,
          size: "1024x1024",
          quality: "auto",
          output_format: "png",
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `OpenAI Image API error: ${response.status}${body ? ` - ${body}` : ""}`,
      );
    }

    const data = await response.json();
    const result = data.data?.[0];
    const imageUrl = result?.b64_json
      ? `data:image/png;base64,${result.b64_json}`
      : result?.url || "";

    if (!imageUrl) {
      throw new Error("OpenAI image response did not contain image data");
    }

    return res.json({
      success: true,
      data: imageUrl,
      fallbackUsed: false,
      message: `Image generated with ${modelName}`,
    });
  } catch (error) {
    console.warn(
      "OpenAI image generation failed, falling back to mock:",
      error.message,
    );
    return generateMock(res, { ...options, type: "image" });
  }
}

async function generateGeminiImage(req, res, options) {
  const hasKey = !!(
    req.headers["x-gemini-api-key"] || process.env.GEMINI_API_KEY
  );
  const apiType =
    req.headers["x-gemini-api-type"] ||
    process.env.GEMINI_API_TYPE ||
    "ai-studio";
  const isVertexMode = apiType === "vertex-ai";

  if (!hasKey && !isVertexMode) {
    return generateMock(res, { ...options, type: "image" });
  }

  try {
    const modelName =
      options.model ||
      process.env.GEMINI_IMAGE_MODEL ||
      DEFAULT_GEMINI_IMAGE_MODEL;
    console.log(`Generating image with ${modelName} (${apiType})...`);

    const ai = createGeminiClient(req);
    const imageSize = modelName.includes("flash-lite-image") ? "1K" : "2K";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: options.prompt,
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize,
        },
      },
    });

    const candidates = response.candidates || [];
    if (candidates.length > 0 && candidates[0].content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || "image/png";
          const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          return res.json({
            success: true,
            data: imageUrl,
            fallbackUsed: false,
            message: `Image generated with ${modelName}`,
          });
        }
      }
    }

    console.warn("Gemini image response did not contain image data");
    return generateMock(res, { ...options, type: "image" });
  } catch (error) {
    console.error("Gemini Image generation error:", error.message);
    return generateMock(res, { ...options, type: "image" });
  }
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
        model: options.model || process.env.ANTHROPIC_MODEL,
        max_tokens: options.maxTokens || 2000,
        messages: [{ role: "user", content: options.prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();

    return res.json({
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
  const hasKey = !!(
    req.headers["x-gemini-api-key"] || process.env.GEMINI_API_KEY
  );
  const apiType =
    req.headers["x-gemini-api-type"] ||
    process.env.GEMINI_API_TYPE ||
    "ai-studio";
  const isVertexMode = apiType === "vertex-ai";

  if (!hasKey && !isVertexMode) {
    return generateMock(res, options);
  }

  const modelName =
    options.model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  try {
    console.log(
      `Initializing Gemini SDK [${apiType}] with model: ${modelName}`,
    );

    const ai = createGeminiClient(req);
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

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return res.json({
      success: true,
      data: text,
      fallbackUsed: false,
      message: `Generated successfully with ${modelName} [${apiType}]`,
    });
  } catch (error) {
    const currentApiType =
      req.headers["x-gemini-api-type"] ||
      process.env.GEMINI_API_TYPE ||
      "ai-studio";
    const errMsg = error?.message || String(error);
    console.error("Gemini SDK error:", errMsg);

    let diagnosis = errMsg;
    if (
      errMsg.includes("API keys are not supported") ||
      errMsg.includes("UNAUTHENTICATED") ||
      errMsg.includes("OAuth2")
    ) {
      diagnosis =
        `[Vertex AI] AI Studio API keys (AIza...) are rejected by Vertex AI endpoints. ` +
        `Use a Vertex AI Express key (starts with AQ.) or switch API Source to "AI Studio" in Settings.`;
    } else if (errMsg.includes("mutually exclusive")) {
      diagnosis =
        "[Vertex AI] SDK config error: apiKey and project/location cannot be used together.";
    } else if (
      errMsg.toLowerCase().includes("not found") &&
      modelName !== DEFAULT_GEMINI_MODEL
    ) {
      console.log(`Retrying with ${DEFAULT_GEMINI_MODEL}...`);
      return generateGemini(req, res, {
        ...options,
        model: DEFAULT_GEMINI_MODEL,
      });
    } else if (
      errMsg.includes("429") ||
      errMsg.includes("RESOURCE_EXHAUSTED")
    ) {
      diagnosis = "Rate limit / quota exceeded for this API key.";
    }

    return res.json({
      success: false,
      data: null,
      fallbackUsed: true,
      message: `Gemini [${currentApiType}] error: ${diagnosis}`,
    });
  }
}

async function generateOllama(req, res, options) {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const modelName = options.model || process.env.OLLAMA_MODEL;

  if (!modelName) {
    return generateMock(res, options);
  }

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        prompt: options.prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();

    return res.json({
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

  return res.json({
    success: true,
    data: mockData,
    fallbackUsed: true,
    message:
      "Template mode active: Using structured templates. Add API key in Settings for AI-generated content.",
  });
}

module.exports = router;
