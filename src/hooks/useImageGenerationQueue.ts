import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getAIGateway } from '@/services/ai-provider';
import type { AIGenerateResponse } from '@/types';
import { toast } from 'sonner';

export function useImageGenerationQueue() {
  const ai = getAIGateway();
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  const generateMutation = useMutation({
    mutationFn: async ({ prompt, id }: { prompt: string; id: string }) => {
      const response = await ai.generate({ prompt, type: 'image' });
      return { id, response };
    },
    onMutate: ({ id }) => {
      setGeneratingIds(prev => new Set(prev).add(id));
    },
    onSuccess: () => {
      toast.success('Image generated');
    },
    onError: (error, { id }) => {
      console.error(`Image Generation Error for ${id}:`, error);
      toast.error('Failed to generate image');
    },
    onSettled: (_, __, { id }) => {
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  });

  const generateImage = useCallback(async (prompt: string, id: string): Promise<AIGenerateResponse | null> => {
    try {
      const result = await generateMutation.mutateAsync({ prompt, id });
      return result.response;
    } catch {
      return null;
    }
  }, [generateMutation]);

  const isGenerating = useCallback((id: string) => {
    return generatingIds.has(id);
  }, [generatingIds]);

  const isAnyGenerating = generatingIds.size > 0;
  const generatingCount = generatingIds.size;
  const generatingItems = Array.from(generatingIds);

  return {
    generateImage,
    isGenerating,
    isAnyGenerating,
    generatingCount,
    generatingItems
  };
}

export function useConcurrentImageGeneration() {
  const ai = getAIGateway();
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Map<string, AIGenerateResponse>>(new Map());

  const generateMultiple = useCallback(async (
    items: { prompt: string; id: string }[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<Map<string, AIGenerateResponse>> => {
    const ids = items.map(i => i.id);
    setGeneratingIds(new Set(ids));
    setResults(new Map());
    
    let completed = 0;
    
    const promises = items.map(async ({ prompt, id }) => {
      try {
        const response = await ai.generate({ prompt, type: 'image' });
        setResults(prev => new Map(prev).set(id, response));
        setGeneratingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        completed++;
        onProgress?.(completed, items.length);
        return { id, response, success: true };
      } catch (error) {
        console.error(`Failed to generate image for ${id}:`, error);
        setGeneratingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        completed++;
        onProgress?.(completed, items.length);
        return { id, response: null, success: false };
      }
    });

    await Promise.allSettled(promises);
    return results;
  }, [ai]);

  const isGenerating = useCallback((id: string) => {
    return generatingIds.has(id);
  }, [generatingIds]);

  const isAnyGenerating = generatingIds.size > 0;
  const generatingCount = generatingIds.size;
  const generatingItems = Array.from(generatingIds);

  return {
    generateMultiple,
    isGenerating,
    isAnyGenerating,
    generatingCount,
    generatingItems,
    results
  };
}