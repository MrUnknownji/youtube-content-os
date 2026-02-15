import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Zap,
  RefreshCw,
  Sparkles,
  Clock,
  Target,
  Copy,
  CheckCheck,
  Bookmark,
  Download,
  Play,
  Scissors,
  Flame,
  Heart,
  Lightbulb,
  AlertTriangle,
  Trophy,
  Clock3,
  Instagram,
  Music2,
  ChevronDown,
  ChevronUp,
  Wand2,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '@/state/projectStore';
import { useTextGeneration } from '@/hooks/useAIGeneration';
import { useImageGenerationQueue } from '@/hooks/useImageGenerationQueue';
import { getAIGateway } from '@/services/ai-provider';
import { getDatabaseGateway } from '@/services/db-adapter';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ImageViewer } from '@/components/ImageViewer';
import type { ShortsExtract, PinnedItem } from '@/types';

const VIRAL_POTENTIAL_COLORS = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-chart-3 text-primary-foreground',
  high: 'bg-chart-2 text-primary-foreground',
  viral: 'bg-chart-1 text-primary-foreground'
};

const CONTENT_TYPE_ICONS = {
  hook: Zap,
  twist: Flame,
  reveal: Lightbulb,
  emotion: Heart,
  value_bomb: Trophy,
  controversy: AlertTriangle
};

const MOCK_SHORTS: ShortsExtract[] = [
  {
    id: 'short-1',
    sourceScriptId: 'script-1',
    title: 'The 5-Second Rule That Changed Everything',
    duration: 25,
    timestampStart: '0:15',
    timestampEnd: '0:40',
    hookText: "Agar aap ye ek cheez nahi karte, toh aapka 90% time waste ho raha hai...",
    hookReason: 'Creates curiosity gap with a shocking statistic and personal address',
    fullContent: "Agar aap ye ek cheez nahi karte, toh aapka 90% time waste ho raha hai... Maine khud try kiya aur results dekho - productivity 3x badh gayi!",
    engagementScore: 92,
    viralPotential: 'viral',
    contentType: 'hook',
    targetAudience: 'Productivity seekers, students, professionals',
    suggestedThumbnail: 'Person with shocked expression, clock in background, bold text "90% WASTE"',
    suggestedTitle: [
      'Ye Galti Mat Karna! 🚫',
      '90% Log Ye Galat Karte Hain',
      '1 Min Mein Sikh Jo Badal Degi Zindagi'
    ],
    hashtags: ['#productivity', '#timemanagement', '#success', '#motivation', '#shorts'],
    bestPostingTime: '7-9 PM IST',
    crossPlatformAdaptation: {
      instagram: 'Add trending audio, use 4:5 ratio, include poll sticker',
      tiktok: 'Use popular sound, add captions, faster pace with jump cuts'
    }
  },
  {
    id: 'short-2',
    sourceScriptId: 'script-1',
    title: 'The Hidden Feature Nobody Knows',
    duration: 20,
    timestampStart: '1:30',
    timestampEnd: '1:50',
    hookText: "Maine YouTube pe 100+ videos dekhi aur ye secret feature paya...",
    hookReason: 'Exclusivity and insider knowledge creates FOMO',
    fullContent: "Maine YouTube pe 100+ videos dekhi aur ye secret feature paya... Settings mein jao, ye enable karo, and boom - results dekho!",
    engagementScore: 88,
    viralPotential: 'high',
    contentType: 'reveal',
    targetAudience: 'Tech enthusiasts, content creators',
    suggestedThumbnail: 'Phone screen with secret feature highlighted, "SECRET" text',
    suggestedTitle: [
      'YouTube Ka Secret Feature! 🤫',
      'Ye Feature Disable Hai 99% Log Ka',
      'Unlock Hidden YouTube Settings'
    ],
    hashtags: ['#youtube', '#secret', '#tips', '#tech', '#shorts'],
    bestPostingTime: '12-2 PM IST',
    crossPlatformAdaptation: {
      instagram: 'Screen recording style, use in-app music',
      tiktok: 'Green screen effect, pointing trend'
    }
  }
];

