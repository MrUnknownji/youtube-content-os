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
import { Settings, Eye, EyeOff, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface AISettings {
  useAI: boolean;
  geminiApiKey: string;
}

const STORAGE_KEY = 'yco-ai-settings';

export function getAISettings(): AISettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load AI settings:', e);
  }
  return {
    useAI: false,
    geminiApiKey: ''
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
      <DialogContent className="sm:max-w-[450px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="font-sans text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Settings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Toggle between template mode and AI-powered generation.
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

          {/* API Key Input - Only shown when AI mode is enabled */}
          {settings.useAI && (
            <div className="space-y-3 p-4 rounded-lg border border-primary/30 bg-primary/5">
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
          )}

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
