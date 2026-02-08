// Module 2: Topic Intelligence - 10 Suggestions Grid
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Bookmark, 
  Check, 
  RefreshCw, 
  Sparkles, 
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '@/state/projectStore';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { getAIGateway } from '@/services/ai-provider';
import { getDatabaseGateway } from '@/services/db-adapter';
import type { TopicSuggestion, PinnedItem } from '@/types';

const MOCK_TOPICS: TopicSuggestion[] = [
  { id: 'topic-1', title: 'The Hidden Truth About Productivity No One Talks About', rationale: 'Addresses a curiosity gap while promising insider knowledge', predictedScore: 85 },
  { id: 'topic-2', title: 'Why Most People Fail at Building Habits (And How to Fix It)', rationale: 'Identifies a common pain point with solution promise', predictedScore: 82 },
  { id: 'topic-3', title: 'I Tried This Morning Routine for 30 Days - Here\'s What Happened', rationale: 'Personal story format with specific timeframe', predictedScore: 78 },
  { id: 'topic-4', title: 'The Science Behind Deep Work: What Research Actually Shows', rationale: 'Authority-building with scientific backing', predictedScore: 75 },
  { id: 'topic-5', title: '5 Mistakes That Are Killing Your Focus (Backed by Science)', rationale: 'List format with negative framing (loss aversion)', predictedScore: 80 },
  { id: 'topic-6', title: 'How I 10x\'d My Output Without Working More Hours', rationale: 'Results-focused with counterintuitive promise', predictedScore: 88 },
  { id: 'topic-7', title: 'The Productivity System That Changed Everything for Me', rationale: 'Personal transformation story', predictedScore: 76 },
  { id: 'topic-8', title: 'Why You\'re Always Busy But Never Productive', rationale: 'Relatable problem identification', predictedScore: 79 },
  { id: 'topic-9', title: 'The Counterintuitive Approach to Getting More Done', rationale: 'Curiosity gap with contradiction', predictedScore: 81 },
  { id: 'topic-10', title: 'What Successful Creators Do Differently Every Morning', rationale: 'Social proof with daily routine appeal', predictedScore: 83 }
];

