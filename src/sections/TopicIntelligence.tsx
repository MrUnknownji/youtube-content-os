// Module 2: Topic Intelligence - 10 Suggestions Grid
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark,
  Check,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectStore } from "@/state/projectStore";
import { useTextGeneration } from "@/hooks/useAIGeneration";
import { getAIGateway } from "@/services/ai-provider";
import { getDatabaseGateway } from "@/services/db-adapter";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopicSuggestion, PinnedItem } from "@/types";

const MOCK_TOPICS: TopicSuggestion[] = [
  {
    id: "topic-1",
    title: "The Hidden Truth About Productivity No One Talks About",
    rationale: "Addresses a curiosity gap while promising insider knowledge",
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
    title: "I Tried This Morning Routine for 30 Days - Here's What Happened",
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

export function TopicIntelligence() {
  const {
    currentProject,
    currentStage,
    updateProject,
    finalizeTopic,
    pinnedItems,
    addPinnedItem,
    removePinnedItem,
  } = useProjectStore();
  const { generate: generateText } = useTextGeneration();

  const [topics, setTopics] = useState<TopicSuggestion[]>(() => {
    if (
      currentProject?.topicSuggestions &&
      currentProject.topicSuggestions.length > 0
    ) {
      return currentProject.topicSuggestions;
    }
    return getAIGateway().isAvailable() ? [] : MOCK_TOPICS;
  });

  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [preferences, setPreferences] = useState("");
  const [finalizedTopicId, setFinalizedTopicId] = useState<string | null>(null);

  const ai = getAIGateway();
  const db = getDatabaseGateway();

  const generationStarted = useRef(false);

  useEffect(() => {
    if (
      currentStage === "topics" &&
      topics.length === 0 &&
      ai.isAvailable() &&
      !localIsGenerating &&
      !generationStarted.current
    ) {
      generationStarted.current = true;
      handleGenerateTopics();
    }
  }, [currentStage, topics.length, localIsGenerating]);

  const handleGenerateTopics = async () => {
    if (localIsGenerating) return;
    setLocalIsGenerating(true);

    try {
      const dataContext = currentProject?.dataSource
        ? `Based on this data: ${JSON.stringify(currentProject.dataSource.rawData).slice(0, 500)}...`
        : `Generate video topic suggestions for: ${preferences || "general YouTube content"}`;

      const prompt = `${dataContext}

You are an expert YouTube content strategist. Generate exactly 10 compelling VIDEO TOPIC ideas tailored to the creator's niche and audience.

User preferences: ${preferences || "None specified"}

GUIDELINES:
- Vary the content styles: tutorials, opinion pieces, case studies, debunks, comparisons, how-tos, listicles, personal experience
- Titles should be clear, specific, and genuinely valuable — not overly sensational
- A good title accurately represents the content while sparking genuine curiosity
- Use concrete numbers or specifics when they add credibility (not arbitrary ones)
- Avoid excessive ALL CAPS, excessive punctuation, or hollow superlatives
- If preferences suggest a specific language or style, match it; otherwise default to clear English
- Think about what would serve the audience, not just maximize clicks

Return as valid JSON array with these exact fields:
- id: unique identifier like "topic-1"
- title: the video title (clear, specific, compelling)
- rationale: why this topic would resonate with the target audience and what value it delivers
- predictedScore: number 65-92 indicating estimated audience interest based on specificity and relevance`;

      const response = await generateText({
        prompt,
        type: "text",
        format: "json",
      });

      if (response.success) {
        try {
          const jsonMatch = response.data.match(/\[[\s\S]*\]/);
          const parsedTopics = jsonMatch
            ? JSON.parse(jsonMatch[0])
            : JSON.parse(response.data);

          if (Array.isArray(parsedTopics) && parsedTopics.length > 0) {
            const validatedTopics = parsedTopics.map((t, i) => ({
              id: String(t.id || `topic-${i + 1}`),
              title: String(t.title || "Untitled"),
              rationale: String(t.rationale || ""),
              predictedScore: parseInt(t.predictedScore) || 75,
            }));
            setTopics(validatedTopics);
            updateProject({ topicSuggestions: validatedTopics });
            toast.success("Topics generated successfully");
          }
        } catch (e) {
          setTopics(MOCK_TOPICS);
        }
      }
    } catch (error) {
      toast.error("Failed to generate topics");
    } finally {
      setLocalIsGenerating(false);
    }
  };

  const pinTopic = async (topic: TopicSuggestion) => {
    if (!currentProject) return;

    const pinItem: Omit<PinnedItem, "id" | "pinnedAt"> = {
      userId: "personal_user",
      itemType: "topic",
      content: topic,
      sourceProjectId: currentProject.id,
    };

    const result = await db.addPinnedItem(pinItem);
    if (result.success) {
      addPinnedItem(result.data!);
      toast.success("Topic pinned");
    }
  };

  const unpinTopic = async (topicId: string) => {
    const pinToRemove = pinnedItems.find(
      (p) =>
        p.itemType === "topic" && (p.content as TopicSuggestion).id === topicId,
    );

    if (pinToRemove) {
      const result = await db.deletePinnedItem(pinToRemove.id);
      if (result.success) {
        removePinnedItem(pinToRemove.id);
        toast.success("Topic unpinned");
      }
    }
  };

  const isPinned = (topicId: string) => {
    return pinnedItems.some(
      (p) =>
        p.itemType === "topic" && (p.content as TopicSuggestion).id === topicId,
    );
  };

  const handleFinalizeTopic = (topic: TopicSuggestion) => {
    finalizeTopic(topic);
    setFinalizedTopicId(topic.id);
    toast.success("Topic selected");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-chart-1 text-primary-foreground";
    if (score >= 70) return "bg-chart-2 text-primary-foreground";
    if (score >= 60) return "bg-chart-3 text-primary-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-sans text-foreground">
            Topic Intelligence
          </h2>
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
            <RefreshCw
              className={`mr-2 h-4 w-4 ${localIsGenerating ? "animate-spin" : ""}`}
            />
            Refresh 10
          </Button>
        </div>
      </div>

      {/* Preferences Input */}
      <Card className="bg-card/60 backdrop-blur-xl border-border/50 rounded-2xl shadow-sm overflow-hidden">
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
                {localIsGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topics Grid / Empty State / Loading */}
      {localIsGenerating && topics.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="bg-card/50 backdrop-blur-sm border-border/50 rounded-2xl shadow-sm"
            >
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : topics.length === 0 ? (
        <Card className="bg-card/40 backdrop-blur-sm border-border/50 border-dashed rounded-2xl">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Lightbulb className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold font-sans text-foreground mb-2">
              No topic suggestions yet
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Enter what kind of content you want to create and click Generate
              to get AI-powered video topic suggestions.
            </p>
            <div className="w-full max-w-lg">
              <div className="flex gap-3">
                <Input
                  placeholder="e.g., tutorials about time management, productivity hacks..."
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  className="bg-input border-input flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !localIsGenerating) {
                      handleGenerateTopics();
                    }
                  }}
                />
                <Button
                  onClick={handleGenerateTopics}
                  disabled={localIsGenerating}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Topics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, index) => (
            <Card
              key={topic.id}
              className={`
                group relative bg-card/60 backdrop-blur-md border-border/40 rounded-2xl shadow-sm transition-all duration-300 ease-out
                ${
                  finalizedTopicId === topic.id
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:shadow-xl hover:border-border/80"
                }
              `}
            >
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                    <Badge
                      className={`${getScoreColor(
                        topic.predictedScore,
                      )} font-medium shadow-sm`}
                    >
                      <TrendingUp className="mr-1 h-3.5 w-3.5" />
                      {topic.predictedScore}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      isPinned(topic.id)
                        ? unpinTopic(topic.id)
                        : pinTopic(topic)
                    }
                    className={`h-8 w-8 rounded-full transition-colors ${isPinned(topic.id) ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    <Bookmark
                      className={`h-4 w-4 ${isPinned(topic.id) ? "fill-current" : ""}`}
                    />
                  </Button>
                </div>

                <h3 className="font-sans font-semibold text-foreground text-lg leading-snug mb-3 flex-1">
                  {topic.title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                  {topic.rationale}
                </p>

                <div className="mt-auto pt-4 border-t border-border/40">
                  <Button
                    onClick={() => handleFinalizeTopic(topic)}
                    disabled={
                      localIsGenerating || finalizedTopicId === topic.id
                    }
                    className={`
                      w-full rounded-xl transition-all duration-300 font-medium
                      ${
                        finalizedTopicId === topic.id
                          ? "bg-primary/20 text-primary hover:bg-primary/20"
                          : "bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm hover:shadow-md"
                      }
                    `}
                  >
                    {finalizedTopicId === topic.id ? (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Selected
                      </>
                    ) : (
                      "Select Topic"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
