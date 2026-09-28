// Settings Dialog Component - AI Mode Toggle
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Trash2,
  AlertTriangle,
  Database,
  ImageIcon,
  Cloud,
  ToggleLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectStore } from "@/state/projectStore";
import { AppearanceSettings } from "@/components/AppearanceSettings";
import {
  CONTENT_MODEL_OPTIONS,
  DEFAULT_CONTENT_MODEL,
  DEFAULT_IMAGE_MODEL,
  getModelLabel,
  IMAGE_MODEL_OPTIONS,
  normalizeContentModel,
  normalizeImageModel,
} from "@/lib/ai-models";

interface AISettings {
  useAI: boolean;
  geminiApiKey: string;
  openaiApiKey: string;
  geminiApiType: "ai-studio" | "vertex-ai";
  /** Legacy storage field name. It now stores the selected content model for either provider. */
  geminiModel: string;
  mongoUri: string;
  useImageGen: boolean;
  imageModel: string;
  useCloudinary: boolean;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
}

const STORAGE_KEY = "yco-ai-settings";

export function getAISettings(): AISettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        useAI: parsed.useAI ?? false,
        geminiApiKey: parsed.geminiApiKey ?? "",
        openaiApiKey: parsed.openaiApiKey ?? "",
        geminiApiType: parsed.geminiApiType ?? "ai-studio",
        geminiModel: normalizeContentModel(parsed.geminiModel),
        mongoUri: parsed.mongoUri ?? "",
        useImageGen: parsed.useImageGen ?? false,
        imageModel: normalizeImageModel(parsed.imageModel),
        useCloudinary: parsed.useCloudinary ?? false,
        cloudinaryCloudName: parsed.cloudinaryCloudName ?? "",
        cloudinaryApiKey: parsed.cloudinaryApiKey ?? "",
        cloudinaryApiSecret: parsed.cloudinaryApiSecret ?? "",
      };
    }
  } catch (e) {
    console.error("Failed to load AI settings:", e);
  }
  return {
    useAI: false,
    geminiApiKey: "",
    openaiApiKey: "",
    geminiApiType: "ai-studio",
    geminiModel: DEFAULT_CONTENT_MODEL,
    mongoUri: "",
    useImageGen: false,
    imageModel: DEFAULT_IMAGE_MODEL,
    useCloudinary: false,
    cloudinaryCloudName: "",
    cloudinaryApiKey: "",
    cloudinaryApiSecret: "",
  };
}

export function saveAISettings(settings: AISettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save AI settings:", e);
  }
}

export function isAIModeEnabled(): boolean {
  return getAISettings().useAI;
}

export function getGeminiApiKey(): string {
  return getAISettings().geminiApiKey;
}

