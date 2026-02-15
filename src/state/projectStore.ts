import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { 
  Project, 
  PinnedItem, 
  WorkflowStage, 
  TopicSuggestion, 
  ScriptVariant,
  StoryboardScene,
  VideoMetadata,
  ServiceStatus 
} from '@/types';

interface ProjectState {
  currentProject: Project | null;
  pinnedItems: PinnedItem[];
  currentStage: WorkflowStage;
  isGenerating: boolean;
  serviceStatus: ServiceStatus;
  
  // Actions
  setCurrentProject: (project: Project | null) => void;
  setPinnedItems: (items: PinnedItem[]) => void;
  addPinnedItem: (item: PinnedItem) => void;
  removePinnedItem: (id: string) => void;
  setCurrentStage: (stage: WorkflowStage) => void;
  setIsGenerating: (generating: boolean) => void;
  setServiceStatus: (status: ServiceStatus) => void;
  
  // Project operations
  updateProject: (updates: Partial<Project>) => void;
  finalizeTopic: (topic: TopicSuggestion) => void;
  finalizeScript: (script: ScriptVariant) => void;
  finalizeStoryboard: (scenes: StoryboardScene[]) => void;
  finalizeMetadata: (metadata: VideoMetadata) => void;
  createNewProject: () => Project;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      currentProject: null,
      pinnedItems: [],
      currentStage: 'ingestion',
      isGenerating: false,
      serviceStatus: {
        mongodb: 'unknown',
        cloudinary: 'unknown',
        ai: 'unknown'
      },

      setCurrentProject: (project) => set({ currentProject: project }),
      
      setPinnedItems: (items) => set({ pinnedItems: items }),
      
      addPinnedItem: (item) => set((state) => ({ 
        pinnedItems: [item, ...state.pinnedItems] 
      })),
      
      removePinnedItem: (id) => set((state) => ({ 
        pinnedItems: state.pinnedItems.filter(i => i.id !== id) 
      })),
      
      setCurrentStage: (stage) => set((state) => {
        if (state.currentProject) {
          return { 
            currentStage: stage,
            currentProject: { ...state.currentProject, stage }
          };
        }
        return { currentStage: stage };
      }),
      
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      
      setServiceStatus: (status) => set({ serviceStatus: status }),

      updateProject: (updates) => set((state) => {
        if (state.currentProject) {
          return { 
            currentProject: { ...state.currentProject, ...updates } 
          };
        }
        return state;
      }),

      finalizeTopic: (topic) => set((state) => {
        if (!state.currentProject) return state;
        return {
          currentStage: 'script',
          currentProject: {
            ...state.currentProject,
            selectedTopic: {
              id: topic.id,
              title: topic.title,
              finalizedAt: new Date()
            },
            selectedScript: null,
            scriptVariants: [],
            selectedStoryboard: null,
            titleSuggestions: [],
            thumbnailConcepts: [],
            selectedMetadata: null,
            stage: 'script'
          }
        };
      }),

      finalizeScript: (script) => set((state) => {
        if (!state.currentProject) return state;
        return {
          currentStage: 'storyboard',
          currentProject: {
            ...state.currentProject,
            selectedScript: {
              id: script.id,
              content: script.content,
              format: script.format
            },
            selectedStoryboard: null,
            titleSuggestions: [],
            thumbnailConcepts: [],
            selectedMetadata: null,
            stage: 'storyboard'
          }
        };
      }),

      finalizeStoryboard: (scenes) => set((state) => {
        if (!state.currentProject) return state;
        return {
          currentStage: 'metadata',
          currentProject: {
            ...state.currentProject,
            selectedStoryboard: {
              scenes,
              format: state.currentProject.selectedScript?.format || 'facecam'
            },
            selectedMetadata: null,
            stage: 'metadata'
          }
        };
      }),

      finalizeMetadata: (metadata) => set((state) => {
        if (!state.currentProject) return state;
        return {
          currentStage: 'shorts',
          currentProject: {
            ...state.currentProject,
            selectedMetadata: metadata,
            stage: 'shorts'
          }
        };
      }),

      createNewProject: () => {
        const project: Project = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          stage: 'ingestion',
          dataSource: null,
          selectedTopic: null,
          selectedScript: null,
          selectedStoryboard: null,
          selectedMetadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        set({ 
          currentProject: project,
          currentStage: 'ingestion'
        });
        return project;
      }
    }),
    {
      name: 'yco-project-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        if (!state.currentProject?.selectedStoryboard?.scenes) {
          return state;
        }
        return {
          ...state,
          currentProject: {
            ...state.currentProject,
            selectedStoryboard: state.currentProject.selectedStoryboard ? {
              ...state.currentProject.selectedStoryboard,
              scenes: state.currentProject.selectedStoryboard.scenes.map(scene => {
                const { generatedImageUrl, ...rest } = scene;
                return rest;
              })
            } : null
          }
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state?.currentProject) {
          state.currentProject.createdAt = new Date(state.currentProject.createdAt);
          state.currentProject.updatedAt = new Date(state.currentProject.updatedAt);
          if (state.currentProject.selectedTopic) {
            state.currentProject.selectedTopic.finalizedAt = new Date(state.currentProject.selectedTopic.finalizedAt);
          }
        }
        if (state?.pinnedItems) {
          state.pinnedItems = state.pinnedItems.map(item => ({
            ...item,
            pinnedAt: new Date(item.pinnedAt)
          }));
        }
      }
    }
  )
);
