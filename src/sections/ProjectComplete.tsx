import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  FileCode,
  Copy,
  CheckCheck,
  FolderArchive,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '@/state/projectStore';
import { ImageViewer } from '@/components/ImageViewer';

export function ProjectComplete() {
  const { currentProject } = useProjectStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${fieldName} copied`);
  };

  const exportScript = () => {
    if (!currentProject?.selectedScript) {
      toast.error('No script selected');
      return;
    }
    const blob = new Blob([currentProject.selectedScript.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script-${currentProject.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Script exported');
  };

  const exportMetadata = () => {
    if (!currentProject?.selectedMetadata) {
      toast.error('No metadata selected');
      return;
    }
    const meta = currentProject.selectedMetadata;
    let content = `# ${meta.title}\n\n`;
    content += `## Description\n${meta.description}\n\n`;
    if (meta.tags.length > 0) {
      content += `## Tags\n${meta.tags.map(t => `#${t}`).join(' ')}\n\n`;
    }
    if (meta.thumbnailConcept) {
      content += `## Thumbnail Concept\n**Title:** ${meta.thumbnailConcept}\n`;
      content += `**Description:** ${meta.thumbnailPrompt}\n`;
      if (meta.thumbnailLayout) content += `**Layout:** ${meta.thumbnailLayout}\n`;
    }
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metadata-${currentProject.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Metadata exported');
  };

  const exportStoryboard = () => {
    if (!currentProject?.selectedStoryboard?.scenes?.length) {
      toast.error('No storyboard selected');
      return;
    }
    let content = `# Visual Storyboard\n\n`;
    content += `**Format:** ${currentProject.selectedStoryboard.format}\n\n`;
    currentProject.selectedStoryboard.scenes.forEach((scene) => {
      content += `## Scene ${scene.sceneNumber} (${scene.timestampStart} - ${scene.timestampEnd})\n`;
      content += `**Type:** ${scene.type} | **Duration:** ${scene.duration}s\n\n`;
      content += `### Script Segment\n${scene.scriptSegment}\n\n`;
      content += `### Visual Description\n${scene.visualDescription}\n\n`;
      content += `### Image Prompt\n${scene.imagePrompt}\n\n`;
      if (scene.recordingInstructions) {
        content += `### Recording Instructions\n${scene.recordingInstructions}\n\n`;
      }
      if (scene.audioNote) {
        content += `### Audio Note\n${scene.audioNote}\n\n`;
      }
      content += `---\n\n`;
    });
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyboard-${currentProject.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Storyboard exported');
  };

  const exportScenesJson = () => {
    if (!currentProject?.selectedStoryboard?.scenes?.length) {
      toast.error('No storyboard selected');
      return;
    }
    const scenes = currentProject.selectedStoryboard.scenes.map(scene => {
      const { generatedImageUrl, ...rest } = scene;
      return rest;
    });
    const blob = new Blob([JSON.stringify(scenes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenes-${currentProject.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Scenes JSON exported');
  };

  const exportAllSelected = () => {
    if (!currentProject) {
      toast.error('No project data');
      return;
    }

    let content = `# Project Export\n\n`;
    content += `**Project ID:** ${currentProject.id}\n`;
    content += `**Created:** ${new Date(currentProject.createdAt).toLocaleString()}\n\n`;

    if (currentProject.selectedTopic) {
      content += `## Topic\n**Title:** ${currentProject.selectedTopic.title}\n\n`;
    }

    if (currentProject.selectedScript) {
      content += `## Script\n\`\`\`\n${currentProject.selectedScript.content}\n\`\`\`\n\n`;
      content += `**Format:** ${currentProject.selectedScript.format}\n\n`;
    }

    if (currentProject.selectedStoryboard?.scenes?.length) {
      content += `## Visual Storyboard\n\n`;
      content += `**Format:** ${currentProject.selectedStoryboard.format}\n\n`;
      currentProject.selectedStoryboard.scenes.forEach((scene) => {
        content += `### Scene ${scene.sceneNumber} (${scene.timestampStart} - ${scene.timestampEnd})\n`;
        content += `**Type:** ${scene.type} | **Duration:** ${scene.duration}s\n\n`;
        content += `**Script Segment:**\n${scene.scriptSegment}\n\n`;
        content += `**Visual Description:**\n${scene.visualDescription}\n\n`;
        content += `**Image Prompt:**\n${scene.imagePrompt}\n\n`;
        if (scene.recordingInstructions) {
          content += `**Recording Instructions:**\n${scene.recordingInstructions}\n\n`;
        }
        if (scene.audioNote) {
          content += `**Audio Note:** ${scene.audioNote}\n\n`;
        }
        content += `---\n\n`;
      });
    }

    if (currentProject.selectedMetadata) {
      const meta = currentProject.selectedMetadata;
      content += `## Metadata\n\n`;
      content += `### Title\n${meta.title}\n\n`;
      content += `### Description\n${meta.description}\n\n`;
      if (meta.tags.length > 0) {
        content += `### Tags\n${meta.tags.map(t => `#${t}`).join(' ')}\n\n`;
      }
      if (meta.thumbnailConcept) {
        content += `### Thumbnail Concept\n`;
        content += `**Title:** ${meta.thumbnailConcept}\n`;
        content += `**Description:** ${meta.thumbnailPrompt}\n`;
        if (meta.thumbnailLayout) content += `**Layout:** ${meta.thumbnailLayout}\n`;
        content += `\n`;
      }
    }

    if (currentProject.shortsExtracts?.length) {
      content += `## Shorts Extracts\n\n`;
      currentProject.shortsExtracts.forEach((short, i) => {
        content += `### Short ${i + 1}: ${short.title}\n`;
        content += `**Type:** ${short.contentType} | **Duration:** ${short.duration}s\n`;
        content += `**Viral Potential:** ${short.viralPotential}\n\n`;
        content += `**Hook:**\n${short.hookText}\n\n`;
        content += `**Full Script:**\n${short.fullContent}\n\n`;
        content += `**Hashtags:** ${short.hashtags.join(' ')}\n\n`;
        content += `---\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-complete-${currentProject.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Full project exported');
  };

  const exportFullJson = () => {
    if (!currentProject) {
      toast.error('No project data');
      return;
    }
    const projectData = {
      ...currentProject,
      selectedStoryboard: currentProject.selectedStoryboard ? {
        ...currentProject.selectedStoryboard,
        scenes: currentProject.selectedStoryboard.scenes.map(scene => {
          const { generatedImageUrl, ...rest } = scene;
          return rest;
        })
      } : null,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-full-${currentProject.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Full JSON exported');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-sans text-foreground">Project Complete!</h2>
          <p className="text-muted-foreground mt-1">
            Review your content and export what you need
          </p>
        </div>
      </div>

      <Tabs defaultValue="information" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="information" className="data-[state=active]:bg-background gap-1">
            <FileText className="h-4 w-4" />
            Information
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-background gap-1">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="information" className="mt-6 space-y-6">
          {/* Topic */}
          {currentProject?.selectedTopic && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Topic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground font-medium">{currentProject.selectedTopic.title}</p>
              </CardContent>
            </Card>
          )}

          {/* Script */}
          {currentProject?.selectedScript && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    Script
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentProject.selectedScript.format}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(currentProject.selectedScript!.content, 'Script')}
                    >
                      {copiedField === 'Script' ? (
                        <CheckCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-md p-4 max-h-[300px] overflow-auto">
                  <pre className="font-mono text-sm whitespace-pre-wrap text-foreground">
                    {currentProject.selectedScript.content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Storyboard */}
          {currentProject?.selectedStoryboard?.scenes?.length ? (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Visual Storyboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{currentProject.selectedStoryboard.format}</Badge>
                  <span>{currentProject.selectedStoryboard.scenes.length} scenes</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentProject.selectedStoryboard.scenes.map((scene) => (
                    <div key={scene.sceneNumber} className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">Scene {scene.sceneNumber}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {scene.timestampStart} - {scene.timestampEnd}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-2 line-clamp-2">
                        {scene.scriptSegment}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        <span className="font-medium">Visual:</span> {scene.visualDescription}
                      </p>
                      {scene.generatedImageUrl ? (
                        <div className="border rounded-md overflow-hidden mt-2">
                          <ImageViewer src={scene.generatedImageUrl} alt={`Scene ${scene.sceneNumber}`} />
                        </div>
                      ) : (
                        <div className="bg-muted/50 rounded-md p-2 mt-2">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Prompt:</span> {scene.imagePrompt}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Metadata */}
          {currentProject?.selectedMetadata && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Title</Label>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-foreground font-medium">{currentProject.selectedMetadata.title}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(currentProject.selectedMetadata!.title, 'Title')}
                    >
                      {copiedField === 'Title' ? (
                        <CheckCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Description</Label>
                  <div className="flex items-start justify-between mt-1 gap-2">
                    <p className="text-foreground text-sm whitespace-pre-wrap flex-1 max-h-[150px] overflow-auto">
                      {currentProject.selectedMetadata.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(currentProject.selectedMetadata!.description, 'Description')}
                    >
                      {copiedField === 'Description' ? (
                        <CheckCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {currentProject.selectedMetadata.tags.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentProject.selectedMetadata.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {currentProject.selectedMetadata.thumbnailConcept && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Thumbnail Concept</Label>
                    <div className="mt-1 bg-muted/50 rounded-md p-3">
                      <p className="font-medium text-foreground">
                        {currentProject.selectedMetadata.thumbnailConcept}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentProject.selectedMetadata.thumbnailPrompt}
                      </p>
                      {currentProject.selectedMetadata.thumbnailLayout && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Layout: {currentProject.selectedMetadata.thumbnailLayout}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Shorts */}
          {currentProject?.shortsExtracts?.length ? (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Shorts Extracts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentProject.shortsExtracts.map((short, i) => (
                    <div key={short.id} className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">Short {i + 1}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{short.duration}s</Badge>
                          <Badge variant="secondary">{short.viralPotential}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-primary font-medium mb-1">"{short.hookText}"</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {short.fullContent}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!currentProject?.selectedTopic && !currentProject?.selectedScript && !currentProject?.selectedMetadata && (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No content has been created yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Start from the beginning to build your video content.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Script */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Script Only
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export the finalized script as a text file
                </p>
                <Button
                  onClick={exportScript}
                  disabled={!currentProject?.selectedScript}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Script
                </Button>
              </CardContent>
            </Card>

            {/* Export Metadata */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Title, Description & Thumbnail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export metadata including title, description, tags, and thumbnail concept
                </p>
                <Button
                  onClick={exportMetadata}
                  disabled={!currentProject?.selectedMetadata}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Metadata
                </Button>
              </CardContent>
            </Card>

            {/* Export Storyboard */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Storyboard Only
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export the visual storyboard with all scenes in markdown format
                </p>
                <Button
                  onClick={exportStoryboard}
                  disabled={!currentProject?.selectedStoryboard?.scenes?.length}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Storyboard
                </Button>
              </CardContent>
            </Card>

            {/* Export Scenes JSON */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-primary" />
                  Scenes JSON Only
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export scenes as structured JSON for programmatic use
                </p>
                <Button
                  onClick={exportScenesJson}
                  disabled={!currentProject?.selectedStoryboard?.scenes?.length}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Scenes JSON
                </Button>
              </CardContent>
            </Card>

            {/* Export All Selected */}
            <Card className="bg-card border-border md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderArchive className="h-5 w-5 text-primary" />
                  All Selected Choices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export everything you've selected: topic, script, storyboard, metadata, and shorts in one comprehensive markdown document
                </p>
                <Button
                  onClick={exportAllSelected}
                  disabled={!currentProject?.selectedTopic && !currentProject?.selectedScript && !currentProject?.selectedMetadata}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export All Selected
                </Button>
              </CardContent>
            </Card>

            {/* Export Full JSON */}
            <Card className="bg-card border-border md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-primary" />
                  Full Project JSON
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export complete project data as JSON for backup or import into another system
                </p>
                <Button
                  onClick={exportFullJson}
                  disabled={!currentProject}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Full JSON
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}