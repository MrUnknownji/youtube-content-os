// Module 5: Metadata Suite - Titles, Descriptions, Thumbnails
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { 
  Bookmark, 
  Check, 
  RefreshCw, 
  Sparkles, 
  Type,
  FileText,
  Image as ImageIcon,
  Copy,
  CheckCheck,
  Download,
  Wand2,
  Tag,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '@/state/projectStore';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { getAIGateway } from '@/services/ai-provider';
import { getDatabaseGateway } from '@/services/db-adapter';
import type { VideoMetadata, PinnedItem } from '@/types';

const MOCK_TITLES = [
  "I Tried This for 30 Days. The Results Shocked Me.",
  "The Productivity Method That Actually Works (Science-Backed)",
  "Why You're Still Procrastinating (And the Real Fix)",
  "This Changed How I Work Forever",
  "Stop Doing This If You Want to Be Productive",
  "The 90-Minute Secret Top Creators Use",
  "I Was Wrong About Productivity (Here's What Works)",
  "The Counterintuitive Way to 10x Your Output",
  "Why Hard Work Isn't Enough (Do This Instead)",
  "The Focus Technique That Changed Everything"
];

const MOCK_THUMBNAIL_CONCEPTS = [
  {
    id: 'thumb-1',
    title: 'Before/After Split',
    description: 'Split-screen showing stressed vs. focused versions of the same person',
    layout: 'Left: Chaos (notifications, clutter) | Right: Focus (clean desk, calm)',
    textOverlay: '30 DAY RESULTS',
    colorScheme: 'High contrast with green accent for "after" side'
  },
  {
    id: 'thumb-2',
    title: 'The Big Number',
    description: 'Large "10x" text with person looking shocked/amazed',
    layout: 'Center: Giant "10x" | Bottom: Person with surprised expression',
    textOverlay: '10x OUTPUT',
    colorScheme: 'Bold red/yellow gradient background'
  },
  {
    id: 'thumb-3',
    title: 'The Mistake Reveal',
    description: 'Person holding sign or pointing at common mistake',
    layout: 'Person center frame, pointing down or holding sign',
    textOverlay: 'STOP DOING THIS',
    colorScheme: 'Warning orange with bold white text'
  },
  {
    id: 'thumb-4',
    title: 'The Transformation',
    description: 'Calendar or clock visual showing 30-day progression',
    layout: 'Calendar graphic with highlighted dates, upward arrow',
    textOverlay: '30 DAYS → RESULTS',
    colorScheme: 'Clean blue/white professional look'
  },
  {
    id: 'thumb-5',
    title: 'The Secret Reveal',
    description: 'Person whispering or holding hand to mouth conspiratorially',
    layout: 'Close-up of face, intimate framing',
    textOverlay: 'THE SECRET',
    colorScheme: 'Dark background with spotlight effect'
  }
];

export function MetadataSuite() {
  const { currentProject, currentStage, updateProject, finalizeMetadata, addPinnedItem } = useProjectStore();
  const { generate } = useAIGeneration();

  const [activeTab, setActiveTab] = useState('titles');
  
  const [titles, setTitles] = useState<string[]>(() => {
    if (currentProject?.titleSuggestions?.length) return currentProject.titleSuggestions;
    return getAIGateway().isAvailable() ? [] : MOCK_TITLES;
  });
  
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  
  const [description, setDescription] = useState(() => {
    return currentProject?.selectedMetadata?.description || '';
  });
  
  const [tags, setTags] = useState<string[]>([]);
  
  const [thumbnailConcepts, setThumbnailConcepts] = useState(() => {
    if (currentProject?.thumbnailConcepts?.length) return currentProject.thumbnailConcepts;
    return getAIGateway().isAvailable() ? [] : MOCK_THUMBNAIL_CONCEPTS;
  });
  
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>('');
  const [generateThumbnail, setGenerateThumbnail] = useState(false);
  const [generatedThumbnailUrl, setGeneratedThumbnailUrl] = useState<string>('');
  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);

  const ai = getAIGateway();
  const db = getDatabaseGateway();

  const titleGenerationStarted = useRef(false);
  const descGenerationStarted = useRef(false);
  const conceptGenerationStarted = useRef(false);

  // Auto-generate if empty and arrived at this stage
  useEffect(() => {
    if (currentStage === 'metadata' && !localIsGenerating) {
      if (titles.length === 0 && ai.isAvailable() && currentProject && !titleGenerationStarted.current) {
        titleGenerationStarted.current = true;
        handleGenerateTitles();
      }
      if (!description && ai.isAvailable() && currentProject && !descGenerationStarted.current) {
        descGenerationStarted.current = true;
        handleGenerateDescription();
      }
    }
  }, [currentStage, titles.length, description, currentProject, localIsGenerating]);

  // Auto-generate thumbnails when switching to tab
  useEffect(() => {
    if (
      currentStage === 'metadata' && 
      activeTab === 'thumbnail' && 
      thumbnailConcepts.length === 0 && 
      ai.isAvailable() && 
      currentProject && 
      !localIsGenerating &&
      !conceptGenerationStarted.current
    ) {
      conceptGenerationStarted.current = true;
      handleGenerateThumbnailConcepts();
    }
  }, [currentStage, activeTab, thumbnailConcepts.length, currentProject, localIsGenerating]);

  const handleGenerateTitles = async () => {
    if (localIsGenerating) return;
    setLocalIsGenerating(true);
    try {
      const topic = currentProject?.selectedTopic?.title || 'productivity video';
      const prompt = `Generate 10 engaging YouTube video titles for video about: "${topic}"
Return as valid JSON array of strings.`;

      const response = await generate({ prompt, type: 'text', format: 'json' });
      
      if (response.success) {
        try {
          const jsonMatch = response.data.match(/\[[\s\S]*\]/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response.data);
            const validatedTitles = parsed
              .filter((t: any) => t !== null && t !== undefined)
              .map((t: any) => String(t));
            setTitles(validatedTitles);
            updateProject({ titleSuggestions: validatedTitles });
            toast.success('Titles generated');
        } catch (e) {
          setTitles(MOCK_TITLES);
        }
      }
    } catch (error) {
      setTitles(MOCK_TITLES);
    } finally {
      setLocalIsGenerating(false);
    }
  };

  const handleGenerateDescription = async () => {
    try {
      const topic = currentProject?.selectedTopic?.title || 'productivity';
      const script = currentProject?.selectedScript?.content?.slice(0, 500) || '';
      const scenes = currentProject?.selectedStoryboard?.scenes || [];
      
      const timestamps = scenes.map(s => `${s.timestampStart} - ${s.scriptSegment.slice(0, 50)}...`).join('\n');
      
      const prompt = `Write an SEO YouTube description for: "${topic}"
Script: ${script}
Timestamps:
${timestamps}
Include emojis and 5 hashtags.`;

      const response = await generate({ prompt, type: 'text' });
      if (response.success) {
        setDescription(response.data);
        const tagMatch = response.data.match(/#[\w]+/g);
        if (tagMatch) {
          setTags(tagMatch.map(t => t.slice(1)));
        }
        toast.success('Description generated');
      }
    } catch (error) {
       toast.error('Failed to generate description');
    }
  };

  const handleGenerateThumbnailConcepts = async () => {
    if (localIsGenerating) return;
    setLocalIsGenerating(true);
    try {
      const topic = currentProject?.selectedTopic?.title || 'productivity video';
      const prompt = `Generate 5 YouTube thumbnail concepts for: "${topic}"
Return as valid JSON array with fields: id, title, description, layout, textOverlay, colorScheme`;

      const response = await generate({ prompt, type: 'text', format: 'json' });
      
      if (response.success) {
        try {
          const jsonMatch = response.data.match(/\[[\s\S]*\]/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response.data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const validatedConcepts = parsed.map((c, i) => ({
              id: String(c.id || `thumb-${i + 1}`),
              title: String(c.title || 'Untitled'),
              description: String(c.description || ''),
              layout: String(c.layout || ''),
              textOverlay: String(c.textOverlay || ''),
              colorScheme: String(c.colorScheme || '')
            }));
            setThumbnailConcepts(validatedConcepts);
            updateProject({ thumbnailConcepts: validatedConcepts });
            toast.success('Thumbnails generated');
          }
        } catch {
          setThumbnailConcepts(MOCK_THUMBNAIL_CONCEPTS);
        }
      }
    } catch (error) {
      setThumbnailConcepts(MOCK_THUMBNAIL_CONCEPTS);
    } finally {
      setLocalIsGenerating(false);
    }
  };

  const generateThumbnailImage = async (concept: typeof MOCK_THUMBNAIL_CONCEPTS[0]) => {
    try {
      const prompt = `Create a YouTube thumbnail: ${concept.description}. 
Layout: ${concept.layout}. 
Text: ${concept.textOverlay}.
Style: ${concept.colorScheme}. 
High quality, eye-catching, professional.`;

      const response = await ai.generate({ prompt, type: 'image' });
      if (response.success) {
        setGeneratedThumbnailUrl(response.data);
        toast.success('Thumbnail preview generated');
      }
    } catch (error) {
      toast.error('Failed to generate thumbnail');
    }
  };

  const copyTitle = (title: string) => {
    navigator.clipboard.writeText(title);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
    toast.success('Title copied');
  };

  const pinTitle = async (title: string) => {
    if (!currentProject) return;
    const pinItem: Omit<PinnedItem, 'id' | 'pinnedAt'> = {
      userId: 'personal_user',
      itemType: 'title',
      content: title,
      sourceProjectId: currentProject.id
    };
    const result = await db.addPinnedItem(pinItem);
    if (result.success) {
      addPinnedItem(result.data!);
      toast.success('Title pinned');
    }
  };

  const handleFinalizeMetadata = () => {
    const metadata: VideoMetadata = {
      title: selectedTitle || customTitle,
      description,
      tags,
      thumbnailPrompt: thumbnailConcepts.find(c => c.id === selectedThumbnail)?.description || '',
      thumbnailConcept: thumbnailConcepts.find(c => c.id === selectedThumbnail)?.title,
      thumbnailLayout: thumbnailConcepts.find(c => c.id === selectedThumbnail)?.layout
    };
    
    finalizeMetadata(metadata);
    toast.success('Metadata finalized!');
    setActiveTab('done');
  };

  const exportDocument = () => {
    if (!currentProject) return;

    const finalTitle = currentProject.selectedMetadata?.title || selectedTitle || customTitle || 'Untitled Project';
    const finalDescription = currentProject.selectedMetadata?.description || description;
    const finalTags = currentProject.selectedMetadata?.tags || tags;

    // Construct the markdown/text content
    let content = `# ${finalTitle}\n\n`;
    content += `## Description\n${finalDescription}\n\n`;

    if (finalTags.length > 0) {
      content += `## Tags\n${finalTags.map(t => `#${t}`).join(' ')}\n\n`;
    }

    const thumbConcept = currentProject.selectedMetadata?.thumbnailConcept
      ? {
          title: currentProject.selectedMetadata.thumbnailConcept,
          description: currentProject.selectedMetadata.thumbnailPrompt,
          layout: currentProject.selectedMetadata.thumbnailLayout,
          textOverlay: '',
          colorScheme: ''
        }
      : thumbnailConcepts.find(c => c.id === selectedThumbnail);

    if (thumbConcept) {
      content += `## Thumbnail Concept\n`;
      content += `**Title:** ${thumbConcept.title}\n`;
      content += `**Description:** ${thumbConcept.description}\n`;
      if (thumbConcept.layout) content += `**Layout:** ${thumbConcept.layout}\n`;
      if (thumbConcept.textOverlay) content += `**Text Overlay:** ${thumbConcept.textOverlay}\n`;
      if (thumbConcept.colorScheme) content += `**Color Scheme:** ${thumbConcept.colorScheme}\n\n`;
    }

    if (currentProject.selectedTopic) {
        content += `## Topic\n${currentProject.selectedTopic.title}\n\n`;
    }

    if (currentProject.selectedScript) {
        content += `## Script\n${currentProject.selectedScript.content}\n\n`;
    }

    // Create download
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(finalTitle || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Document exported');
  };

  const exportProject = () => {
    if (!currentProject) return;
    const projectData = JSON.stringify({
      project: currentProject,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }, null, 2);
    const blob = new Blob([projectData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-content-brief-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Project exported');
  };

  const canFinalize = (selectedTitle || customTitle) && description;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-sans text-foreground">Metadata Suite</h2>
          <p className="text-muted-foreground mt-1">
            Create titles, descriptions, and thumbnail concepts
          </p>
        </div>
        <Button
          onClick={exportProject}
          variant="outline"
          className="border-border"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Brief
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted">
          <TabsTrigger value="titles" className="data-[state=active]:bg-background gap-1">
            <Type className="h-4 w-4" />
            Titles
          </TabsTrigger>
          <TabsTrigger value="description" className="data-[state=active]:bg-background gap-1">
            <FileText className="h-4 w-4" />
            Description
          </TabsTrigger>
          <TabsTrigger value="thumbnail" className="data-[state=active]:bg-background gap-1">
            <ImageIcon className="h-4 w-4" />
            Thumbnail
          </TabsTrigger>
          <TabsTrigger value="done" disabled={currentStage !== 'complete'} className="data-[state=active]:bg-background gap-1">
            <FileCheck className="h-4 w-4" />
            Done
          </TabsTrigger>
        </TabsList>

        {/* Titles Tab */}
        <TabsContent value="titles" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium font-sans text-foreground">Choose a Title</h3>
            <Button
              onClick={handleGenerateTitles}
              disabled={localIsGenerating}
              variant="outline"
              size="sm"
              className="border-border"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${localIsGenerating ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <RadioGroup value={selectedTitle} onValueChange={setSelectedTitle} className="space-y-3">
            {titles.map((title, i) => (
              <div
                key={i}
                className={`
                  flex items-center justify-between p-4 rounded-lg border transition-all
                  ${selectedTitle === title 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border bg-card hover:border-primary/50'}
                `}
              >
                <div className="flex items-center gap-3 flex-1">
                  <RadioGroupItem value={title} id={`title-${i}`} />
                  <Label 
                    htmlFor={`title-${i}`} 
                    className="flex-1 cursor-pointer font-sans text-foreground"
                  >
                    {title}
                  </Label>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyTitle(title)}
                  >
                    {copiedTitle && selectedTitle === title ? (
                      <CheckCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => pinTitle(title)}
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label className="font-sans text-foreground">Or write your own:</Label>
            <Input
              value={customTitle}
              onChange={(e) => {
                setCustomTitle(e.target.value);
                setSelectedTitle('');
              }}
              placeholder="Enter custom title..."
              className="bg-input border-input"
            />
          </div>

          {selectedTitle && (
            <Button
              onClick={() => setActiveTab('description')}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Check className="mr-2 h-4 w-4" />
              Confirm Title & Continue
            </Button>
          )}
        </TabsContent>

        {/* Description Tab */}
        <TabsContent value="description" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium font-sans text-foreground">Video Description</h3>
            <Button
              onClick={handleGenerateDescription}
              variant="outline"
              size="sm"
              className="border-border"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          </div>

          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[300px] font-serif text-sm bg-input border-input"
            placeholder="Video description with timestamps, key points, and CTAs..."
          />

          {tags.length > 0 && (
            <div>
              <Label className="font-sans text-foreground mb-2 block flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Extracted Tags
              </Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">#{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => setActiveTab('thumbnail')}
            disabled={!description}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Check className="mr-2 h-4 w-4" />
            Confirm Description & Continue
          </Button>
        </TabsContent>

        {/* Thumbnail Tab */}
        <TabsContent value="thumbnail" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium font-sans text-foreground">Thumbnail Concepts</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={generateThumbnail}
                  onCheckedChange={setGenerateThumbnail}
                  id="gen-thumb"
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="gen-thumb" className="text-sm text-muted-foreground">
                  Generate Preview
                </Label>
              </div>
              <Button
                onClick={handleGenerateThumbnailConcepts}
                disabled={localIsGenerating}
                variant="outline"
                size="sm"
                className="border-border"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${localIsGenerating ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <RadioGroup 
            value={selectedThumbnail} 
            onValueChange={setSelectedThumbnail}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {thumbnailConcepts.map((concept) => (
              <Card
                key={concept.id}
                className={`
                  cursor-pointer transition-all
                  ${selectedThumbnail === concept.id 
                    ? 'ring-2 ring-primary' 
                    : 'hover:shadow-md'}
                `}
                onClick={() => setSelectedThumbnail(concept.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={concept.id} id={concept.id} className="mt-1" />
                    <div className="flex-1">
                      <h4 className="font-sans font-medium text-foreground">{concept.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{concept.description}</p>
                      <div className="mt-3 space-y-2">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Layout: </span>
                          <span className="text-foreground">{concept.layout}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Text: </span>
                          <span className="font-mono bg-muted px-1 rounded">{concept.textOverlay}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Colors: </span>
                          <span className="text-foreground">{concept.colorScheme}</span>
                        </div>
                      </div>
                      {generateThumbnail && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateThumbnailImage(concept);
                          }}
                        >
                          <Wand2 className="mr-2 h-3 w-3" />
                          Generate Preview
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </RadioGroup>

          {generatedThumbnailUrl && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-sans">Generated Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src={generatedThumbnailUrl} 
                  alt="Generated thumbnail preview"
                  className="w-full max-w-md mx-auto rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleFinalizeMetadata}
            disabled={!canFinalize || localIsGenerating}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6"
          >
            <Check className="mr-2 h-5 w-5" />
            Complete Project
          </Button>
        </TabsContent>

        {/* Done Tab */}
        <TabsContent value="done" className="mt-6 space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold font-sans">Project Complete!</h3>
                  <p className="text-muted-foreground">Your video content package is ready.</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Title</Label>
                    <p className="font-medium font-sans">
                      {currentProject?.selectedMetadata?.title || selectedTitle || customTitle}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Topic</Label>
                    <p className="font-medium">{currentProject?.selectedTopic?.title}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Thumbnail Concept</Label>
                  <p className="font-medium">
                    {currentProject?.selectedMetadata?.thumbnailConcept || thumbnailConcepts.find(c => c.id === selectedThumbnail)?.title}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={exportDocument}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Export Selected Choices
                </Button>
                <Button
                  onClick={exportProject}
                  variant="outline"
                  className="flex-1 border-primary/20 hover:bg-primary/10"
                  size="lg"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Export Full JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
