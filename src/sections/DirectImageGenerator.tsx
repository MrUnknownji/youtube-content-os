// Direct Image Generator - Generate images from prompts directly
import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Wand2,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  Copy,
  CheckCheck,
  Download,
  Maximize2,
  X,
  Sparkles,
  AlertCircle,
  History,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { getAIGateway } from '@/services/ai-provider';
import { getAISettings } from '@/components/SettingsDialog';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: Date;
  model: string;
  size: string;
}

const IMAGE_SIZES = [
  { value: '1024x1024', label: 'Square (1024x1024)' },
  { value: '1024x1536', label: 'Portrait (1024x1536)' },
  { value: '1536x1024', label: 'Landscape (1536x1024)' },
];

export function DirectImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(() => {
    const stored = localStorage.getItem('yco-generated-images');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((img: any) => ({
          ...img,
          createdAt: new Date(img.createdAt)
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);

  const { generate, isGenerating } = useAIGeneration();
  const ai = getAIGateway();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const saveImages = (images: GeneratedImage[]) => {
    localStorage.setItem('yco-generated-images', JSON.stringify(images));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (!ai.isAvailable()) {
      toast.error('AI mode is not enabled. Please enable it in Settings.');
      return;
    }

    const settings = getAISettings();
    if (!settings.useImageGen) {
      toast.error('Image generation is not enabled. Please enable it in Settings.');
      return;
    }

    try {
      const response = await generate({
        prompt: prompt.trim(),
        type: 'image'
      });

      if (response.success) {
        const newImage: GeneratedImage = {
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          prompt: prompt.trim(),
          imageUrl: response.data,
          createdAt: new Date(),
          model: settings.imageModel || 'gpt-image-1.5',
          size
        };

        const updated = [newImage, ...generatedImages].slice(0, 50); // Keep last 50
        setGeneratedImages(updated);
        saveImages(updated);
        setSelectedImage(newImage);
        toast.success('Image generated successfully');
      } else {
        toast.error('Failed to generate image');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error('Failed to generate image. Please check your API key.');
    }
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      if (image.imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = image.imageUrl;
        link.download = `generated-image-${image.id}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(image.imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `generated-image-${image.id}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      toast.success('Image downloaded');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download image');
    }
  };

  const copyPrompt = (image: GeneratedImage) => {
    navigator.clipboard.writeText(image.prompt);
    setCopiedId(image.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Prompt copied to clipboard');
  };

  const deleteImage = (id: string) => {
    const updated = generatedImages.filter(img => img.id !== id);
    setGeneratedImages(updated);
    saveImages(updated);
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
    toast.success('Image removed');
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all generated images?')) {
      setGeneratedImages([]);
      saveImages([]);
      setSelectedImage(null);
      toast.success('History cleared');
    }
  };

  const regenerateImage = async (image: GeneratedImage) => {
    setPrompt(image.prompt);
    setSize(image.size);
    textareaRef.current?.focus();
    toast.info('Prompt loaded. Click Generate to create a new version.');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isAIEnabled = ai.isAvailable();
  const settings = getAISettings();
  const isImageGenEnabled = settings.useImageGen;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-sans text-foreground">Image Generator</h2>
          <p className="text-muted-foreground mt-1">
            Generate images directly from text prompts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isAIEnabled && isImageGenEnabled ? 'default' : 'destructive'} className="gap-1">
            {isAIEnabled && isImageGenEnabled ? (
              <>
                <Sparkles className="h-3 w-3" />
                AI Ready
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                {!isAIEnabled ? 'AI Disabled' : 'Image Gen Disabled'}
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Warning if AI not enabled */}
      {(!isAIEnabled || !isImageGenEnabled) && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">
                {!isAIEnabled ? 'AI Mode is disabled' : 'Image Generation is disabled'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {!isAIEnabled 
                  ? 'Please enable AI Mode in Settings to generate images.' 
                  : 'Please enable Image Generation in Settings to use this feature.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Section */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-muted-foreground" />
              Prompt
            </Label>
            <Textarea
              ref={textareaRef}
              id="prompt"
              placeholder="Describe the image you want to generate... (e.g., 'A futuristic city at sunset with flying cars and neon lights')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] resize-none bg-input border-input"
              disabled={!isAIEnabled || !isImageGenEnabled}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  handleGenerate();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Press Cmd/Ctrl + Enter to generate
            </p>
          </div>

          {/* Options */}
          <div className="flex items-center gap-4">
            <div className="space-y-2 flex-1 max-w-[200px]">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Size
              </Label>
              <Select
                value={size}
                onValueChange={setSize}
                disabled={!isAIEnabled || !isImageGenEnabled}
              >
                <SelectTrigger className="bg-input border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1" />

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !isAIEnabled || !isImageGenEnabled || !prompt.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Image Preview */}
        <div className="lg:col-span-2 space-y-4">
          {selectedImage ? (
            <Card className="border-border overflow-hidden">
              <div className="relative group">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.prompt}
                  className="w-full h-auto max-h-[600px] object-contain bg-muted"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Overlay Controls */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-10 w-10 bg-background/90 backdrop-blur-sm hover:bg-background"
                    onClick={() => setIsFullscreenOpen(true)}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-10 w-10 bg-background/90 backdrop-blur-sm hover:bg-background"
                    onClick={() => handleDownload(selectedImage)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                        {selectedImage.size}
                      </Badge>
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                        {selectedImage.model}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-background/90 backdrop-blur-sm hover:bg-background"
                        onClick={() => copyPrompt(selectedImage)}
                      >
                        {copiedId === selectedImage.id ? (
                          <CheckCheck className="h-4 w-4 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        Copy Prompt
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-background/90 backdrop-blur-sm hover:bg-background"
                        onClick={() => regenerateImage(selectedImage)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-4 border-t border-border">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  <span className="font-medium text-foreground">Prompt: </span>
                  {selectedImage.prompt}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Generated at {formatTime(selectedImage.createdAt)}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border border-dashed">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {generatedImages.length > 0 
                    ? 'Select an image from history to view' 
                    : 'Your generated images will appear here'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* History Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-foreground">History</h3>
            </div>
            <div className="flex items-center gap-2">
              {generatedImages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="h-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
              <Switch
                checked={showHistory}
                onCheckedChange={setShowHistory}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          {showHistory && (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {generatedImages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No images generated yet
                  </p>
                ) : (
                  generatedImages.map((image) => (
                    <Card
                      key={image.id}
                      className={`border-border cursor-pointer transition-all hover:shadow-md ${
                        selectedImage?.id === image.id ? 'ring-1 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <div className="flex gap-3 p-3">
                        <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={image.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground line-clamp-2">
                            {image.prompt}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {image.size}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(image.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(image);
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteImage(image.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-border">
          <DialogTitle className="sr-only">Fullscreen Image</DialogTitle>
          <DialogDescription className="sr-only">
            Full size preview of generated image
          </DialogDescription>
          {selectedImage && (
            <div className="relative w-full h-full flex items-center justify-center">
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 z-10 h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setIsFullscreenOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute top-2 left-2 z-10 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  onClick={() => handleDownload(selectedImage)}
                >
                  <Download className="h-3 w-3 mr-2" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  onClick={() => copyPrompt(selectedImage)}
                >
                  {copiedId === selectedImage.id ? (
                    <CheckCheck className="h-3 w-3 mr-2" />
                  ) : (
                    <Copy className="h-3 w-3 mr-2" />
                  )}
                  Copy Prompt
                </Button>
              </div>
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.prompt}
                className="max-w-full max-h-[90vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white/90 text-sm line-clamp-2">
                  {selectedImage.prompt}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
