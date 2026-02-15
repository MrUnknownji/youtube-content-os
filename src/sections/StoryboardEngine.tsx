// Module 4: Visual Storyboard Engine - Scene-by-scene planning
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Bookmark, 
  Check, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Clock,
  Camera,
  Monitor,
  Image as ImageIcon,
  Music,
  Mic,
  Wand2,
  Copy,
  CheckCheck,
  ChevronsUp,
  ChevronsDown,
  HelpCircle,
  Clapperboard,
  Sparkles,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '@/state/projectStore';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { getAIGateway } from '@/services/ai-provider';
import { getDatabaseGateway } from '@/services/db-adapter';
import { ImageViewer } from '@/components/ImageViewer';
import { getAISettings } from '@/components/SettingsDialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { StoryboardScene, PinnedItem } from '@/types';

const MOCK_SCENES: StoryboardScene[] = [
  {
    sceneNumber: 1,
    timestampStart: '0:00',
    timestampEnd: '0:15',
    duration: 15,
    type: 'A-roll',
    scriptSegment: 'Hey everyone, welcome back! Today I\'m going to share something that completely changed how I think about productivity.',
    visualDescription: 'Host speaking directly to camera with energetic expression, bright studio lighting',
    imagePrompt: 'YouTube creator in modern home studio, professional ring light, confident welcoming expression, clean background with subtle plants, 4K quality',
    audioNote: 'Upbeat intro music fading out'
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
    audioNote: 'Subtle tension music building'
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
    recordingInstructions: 'Open Google Calendar, zoom to 150%, navigate to week view, demonstrate creating time block',
    audioNote: 'Calm explanatory tone'
  },
  {
    sceneNumber: 4,
    timestampStart: '2:00',
    timestampEnd: '3:00',
    duration: 60,
    type: 'Graphic',
    scriptSegment: 'I tested this approach for 30 days, and the results were incredible.',
    visualDescription: 'Animated infographic showing before/after productivity metrics, charts trending upward',
    imagePrompt: 'Modern infographic design with before/after comparison, productivity metrics visualization, upward trending charts, clean data visualization style, green and blue color scheme',
    audioNote: 'Upbeat achievement music'
  },
  {
    sceneNumber: 5,
    timestampStart: '3:00',
    timestampEnd: '3:30',
    duration: 30,
    type: 'A-roll',
    scriptSegment: 'If you want to try this yourself, hit that like button and subscribe!',
    visualDescription: 'Host with enthusiastic expression, pointing to subscribe button area',
    imagePrompt: 'YouTube creator pointing enthusiastically, bright smile, gesture toward camera, engaging call-to-action pose, professional lighting',
    audioNote: 'Outro music building'
  }
];

const TYPE_ICONS = {
  'A-roll': Mic,
  'B-roll': Camera,
  'ScreenCap': Monitor,
  'Graphic': ImageIcon
};

const TYPE_COLORS = {
  'A-roll': 'bg-primary text-primary-foreground',
  'B-roll': 'bg-chart-2 text-primary-foreground',
  'ScreenCap': 'bg-chart-3 text-primary-foreground',
  'Graphic': 'bg-accent text-accent-foreground'
};

const isValidType = (type: string): type is keyof typeof TYPE_ICONS => {
  return type in TYPE_ICONS;
};

