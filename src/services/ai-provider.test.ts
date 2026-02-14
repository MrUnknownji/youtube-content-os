import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAIGateway, resetAIGateway } from './ai-provider';
import type { AIGenerateRequest, AIProvider } from '@/types';

describe('AIProvider Service', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset singleton
    resetAIGateway();

    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Clear localStorage
    localStorage.clear();

    // Mock console.warn and console.error to keep test output clean
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use mock mode when AI is disabled', async () => {
    // Setup: AI disabled in settings
    localStorage.setItem('yco-ai-settings', JSON.stringify({
      useAI: false,
    }));

    const gateway = getAIGateway();
    const request: AIGenerateRequest = {
      prompt: 'test prompt for topic',
      type: 'text',
    };

    const response = await gateway.generate(request);

    // Assertions
    expect(response.success).toBe(true);
    expect(response.fallbackUsed).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();

    // Check if mock data is returned (mock logic for 'topic')
    const data = JSON.parse(response.data);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('title');
  });

  it('should use API when AI is enabled and settings are valid', async () => {
    // Setup: AI enabled with API key
    const settings = {
      useAI: true,
      geminiApiKey: 'test-api-key',
      geminiModel: 'gemini-test-model',
    };
    localStorage.setItem('yco-ai-settings', JSON.stringify(settings));

    // Mock API response
    const mockApiResponse = {
      success: true,
      data: 'AI generated content',
      fallbackUsed: false,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const gateway = getAIGateway();
    const request: AIGenerateRequest = {
      prompt: 'generate a script',
      type: 'text',
    };

    const response = await gateway.generate(request);

    // Assertions
    expect(response.success).toBe(true);
    expect(response.data).toBe('AI generated content');
    expect(response.fallbackUsed).toBe(false);

    // Verify fetch call
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/ai/generate');
    expect(options.method).toBe('POST');
    expect(options.headers).toHaveProperty('x-gemini-api-key', 'test-api-key');
    expect(JSON.parse(options.body)).toEqual(expect.objectContaining({
      provider: 'gemini',
      prompt: 'generate a script',
      model: 'gemini-test-model',
    }));
  });

  it('should use image generation when enabled', async () => {
    // Setup: AI and Image Gen enabled
    const settings = {
      useAI: true,
      geminiApiKey: 'test-api-key',
      useImageGen: true,
      imageModel: 'gpt-image-test',
    };
    localStorage.setItem('yco-ai-settings', JSON.stringify(settings));

    // Mock API response
    const mockApiResponse = {
      success: true,
      data: 'https://example.com/image.png',
      fallbackUsed: false,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const gateway = getAIGateway();
    const request: AIGenerateRequest = {
      prompt: 'a beautiful landscape',
      type: 'image',
    };

    const response = await gateway.generate(request);

    // Assertions
    expect(response.success).toBe(true);
    expect(response.data).toBe('https://example.com/image.png');
    expect(response.fallbackUsed).toBe(false);

    // Verify fetch call for image
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual(expect.objectContaining({
      type: 'image',
      model: 'gpt-image-test',
    }));
  });

  it('should fallback to mock when image generation is disabled in settings', async () => {
    // Setup: AI enabled but Image Gen disabled
    const settings = {
      useAI: true,
      geminiApiKey: 'test-api-key',
      useImageGen: false,
    };
    localStorage.setItem('yco-ai-settings', JSON.stringify(settings));

    const gateway = getAIGateway();
    const request: AIGenerateRequest = {
      prompt: 'a beautiful landscape',
      type: 'image',
    };

    const response = await gateway.generate(request);

    // Assertions
    expect(response.success).toBe(true);
    expect(response.fallbackUsed).toBe(true); // Should fallback
    expect(response.message).toContain('Mock mode');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should fallback to template when API call fails', async () => {
    // Setup: AI enabled
    const settings = {
      useAI: true,
      geminiApiKey: 'test-api-key',
    };
    localStorage.setItem('yco-ai-settings', JSON.stringify(settings));

    // Mock API failure
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const gateway = getAIGateway();
    const request: AIGenerateRequest = {
      prompt: 'generate a script',
      type: 'text',
    };

    const response = await gateway.generate(request);

    // Assertions
    expect(response.success).toBe(true);
    expect(response.fallbackUsed).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Check if mock script template is returned
    expect(response.data).toContain('[HOOK - 0:00-0:15]');
  });

  it('should fallback to template when API returns non-ok status', async () => {
    // Setup: AI enabled
    const settings = {
      useAI: true,
      geminiApiKey: 'test-api-key',
    };
    localStorage.setItem('yco-ai-settings', JSON.stringify(settings));

    // Mock API error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const gateway = getAIGateway();
    const request: AIGenerateRequest = {
      prompt: 'generate a script',
      type: 'text',
    };

    const response = await gateway.generate(request);

    // Assertions
    expect(response.success).toBe(true);
    expect(response.fallbackUsed).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
