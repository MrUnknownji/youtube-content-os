// Settings Dialog Component - AI Mode Toggle
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Eye, EyeOff, Sparkles, Zap, Trash2, AlertTriangle, Database, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '@/state/projectStore';

interface AISettings {
  useAI: boolean;
  geminiApiKey: string;
  geminiModel: string;
  mongoUri: string;
  useImageGen: boolean;
  imageModel: string;
}

const STORAGE_KEY = 'yco-ai-settings';

export function getAISettings(): AISettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure new fields exist
      return {
        useAI: parsed.useAI ?? false,
        geminiApiKey: parsed.geminiApiKey ?? '',
        geminiModel: parsed.geminiModel ?? 'gemini-1.5-flash',
        mongoUri: parsed.mongoUri ?? '',
        useImageGen: parsed.useImageGen ?? false,
        imageModel: parsed.imageModel ?? 'dall-e-3'
      };
    }
  } catch (e) {
    console.error('Failed to load AI settings:', e);
  }
  return {
    useAI: false,
    geminiApiKey: '',
    geminiModel: 'gemini-1.5-flash',
    mongoUri: '',
    useImageGen: false,
    imageModel: 'dall-e-3'
  };
}

export function saveAISettings(settings: AISettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save AI settings:', e);
  }
}

export function isAIModeEnabled(): boolean {
  return getAISettings().useAI;
}

export function getGeminiApiKey(): string {
  return getAISettings().geminiApiKey;
}

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AISettings>(getAISettings());
  const [showKey, setShowKey] = useState(false);
  const [showMongo, setShowMongo] = useState(false);
  const { createNewProject, setPinnedItems } = useProjectStore();

  useEffect(() => {
    if (open) {
      setSettings(getAISettings());
    }
  }, [open]);

  const handleSave = () => {
    saveAISettings(settings);
    toast.success(settings.useAI ? 'AI Mode enabled - Using Gemini' : 'Template Mode enabled');
    setOpen(false);
    // Dispatch event for components to react to the change
    window.dispatchEvent(new CustomEvent('ai-settings-changed', { detail: settings }));
  };

  const handleToggleAI = (checked: boolean) => {
    setSettings(prev => ({ ...prev, useAI: checked }));
  };

  const handleToggleImageGen = (checked: boolean) => {
    setSettings(prev => ({ ...prev, useImageGen: checked }));
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the application? This will delete the current project and all pinned items.')) {
      createNewProject();
      setPinnedItems([]);
      toast.success('Application reset successfully');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground hover:bg-sidebar-accent"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] bg-background border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure AI providers and application preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* AI Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3">
              {settings.useAI ? (
                <div className="p-2 rounded-full bg-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-muted">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-medium text-foreground">
                  {settings.useAI ? 'AI Mode' : 'Template Mode'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {settings.useAI 
                    ? 'Using Gemini 3 Flash for generation' 
                    : 'Using pre-built templates'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.useAI}
              onCheckedChange={handleToggleAI}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* API Key & Model Input - Only shown when AI mode is enabled */}
          {settings.useAI && (
            <div className="space-y-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
              <div className="space-y-2">
                <Label className="font-sans text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Gemini API Key
                </Label>
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    placeholder="AIza..."
                    value={settings.geminiApiKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                    className="bg-input border-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the server's configured API key from .env
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-sans text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Gemini Model
                </Label>
                <Select
                  value={settings.geminiModel}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, geminiModel: value }))}
                >
                  <SelectTrigger className="w-full bg-input border-input">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</SelectItem>
                    <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Capable)</SelectItem>
                    <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Preview)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Image Generation Settings */}
          {settings.useAI && (
            <div className="flex flex-col gap-4 p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-accent">
                    <ImageIcon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Image Generation</p>
                    <p className="text-sm text-muted-foreground">
                      Enable AI image creation
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.useImageGen}
                  onCheckedChange={handleToggleImageGen}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {settings.useImageGen && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label className="font-sans text-foreground">Image Model</Label>
                  <Select
                    value={settings.imageModel}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, imageModel: value }))}
                  >
                    <SelectTrigger className="w-full bg-input border-input">
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dall-e-3">DALL-E 3 (OpenAI)</SelectItem>
                      <SelectItem value="imagen-3.0-generate-001">Imagen 3 (Google)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Database Configuration */}
          <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
            <Label className="font-sans text-foreground flex items-center gap-2">
              <Database className="h-4 w-4" />
              Custom MongoDB URI
            </Label>
            <div className="relative">
              <Input
                type={showMongo ? 'text' : 'password'}
                placeholder="mongodb+srv://..."
                value={settings.mongoUri}
                onChange={(e) => setSettings(prev => ({ ...prev, mongoUri: e.target.value }))}
                className="bg-input border-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowMongo(!showMongo)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showMongo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Optional: Override the server's database connection string.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">
              {settings.useAI ? '✨ AI Mode' : '📋 Template Mode'}
            </p>
            <p>
              {settings.useAI 
                ? 'All generation (topics, scripts, storyboards, metadata) will use Google Gemini 3 Flash for intelligent, context-aware content.'
                : 'Uses pre-built templates for quick content generation. Great for testing or when API is unavailable.'}
            </p>
          </div>

          {/* Danger Zone */}
          <div className="border border-destructive/20 rounded-lg overflow-hidden">
            <div className="bg-destructive/10 px-4 py-2 border-b border-destructive/20 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Danger Zone</span>
            </div>
            <div className="p-4 bg-background">
              <p className="text-sm text-muted-foreground mb-3">
                Reset the application to its initial state. This will delete the current project and all pinned items.
              </p>
              <Button
                variant="destructive"
                onClick={handleReset}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Reset Application
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Quick toggle component for the navigation
export function AIModeToggle() {
  const [useAI, setUseAI] = useState(getAISettings().useAI);

  useEffect(() => {
    const handleChange = (e: CustomEvent<AISettings>) => {
      setUseAI(e.detail.useAI);
    };
    window.addEventListener('ai-settings-changed', handleChange as EventListener);
    return () => window.removeEventListener('ai-settings-changed', handleChange as EventListener);
  }, []);

  const toggleMode = () => {
    const current = getAISettings();
    const newSettings = { ...current, useAI: !current.useAI };
    saveAISettings(newSettings);
    setUseAI(newSettings.useAI);
    toast.success(newSettings.useAI ? 'AI Mode enabled' : 'Template Mode enabled');
    window.dispatchEvent(new CustomEvent('ai-settings-changed', { detail: newSettings }));
  };

  return (
    <button
      onClick={toggleMode}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
        ${useAI 
          ? 'bg-primary/20 text-primary border border-primary/30' 
          : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'}
      `}
      title={useAI ? 'Using AI - Click to switch to Template Mode' : 'Using Templates - Click to switch to AI Mode'}
    >
      {useAI ? (
        <>
          <Sparkles className="h-3 w-3" />
          AI Mode
        </>
      ) : (
        <>
          <Zap className="h-3 w-3" />
          Template
        </>
      )}
    </button>
  );
}