export function StoryboardEngine() {
  const { currentProject, updateProject, finalizeStoryboard, currentStage } = useProjectStore();
  const { generate } = useAIGeneration();
  
  const [scenes, setScenes] = useState<StoryboardScene[]>(() => {
    if (currentProject?.selectedStoryboard?.scenes?.length) return currentProject.selectedStoryboard.scenes;
    return getAIGateway().isAvailable() ? [] : MOCK_SCENES;
  });
  
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(new Set([1]));
  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [generateImages, setGenerateImages] = useState(false);
  const [generatingScene, setGeneratingScene] = useState<number | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const ai = getAIGateway();
  const db = getDatabaseGateway();

  const toggleScene = (sceneNum: number) => {
    setExpandedScenes(prev => {
      const next = new Set(prev);
      if (next.has(sceneNum)) {
        next.delete(sceneNum);
      } else {
        next.add(sceneNum);
      }
      return next;
    });
  };

  const expandAllScenes = () => {
    setExpandedScenes(new Set(scenes.map(s => s.sceneNumber)));
  };

  const collapseAllScenes = () => {
    setExpandedScenes(new Set());
  };

  const generationStarted = useRef(false);

  // Auto-generate if empty and AI mode and arrived at this stage
  useEffect(() => {
    if (
      currentStage === 'storyboard' && 
      scenes.length === 0 && 
      ai.isAvailable() && 
      currentProject?.selectedScript && 
      !localIsGenerating &&
      !generationStarted.current
    ) {
      generationStarted.current = true;
      handleGenerateStoryboard();
    }
  }, [currentStage, scenes.length, currentProject?.selectedScript, localIsGenerating]);

  const handleGenerateStoryboard = async () => {
    if (localIsGenerating) return;
    setLocalIsGenerating(true);
    
    try {
      const script = currentProject?.selectedScript?.content || '';
      const format = currentProject?.selectedScript?.format || 'facecam';
      
      const prompt = `Create a detailed visual storyboard for this YouTube script. 
CRITICAL: Every scene must have a visual description AND an image generation prompt. Do not leave them empty.

Script segment:
${script.slice(0, 1500)}...

Format: ${format}

Break down into scenes with:
- sceneNumber (integer)
- timestampStart (string, e.g., "0:15")
- timestampEnd (string, e.g., "0:30")
- duration (integer seconds)
- type (A-roll, B-roll, ScreenCap, or Graphic)
- scriptSegment (text being spoken)
- visualDescription (detailed action/visuals - MANDATORY)
- imagePrompt (detailed AI image prompt - MANDATORY)
- recordingInstructions (camera movement/software)
- audioNote (SFX/mood)

Return as valid JSON array. Ensure total duration matches script.`;

      const response = await generate({ prompt, type: 'text', format: 'json' });
      
      if (response.success) {
        try {
          const jsonMatch = response.data.match(/\[[\s\S]*\]/);
          const parsedScenes = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response.data);
          
          if (Array.isArray(parsedScenes) && parsedScenes.length > 0) {
            let lastEndTime = '0:00';
            
            const validatedScenes = parsedScenes.map((s, i) => {
              const duration = typeof s.duration === 'number' ? s.duration : parseInt(s.duration) || 20;
              
              const calcEnd = (start: string, dur: number) => {
                const parts = start.split(':');
                if (parts.length < 2) return '0:00';
                const totalSecs = parseInt(parts[0]) * 60 + parseInt(parts[1]) + dur;
                const m = Math.floor(totalSecs / 60);
                const s_ = totalSecs % 60;
                return `${m}:${s_.toString().padStart(2, '0')}`;
              };

              // Ensure timestamps are valid, filling in missing or default values
              const start = (s.timestampStart && s.timestampStart !== '0:00') ? s.timestampStart : (i === 0 ? '0:00' : lastEndTime);
              const end = (s.timestampEnd && s.timestampEnd !== '0:00' && s.timestampEnd !== start) ? s.timestampEnd : calcEnd(start, duration);
              
              lastEndTime = end;

              return {
                sceneNumber: typeof s.sceneNumber === 'number' ? s.sceneNumber : i + 1,
                timestampStart: start,
                timestampEnd: end,
                duration,
                type: isValidType(s.type) ? s.type : 'A-roll',
                scriptSegment: String(s.scriptSegment || ''),
                visualDescription: String(s.visualDescription || s.scriptSegment || 'Focus on host speaking'),
                imagePrompt: String(s.imagePrompt || s.visualDescription || `A professional YouTube scene about ${currentProject?.selectedTopic?.title}`),
                recordingInstructions: s.recordingInstructions ? String(s.recordingInstructions) : undefined,
                audioNote: s.audioNote ? String(s.audioNote) : undefined
              };
            });
            
            setScenes(validatedScenes);
            setExpandedScenes(new Set([1]));
            updateProject({ 
              selectedStoryboard: { 
                scenes: validatedScenes, 
                format: currentProject?.selectedScript?.format || 'facecam' 
              } 
            });
            toast.success('Storyboard generated successfully');
          }
        } catch (e) {
          console.error('Parse failed', e);
          setScenes(MOCK_SCENES);
        }
      }
    } catch (error) {
      toast.error('Generation failed');
    } finally {
      setLocalIsGenerating(false);
    }
  };

  const generateSceneImage = async (scene: StoryboardScene) => {
    if (!generateImages) return;
    if (generatingScene === scene.sceneNumber) return;
    
    setGeneratingScene(scene.sceneNumber);
    
    try {
      const response = await ai.generate({
        prompt: scene.imagePrompt,
        type: 'image'
      });
      
      if (response.success) {
        const updatedScenes = scenes.map(s => 
          s.sceneNumber === scene.sceneNumber 
            ? { ...s, generatedImageUrl: response.data }
            : s
        );
        setScenes(updatedScenes);
        toast.success(`Scene ${scene.sceneNumber} image generated`);
      }
    } catch (error) {
      toast.error('Failed to generate image');
    } finally {
      setGeneratingScene(null);
    }
  };

  const regenerateSceneImage = async (scene: StoryboardScene) => {
    if (!generateImages) return;
    if (generatingScene === scene.sceneNumber) return;
    
    setGeneratingScene(scene.sceneNumber);
    
    try {
      const response = await ai.generate({
        prompt: scene.imagePrompt,
        type: 'image'
      });
      
      if (response.success) {
        const updatedScenes = scenes.map(s => 
          s.sceneNumber === scene.sceneNumber 
            ? { ...s, generatedImageUrl: response.data }
            : s
        );
        setScenes(updatedScenes);
        toast.success(`Scene ${scene.sceneNumber} image regenerated`);
      }
    } catch (error) {
      toast.error('Failed to regenerate image');
    } finally {
      setGeneratingScene(null);
    }
  };

  const copyPrompt = (scene: StoryboardScene) => {
    navigator.clipboard.writeText(scene.imagePrompt);
    setCopiedPrompt(scene.sceneNumber);
    setTimeout(() => setCopiedPrompt(null), 2000);
    toast.success('Prompt copied to clipboard');
  };

  const pinScene = async (scene: StoryboardScene) => {
    if (!currentProject) {
      toast.error('No active project');
      return;
    }

    const pinItem: Omit<PinnedItem, 'id' | 'pinnedAt'> = {
      userId: 'personal_user',
      itemType: 'storyboard',
      content: [scene],
      sourceProjectId: currentProject.id
    };

    const result = await db.addPinnedItem(pinItem);
    if (result.success) {
      useProjectStore.getState().addPinnedItem(result.data!);
      toast.success('Scene pinned to library');
    }
  };

  const uploadToCloudinary = async (imageData: string, sceneNumber: number): Promise<string | null> => {
    const settings = getAISettings();
    if (!settings.useCloudinary || !settings.cloudinaryCloudName || !settings.cloudinaryApiKey) {
      return null;
    }

    try {
      const isProd = import.meta.env.PROD;
      const apiUrl = import.meta.env.VITE_API_URL || (isProd ? '/api' : 'http://localhost:3001/api');

      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          filename: `scene-${sceneNumber}-${Date.now()}`,
          metadata: { sceneNumber },
          cloudinaryConfig: {
            cloudName: settings.cloudinaryCloudName,
            apiKey: settings.cloudinaryApiKey,
            apiSecret: settings.cloudinaryApiSecret
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && !result.fallbackUsed) {
          return result.data.url;
        }
      }
    } catch (error) {
      console.error(`Failed to upload scene ${sceneNumber} to Cloudinary:`, error);
    }
    return null;
  };

  const handleFinalizeStoryboard = async () => {
    setIsFinalizing(true);
    
    try {
      const settings = getAISettings();
      let finalScenes = [...scenes];

      if (settings.useCloudinary && settings.useImageGen) {
        const scenesWithImages = scenes.filter(s => s.generatedImageUrl?.startsWith('data:'));
        
        if (scenesWithImages.length > 0) {
          toast.info(`Uploading ${scenesWithImages.length} images to Cloudinary...`);
          
          const uploadedScenes = await Promise.all(
            scenes.map(async (scene) => {
              if (scene.generatedImageUrl?.startsWith('data:')) {
                const cloudinaryUrl = await uploadToCloudinary(scene.generatedImageUrl, scene.sceneNumber);
                if (cloudinaryUrl) {
                  return { ...scene, generatedImageUrl: cloudinaryUrl };
                }
              }
              return scene;
            })
          );
          
          finalScenes = uploadedScenes;
          setScenes(finalScenes);
          toast.success('Images uploaded to Cloudinary');
        }
      }

      finalizeStoryboard(finalScenes);
      toast.success('Storyboard finalized');
    } catch (error) {
      console.error('Failed to finalize storyboard:', error);
      toast.error('Failed to finalize storyboard');
    } finally {
      setIsFinalizing(false);
    }
  };

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportScenes = () => {
    if (!currentProject || scenes.length === 0) {
      toast.error('No scenes to export');
      return;
    }

    const exportData = {
      id: currentProject.id,
      selectedStoryboard: {
        scenes: scenes.map(s => ({
          sceneNumber: s.sceneNumber,
          timestampStart: s.timestampStart,
          timestampEnd: s.timestampEnd,
          duration: s.duration,
          type: s.type,
          scriptSegment: s.scriptSegment,
          visualDescription: s.visualDescription
        }))
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenes-${currentProject.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Scenes exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-sans text-foreground">Visual Storyboard</h2>
          <p className="text-muted-foreground mt-1">
            Plan every scene of your video
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={generateImages}
              onCheckedChange={setGenerateImages}
              id="generate-images"
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="generate-images" className="text-sm text-muted-foreground">
              Generate Images
            </Label>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={expandAllScenes}
              variant="outline"
              size="sm"
              className="border-border"
              title="Expand all scenes"
            >
              <ChevronsDown className="h-4 w-4" />
            </Button>
            <Button
              onClick={collapseAllScenes}
              variant="outline"
              size="sm"
              className="border-border"
              title="Collapse all scenes"
            >
              <ChevronsUp className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleGenerateStoryboard}
            disabled={localIsGenerating}
            variant="outline"
            className="border-border"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${localIsGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
          <Button
            onClick={exportScenes}
            disabled={scenes.length === 0}
            variant="outline"
            className="border-border"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {scenes.length} scenes
        </Badge>
        <Badge variant="outline" className="gap-1">
          Total: {formatDuration(totalDuration)}
        </Badge>
        <div className="flex gap-2">
          {Object.entries(TYPE_ICONS).map(([type, Icon]) => {
            const count = scenes.filter(s => s.type === type).length;
            if (count === 0) return null;
            return (
              <Badge key={type} variant="secondary" className="gap-1 text-xs">
                <Icon className="h-3 w-3" />
                {count} {type}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Timeline / Empty State / Loading */}
      {localIsGenerating && scenes.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card border-border rounded-lg shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <Skeleton className="h-5 w-20 rounded-full flex-shrink-0" />
                  <Skeleton className="h-4 w-24 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : scenes.length === 0 ? (
        <Card className="bg-card border-border border-dashed rounded-lg">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clapperboard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold font-sans text-foreground mb-2">
              No storyboard scenes yet
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Finalize a script first, then generate a visual storyboard with scene-by-scene planning.
            </p>
            <div className="flex items-center gap-4 mb-4">
              <Label className="text-sm text-muted-foreground">Enable Image Generation</Label>
              <Switch
                checked={generateImages}
                onCheckedChange={setGenerateImages}
                id="generate-images-empty"
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <Button
              onClick={handleGenerateStoryboard}
              disabled={localIsGenerating || !currentProject?.selectedScript}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Storyboard
            </Button>
            {!currentProject?.selectedScript && (
              <p className="text-sm text-muted-foreground mt-2">
                Finalize a script in the previous step first
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {scenes.map((scene) => {
              const Icon = TYPE_ICONS[scene.type as keyof typeof TYPE_ICONS] || HelpCircle;
              const isExpanded = expandedScenes.has(scene.sceneNumber);
              const isGeneratingImage = generatingScene === scene.sceneNumber;
              
              return (
                <Collapsible
                  key={scene.sceneNumber}
                  open={isExpanded}
                  onOpenChange={() => toggleScene(scene.sceneNumber)}
                >
                  <Card className={`
                    bg-card border-border rounded-lg shadow-sm transition-all duration-200
                    ${isExpanded ? 'ring-1 ring-primary' : 'hover:shadow-md'}
                  `}>
                    {/* Header - Always visible */}
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-4 cursor-pointer">
                        <div className="flex items-center gap-4">
                          {/* Scene Number */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-mono font-medium">{scene.sceneNumber}</span>
                          </div>
                          
                          {/* Type Badge */}
                          <Badge className={`${TYPE_COLORS[scene.type]} gap-1 flex-shrink-0`}>
                            <Icon className="h-3 w-3" />
                            {scene.type}
                          </Badge>
                          
                          {/* Timestamp */}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            {scene.timestampStart} - {scene.timestampEnd}
                          </div>
                          
                          {/* Script Preview */}
                          <p className="flex-1 text-sm text-foreground truncate">
                            {scene.scriptSegment}
                          </p>
                          
                          {/* Expand Icon */}
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>

                    {/* Expanded Content */}
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4 px-4">
                        <div className="border-t border-border pt-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left Column - Details */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                                <Camera className="h-4 w-4 text-muted-foreground" />
                                Visual Description
                              </h4>
                              <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                                {scene.visualDescription}
                              </p>
                            </div>

                            {scene.recordingInstructions && (
                              <div>
                                <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                                  <Monitor className="h-4 w-4 text-muted-foreground" />
                                  Recording Instructions
                                </h4>
                                <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 font-mono">
                                  {scene.recordingInstructions}
                                </p>
                              </div>
                            )}

                            {scene.audioNote && (
                              <div>
                                <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                                  <Music className="h-4 w-4 text-muted-foreground" />
                                  Audio Note
                                </h4>
                                <p className="text-sm text-muted-foreground">{scene.audioNote}</p>
                              </div>
                            )}
                          </div>

                          {/* Right Column - Image Prompt */}
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                  <Wand2 className="h-4 w-4 text-muted-foreground" />
                                  Image Generation Prompt
                                </h4>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyPrompt(scene)}
                                  >
                                    {copiedPrompt === scene.sceneNumber ? (
                                      <CheckCheck className="h-3 w-3 text-primary" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <div className="bg-secondary rounded-md p-3">
                                <p className="text-sm font-mono text-secondary-foreground">
                                  {scene.imagePrompt}
                                </p>
                              </div>
                              {generateImages && (
                                <div className="mt-2">
                                  {!scene.generatedImageUrl ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => generateSceneImage(scene)}
                                      disabled={isGeneratingImage}
                                    >
                                      {isGeneratingImage ? (
                                        <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                      ) : (
                                        <Wand2 className="mr-2 h-3 w-3" />
                                      )}
                                      {isGeneratingImage ? 'Generating...' : 'Generate Preview'}
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => regenerateSceneImage(scene)}
                                      disabled={isGeneratingImage}
                                    >
                                      {isGeneratingImage ? (
                                        <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                      ) : (
                                        <RefreshCw className="mr-2 h-3 w-3" />
                                      )}
                                      {isGeneratingImage ? 'Generating...' : 'Regenerate'}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Generated Image Preview */}
                            {scene.generatedImageUrl && (
                              <div className="border rounded-md overflow-hidden">
                                <ImageViewer
                                  src={scene.generatedImageUrl} 
                                  alt={`Scene ${scene.sceneNumber} preview`}
                                />
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => pinScene(scene)}
                                className="flex-1"
                              >
                                <Bookmark className="mr-2 h-3 w-3" />
                                Pin Scene
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>

          {/* Finalize Button */}
          <Button
            onClick={handleFinalizeStoryboard}
            disabled={localIsGenerating || isFinalizing}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6"
          >
            {isFinalizing ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Uploading Images...
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                Finalize Storyboard
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
