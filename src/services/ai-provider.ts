// AI Provider Service - Simplified for Gemini-only mode
import type { AIConfig, AIGenerateRequest, AIGenerateResponse, AIProvider } from '@/types';

interface AISettings {
  useAI: boolean;
  geminiApiKey: string;
  geminiModel?: string;
}

function getAISettings(): AISettings {
  try {
    const stored = localStorage.getItem('yco-ai-settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load AI settings:', e);
  }
  return {
    useAI: false,
    geminiApiKey: '',
    geminiModel: 'gemini-1.5-flash'
  };
}

// Mock responses for when template mode is enabled
const MOCK_TOPIC_TITLES = [
  "The Hidden Truth About Productivity No One Talks About",
  "Why Most People Fail at Building Habits (And How to Fix It)",
  "I Tried This Morning Routine for 30 Days - Here's What Happened",
  "The Science Behind Deep Work: What Research Actually Shows",
  "5 Mistakes That Are Killing Your Focus (Backed by Science)",
  "How I 10x'd My Output Without Working More Hours",
  "The Productivity System That Changed Everything for Me",
  "Why You're Always Busy But Never Productive",
  "The Counterintuitive Approach to Getting More Done",
  "What Successful Creators Do Differently Every Morning"
];

const MOCK_SCRIPT_TEMPLATES = {
  facecam: `[HOOK - 0:00-0:15]
Hey everyone, welcome back! Today I'm going to share something that completely changed how I think about {topic}. If you've been struggling with {pain_point}, this video is for you.

[PROBLEM - 0:15-0:45]
Here's the thing: most people approach {topic} completely wrong. They {common_mistake}, and then wonder why they're not seeing results. I was there too, trust me.

[SOLUTION - 0:45-2:00]
But then I discovered {solution}. The key insight is {key_insight}. Let me break this down into three simple steps:

Step 1: {step_1}
Step 2: {step_2}  
Step 3: {step_3}

[PROOF - 2:00-3:00]
I tested this approach for {timeframe}, and the results were incredible. {specific_result}. And I'm not the only one - {social_proof}.

[CTA - 3:00-3:30]
If you want to try this yourself, I've put together a free guide in the description. And if you found this helpful, hit that like button and subscribe for more content like this. See you in the next one!`,

  faceless: `[0:00-0:10] TITLE CARD: "The {topic} Method"
TEXT OVERLAY: "What if everything you knew about {topic} was wrong?"

[0:10-0:30] B-ROLL: Fast-paced montage of {related_visuals}
NARRATOR (V.O.): Every day, millions of people struggle with {pain_point}. But what if I told you there's a better way?

[0:30-1:00] SCREEN CAPTURE: Demonstrating {process}
NARRATOR (V.O.): It all starts with understanding {key_concept}. Most people get this wrong because {common_misconception}.

[1:00-2:00] GRAPHICS: Animated infographic showing {data_visualization}
NARRATOR (V.O.): Here's the data that changed everything. {statistics}. This means {implication}.

[2:00-2:45] B-ROLL: {demonstration_footage}
NARRATOR (V.O.): So how do you actually implement this? Follow these three steps:

TEXT OVERLAY:
1. {step_1}
2. {step_2}
3. {step_3}

[2:45-3:15] SCREEN CAPTURE: Step-by-step walkthrough
NARRATOR (V.O.): I documented my own journey trying this for {timeframe}. The result? {specific_outcome}.

[3:15-3:30] END CARD with CTA
TEXT: "Subscribe for more" / "Link in description"`
};

class AIGateway {
  private config: AIConfig;
  private settings: AISettings;

  constructor(config: Partial<AIConfig> = {}) {
    this.settings = getAISettings();
    
    // Determine provider based on AI toggle
    const provider: AIProvider = this.settings.useAI ? 'gemini' : 'mock';
    
    this.config = {
      provider,
      apiKey: this.settings.geminiApiKey || undefined,
      model: config.model || 'gemini-3-flash-preview',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 2000,
      ...config
    };
  }

