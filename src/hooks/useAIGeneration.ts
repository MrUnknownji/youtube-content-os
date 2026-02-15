import { useMutation } from '@tanstack/react-query';
import { getAIGateway } from '@/services/ai-provider';
import type { AIGenerateRequest, AIGenerateResponse } from '@/types';
import { toast } from 'sonner';

export const useTextGeneration = () => {
  const ai = getAIGateway();

  const generateMutation = useMutation({
    mutationFn: async (request: AIGenerateRequest): Promise<AIGenerateResponse> => {
      return ai.generate(request);
    },
    onError: (error) => {
      console.error('Text Generation Error:', error);
      toast.error('Text generation failed. Please try again.');
    }
  });

  return {
    generate: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    error: generateMutation.error
  };
};

export const useImageGeneration = () => {
  const ai = getAIGateway();

  const generateMutation = useMutation({
    mutationFn: async ({ prompt }: { prompt: string; id: string }): Promise<AIGenerateResponse> => {
      const response = await ai.generate({ prompt, type: 'image' });
      return response;
    },
    onError: (error) => {
      console.error('Image Generation Error:', error);
      toast.error('Failed to generate image');
    }
  });

  const isGenerating = (id: string) => {
    return generateMutation.isPending && 
           generateMutation.variables?.id === id;
  };

  return {
    generate: (prompt: string, id: string) => 
      generateMutation.mutateAsync({ prompt, id }),
    isGenerating,
    isAnyGenerating: generateMutation.isPending,
    error: generateMutation.error
  };
};

export const useBatchImageGeneration = () => {
  const ai = getAIGateway();

  const generateAllMutation = useMutation({
    mutationFn: async (items: { prompt: string; id: string }[]): Promise<Map<string, AIGenerateResponse>> => {
      const results = new Map<string, AIGenerateResponse>();
      
      const promises = items.map(async ({ prompt, id }) => {
        try {
          const response = await ai.generate({ prompt, type: 'image' });
          results.set(id, response);
        } catch (error) {
          console.error(`Failed to generate image for ${id}:`, error);
        }
      });

      await Promise.allSettled(promises);
      return results;
    },
    onError: (error) => {
      console.error('Batch Image Generation Error:', error);
      toast.error('Some images failed to generate');
    }
  });

  return {
    generateAll: (items: { prompt: string; id: string }[]) => 
      generateAllMutation.mutateAsync(items),
    isGenerating: generateAllMutation.isPending,
    progress: generateAllMutation.data?.size ?? 0,
    error: generateAllMutation.error
  };
};

export const useAIGeneration = () => {
  const ai = getAIGateway();

  const generateMutation = useMutation({
    mutationFn: async (request: AIGenerateRequest): Promise<AIGenerateResponse> => {
      return ai.generate(request);
    },
    onError: (error) => {
      console.error('AI Generation Error:', error);
      toast.error('AI generation failed. Please check your connection or API key.');
    }
  });

  return {
    generate: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending
  };
};