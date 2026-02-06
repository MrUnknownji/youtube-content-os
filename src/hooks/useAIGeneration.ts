import { useMutation } from '@tanstack/react-query';
import { getAIGateway } from '@/services/ai-provider';
import { useProjectStore } from '@/state/projectStore';
import type { AIGenerateRequest } from '@/types';
import { toast } from 'sonner';

export const useAIGeneration = () => {
  const ai = getAIGateway();
  const setIsGenerating = useProjectStore((state) => state.setIsGenerating);

  // General generation mutation
  const generateMutation = useMutation({
    mutationFn: async (request: AIGenerateRequest) => {
      setIsGenerating(true);
      return ai.generate(request);
    },
    onSettled: () => {
      setIsGenerating(false);
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