export function TopicIntelligence() {
  const { currentProject, currentStage, updateProject, finalizeTopic, pinnedItems, addPinnedItem, removePinnedItem } = useProjectStore();
  const { generate } = useAIGeneration();
  
  const [topics, setTopics] = useState<TopicSuggestion[]>(() => {
    if (currentProject?.topicSuggestions && currentProject.topicSuggestions.length > 0) {
      return currentProject.topicSuggestions;
    }
    return getAIGateway().isAvailable() ? [] : MOCK_TOPICS;
  });
  
  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [preferences, setPreferences] = useState('');
  const [finalizedTopicId, setFinalizedTopicId] = useState<string | null>(null);

  const ai = getAIGateway();
  const db = getDatabaseGateway();

  const generationStarted = useRef(false);

  // Auto-generate if empty and arrived at this stage
  useEffect(() => {
    if (
      currentStage === 'topics' && 
      topics.length === 0 && 
      ai.isAvailable() && 
      currentProject?.dataSource && 
      !localIsGenerating && 
      !generationStarted.current
    ) {
      generationStarted.current = true;
      handleGenerateTopics();
    }
  }, [currentStage, topics.length, currentProject?.dataSource, localIsGenerating]);

  const handleGenerateTopics = async () => {
    if (localIsGenerating) return;
    setLocalIsGenerating(true);
    
    try {
      const dataContext = currentProject?.dataSource ? 
        `Based on this data: ${JSON.stringify(currentProject.dataSource.rawData).slice(0, 500)}...` : 
        'Generate video topic suggestions';
      
      const prompt = `${dataContext}

You are a YouTube video title expert. Generate exactly 10 engaging YouTube video TITLE suggestions that would work well as clickable video titles.

IMPORTANT INSTRUCTIONS:
- Generate VIDEO TITLES only, not tips, not advice, not strategies
- Each title should be catchy, curiosity-inducing, and click-worthy
- Use proven title formats: numbers, how-to, questions, revelations, challenges
- Titles should be in HINGLISH (mix of Hindi + English, written in English script)
- Example good titles: "Maine 30 Din Ye Try Kiya - Results Dekho!", "Ye Galti Mat Karna YouTube Par"

User preferences: ${preferences || 'None specified'}

Return as valid JSON array with these exact fields:
- id: unique identifier like "topic-1"
- title: the video title in Hinglish (mix of Hindi and English in English script)
- rationale: brief explanation of why this title works (in English)
- predictedScore: number 60-95 indicating click potential`;

      const response = await generate({ prompt, type: 'text', format: 'json' });
      
      if (response.success) {
        try {
          const jsonMatch = response.data.match(/\[[\s\S]*\]/);
          const parsedTopics = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response.data);
          
          if (Array.isArray(parsedTopics) && parsedTopics.length > 0) {
            const validatedTopics = parsedTopics.map((t, i) => ({
              id: String(t.id || `topic-${i + 1}`),
              title: String(t.title || 'Untitled'),
              rationale: String(t.rationale || ''),
              predictedScore: parseInt(t.predictedScore) || 75
            }));
            setTopics(validatedTopics);
            updateProject({ topicSuggestions: validatedTopics });
            toast.success('Topics generated successfully');
          }
        } catch (e) {
          setTopics(MOCK_TOPICS);
        }
      }
    } catch (error) {
      toast.error('Failed to generate topics');
    } finally {
      setLocalIsGenerating(false);
    }
  };

  const pinTopic = async (topic: TopicSuggestion) => {
    if (!currentProject) return;

    const pinItem: Omit<PinnedItem, 'id' | 'pinnedAt'> = {
      userId: 'personal_user',
      itemType: 'topic',
      content: topic,
      sourceProjectId: currentProject.id
    };

    const result = await db.addPinnedItem(pinItem);
    if (result.success) {
      addPinnedItem(result.data!);
      toast.success('Topic pinned');
    }
  };

  const unpinTopic = async (topicId: string) => {
    const pinToRemove = pinnedItems.find(p => 
      p.itemType === 'topic' && (p.content as TopicSuggestion).id === topicId
    );
    
    if (pinToRemove) {
      const result = await db.deletePinnedItem(pinToRemove.id);
      if (result.success) {
        removePinnedItem(pinToRemove.id);
        toast.success('Topic unpinned');
      }
    }
  };

  const isPinned = (topicId: string) => {
    return pinnedItems.some(p => p.itemType === 'topic' && (p.content as TopicSuggestion).id === topicId);
  };

  const handleFinalizeTopic = (topic: TopicSuggestion) => {
    finalizeTopic(topic);
    setFinalizedTopicId(topic.id);
    toast.success('Topic selected');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-chart-1 text-primary-foreground';
    if (score >= 70) return 'bg-chart-2 text-primary-foreground';
    if (score >= 60) return 'bg-chart-3 text-primary-foreground';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-sans text-foreground">Topic Intelligence</h2>
          <p className="text-muted-foreground mt-1">
            AI-powered topic suggestions based on your data
          </p>
        </div>
        <div className="flex gap-2">

          <Button
            onClick={handleGenerateTopics}
            disabled={localIsGenerating}
            variant="outline"
            className="border-border"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${localIsGenerating ? 'animate-spin' : ''}`} />
            Refresh 10
          </Button>
        </div>
      </div>

      {/* Preferences Input */}
      <Card className="bg-card border-border rounded-lg shadow-sm">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="font-sans text-foreground mb-2 block">
                What would you like to create? (Optional)
              </Label>
              <Input
                placeholder="e.g., tutorials about time management, productivity hacks, morning routines..."
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="bg-input border-input"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerateTopics}
                disabled={localIsGenerating}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {localIsGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic, index) => (
          <Card 
            key={topic.id} 
            className={`
              bg-card border-border rounded-lg shadow-sm transition-all duration-200
              ${finalizedTopicId === topic.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}
            `}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                    <Badge className={`${getScoreColor(topic.predictedScore)} text-xs`}>
                      <TrendingUp className="mr-1 h-3 w-3" />
                      {topic.predictedScore}
                    </Badge>
                  </div>
                  <h3 className="font-sans font-semibold text-foreground leading-tight mb-2">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {topic.rationale}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => isPinned(topic.id) ? unpinTopic(topic.id) : pinTopic(topic)}
                    className={isPinned(topic.id) ? 'text-primary' : 'text-muted-foreground'}
                  >
                    <Bookmark className={`h-4 w-4 ${isPinned(topic.id) ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    size="icon"
                    onClick={() => handleFinalizeTopic(topic)}
                    disabled={localIsGenerating || finalizedTopicId === topic.id}
                    className={`
                      rounded-full
                      ${finalizedTopicId === topic.id 
                        ? 'bg-primary/50 text-primary-foreground' 
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground'}
                    `}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


    </div>
  );
}
