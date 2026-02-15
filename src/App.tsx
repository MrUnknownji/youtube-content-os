// YouTube Content OS - Main Application
import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { getAIGateway } from '@/services/ai-provider';
import { getDatabaseGateway } from '@/services/db-adapter';
import { getStorageGateway } from '@/services/storage-adapter';
import { Navigation } from '@/sections/Navigation';
import { DataIngestion } from '@/sections/DataIngestion';
import { TopicIntelligence } from '@/sections/TopicIntelligence';
import { ScriptStudio } from '@/sections/ScriptStudio';
import { StoryboardEngine } from '@/sections/StoryboardEngine';
import { MetadataSuite } from '@/sections/MetadataSuite';
import { ShortsGenerator } from '@/sections/ShortsGenerator';
import { DirectImageGenerator } from '@/sections/DirectImageGenerator';
import { CreatorProfileSetup } from '@/sections/CreatorProfile';
import { useProjectStore } from '@/state/projectStore';
import type { WorkflowStage } from '@/types';

function App() {
  const { currentStage, setCurrentStage, currentProject, createNewProject, setServiceStatus } = useProjectStore();
  const [isLoading, setIsLoading] = useState(true);

  // Check health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const ai = getAIGateway();
      const db = getDatabaseGateway();
      const storage = getStorageGateway();
      
      const isMongoUp = await db.isMongoAvailable();
      const isCloudinaryUp = storage.isCloudinaryAvailable();
      
      setServiceStatus({
        mongodb: isMongoUp ? 'connected' : 'disconnected',
        cloudinary: isCloudinaryUp ? 'connected' : 'disconnected',
        ai: ai.isAvailable() ? 'connected' : 'disconnected'
      });
    };
    checkHealth();
  }, []);

  useEffect(() => {
    if (!currentProject) {
      createNewProject();
    }
    setIsLoading(false);
  }, []);

  const handleStageChange = (stage: WorkflowStage) => {
    if (stage === 'imagegen') {
      setCurrentStage(stage);
      return;
    }

    if (!currentProject) {
      toast.error('No active project');
      return;
    }

    const stageOrder: WorkflowStage[] = ['ingestion', 'topics', 'script', 'storyboard', 'metadata', 'shorts', 'complete'];
    const targetIndex = stageOrder.indexOf(stage);
    const currentIndex = stageOrder.indexOf(currentStage);

    if (targetIndex <= currentIndex) {
      setCurrentStage(stage);
      return;
    }

    const prerequisites: Record<WorkflowStage, () => boolean> = {
      ingestion: () => true,
      topics: () => true,
      script: () => currentProject.selectedTopic !== null,
      storyboard: () => currentProject.selectedScript !== null,
      metadata: () => currentProject.selectedStoryboard !== null,
      shorts: () => currentProject.selectedMetadata !== null,
      complete: () => currentProject.selectedMetadata !== null,
      imagegen: () => true
    };

    if (prerequisites[stage]()) {
      setCurrentStage(stage);
    } else {
      toast.error('Complete current stage first');
    }
  };

  const renderStage = () => {
    switch (currentStage) {
      case 'ingestion':
        return <DataIngestion />;
      case 'topics':
        return <TopicIntelligence />;
      case 'script':
        return <ScriptStudio />;
      case 'storyboard':
        return <StoryboardEngine />;
      case 'metadata':
        return <MetadataSuite />;
      case 'shorts':
        return <ShortsGenerator />;
      case 'complete':
        return (
          <div className="space-y-6">
            <ShortsGenerator />
            <CreatorProfileSetup />
          </div>
        );
      case 'imagegen':
        return <DirectImageGenerator />;
      default:
        return <DataIngestion />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
            <span className="text-primary-foreground font-bold">C</span>
          </div>
          <span className="text-foreground font-sans">Loading Content OS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            fontFamily: 'var(--font-sans)',
          },
        }}
      />
      
      {/* Navigation Sidebar */}
      <Navigation 
        currentStage={currentStage} 
        onStageChange={handleStageChange} 
      />

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto">
        {/* Mobile header spacer */}
        <div className="lg:hidden h-[73px]" />
        
        <div className="max-w-5xl mx-auto p-6 lg:p-8">
          {/* Stage Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>{currentStage === 'imagegen' ? 'Tool' : 'Stage'}</span>
              <span>{currentStage === 'imagegen' ? '•' : ['ingestion', 'topics', 'script', 'storyboard', 'metadata', 'shorts', 'complete'].indexOf(currentStage) + 1}</span>
              <span>of</span>
              <span>{currentStage === 'imagegen' ? '•' : '7'}</span>
            </div>
            <h1 className="text-3xl font-bold font-sans text-foreground capitalize">
              {currentStage === 'ingestion' && 'Data Ingestion'}
              {currentStage === 'topics' && 'Topic Intelligence'}
              {currentStage === 'script' && 'Script Studio'}
              {currentStage === 'storyboard' && 'Visual Storyboard'}
              {currentStage === 'metadata' && 'Metadata Suite'}
              {currentStage === 'shorts' && 'Shorts Extractor'}
              {currentStage === 'complete' && 'Project Complete'}
              {currentStage === 'imagegen' && 'Image Generator'}
            </h1>
          </div>

          {/* Stage Content */}
          {renderStage()}
        </div>
      </main>
    </div>
  );
}

export default App;
