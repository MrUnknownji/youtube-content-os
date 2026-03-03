// Module 5: Metadata Suite - Titles, Descriptions, Thumbnails
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
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
} from "lucide-react";
import { toast } from "sonner";
import { useProjectStore } from "@/state/projectStore";
import { useTextGeneration } from "@/hooks/useAIGeneration";
import { useImageGenerationQueue } from "@/hooks/useImageGenerationQueue";
import { getAIGateway } from "@/services/ai-provider";
import { getDatabaseGateway } from "@/services/db-adapter";
import { ImageViewer } from "@/components/ImageViewer";
import { MOCK_TITLES, MOCK_THUMBNAIL_CONCEPTS } from "@/data/mock-metadata";
import type { VideoMetadata, PinnedItem, ThumbnailConcept } from "@/types";
import {
  LanguageToggle,
  getLanguageInstruction,
} from "@/components/LanguageToggle";
import type { ContentLanguage } from "@/components/LanguageToggle";

export function MetadataSuite() {
  const {
    currentProject,
    currentStage,
    updateProject,
    finalizeMetadata,
    addPinnedItem,
  } = useProjectStore();
  const { generate: generateText } = useTextGeneration();
  const {
    generateImage,
    isGenerating: isImageGenerating,
    isAnyGenerating,
  } = useImageGenerationQueue();

  const [activeTab, setActiveTab] = useState("titles");

  const [titles, setTitles] = useState<string[]>(() => {
    if (currentProject?.titleSuggestions?.length)
      return currentProject.titleSuggestions;
    return getAIGateway().isAvailable() ? [] : MOCK_TITLES;
  });

  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [customTitle, setCustomTitle] = useState("");

  const [description, setDescription] = useState(() => {
    return currentProject?.selectedMetadata?.description || "";
  });

  const [tags, setTags] = useState<string[]>([]);

  const [thumbnailConcepts, setThumbnailConcepts] = useState(() => {
    if (currentProject?.thumbnailConcepts?.length)
      return currentProject.thumbnailConcepts;
    return getAIGateway().isAvailable() ? [] : MOCK_THUMBNAIL_CONCEPTS;
  });

  const [selectedThumbnail, setSelectedThumbnail] = useState<string>("");
  const [generateThumbnail, setGenerateThumbnail] = useState(false);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<
    Record<string, string>
  >({});
  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [thumbnailPrompts, setThumbnailPrompts] = useState<
    Record<string, string>
  >({});
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [titleLanguage, setTitleLanguage] =
    useState<ContentLanguage>("hinglish");
  const [descLanguage, setDescLanguage] = useState<ContentLanguage>("hinglish");

  const ai = getAIGateway();
  const db = getDatabaseGateway();

  const titleGenerationStarted = useRef(false);
  const descGenerationStarted = useRef(false);
  const conceptGenerationStarted = useRef(false);

  // Auto-generate if empty and arrived at this stage
  useEffect(() => {
    if (currentStage === "metadata" && !localIsGenerating) {
      if (
        titles.length === 0 &&
        ai.isAvailable() &&
        currentProject &&
        !titleGenerationStarted.current
      ) {
        titleGenerationStarted.current = true;
        handleGenerateTitles();
      }
      if (
        !description &&
        ai.isAvailable() &&
        currentProject &&
        !descGenerationStarted.current
      ) {
        descGenerationStarted.current = true;
        handleGenerateDescription();
      }
    }
  }, [
    currentStage,
    titles.length,
    description,
    currentProject,
    localIsGenerating,
  ]);

  // Auto-generate thumbnails when switching to tab
  useEffect(() => {
    if (
      currentStage === "metadata" &&
      activeTab === "thumbnail" &&
      thumbnailConcepts.length === 0 &&
      ai.isAvailable() &&
      currentProject &&
      !localIsGenerating &&
      !conceptGenerationStarted.current
    ) {
      conceptGenerationStarted.current = true;
      handleGenerateThumbnailConcepts();
    }
  }, [
    currentStage,
    activeTab,
    thumbnailConcepts.length,
    currentProject,
    localIsGenerating,
  ]);

  const handleGenerateTitles = async (overrideLang?: ContentLanguage) => {
    if (localIsGenerating) return;
    setLocalIsGenerating(true);
    const activeTitleLang = overrideLang ?? titleLanguage;
    try {
      const topic =
        currentProject?.selectedTopic?.title || "productivity video";
      const prompt = `You are a YouTube title expert. Generate exactly 10 strong YouTube video titles for a video about: "${topic}"

LANGUAGE: ${getLanguageInstruction(activeTitleLang)}

GUIDELINES:
- Vary title styles: how-to, list, question, story, opinion, comparison, tutorial, case study
- Titles should be specific and honest about what the viewer will get
- Avoid hollow superlatives like "AMAZING", "INCREDIBLE", "MIND-BLOWING"
- Use numbers only when they're meaningful and accurate
- Emojis are optional — use sparingly and only if they add clarity
- Match the language/style to the video's topic and apparent audience
- A great title makes a clear promise and delivers curiosity without being deceptive

Return as valid JSON array of strings only. No explanations.`;

      const response = await generateText({
        prompt,
        type: "text",
        format: "json",
      });

      if (response.success) {
        try {
          const jsonMatch = response.data.match(/\[[\s\S]*\]/);
          const parsed = jsonMatch
            ? JSON.parse(jsonMatch[0])
            : JSON.parse(response.data);
          const validatedTitles = parsed
            .filter((t: unknown) => t !== null && t !== undefined)
            .map((t: unknown) => String(t));
          setTitles(validatedTitles);
          updateProject({ titleSuggestions: validatedTitles });
          toast.success("Titles generated");
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

  const handleGenerateTitlesWithLang = handleGenerateTitles;

  const handleGenerateDescription = async (overrideLang?: ContentLanguage) => {
    const activeDescLang = overrideLang ?? descLanguage;
    try {
      const topic = currentProject?.selectedTopic?.title || "productivity";
      const script =
        currentProject?.selectedScript?.content?.slice(0, 500) || "";
      const scenes = currentProject?.selectedStoryboard?.scenes || [];

      const timestamps = scenes
        .map((s) => `${s.timestampStart} - ${s.scriptSegment.slice(0, 50)}...`)
        .join("\n");

      const prompt = `Write a well-structured YouTube video description for a video about: "${topic}"

LANGUAGE: ${getLanguageInstruction(activeDescLang)}

Script excerpt: ${script}

Timestamps to include:
${timestamps}

DESCRIPTION STRUCTURE:

1. Opening hook (2-3 sentences): Clearly state what the video is about and what the viewer will gain. Make it compelling but honest.

2. Expanded summary (100-150 words): Cover the key points, who this is for, and why it matters. Write naturally and conversationally.

3. Timestamps: Use the provided timestamps formatted as:
0:00 - Topic

4. Call to action: Brief, genuine subscribe/like/comment request with a specific question to encourage engagement.

5. Relevant hashtags (5-8): Mix of broad and niche-specific tags.

GUIDELINES:
- Include relevant keywords naturally for SEO
- Keep it authentic — avoid excessive emojis or hollow hype
- Total length: 150-300 words

Return the complete description.`;

      const response = await generateText({ prompt, type: "text" });
      if (response.success) {
        setDescription(response.data);
        const tagMatch = response.data.match(/#[\w]+/g);
        if (tagMatch) {
          setTags(tagMatch.map((t: string) => t.slice(1)));
        }
        toast.success("Description generated");
      }
    } catch (error) {
      toast.error("Failed to generate description");
    }
  };

  const handleGenerateDescriptionWithLang = handleGenerateDescription;

  const handleGenerateThumbnailConcepts = async () => {
    if (localIsGenerating) return;
    setLocalIsGenerating(true);
    try {
      const topic =
        currentProject?.selectedTopic?.title || "productivity video";
      const prompt = `Generate 5 YouTube thumbnail concepts for: "${topic}"
Return as valid JSON array with fields: id, title, description, layout, textOverlay, colorScheme`;

      const response = await generateText({
        prompt,
        type: "text",
        format: "json",
      });

      if (response.success) {
        try {
          const jsonMatch = response.data.match(/\[[\s\S]*\]/);
          const parsed = jsonMatch
            ? JSON.parse(jsonMatch[0])
            : JSON.parse(response.data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const validatedConcepts = parsed.map((c, i) => ({
              id: String(c.id || `thumb-${i + 1}`),
              title: String(c.title || "Untitled"),
              description: String(c.description || ""),
              layout: String(c.layout || ""),
              textOverlay: String(c.textOverlay || ""),
              colorScheme: String(c.colorScheme || ""),
            }));
            setThumbnailConcepts(validatedConcepts);
            updateProject({ thumbnailConcepts: validatedConcepts });
            toast.success("Thumbnails generated");
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

  const generateThumbnailImage = async (concept: ThumbnailConcept) => {
    if (isImageGenerating(concept.id)) return;

    const prompt = `Create a YouTube thumbnail: ${concept.description}. 
    Layout: ${concept.layout}. 
    Text: ${concept.textOverlay}.
    Style: ${concept.colorScheme}. 
    High quality, eye-catching, professional.`;

    setThumbnailPrompts((prev) => ({ ...prev, [concept.id]: prompt }));

    const response = await generateImage(prompt, concept.id);
    if (response?.success) {
      setGeneratedThumbnails((prev) => ({
        ...prev,
        [concept.id]: response.data,
      }));
    }
  };

  const regenerateThumbnailImage = async (conceptId: string) => {
    const storedPrompt = thumbnailPrompts[conceptId];
    if (!storedPrompt) return;
    if (isImageGenerating(conceptId)) return;

    const response = await generateImage(storedPrompt, conceptId);
    if (response?.success) {
      setGeneratedThumbnails((prev) => ({
        ...prev,
        [conceptId]: response.data,
      }));
    }
  };

  const copyTitle = (title: string) => {
    navigator.clipboard.writeText(title);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
    toast.success("Title copied");
  };

  const pinTitle = async (title: string) => {
    if (!currentProject) return;
    const pinItem: Omit<PinnedItem, "id" | "pinnedAt"> = {
      userId: "personal_user",
      itemType: "title",
      content: title,
      sourceProjectId: currentProject.id,
    };
    const result = await db.addPinnedItem(pinItem);
    if (result.success) {
      addPinnedItem(result.data!);
      toast.success("Title pinned");
    }
  };

  const handleFinalizeMetadata = () => {
    const metadata: VideoMetadata = {
      title: selectedTitle || customTitle,
      description,
      tags,
      thumbnailPrompt:
        thumbnailConcepts.find((c) => c.id === selectedThumbnail)
          ?.description || "",
      thumbnailConcept: thumbnailConcepts.find(
        (c) => c.id === selectedThumbnail,
      )?.title,
      thumbnailLayout: thumbnailConcepts.find((c) => c.id === selectedThumbnail)
        ?.layout,
    };

    finalizeMetadata(metadata);
    toast.success("Metadata finalized! Now extract shorts for maximum reach.");
  };

  const exportProject = () => {
    if (!currentProject) return;
    const projectData = JSON.stringify(
      {
        project: currentProject,
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
      },
      null,
      2,
    );
    const blob = new Blob([projectData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `youtube-content-brief-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Project exported");
  };

  const canFinalize = (selectedTitle || customTitle) && description;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-sans text-foreground">
            Metadata Suite
          </h2>
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
        <TabsList className="grid w-full grid-cols-3 bg-muted/80 backdrop-blur-sm rounded-xl p-1 mb-2 shadow-sm">
          <TabsTrigger
            value="titles"
            className="data-[state=active]:bg-background gap-1"
          >
            <Type className="h-4 w-4" />
            Titles
          </TabsTrigger>
          <TabsTrigger
            value="description"
            className="data-[state=active]:bg-background gap-1"
          >
            <FileText className="h-4 w-4" />
            Description
          </TabsTrigger>
          <TabsTrigger
            value="thumbnail"
            className="data-[state=active]:bg-background gap-1"
          >
            <ImageIcon className="h-4 w-4" />
            Thumbnail
          </TabsTrigger>
        </TabsList>

        {/* Titles Tab */}
        <TabsContent value="titles" className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-lg font-medium font-sans text-foreground">
              Choose a Title
            </h3>
            <div className="flex items-center gap-2">
              <LanguageToggle
                value={titleLanguage}
                onChange={(lang) => {
                  setTitleLanguage(lang);
                  if (titles.length > 0) {
                    setTimeout(() => handleGenerateTitlesWithLang(lang), 0);
                  }
                }}
                size="sm"
              />
              <Button
                onClick={() => handleGenerateTitlesWithLang(titleLanguage)}
                disabled={localIsGenerating}
                variant="outline"
                size="sm"
                className="border-border"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${localIsGenerating ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          <RadioGroup
            value={selectedTitle}
            onValueChange={setSelectedTitle}
            className="space-y-3"
          >
            {titles.map((title, i) => (
              <div
                key={i}
                className={`
                  flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 shadow-sm
                  ${
                    selectedTitle === title
                      ? "border-primary ring-1 ring-primary bg-primary/5"
                      : "border-border/50 bg-card/60 backdrop-blur-md hover:border-primary/30 hover:shadow-md"
                  }
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
            <Label className="font-sans text-foreground">
              Or write your own:
            </Label>
            <Input
              value={customTitle}
              onChange={(e) => {
                setCustomTitle(e.target.value);
                setSelectedTitle("");
              }}
              placeholder="Enter custom title..."
              className="bg-input/50 border-input rounded-xl"
            />
          </div>

          {selectedTitle && (
            <Button
              onClick={() => setActiveTab("description")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl py-6 shadow-md transition-all hover:shadow-xl"
            >
              <Check className="mr-2 h-4 w-4" />
              Confirm Title & Continue
            </Button>
          )}
        </TabsContent>

        {/* Description Tab */}
        <TabsContent value="description" className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-lg font-medium font-sans text-foreground">
              Video Description
            </h3>
            <div className="flex items-center gap-2">
              <LanguageToggle
                value={descLanguage}
                onChange={(lang) => {
                  setDescLanguage(lang);
                  if (description) {
                    setTimeout(
                      () => handleGenerateDescriptionWithLang(lang),
                      0,
                    );
                  }
                }}
                size="sm"
              />
              <Button
                onClick={() => handleGenerateDescriptionWithLang(descLanguage)}
                variant="outline"
                size="sm"
                className="border-border"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            </div>
          </div>

          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[300px] font-sans text-[15px] leading-relaxed bg-input/50 border-input rounded-2xl p-4 shadow-inner"
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
                  <Badge key={i} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => setActiveTab("thumbnail")}
            disabled={!description}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl py-6 shadow-md transition-all hover:shadow-xl"
          >
            <Check className="mr-2 h-4 w-4" />
            Confirm Description & Continue
          </Button>
        </TabsContent>

        {/* Thumbnail Tab */}
        <TabsContent value="thumbnail" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium font-sans text-foreground">
              Thumbnail Concepts
            </h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={generateThumbnail}
                  onCheckedChange={setGenerateThumbnail}
                  id="gen-thumb"
                  className="data-[state=checked]:bg-primary"
                />
                <Label
                  htmlFor="gen-thumb"
                  className="text-sm text-muted-foreground"
                >
                  Generate Images
                </Label>
              </div>
              <Button
                onClick={handleGenerateThumbnailConcepts}
                disabled={localIsGenerating}
                variant="outline"
                size="sm"
                className="border-border"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${localIsGenerating ? "animate-spin" : ""}`}
                />
                Refresh Concepts
              </Button>
            </div>
          </div>

          <RadioGroup
            value={selectedThumbnail}
            onValueChange={setSelectedThumbnail}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {thumbnailConcepts.map((concept) => {
              const isGenerating = isImageGenerating(concept.id);
              const hasGeneratedImage = !!generatedThumbnails[concept.id];

              return (
                <Card
                  key={concept.id}
                  className={`
                    cursor-pointer transition-all duration-300 overflow-hidden bg-card/60 backdrop-blur-md border-border/50 rounded-2xl shadow-sm
                    ${
                      selectedThumbnail === concept.id
                        ? "ring-2 ring-primary/50 bg-primary/5 shadow-md"
                        : "hover:shadow-md hover:border-primary/20"
                    }
                  `}
                  onClick={() => setSelectedThumbnail(concept.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <RadioGroupItem
                        value={concept.id}
                        id={concept.id}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-sans font-medium text-foreground">
                          {concept.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {concept.description}
                        </p>

                        {/* Concept Details */}
                        <div className="mt-3 space-y-1.5">
                          <div className="text-xs">
                            <span className="text-muted-foreground">
                              Layout:{" "}
                            </span>
                            <span className="text-foreground">
                              {concept.layout}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">
                              Text:{" "}
                            </span>
                            <span className="font-mono bg-muted px-1 rounded">
                              {concept.textOverlay}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">
                              Colors:{" "}
                            </span>
                            <span className="text-foreground">
                              {concept.colorScheme}
                            </span>
                          </div>
                        </div>

                        {/* Generate Button */}
                        {generateThumbnail && (
                          <div className="mt-3">
                            {!hasGeneratedImage ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateThumbnailImage(concept);
                                }}
                                disabled={isGenerating}
                              >
                                {isGenerating ? (
                                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                ) : (
                                  <Wand2 className="mr-2 h-3 w-3" />
                                )}
                                {isGenerating
                                  ? "Generating..."
                                  : "Generate Preview"}
                              </Button>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    regenerateThumbnailImage(concept.id);
                                  }}
                                  disabled={isGenerating}
                                >
                                  {isGenerating ? (
                                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                  )}
                                  Regenerate
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Generated Image Preview - Similar to StoryboardEngine */}
                        {hasGeneratedImage && (
                          <div
                            className="mt-3 border rounded-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ImageViewer
                              src={generatedThumbnails[concept.id]}
                              alt={`${concept.title} preview`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </RadioGroup>

          <Button
            onClick={handleFinalizeMetadata}
            disabled={!canFinalize || localIsGenerating || isAnyGenerating}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl py-6 shadow-md transition-all hover:shadow-xl"
          >
            <Check className="mr-2 h-5 w-5" />
            Finalize Metadata & Continue to Shorts
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
