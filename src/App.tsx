// YouTube Content OS - Main Application
import { lazy, Suspense, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { getAIGateway } from "@/services/ai-provider";
import { getDatabaseGateway } from "@/services/db-adapter";
import { getStorageGateway } from "@/services/storage-adapter";
import { Navigation } from "@/sections/Navigation";
import { useProjectStore } from "@/state/projectStore";
import type { WorkflowStage } from "@/types";

const DataIngestion = lazy(() =>
  import("@/sections/DataIngestion").then((module) => ({
    default: module.DataIngestion,
  })),
);
const TopicIntelligence = lazy(() =>
  import("@/sections/TopicIntelligence").then((module) => ({
    default: module.TopicIntelligence,
  })),
);
const ScriptStudio = lazy(() =>
  import("@/sections/ScriptStudio").then((module) => ({
    default: module.ScriptStudio,
  })),
);
const StoryboardEngine = lazy(() =>
  import("@/sections/StoryboardEngine").then((module) => ({
    default: module.StoryboardEngine,
  })),
);
const MetadataSuite = lazy(() =>
  import("@/sections/MetadataSuite").then((module) => ({
    default: module.MetadataSuite,
  })),
);
const ShortsGenerator = lazy(() =>
  import("@/sections/ShortsGenerator").then((module) => ({
    default: module.ShortsGenerator,
  })),
);
const DirectImageGenerator = lazy(() =>
  import("@/sections/DirectImageGenerator").then((module) => ({
    default: module.DirectImageGenerator,
  })),
);
const CreatorProfileSetup = lazy(() =>
  import("@/sections/CreatorProfile").then((module) => ({
    default: module.CreatorProfileSetup,
  })),
);
const ProjectComplete = lazy(() =>
  import("@/sections/ProjectComplete").then((module) => ({
    default: module.ProjectComplete,
  })),
);

function StageFallback() {
  return (
    <div className="grid min-h-[45vh] place-items-center rounded-2xl border border-dashed border-border/70 bg-card/40 p-6">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm font-medium">Loading workspace…</span>
      </div>
    </div>
  );
}

function App() {
  const {
    currentStage,
    setCurrentStage,
    currentProject,
    createNewProject,
    setServiceStatus,
  } = useProjectStore();
  // Check health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const ai = getAIGateway();
      const db = getDatabaseGateway();
      const storage = getStorageGateway();

      const isMongoUp = await db.isMongoAvailable();
      const isCloudinaryUp = storage.isCloudinaryAvailable();

      setServiceStatus({
        mongodb: isMongoUp ? "connected" : "disconnected",
        cloudinary: isCloudinaryUp ? "connected" : "disconnected",
        ai: ai.isAvailable() ? "connected" : "disconnected",
      });
    };
    checkHealth();
  }, [setServiceStatus]);

  useEffect(() => {
    if (!currentProject) {
      queueMicrotask(createNewProject);
    }
  }, [createNewProject, currentProject]);

  const handleStageChange = (stage: WorkflowStage) => {
    if (stage === "imagegen") {
      setCurrentStage(stage);
      return;
    }

    const stageOrder: WorkflowStage[] = [
      "ingestion",
      "topics",
      "script",
      "storyboard",
      "metadata",
      "shorts",
      "complete",
    ];
    const targetIndex = stageOrder.indexOf(stage);
    const currentIndex = stageOrder.indexOf(currentStage);

    if (targetIndex <= currentIndex) {
      setCurrentStage(stage);
      return;
    }

    const prerequisites: Record<WorkflowStage, () => boolean> = {
      ingestion: () => true,
      topics: () => true,
      script: () => currentProject?.selectedTopic != null,
      storyboard: () => currentProject?.selectedScript != null,
      metadata: () => currentProject?.selectedStoryboard != null,
      shorts: () => currentProject?.selectedMetadata != null,
      complete: () => currentProject?.selectedMetadata != null,
      imagegen: () => true,
      profile: () => true,
    };

    if (prerequisites[stage]()) {
      setCurrentStage(stage);
    } else {
      toast.error("Complete current stage first");
    }
  };

  if (!currentProject) {
    return (
      <div className="min-h-[100dvh] bg-background p-4">
        <StageFallback />
      </div>
    );
  }

  const renderStage = () => {
    switch (currentStage) {
      case "ingestion":
        return <DataIngestion />;
      case "topics":
        return <TopicIntelligence />;
      case "script":
        return <ScriptStudio />;
      case "storyboard":
        return <StoryboardEngine />;
      case "metadata":
        return <MetadataSuite />;
      case "shorts":
        return <ShortsGenerator />;
      case "complete":
        return <ProjectComplete />;
      case "imagegen":
        return <DirectImageGenerator />;
      case "profile":
        return <CreatorProfileSetup />;
      default:
        return <DataIngestion />;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex overflow-x-hidden">
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            fontFamily: "var(--font-sans)",
          },
        }}
      />

      {/* Navigation Sidebar */}
      <Navigation
        currentStage={currentStage}
        onStageChange={handleStageChange}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 min-h-[100dvh] overflow-y-auto overflow-x-hidden relative">
        {/* Top ambient gradient for a premium feel */}
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/10 via-background/50 to-transparent pointer-events-none -z-10" />

        {/* Mobile header spacer */}
        <div className="lg:hidden h-[73px]" />

        <div className="w-full max-w-6xl mx-auto px-3 py-4 sm:p-6 lg:p-8 xl:p-10 transition-all duration-300">
          {/* Stage Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>{currentStage === "imagegen" ? "Tool" : "Stage"}</span>
              <span>
                {currentStage === "imagegen"
                  ? "•"
                  : [
                      "ingestion",
                      "topics",
                      "script",
                      "storyboard",
                      "metadata",
                      "shorts",
                      "complete",
                    ].indexOf(currentStage) + 1}
              </span>
              <span>of</span>
              <span>{currentStage === "imagegen" ? "•" : "7"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-foreground capitalize leading-tight">
              {currentStage === "ingestion" && "Data Ingestion"}
              {currentStage === "topics" && "Topic Intelligence"}
              {currentStage === "script" && "Script Studio"}
              {currentStage === "storyboard" && "Visual Storyboard"}
              {currentStage === "metadata" && "Metadata Suite"}
              {currentStage === "shorts" && "Shorts Extractor"}
              {currentStage === "complete" && "Project Complete"}
              {currentStage === "imagegen" && "Image Generator"}
              {currentStage === "profile" && "Creator Profile"}
            </h1>
          </div>

          {/* Stage Content */}
          <Suspense fallback={<StageFallback />}>{renderStage()}</Suspense>
        </div>
      </main>
    </div>
  );
}

export default App;