  isAvailable(): boolean {
    return this.settings.useAI;
  }

  getProvider(): AIProvider {
    return this.config.provider;
  }

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    // Re-check settings in case they changed
    const currentSettings = getAISettings();
    
    // If AI mode is enabled, use Gemini via backend
    if (currentSettings.useAI) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        // Add API key from settings if provided
        if (currentSettings.geminiApiKey) {
          headers['x-gemini-api-key'] = currentSettings.geminiApiKey;
        }

        const isProd = import.meta.env.PROD;
        const apiUrl = import.meta.env.VITE_API_URL || (isProd ? '/api' : 'http://localhost:3001/api');

        const response = await fetch(`${apiUrl}/ai/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            provider: 'gemini',
            prompt: request.prompt,
            type: request.type || 'text',
            images: request.images,
            format: request.format,
            model: currentSettings.geminiModel || 'gemini-1.5-flash',
            temperature: 0.7,
            maxTokens: request.config?.maxTokens || 8192
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && !result.fallbackUsed) {
            return {
              success: true,
              data: result.data,
              fallbackUsed: false,
              message: 'Generated with Gemini 3 Flash'
            };
          }
        }
        
        console.warn('Gemini API call failed, falling back to templates');
      } catch (error) {
        console.error('AI request failed:', error);
      }
    }

    // Fallback to mock/template mode
    return this.generateMock(request);
  }

  private generateMock(request: AIGenerateRequest): AIGenerateResponse {
    const prompt = request.prompt.toLowerCase();
    
    if (request.type === 'image') {
      // Return a placeholder SVG for image generation
      return {
        success: true,
        data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIFByZXZpZXc8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI2NSUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5BZGQgQVBJIGtleSBpbiBTZXR0aW5ncyB0byBnZW5lcmF0ZTwvdGV4dD48L3N2Zz4=',
        fallbackUsed: true,
        message: 'Mock mode: Placeholder image returned. Add API key in Settings to generate real images.'
      };
    }

    // Generate contextual mock content based on prompt
    let mockData = '';
    
    if (prompt.includes('topic') || prompt.includes('title')) {
      // Generate 10 topic suggestions
      const topics = MOCK_TOPIC_TITLES.map((title, i) => ({
        id: `topic-${i + 1}`,
        title,
        rationale: `Based on trending content patterns and audience engagement data, this angle addresses a common pain point while offering actionable insights.`,
        predictedScore: Math.floor(Math.random() * 30) + 70
      }));
      mockData = JSON.stringify(topics);
    } else if (prompt.includes('script')) {
      const format = prompt.includes('faceless') ? 'faceless' : 'facecam';
      const template = MOCK_SCRIPT_TEMPLATES[format];
      mockData = template
        .replace(/{topic}/g, 'Productivity')
        .replace(/{pain_point}/g, 'staying focused')
        .replace(/{common_mistake}/g, 'trying to multitask')
        .replace(/{solution}/g, 'time blocking')
        .replace(/{key_insight}/g, 'single-tasking beats multitasking every time')
        .replace(/{step_1}/g, 'Identify your most important task')
        .replace(/{step_2}/g, 'Block 90 minutes of uninterrupted time')
        .replace(/{step_3}/g, 'Eliminate all distractions')
        .replace(/{timeframe}/g, '30 days')
        .replace(/{specific_result}/g, 'My output doubled while working fewer hours')
        .replace(/{social_proof}/g, 'thousands of creators have reported similar results')
        .replace(/{related_visuals}/g, 'clocks, calendars, focused work')
        .replace(/{key_concept}/g, 'deep work')
        .replace(/{common_misconception}/g, 'they think willpower is enough')
        .replace(/{data_visualization}/g, 'productivity curves over time')
        .replace(/{statistics}/g, 'Studies show focused work produces 40% better results')
        .replace(/{implication}/g, 'your environment matters more than your motivation')
        .replace(/{demonstration_footage}/g, 'person working at desk with phone away');
    } else if (prompt.includes('title')) {
      const titles = [
        "I Tried This for 30 Days. The Results Shocked Me.",
        "The Productivity Method That Actually Works (Science-Backed)",
        "Why You're Still Procrastinating (And the Real Fix)",
        "This Changed How I Work Forever",
        "Stop Doing This If You Want to Be Productive"
      ];
      mockData = JSON.stringify(titles);
    } else if (prompt.includes('description')) {
      mockData = `In this video, I break down the science-backed productivity system that helped me double my output while working fewer hours.

🎯 Key Takeaways:
• Why multitasking is killing your productivity
• The 90-minute focus block method
• How to design your environment for success

⏱️ Timestamps:
0:00 - The problem with modern work
1:30 - What the research actually shows
3:45 - The 3-step implementation
6:00 - My 30-day results
8:30 - How to get started today

📚 Resources:
Free guide mentioned in video: [link in description]

#productivity #focus #deepwork`;
    } else if (prompt.includes('thumbnail') || prompt.includes('image prompt')) {
      mockData = `A clean, high-contrast thumbnail showing a split-screen comparison: left side labeled "BEFORE" with a stressed, overwhelmed person surrounded by chaos; right side labeled "AFTER" with the same person calm and focused. Bold text overlay: "30 DAY TRANSFORMATION". Use bright, energetic colors with a subtle gradient background. Include a small clock icon and upward trending arrow graphic.`;
    } else if (prompt.includes('storyboard')) {
      mockData = JSON.stringify([
        {
          sceneNumber: 1,
          timestampStart: '0:00',
          timestampEnd: '0:15',
          duration: 15,
          type: 'A-roll',
          scriptSegment: "Hey everyone, welcome back! Today I'm going to share something that completely changed how I think about productivity.",
          visualDescription: 'Host speaking directly to camera with energetic expression, bright studio lighting',
          imagePrompt: 'YouTube creator in modern home studio, professional ring light, confident welcoming expression, clean background with subtle plants, 4K quality',
          audioNote: 'Upbeat intro music fading out',
          recordingInstructions: 'Look directly at lens, high energy'
        },
        {
          sceneNumber: 2,
          timestampStart: '0:15',
          timestampEnd: '0:45',
          duration: 30,
          type: 'B-roll',
          scriptSegment: 'Most people approach productivity completely wrong. They try to multitask...',
          visualDescription: 'Montage of distracted workers, multiple browser tabs, phone notifications popping up',
          imagePrompt: 'Split screen comparison: left side shows chaotic workspace with multiple screens, notifications, coffee cups; right side shows clean minimalist desk with single laptop',
          audioNote: 'Subtle tension music building',
          recordingInstructions: 'Capture chaotic desk footage'
        },
        {
          sceneNumber: 3,
          timestampStart: '0:45',
          timestampEnd: '2:00',
          duration: 75,
          type: 'ScreenCap',
          scriptSegment: 'The key insight is single-tasking beats multitasking every time.',
          visualDescription: 'Calendar app showing time blocks, focus mode activated, timer running',
          imagePrompt: 'Clean Google Calendar interface with color-coded 90-minute time blocks, focus mode overlay, minimalist design, professional screenshot',
          audioNote: 'Calm explanatory tone',
          recordingInstructions: 'Screen record calendar setup'
        }
      ]);
    } else {
      mockData = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
    }

    return {
      success: true,
      data: mockData,
      fallbackUsed: true,
      message: 'Template mode active: Using structured templates. Add API key in Settings for AI-generated content.'
    };
  }

  // Batch generation for efficiency
  async generateBatch(requests: AIGenerateRequest[]): Promise<AIGenerateResponse[]> {
    return Promise.all(requests.map(req => this.generate(req)));
  }
}

// Singleton instance
let aiGateway: AIGateway | null = null;

export function getAIGateway(config?: Partial<AIConfig>): AIGateway {
  if (!aiGateway) {
    aiGateway = new AIGateway(config);
  }
  return aiGateway;
}

export function resetAIGateway(config?: Partial<AIConfig>): AIGateway {
  aiGateway = new AIGateway(config);
  return aiGateway;
}

export { AIGateway };
