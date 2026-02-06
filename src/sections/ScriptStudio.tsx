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
import type { ScriptVariant, ScriptFormat, PinnedItem } from '@/types';

const MOCK_SCRIPTS: Record<ScriptFormat, ScriptVariant[]> = {
  facecam: [
    {
      id: 'script-1',
      content: `[HOOK - 0:00-0:15]
Hey everyone, welcome back! Today I'm going to share something that completely changed how I think about productivity. If you've been struggling to stay focused, this video is for you.

[PROBLEM - 0:15-0:45]
Here's the thing: most people approach productivity completely wrong. They try to multitask, and then wonder why they're not seeing results. I was there too, trust me.

[SOLUTION - 0:45-2:00]
But then I discovered time blocking. The key insight is single-tasking beats multitasking every time. Let me break this down into three simple steps:

Step 1: Identify your most important task
Step 2: Block 90 minutes of uninterrupted time
Step 3: Eliminate all distractions

[PROOF - 2:00-3:00]
I tested this approach for 30 days, and the results were incredible. My output doubled while working fewer hours. And I'm not the only one - thousands of creators have reported similar results.

[CTA - 3:00-3:30]
If you want to try this yourself, I've put together a free guide in the description. And if you found this helpful, hit that like button and subscribe for more content like this. See you in the next one!`,
      format: 'facecam',
      wordCount: 198,
      estimatedDuration: '3:30'
    },
    {
      id: 'script-2',
      content: `[CAMERA ON - ENERGETIC]
What if I told you that everything you know about productivity is backwards?

[LEAN IN - CONSPIRATORIAL]
For years, I bought into the hustle culture. More hours = more output, right? Wrong.

[PULL BACK - SERIOUS]
The research is clear: working longer hours actually decreases your effectiveness. After 50 hours a week, your productivity crashes.

[STAND UP - PASSIONATE]
So what's the alternative? Deep work. Focused, uninterrupted blocks of time where you do your most important work.

[SIT DOWN - PRACTICAL]
Here's exactly how I structure my deep work sessions:

First, I pick ONE task. Not two, not three. One.

Second, I set a timer for 90 minutes. This is based on research on our natural attention cycles.

Third, I eliminate every possible distraction. Phone in another room. Notifications off. Door closed.

[LOOK AT CAMERA - EMPHATIC]
The results speak for themselves. In 90 minutes of deep work, I accomplish what used to take me an entire day.

[SMILE - WARM]
Try it for one week. Just one week. I guarantee you'll be amazed at what you can accomplish.

[WAVE]
Thanks for watching, and I'll see you in the next one!`,
      format: 'facecam',
      wordCount: 234,
      estimatedDuration: '4:15'
    },
    {
      id: 'script-3',
      content: `[OPEN - DIRECT TO CAMERA]
Let me share a secret with you.

[PAUSE - BUILD SUSPENSE]
The most productive people in the world don't work more hours than you. They work differently.

[WALK LEFT - STORYTELLING MODE]
I learned this the hard way. Two years ago, I was working 12-hour days, seven days a week. I was exhausted, burned out, and honestly, not getting much done.

[WALK BACK TO CENTER - REVELATION]
Then I discovered the power of time blocking. And everything changed.

[HOLD UP FINGERS - COUNTING]
Here are three things I learned:

One: Willpower is a finite resource. You can't just "try harder" to focus.

Two: Your environment shapes your behavior more than your intentions.

Three: Single-tasking will always beat multitasking.

[LEAN IN - INTIMATE]
So here's what I want you to do. Tomorrow morning, instead of checking your phone first thing, try this:

[SIT DOWN - DEMONSTRATION]
Pick your most important task. Set a timer for 60 minutes. And work on nothing else.

[BACK TO CAMERA - CHALLENGE]
That's it. One hour. Can you do it?

[WARM SMILE - ENCOURAGING]
I believe in you. Now go make it happen.`,
      format: 'facecam',
      wordCount: 212,
      estimatedDuration: '3:45'
    }
  ],
  faceless: [
    {
      id: 'script-1',
      content: `[0:00-0:10] TITLE CARD: "The Productivity Method"
TEXT OVERLAY: "What if everything you knew about productivity was wrong?"
ANIMATION: Text slides in with bounce effect

[0:10-0:30] B-ROLL: Fast-paced montage of busy offices, stressed workers, multiple screens
NARRATOR (V.O.): Every day, millions of people struggle to stay productive. But what if I told you there's a better way?

[0:30-1:00] SCREEN CAPTURE: Calendar app, timer apps, focus mode interfaces
NARRATOR (V.O.): It all starts with understanding deep work. Most people get this wrong because they think willpower is enough.

[1:00-2:00] GRAPHICS: Animated infographic showing productivity curves
NARRATOR (V.O.): Here's the data that changed everything. Studies show focused work produces 40% better results. This means your environment matters more than your motivation.

[2:00-2:45] B-ROLL: Clean workspace, person working focused, phone in drawer
NARRATOR (V.O.): So how do you actually implement this? Follow these three steps:

TEXT OVERLAY (animated):
1. Identify your most important task
2. Block 90 minutes of uninterrupted time
3. Eliminate all distractions

[2:45-3:15] SCREEN CAPTURE: Step-by-step walkthrough of time blocking
NARRATOR (V.O.): I documented my own journey trying this for 30 days. The result? My output doubled while working fewer hours.

[3:15-3:30] END CARD with CTA
TEXT: "Subscribe for more productivity tips" / "Free guide in description"
ANIMATION: Subscribe button pulses`,
      format: 'faceless',
      wordCount: 245,
      estimatedDuration: '3:30'
    },
    {
      id: 'script-2',
      content: `[0:00-0:15] HOOK SEQUENCE
VISUAL: Split screen - left side shows chaotic desk, notifications popping up; right side shows clean workspace
TEXT: "Before vs After"
NARRATOR (V.O.): This simple change doubled my productivity in just 30 days.

[0:15-0:45] PROBLEM SETUP
B-ROLL: Stock footage of distracted workers, phone addiction
GRAPHIC: "Average person checks phone 96 times per day"
NARRATOR (V.O.): We live in a world designed to distract us. And it's killing our ability to focus.

[0:45-1:30] THE SCIENCE
ANIMATED GRAPHIC: Brain scan showing focused vs distracted states
TEXT OVERLAYS:
- "Multitasking reduces IQ by 10 points"
- "It takes 23 minutes to refocus after interruption"
NARRATOR (V.O.): The research is shocking. Every time you switch tasks, your brain pays a price.

[1:30-2:30] THE SOLUTION
SCREEN CAP: Setting up time blocks in calendar app
B-ROLL: Creating focused workspace
TEXT STEPS (appearing one by one):
STEP 1: Choose your ONE most important task
STEP 2: Block 90 minutes on your calendar
STEP 3: Remove ALL distractions

NARRATOR (V.O.): Time blocking isn't complicated. But it is transformative.

[2:30-3:00] PROOF
GRAPHIC: Before/after productivity metrics
B-ROLL: Person finishing work early, enjoying free time
NARRATOR (V.O.): In my experiment, I got more done in 6 focused hours than I used to in 10 distracted ones.

[3:00-3:15] CTA
END CARD: "Try it for 7 days" with subscribe button
NARRATOR (V.O.): Give it one week. Your future self will thank you.`,
      format: 'faceless',
      wordCount: 267,
      estimatedDuration: '3:15'
    },
    {
      id: 'script-3',
      content: `[0:00-0:10] MYSTERY OPENING
VISUAL: Black screen, text appears letter by letter
TEXT: "The 90-Minute Secret"
SOUND EFFECT: Typewriter clicks

[0:10-0:30] THE PROMISE
VISUAL: Fast cuts of successful creators, entrepreneurs
TEXT OVERLAY: "What do they know that you don't?"
NARRATOR (V.O.): The world's most productive people all share one habit. And it's not what you think.

[0:30-1:15] THE MYTH
ANIMATION: "HUSTLE CULTURE" text with red X through it
GRAPHIC: Chart showing productivity declining after 50 hours/week
B-ROLL: Exhausted workers, coffee cups piled up
NARRATOR (V.O.): We've been lied to. Working longer hours doesn't mean getting more done. In fact, after a certain point, each additional hour makes you LESS productive.

[1:15-2:15] THE METHOD
VISUAL: Animated clock breaking into 90-minute segments
SCREEN CAP: Demonstrating the technique
TEXT OVERLAYS with icons:
🎯 Pick ONE task
⏱️ Set 90-minute timer
🚫 Eliminate distractions
🧠 Work with full focus

NARRATOR (V.O.): The method is simple. Work in focused 90-minute blocks. Then take a real break. Repeat.

[2:15-2:45] THE RESULTS
GRAPHIC ANIMATION: Productivity curve climbing upward
TESTIMONIAL TEXTS (scrolling):
"Game changer!" - Sarah K.
"Finally, a system that works" - Mike T.
"My output tripled" - Jennifer L.

NARRATOR (V.O.): Thousands of people have transformed their work with this approach. Now it's your turn.

[2:45-3:00] CALL TO ACTION
VISUAL: Clean end card with clear next steps
TEXT: "Subscribe + Comment 'DEEP WORK' for free guide"
NARRATOR (V.O.): Subscribe and comment "DEEP WORK" below, and I'll send you my complete guide for free.`,
      format: 'faceless',
      wordCount: 289,
      estimatedDuration: '3:00'
    }
  ]
};

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
      const prompt = `Write 3 YouTube video scripts about "${topic}" for a ${format} video format.
 
${format === 'facecam' ? 
  'Include host directions, emotional cues, and camera angles in [brackets].' : 
  'Include B-roll markers, stock footage suggestions, text overlays, and screen capture instructions.'}
 
Each script should be:
- 3-4 minutes when read aloud
- Engaging hook in first 15 seconds
- Clear problem/solution structure
- Strong call-to-action at the end
 
Return as valid JSON array with fields: id, content, wordCount, estimatedDuration.`;

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

      {/* Script Tabs */}
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
