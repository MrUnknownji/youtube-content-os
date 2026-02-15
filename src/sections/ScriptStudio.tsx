// Module 3: Script Studio - Facecam/Faceless Script Generation
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bookmark, 
  Check, 
  RefreshCw, 
  Sparkles, 
  Video,
  User,
  Clock,
  FileText,
  Edit3,
  Play
} from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '@/state/projectStore';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { getAIGateway } from '@/services/ai-provider';
import { getDatabaseGateway } from '@/services/db-adapter';
import { Skeleton } from '@/components/ui/skeleton';
import type { ScriptVariant, ScriptFormat, PinnedItem } from '@/types';
import { MOCK_SCRIPTS } from '@/data/mock-scripts';

export function ScriptStudio() {
  const { currentProject, currentStage, updateProject, finalizeScript, addPinnedItem } = useProjectStore();
  const { generate } = useAIGeneration();

  const [format, setFormat] = useState<ScriptFormat>('faceless');
  const [scripts, setScripts] = useState<ScriptVariant[]>(() => {
    if (currentProject && currentProject.scriptVariants && currentProject.scriptVariants.length > 0) {
      return currentProject.scriptVariants;
    }
    return getAIGateway().isAvailable() ? [] : MOCK_SCRIPTS.faceless;
  });
  const [activeScript, setActiveScript] = useState<string>(() => {
    if (currentProject?.selectedScript) return currentProject.selectedScript.id;
    return 'script-1';
  });
  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const ai = getAIGateway();
  const db = getDatabaseGateway();

  useEffect(() => {
    if (scripts.length > 0 && scripts[0].format !== format && !localIsGenerating) {
       // Only switch to mock if actually empty and not in AI mode
       // Otherwise keep what we have
    }
  }, [format]);

  const generationStarted = useRef(false);

  // Auto-generate if empty and arrived at this stage
  useEffect(() => {
    if (
      currentStage === 'script' && 
      scripts.length === 0 && 
      ai.isAvailable() && 
      currentProject?.selectedTopic && 
      !localIsGenerating &&
      !generationStarted.current
    ) {
      generationStarted.current = true;
      handleGenerateScripts();
    }
  }, [currentStage, scripts.length, currentProject?.selectedTopic, localIsGenerating]);

  const handleGenerateScripts = async () => {
    if (localIsGenerating) return;
    setLocalIsGenerating(true);
    
    try {
      const topic = currentProject?.selectedTopic?.title || 'productivity and focus';
      const prompt = `You are an expert YouTube scriptwriter specializing in viral, engaging content. Write exactly 3 complete YouTube video scripts about: "${topic}"

Format: ${format} video

CRITICAL LANGUAGE REQUIREMENT:
- Write the entire script in HINGLISH (Hindi + English mix, written in English/Roman script)
- Example: "Aaj main aapko bataunga ek amazing trick jo will change your life"
- Use conversational Indian YouTube creator tone
- Mix Hindi and English naturally like Indian creators do

ENGAGEMENT PSYCHOLOGY PRINCIPLES TO APPLY:
1. HOOK (0-3 seconds): Start with pattern interrupt - shocking statement, bold claim, or curiosity gap
2. PROBLEM AGITATION: Make viewer feel the pain point intensely
3. SOLUTION TEASER: Hint at the solution but don't reveal fully yet
4. VALUE DELIVERY: Provide actionable, specific steps they can implement
5. PROOF/SOCIAL VALIDATION: Use numbers, results, or relatable examples
6. CALL-TO-ACTION: Clear, specific action with benefit statement

${format === 'facecam' ? 
  `FACECAM FORMAT:
- Include host directions in [brackets] like [CAMERA ON - ENERGETIC] or [LEAN IN - CONSPIRATORIAL]
- Add emotional cues and camera angles
- Write dialogue meant to be spoken directly to camera
- Include gesture instructions like [POINTS TO SCREEN] or [HOLDS UP PROP]` : 
  `FACELESS FORMAT:
- Include [TIMESTAMP] markers like [0:00-0:15]
- Add B-roll descriptions, stock footage suggestions
- Include TEXT OVERLAY instructions for key points
- Add NARRATOR (V.O.) markers for voiceover
- Specify transitions: [CUT TO], [ZOOM], [FADE]`}

SCRIPT STRUCTURE (3-4 minutes):
- INTRO HOOK (0-15s): Must stop the scroll. Use one of these patterns:
  * Shocking statistic: "95% log ye galti karte hain..."
  * Bold promise: "Aaj ke baad aapki life change ho jayegi..."
  * Curiosity gap: "Maine jo discover kiya, woh shocking hai..."
  * Contrarian take: "Jo aap sunte ho, woh galat hai..."
- PROBLEM SETTING (15-45s): Relatable story, pain points
- SOLUTION BUILD-UP (45s-2min): Step by step with examples
- PROOF/RESULTS (2min-3min): Show it works
- POWERFUL CTA (3min-3:30s): Subscribe with reason to return

IMPORTANT: 
- DO NOT include meta-commentary about YouTube growth tips
- Write the ACTUAL SCRIPT content only
- Each script should feel different in approach/tone

Return as valid JSON array with exactly these fields:
- id: "script-1", "script-2", "script-3"
- content: the full script text in Hinglish
- wordCount: approximate word count (number)
- estimatedDuration: time like "3:30"`;

      const response = await generate({ prompt, type: 'text', format: 'json' });
      
      if (response.success) {
        try {
          const jsonMatch = response.data.match(/\[[\s\S]*\]/);
          const parsedScripts = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response.data);
          
          if (Array.isArray(parsedScripts) && parsedScripts.length > 0) {
            const validatedScripts = parsedScripts.map((s, i) => ({ 
              id: String(s.id || `script-${i + 1}`),
              content: String(s.content || ''),
              format,
              wordCount: typeof s.wordCount === 'number' ? s.wordCount : parseInt(s.wordCount) || 0,
              estimatedDuration: String(s.estimatedDuration || '3:00')
            }));
            setScripts(validatedScripts);
            setActiveScript(validatedScripts[0].id);
            updateProject({ scriptVariants: validatedScripts });
            toast.success('Scripts generated successfully');
          }
        } catch (e) {
          setScripts(MOCK_SCRIPTS[format]);
        }
      }
    } catch (error) {
      toast.error('Generation failed');
    } finally {
      setLocalIsGenerating(false);
    }
  };

  const pinScript = async (script: ScriptVariant) => {
    if (!currentProject) return;

    const pinItem: Omit<PinnedItem, 'id' | 'pinnedAt'> = {
      userId: 'personal_user',
      itemType: 'script',
      content: script,
      sourceProjectId: currentProject.id
    };

    const result = await db.addPinnedItem(pinItem);
    if (result.success) {
      addPinnedItem(result.data!);
      toast.success('Script pinned');
    }
  };

  const handleFinalizeScript = (script: ScriptVariant) => {
    finalizeScript(script);
    toast.success('Script finalized');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-sans text-foreground">Script Studio</h2>
          <p className="text-muted-foreground mt-1">
            Generate and edit scripts for your video
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Facecam</span>
            <Switch
              checked={format === 'faceless'}
              onCheckedChange={(checked) => setFormat(checked ? 'faceless' : 'facecam')}
              className="data-[state=checked]:bg-primary"
            />
            <span className="text-sm text-muted-foreground">Faceless</span>
          </div>
        </div>
      </div>

      {/* Topic Reference */}
      {currentProject?.selectedTopic && (
        <Card className="bg-accent/50 border-accent">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Selected Topic:</span>
              <span className="font-medium text-foreground">{currentProject.selectedTopic.title}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Format Toggle & Generate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={format === 'facecam' ? 'default' : 'secondary'} className="gap-1">
            <User className="h-3 w-3" />
            Facecam
          </Badge>
          <Badge variant={format === 'faceless' ? 'default' : 'secondary'} className="gap-1">
            <Video className="h-3 w-3" />
            Faceless
          </Badge>
        </div>
        <Button
          onClick={handleGenerateScripts}
          disabled={localIsGenerating}
          variant="outline"
          className="border-border"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${localIsGenerating ? 'animate-spin' : ''}`} />
          Generate New Scripts
        </Button>
      </div>

      {/* Script Tabs / Empty State / Loading */}
      {localIsGenerating && scripts.length === 0 ? (
        <div className="space-y-4">
          <TabsList className="bg-muted w-full">
            <TabsTrigger value="loading-1" className="data-[state=active]:bg-background flex-1">Variant A</TabsTrigger>
            <TabsTrigger value="loading-2" className="data-[state=active]:bg-background flex-1">Variant B</TabsTrigger>
            <TabsTrigger value="loading-3" className="data-[state=active]:bg-background flex-1">Variant C</TabsTrigger>
          </TabsList>
          <Card className="bg-card border-border rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-md p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : scripts.length === 0 ? (
        <Card className="bg-card border-border border-dashed rounded-lg">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold font-sans text-foreground mb-2">
              No scripts generated yet
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Select a topic first, then generate scripts for your video. Choose between Facecam or Faceless format.
            </p>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm text-muted-foreground">Facecam</span>
              <Switch
                checked={format === 'faceless'}
                onCheckedChange={(checked) => setFormat(checked ? 'faceless' : 'facecam')}
                className="data-[state=checked]:bg-primary"
              />
              <span className="text-sm text-muted-foreground">Faceless</span>
            </div>
            <Button
              onClick={handleGenerateScripts}
              disabled={localIsGenerating || !currentProject?.selectedTopic}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Scripts
            </Button>
            {!currentProject?.selectedTopic && (
              <p className="text-sm text-muted-foreground mt-2">
                Select a topic in the previous step first
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeScript} onValueChange={setActiveScript}>
          <TabsList className="bg-muted">
            {scripts.map((script, i) => (
              <TabsTrigger 
                key={script.id} 
                value={script.id}
                className="data-[state=active]:bg-background"
              >
                Variant {String.fromCharCode(65 + i)}
              </TabsTrigger>
            ))}
          </TabsList>

          {scripts.map((script) => (
            <TabsContent key={script.id} value={script.id} className="mt-4">
              <Card className="bg-card border-border rounded-lg shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="gap-1">
                        <FileText className="h-3 w-3" />
                        {script.wordCount} words
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {script.estimatedDuration}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Play className="h-3 w-3" />
                        {script.format}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => pinScript(script)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Bookmark className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditedContent(script.content);
                          setIsEditing(true);
                        }}
                        className="text-muted-foreground"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing && activeScript === script.id ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[400px] font-mono text-sm bg-input border-input"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const updated = scripts.map(s => 
                              s.id === script.id ? { ...s, content: editedContent } : s
                            );
                            setScripts(updated);
                            setIsEditing(false);
                            toast.success('Script updated');
                          }}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="border-border"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-md p-4 max-h-[500px] overflow-auto">
                        <pre className="font-mono text-sm whitespace-pre-wrap text-foreground">
                          {script.content}
                        </pre>
                      </div>
                      <Button
                        onClick={() => handleFinalizeScript(script)}
                        disabled={localIsGenerating}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Finalize This Script
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Format Tips */}
      <Card className="bg-secondary/50 border-secondary">
        <CardContent className="pt-4">
          <h4 className="text-sm font-sans font-medium flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4" />
            {format === 'facecam' ? 'Facecam Tips' : 'Faceless Tips'}
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {format === 'facecam' ? (
              <>
                <li>• Use [brackets] for camera directions and emotional cues</li>
                <li>• Maintain eye contact with the lens for connection</li>
                <li>• Vary your energy levels throughout the script</li>
                <li>• Practice transitions between segments</li>
              </>
            ) : (
              <>
                <li>• Plan B-roll footage for every major point</li>
                <li>• Use text overlays to reinforce key messages</li>
                <li>• Include screen captures for tutorials</li>
                <li>• Stock footage should match the narration timing</li>
              </>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