export function getOpenAIApiKey(): string {
  return getAISettings().openaiApiKey;
}

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AISettings>(getAISettings());
  const [showKey, setShowKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showMongo, setShowMongo] = useState(false);
  const [showCloudinaryKey, setShowCloudinaryKey] = useState(false);
  const [showCloudinarySecret, setShowCloudinarySecret] = useState(false);
  const { createNewProject, setPinnedItems } = useProjectStore();

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSettings(getAISettings());
    }
    setOpen(nextOpen);
  };

  const handleSave = () => {
    saveAISettings(settings);
    toast.success(
      settings.useAI
        ? `AI Mode enabled · ${getModelLabel(settings.geminiModel)}`
        : "Template Mode enabled",
    );
    setOpen(false);
    window.dispatchEvent(
      new CustomEvent("ai-settings-changed", { detail: settings }),
    );
  };

  const handleToggleAI = (checked: boolean) => {
    setSettings((prev) => ({ ...prev, useAI: checked }));
  };

  const handleToggleImageGen = (checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      useImageGen: checked,
      useCloudinary: checked ? prev.useCloudinary : false,
    }));
  };

  const handleToggleCloudinary = (checked: boolean) => {
    setSettings((prev) => ({ ...prev, useCloudinary: checked }));
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to reset the application? This will delete the current project and all pinned items.",
      )
    ) {
      createNewProject();
      setPinnedItems([]);
      toast.success("Application reset successfully");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
      <DialogContent className="sm:max-w-[560px] bg-background border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Customize appearance, AI providers, and application preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <AppearanceSettings />

          {/* Generation mode selector */}
          <div
            className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/50 p-1"
            role="radiogroup"
            aria-label="Generation mode"
          >
            <button
              type="button"
              role="radio"
              aria-checked={!settings.useAI}
              onClick={() => handleToggleAI(false)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                !settings.useAI
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>Template Mode</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={settings.useAI}
              onClick={() => handleToggleAI(true)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                settings.useAI
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Mode</span>
            </button>
          </div>

          {settings.useAI && (
            <div className="space-y-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
              <div className="space-y-2">
                <Label className="font-sans text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Content Model
                </Label>
                <Select
                  value={settings.geminiModel}
                  onValueChange={(value) =>
                    setSettings((prev) => ({ ...prev, geminiModel: value }))
                  }
                >
                  <SelectTrigger className="w-full bg-input border-input">
                    <SelectValue placeholder="Select content model" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_MODEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} · {option.provider === "openai" ? "OpenAI" : "Google"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The provider is selected automatically from the model you choose.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60">
                <Label className="font-sans text-foreground flex items-center gap-2">
                  <ToggleLeft className="h-4 w-4" />
                  Gemini API Source
                </Label>
                <div className="flex rounded-md border border-input overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        geminiApiType: "ai-studio",
                      }))
                    }
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      settings.geminiApiType === "ai-studio"
                        ? "bg-primary text-primary-foreground"
                        : "bg-input text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    AI Studio
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        geminiApiType: "vertex-ai",
                      }))
                    }
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-input ${
                      settings.geminiApiType === "vertex-ai"
                        ? "bg-primary text-primary-foreground"
                        : "bg-input text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Vertex AI
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {settings.geminiApiType === "ai-studio"
                    ? "Standard API key from Google AI Studio (aistudio.google.com)"
                    : "Vertex AI uses ADC/service account on the server, or an express API key"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-sans text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {settings.geminiApiType === "vertex-ai"
                    ? "Gemini / Vertex API Key (optional)"
                    : "Gemini API Key"}
                </Label>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder={
                      settings.geminiApiType === "vertex-ai"
                        ? "Express key or leave empty for ADC"
                        : "AIza..."
                    }
                    value={settings.geminiApiKey}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        geminiApiKey: e.target.value,
                      }))
                    }
                    className="bg-input border-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showKey ? "Hide Gemini API key" : "Show Gemini API key"}
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {settings.geminiApiType === "vertex-ai"
                    ? "Leave empty to rely on GOOGLE_APPLICATION_CREDENTIALS set on the server"
                    : "Leave empty to use the server's configured Gemini key"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-sans text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  OpenAI API Key
                </Label>
                <div className="relative">
                  <Input
                    type={showOpenAIKey ? "text" : "password"}
                    placeholder="sk-..."
                    value={settings.openaiApiKey}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        openaiApiKey: e.target.value,
                      }))
                    }
                    className="bg-input border-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showOpenAIKey ? "Hide OpenAI API key" : "Show OpenAI API key"}
                  >
                    {showOpenAIKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to use OPENAI_API_KEY configured on the server.
                </p>
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
                    <p className="font-medium text-foreground">
                      Image Generation
                    </p>
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
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="space-y-2">
                    <Label className="font-sans text-foreground">
                      Image Model
                    </Label>
                    <Select
                      value={settings.imageModel}
                      onValueChange={(value) =>
                        setSettings((prev) => ({ ...prev, imageModel: value }))
                      }
                    >
                      <SelectTrigger className="w-full bg-input border-input">
                        <SelectValue placeholder="Select image model" />
                      </SelectTrigger>
                      <SelectContent>
                        {IMAGE_MODEL_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label} · {option.provider === "openai" ? "OpenAI" : "Google"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Uses the matching OpenAI or Gemini credential configured above.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        <Cloud className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          Cloudinary Upload
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Store images in cloud (optional)
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.useCloudinary}
                      onCheckedChange={handleToggleCloudinary}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  {settings.useCloudinary && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <div className="space-y-2">
                        <Label className="font-sans text-foreground text-sm">
                          Cloud Name
                        </Label>
                        <Input
                          placeholder="your-cloud-name"
                          value={settings.cloudinaryCloudName}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              cloudinaryCloudName: e.target.value,
                            }))
                          }
                          className="bg-input border-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-sans text-foreground text-sm">
                          API Key
                        </Label>
                        <div className="relative">
                          <Input
                            type={showCloudinaryKey ? "text" : "password"}
                            placeholder="123456789012345"
                            value={settings.cloudinaryApiKey}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                cloudinaryApiKey: e.target.value,
                              }))
                            }
                            className="bg-input border-input pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCloudinaryKey(!showCloudinaryKey)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCloudinaryKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-sans text-foreground text-sm">
                          API Secret
                        </Label>
                        <div className="relative">
                          <Input
                            type={showCloudinarySecret ? "text" : "password"}
                            placeholder="••••••••••••••••"
                            value={settings.cloudinaryApiSecret}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                cloudinaryApiSecret: e.target.value,
                              }))
                            }
                            className="bg-input border-input pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCloudinarySecret(!showCloudinarySecret)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCloudinarySecret ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Generated images will be uploaded to Cloudinary and
                        stored as URLs instead of base64 data.
                      </p>
                    </div>
                  )}
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
                type={showMongo ? "text" : "password"}
                placeholder="mongodb+srv://..."
                value={settings.mongoUri}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, mongoUri: e.target.value }))
                }
                className="bg-input border-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowMongo(!showMongo)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showMongo ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Optional: Override the server's database connection string.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">
              {settings.useAI ? "✨ AI Mode" : "📋 Template Mode"}
            </p>
            <p>
              {settings.useAI
                ? `Content uses ${getModelLabel(settings.geminiModel)} and images use ${getModelLabel(settings.imageModel)}. The app routes each request to Google or OpenAI automatically.`
                : "Uses pre-built templates for quick content generation. Great for testing or when APIs are unavailable."}
            </p>
          </div>

          {/* Danger Zone */}
          <div className="border border-destructive/20 rounded-lg overflow-hidden">
            <div className="bg-destructive/10 px-4 py-2 border-b border-destructive/20 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                Danger Zone
              </span>
            </div>
            <div className="p-4 bg-background">
              <p className="text-sm text-muted-foreground mb-3">
                Reset the application to its initial state. This will delete the
                current project and all pinned items.
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
    window.addEventListener(
      "ai-settings-changed",
      handleChange as EventListener,
    );
    return () =>
      window.removeEventListener(
        "ai-settings-changed",
        handleChange as EventListener,
      );
  }, []);

  const toggleMode = () => {
    const current = getAISettings();
    const newSettings = { ...current, useAI: !current.useAI };
    saveAISettings(newSettings);
    setUseAI(newSettings.useAI);
    toast.success(
      newSettings.useAI ? "AI Mode enabled" : "Template Mode enabled",
    );
    window.dispatchEvent(
      new CustomEvent("ai-settings-changed", { detail: newSettings }),
    );
  };

  return (
    <button
      onClick={toggleMode}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
        ${
          useAI
            ? "bg-primary/20 text-primary border border-primary/30"
            : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
        }
      `}
      title={
        useAI
          ? "Using AI - Click to switch to Template Mode"
          : "Using Templates - Click to switch to AI Mode"
      }
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