export function ShortsGenerator() {
  const { currentProject, updateProject, addPinnedItem, currentStage } = useProjectStore();
  const { generate: generateText } = useTextGeneration();
  const { generateImage, isGenerating: isImageGenerating } = useImageGenerationQueue();

  const [shorts, setShorts] = useState<ShortsExtract[]>(() => {
    if (currentProject?.shortsExtracts && currentProject.shortsExtracts.length > 0) {
      return currentProject.shortsExtracts;
    }
    return getAIGateway().isAvailable() ? [] : MOCK_SHORTS;
  });

  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [expandedShort, setExpandedShort] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generateThumbnails, setGenerateThumbnails] = useState(false);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<Record<string, string>>({});

  const ai = getAIGateway();
  const db = getDatabaseGateway();
  const generationStarted = useRef(false);

  useEffect(() => {
    if (
      currentStage === 'shorts' &&
      shorts.length === 0 &&
      ai.isAvailable() &&
      currentProject?.selectedScript &&
      !localIsGenerating &&
      !generationStarted.current
    ) {
      generationStarted.current = true;
      handleGenerateShorts();
    }
  }, [currentStage, shorts.length, currentProject?.selectedScript, localIsGenerating]);

  const handleGenerateShorts = async () => {
    if (localIsGenerating) return;
    setLocalIsGenerating(true);

    try {
      const script = currentProject?.selectedScript?.content || '';
      const topic = currentProject?.selectedTopic?.title || 'video content';

      const prompt = `You are a YouTube Shorts viral content expert. Analyze this script and extract EXACTLY 3 potential shorts (10-30 seconds each).

SCRIPT:
${script.slice(0, 2000)}

TOPIC: ${topic}

CRITICAL REQUIREMENTS FOR SHORTS:
1. Each short MUST have a hook that creates immediate curiosity in the FIRST 2 SECONDS
2. The hook should create: curiosity gap, shock, emotion, controversy, OR value promise
3. Each short must be SELF-CONTAINED - a viewer shouldn't need to see the full video
4. The ending must have a strong payoff or twist

SHORTS CONTENT TYPES TO IDENTIFY:
- HOOK: Shocking opening statement or question that grabs attention
- TWIST: Unexpected revelation or counterintuitive insight  
- REVEAL: Secret tip, hidden feature, or insider knowledge
- EMOTION: Powerful emotional moment or story
- VALUE_BOMB: Quick actionable tip with immediate benefit
- CONTROVERSY: Bold statement that challenges common beliefs

For each short, return as JSON:
{
  "id": "short-1/2/3",
  "sourceScriptId": "script id",
  "title": "Engaging short title in Hinglish",
  "duration": 15-30,
  "timestampStart": "approximate start in script",
  "timestampEnd": "approximate end in script", 
  "hookText": "The exact opening line - THIS IS CRITICAL. Must be 5-8 words maximum, create curiosity, and stop the scroll",
  "hookReason": "Why this hook works psychologically",
  "fullContent": "Complete short script in Hinglish (Hindi + English mix)",
  "engagementScore": 60-95,
  "viralPotential": "low/medium/high/viral",
  "contentType": "hook/twist/reveal/emotion/value_bomb/controversy",
  "targetAudience": "Who will watch this",
  "suggestedThumbnail": "Description of thumbnail with text overlay - BE SPECIFIC about colors, expressions, and text",
  "suggestedTitle": ["3 Hinglish title options with emojis"],
  "hashtags": ["5-8 relevant hashtags including #shorts"],
  "bestPostingTime": "Best time to post in IST",
  "crossPlatformAdaptation": {
    "instagram": "Specific adaptation tips",
    "tiktok": "Specific adaptation tips"
  }
}

Return as valid JSON array of exactly 3 shorts. Make them genuinely viral-worthy.`;

      const response = await generateText({ prompt, type: 'text', format: 'json' });

      if (response.success) {
        try {
          const jsonMatch = response.data.match(/\[[\s\S]*\]/);
          const parsedShorts = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response.data);

          if (Array.isArray(parsedShorts) && parsedShorts.length > 0) {
            const validatedShorts = parsedShorts.map((s, i) => ({
              id: String(s.id || `short-${i + 1}`),
              sourceScriptId: String(s.sourceScriptId || currentProject?.selectedScript?.id || 'script-1'),
              title: String(s.title || `Short ${i + 1}`),
              duration: Math.min(Math.max(parseInt(s.duration) || 20, 10), 30),
              timestampStart: String(s.timestampStart || '0:00'),
              timestampEnd: String(s.timestampEnd || '0:20'),
              hookText: String(s.hookText || ''),
              hookReason: String(s.hookReason || ''),
              fullContent: String(s.fullContent || ''),
              engagementScore: parseInt(s.engagementScore) || 75,
              viralPotential: ['low', 'medium', 'high', 'viral'].includes(s.viralPotential) ? s.viralPotential : 'medium',
              contentType: ['hook', 'twist', 'reveal', 'emotion', 'value_bomb', 'controversy'].includes(s.contentType) ? s.contentType : 'hook',
              targetAudience: String(s.targetAudience || 'General audience'),
              suggestedThumbnail: String(s.suggestedThumbnail || ''),
              suggestedTitle: Array.isArray(s.suggestedTitle) ? s.suggestedTitle.slice(0, 3) : ['Short Title'],
              hashtags: Array.isArray(s.hashtags) ? s.hashtags.slice(0, 8) : ['#shorts'],
              bestPostingTime: String(s.bestPostingTime || '6-8 PM IST'),
              crossPlatformAdaptation: {
                instagram: String(s.crossPlatformAdaptation?.instagram || 'Use trending audio'),
                tiktok: String(s.crossPlatformAdaptation?.tiktok || 'Use popular sound')
              }
            }));
            setShorts(validatedShorts);
            updateProject({ shortsExtracts: validatedShorts });
            toast.success('Shorts extracted successfully');
          }
        } catch (e) {
          console.error('Parse error:', e);
          setShorts(MOCK_SHORTS);
        }
      }
    } catch {
      toast.error('Failed to generate shorts');
    } finally {
      setLocalIsGenerating(false);
    }
  };

  const generateThumbnailImage = async (short: ShortsExtract) => {
    if (isImageGenerating(short.id)) return;
    
    const prompt = `Create a viral YouTube Shorts thumbnail (9:16 vertical aspect ratio): ${short.suggestedThumbnail}
    
Style requirements:
- High contrast, eye-catching design
- Bold, readable text overlay
- Professional quality
- Vibrant colors that pop on mobile screens
- Optimized for small screen viewing

The thumbnail should make viewers instantly curious and want to click.`;

    const response = await generateImage(prompt, short.id);
    if (response?.success) {
      setGeneratedThumbnails(prev => ({ ...prev, [short.id]: response.data }));
    }
  };

  const regenerateThumbnailImage = async (shortId: string) => {
    const short = shorts.find(s => s.id === shortId);
    if (!short || isImageGenerating(shortId)) return;
    
    const prompt = `Create a viral YouTube Shorts thumbnail (9:16 vertical aspect ratio): ${short.suggestedThumbnail}
    
Style requirements:
- High contrast, eye-catching design
- Bold, readable text overlay
- Professional quality
- Vibrant colors that pop on mobile screens
- Optimized for small screen viewing`;

    const response = await generateImage(prompt, shortId);
    if (response?.success) {
      setGeneratedThumbnails(prev => ({ ...prev, [shortId]: response.data }));
    }
  };

  const copyShort = (short: ShortsExtract) => {
    const text = `📝 ${short.title}

🎬 Hook (${short.duration}s):
${short.hookText}

📝 Full Script:
${short.fullContent}

🏷️ Suggested Titles:
${short.suggestedTitle.map((t, i) => `${i + 1}. ${t}`).join('\n')}

#️⃣ Hashtags:
${short.hashtags.join(' ')}

⏰ Best Time: ${short.bestPostingTime}`;
    navigator.clipboard.writeText(text);
    setCopiedId(short.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Short copied to clipboard');
  };

  const pinShort = async (short: ShortsExtract) => {
    if (!currentProject) return;

    const pinItem: Omit<PinnedItem, 'id' | 'pinnedAt'> = {
      userId: 'personal_user',
      itemType: 'shorts',
      content: short,
      sourceProjectId: currentProject.id
    };

    const result = await db.addPinnedItem(pinItem);
    if (result.success) {
      addPinnedItem(result.data!);
      toast.success('Short pinned');
    }
  };

  const exportAllShorts = () => {
    if (shorts.length === 0) return;

    const content = shorts.map((short, i) => {
      return `## Short ${i + 1}: ${short.title}

**Type:** ${short.contentType.toUpperCase()}
**Duration:** ${short.duration} seconds
**Viral Potential:** ${short.viralPotential.toUpperCase()}
**Engagement Score:** ${short.engagementScore}/100

### Hook
${short.hookText}

### Full Script
${short.fullContent}

### Suggested Titles
${short.suggestedTitle.map((t, i) => `${i + 1}. ${t}`).join('\n')}

### Thumbnail Idea
${short.suggestedThumbnail}

### Hashtags
${short.hashtags.join(' ')}

### Best Posting Time
${short.bestPostingTime}

### Cross-Platform Tips
- Instagram: ${short.crossPlatformAdaptation.instagram}
- TikTok: ${short.crossPlatformAdaptation.tiktok}

---`;
    }).join('\n\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shorts-${currentProject?.id || Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Shorts exported');
  };

  const getTypeIcon = (type: ShortsExtract['contentType']) => {
    return CONTENT_TYPE_ICONS[type] || Zap;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-sans text-foreground">Shorts Extractor</h2>
          <p className="text-muted-foreground mt-1">
            Extract viral-worthy shorts from your script
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={generateThumbnails}
              onCheckedChange={setGenerateThumbnails}
              id="gen-thumbnails"
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="gen-thumbnails" className="text-sm text-muted-foreground hidden md:inline">
              Generate Thumbnails
            </Label>
          </div>
          <Button
            onClick={exportAllShorts}
            disabled={shorts.length === 0}
            variant="outline"
            className="border-border"
          >
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Button
            onClick={handleGenerateShorts}
            disabled={localIsGenerating || !currentProject?.selectedScript}
            variant="outline"
            className="border-border"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${localIsGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </div>
      </div>

      {currentProject?.selectedScript && (
        <Card className="bg-accent/50 border-accent">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">From Script:</span>
              <span className="font-medium text-foreground truncate max-w-md">
                {currentProject.selectedScript.content.slice(0, 100)}...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {localIsGenerating && shorts.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : shorts.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Scissors className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold font-sans text-foreground mb-2">
              No shorts extracted yet
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Finalize a script first, then extract viral-worthy shorts for YouTube, Instagram, and TikTok.
            </p>
            <Button
              onClick={handleGenerateShorts}
              disabled={localIsGenerating || !currentProject?.selectedScript}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Extract Shorts
            </Button>
            {!currentProject?.selectedScript && (
              <p className="text-sm text-muted-foreground mt-2">
                Complete the script stage first
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {shorts.map((short) => {
            const TypeIcon = getTypeIcon(short.contentType);
            const isExpanded = expandedShort === short.id;
            const isGeneratingThumbnail = isImageGenerating(short.id);
            const hasThumbnail = !!generatedThumbnails[short.id];

            return (
              <Collapsible
                key={short.id}
                open={isExpanded}
                onOpenChange={() => setExpandedShort(isExpanded ? null : short.id)}
              >
              <Card className="bg-card border-border transition-all duration-200">
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-5 cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className={`
                          w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                          ${VIRAL_POTENTIAL_COLORS[short.viralPotential]}
                        `}>
                          <TypeIcon className="h-6 w-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {short.duration}s
                            </Badge>
                            <Badge className={VIRAL_POTENTIAL_COLORS[short.viralPotential]}>
                              {short.viralPotential === 'viral' && <Flame className="h-3 w-3 mr-1" />}
                              {short.viralPotential.toUpperCase()}
                            </Badge>
                            <Badge variant="secondary">
                              <Target className="h-3 w-3 mr-1" />
                              {short.engagementScore}% Score
                            </Badge>
                          </div>

                          <h3 className="font-sans font-semibold text-foreground mb-2">
                            {short.title}
                          </h3>

                          <div className="bg-muted/50 rounded-md p-3 mb-2">
                            <p className="text-sm font-medium text-primary">
                              "{short.hookText}"
                            </p>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {short.fullContent}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-5 px-5">
                      <div className="border-t border-border pt-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                Why This Hook Works
                              </h4>
                              <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                                {short.hookReason}
                              </p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                <Play className="h-4 w-4 text-primary" />
                                Full Script
                              </h4>
                              <Textarea
                                value={short.fullContent}
                                readOnly
                                className="min-h-[100px] bg-muted/50 border-0"
                              />
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" />
                                Target Audience
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {short.targetAudience}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">
                                Suggested Titles
                              </h4>
                              <div className="space-y-2">
                                {short.suggestedTitle.map((title, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                                  >
                                    <span className="text-xs text-muted-foreground">{i + 1}.</span>
                                    <span className="text-sm text-foreground">{title}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">
                                Hashtags
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {short.hashtags.map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                <Clock3 className="h-4 w-4 text-primary" />
                                Best Posting Time
                              </h4>
                              <p className="text-sm text-muted-foreground">{short.bestPostingTime}</p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">
                                Cross-Platform Tips
                              </h4>
                              <div className="space-y-2">
                                <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
                                  <Instagram className="h-4 w-4 text-pink-500 mt-0.5" />
                                  <span className="text-sm text-muted-foreground">{short.crossPlatformAdaptation.instagram}</span>
                                </div>
                                <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
                                  <Music2 className="h-4 w-4 text-foreground mt-0.5" />
                                  <span className="text-sm text-muted-foreground">{short.crossPlatformAdaptation.tiktok}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-primary" />
                            Thumbnail
                          </h4>
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 mb-3">
                            {short.suggestedThumbnail}
                          </p>
                          
                          {generateThumbnails && (
                            <div className="space-y-3">
                              {!hasThumbnail ? (
                                <Button
                                  onClick={() => generateThumbnailImage(short)}
                                  disabled={isGeneratingThumbnail}
                                  variant="outline"
                                  className="w-full"
                                >
                                  {isGeneratingThumbnail ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Wand2 className="mr-2 h-4 w-4" />
                                  )}
                                  {isGeneratingThumbnail ? 'Generating...' : 'Generate Thumbnail'}
                                </Button>
                              ) : (
                                <>
                                  <div className="border rounded-md overflow-hidden max-w-xs">
                                    <ImageViewer
                                      src={generatedThumbnails[short.id]}
                                      alt={`Thumbnail for ${short.title}`}
                                    />
                                  </div>
                                  <Button
                                    onClick={() => regenerateThumbnailImage(short.id)}
                                    disabled={isGeneratingThumbnail}
                                    variant="outline"
                                    size="sm"
                                  >
                                    {isGeneratingThumbnail ? (
                                      <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                    ) : (
                                      <RefreshCw className="mr-2 h-3 w-3" />
                                    )}
                                    Regenerate
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => copyShort(short)}
                            variant="outline"
                            className="flex-1"
                          >
                            {copiedId === short.id ? (
                              <CheckCheck className="mr-2 h-4 w-4 text-primary" />
                            ) : (
                              <Copy className="mr-2 h-4 w-4" />
                            )}
                            {copiedId === short.id ? 'Copied!' : 'Copy Script'}
                          </Button>
                          <Button
                            onClick={() => pinShort(short)}
                            variant="outline"
                          >
                            <Bookmark className="mr-2 h-4 w-4" />
                            Pin
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      <Card className="bg-secondary/50 border-secondary">
        <CardContent className="pt-4">
          <h4 className="text-sm font-sans font-medium flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4" />
            Shorts Best Practices
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Hook viewers in the first 2 seconds - this is critical</li>
            <li>• Create curiosity gaps that make viewers want to see the full video</li>
            <li>• Use pattern interrupts to maintain attention throughout</li>
            <li>• End with a satisfying payoff or cliffhanger</li>
            <li>• Optimize for vertical viewing (9:16 aspect ratio)</li>
            <li>• Add captions - 85% of shorts are watched without sound</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
