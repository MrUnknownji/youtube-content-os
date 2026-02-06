// Global State Store for YouTube Content OS
import type { 
  Project, 
  PinnedItem, 
  WorkflowStage, 
  DataSource, 
  TopicSuggestion, 
  ScriptVariant,
  StoryboardScene,
  VideoMetadata,
  ServiceStatus 
} from '@/types';

// Create a simple event-based store
class AppStore {
  private listeners: Map<string, Set<() => void>> = new Map();
  
  // State
  private currentProject: Project | null = null;
  private pinnedItems: PinnedItem[] = [];
  private currentStage: WorkflowStage = 'ingestion';
  private isGenerating: boolean = false;
  private serviceStatus: ServiceStatus = {
    mongodb: 'unknown',
    cloudinary: 'unknown',
    ai: 'unknown'
  };

  constructor() {
    this.loadFromLocalStorage();
    this.checkServiceStatus();
  }

  // Subscribe to changes
  subscribe(key: string, callback: () => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
    
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  private emit(key: string) {
    this.listeners.get(key)?.forEach(cb => cb());
  }

  // Getters
  getCurrentProject(): Project | null {
    return this.currentProject;
  }

  getPinnedItems(): PinnedItem[] {
    return this.pinnedItems;
  }

  getCurrentStage(): WorkflowStage {
    return this.currentStage;
  }

  getIsGenerating(): boolean {
    return this.isGenerating;
  }

  getServiceStatus(): ServiceStatus {
    return this.serviceStatus;
  }

  // Setters
  setCurrentProject(project: Project | null) {
    this.currentProject = project;
    this.saveToLocalStorage();
    this.emit('project');
  }

  setPinnedItems(items: PinnedItem[]) {
    this.pinnedItems = items;
    this.saveToLocalStorage();
    this.emit('pinnedItems');
  }

  addPinnedItem(item: PinnedItem) {
    this.pinnedItems = [item, ...this.pinnedItems];
    this.saveToLocalStorage();
    this.emit('pinnedItems');
  }

  removePinnedItem(id: string) {
    this.pinnedItems = this.pinnedItems.filter(item => item.id !== id);
    this.saveToLocalStorage();
    this.emit('pinnedItems');
  }

  setCurrentStage(stage: WorkflowStage) {
    this.currentStage = stage;
    if (this.currentProject) {
      this.currentProject.stage = stage;
      this.saveToLocalStorage();
    }
    this.emit('stage');
  }

  setIsGenerating(generating: boolean) {
    this.isGenerating = generating;
    this.emit('generating');
  }

  setServiceStatus(status: ServiceStatus) {
    this.serviceStatus = status;
    this.emit('serviceStatus');
  }

  // Project operations
  updateProjectDataSource(dataSource: DataSource) {
    if (this.currentProject) {
      this.currentProject.dataSource = dataSource;
      this.saveToLocalStorage();
      this.emit('project');
    }
  }

  updateProject(updates: Partial<Project>) {
    if (this.currentProject) {
      this.currentProject = { ...this.currentProject, ...updates };
      this.saveToLocalStorage();
      this.emit('project');
    }
  }

  finalizeTopic(topic: TopicSuggestion) {
    if (this.currentProject) {
      this.currentProject.selectedTopic = {
        id: topic.id,
        title: topic.title,
        finalizedAt: new Date()
      };
      // Clear downstream
      this.currentProject.selectedScript = null;
      this.currentProject.scriptVariants = [];
      this.currentProject.selectedStoryboard = null;
      this.currentProject.titleSuggestions = [];
      this.currentProject.thumbnailConcepts = [];
      this.currentProject.selectedMetadata = null;
      this.currentProject.stage = 'script';
      this.currentStage = 'script';
      this.saveToLocalStorage();
      this.emit('project');
      this.emit('stage');
    }
  }

  finalizeScript(script: ScriptVariant) {
    if (this.currentProject) {
      this.currentProject.selectedScript = {
        id: script.id,
        content: script.content,
        format: script.format
      };
      // Clear downstream
      this.currentProject.selectedStoryboard = null;
      this.currentProject.titleSuggestions = [];
      this.currentProject.thumbnailConcepts = [];
      this.currentProject.selectedMetadata = null;
      this.currentProject.stage = 'storyboard';
      this.currentStage = 'storyboard';
      this.saveToLocalStorage();
      this.emit('project');
      this.emit('stage');
    }
  }

  finalizeStoryboard(scenes: StoryboardScene[]) {
    if (this.currentProject) {
      this.currentProject.selectedStoryboard = {
        scenes,
        format: this.currentProject.selectedScript?.format || 'facecam'
      };
      // Clear downstream
      this.currentProject.selectedMetadata = null;
      this.currentProject.stage = 'metadata';
      this.currentStage = 'metadata';
      this.saveToLocalStorage();
      this.emit('project');
      this.emit('stage');
    }
  }

  finalizeMetadata(metadata: VideoMetadata) {
    if (this.currentProject) {
      this.currentProject.selectedMetadata = metadata;
      this.currentProject.stage = 'complete';
      this.currentStage = 'complete';
      this.saveToLocalStorage();
      this.emit('project');
      this.emit('stage');
    }
  }

  // Persistence
  private saveToLocalStorage() {
    try {
      const data = {
        currentProject: this.currentProject,
        pinnedItems: this.pinnedItems,
        currentStage: this.currentStage
      };
      localStorage.setItem('yco-store', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('yco-store');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.currentProject) {
          this.currentProject = {
            ...data.currentProject,
            createdAt: new Date(data.currentProject.createdAt),
            updatedAt: new Date(data.currentProject.updatedAt),
            selectedTopic: data.currentProject.selectedTopic ? {
              ...data.currentProject.selectedTopic,
              finalizedAt: new Date(data.currentProject.selectedTopic.finalizedAt)
            } : null
          };
        }
        if (data.pinnedItems) {
          this.pinnedItems = data.pinnedItems.map((item: PinnedItem) => ({
            ...item,
            pinnedAt: new Date(item.pinnedAt)
          }));
        }
        if (data.currentStage) {
          this.currentStage = data.currentStage;
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
  }

  // Check service status
  private async checkServiceStatus() {
    try {
      const isProd = import.meta.env.PROD;
      const apiUrl = import.meta.env.VITE_API_URL || (isProd ? '/api' : 'http://localhost:3001/api');
      const response = await fetch(`${apiUrl}/health`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        this.setServiceStatus({
          mongodb: data.data.services.mongodb.status === 'connected' ? 'connected' : 'disconnected',
          cloudinary: data.data.services.cloudinary.status === 'connected' ? 'connected' : 'disconnected',
          ai: data.data.services.ai.status === 'connected' ? 'connected' : 
              data.data.services.ai.status === 'mock' ? 'mock' : 'disconnected'
        });
      }
    } catch {
      // All services unavailable
      this.setServiceStatus({
        mongodb: 'disconnected',
        cloudinary: 'disconnected',
        ai: 'mock'
      });
    }
  }

  // Create new project
  createNewProject(): Project {
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
    this.setCurrentProject(project);
    this.setCurrentStage('ingestion');
    return project;
  }

  // Export project data
  exportProject(): string {
    if (!this.currentProject) return '';
    return JSON.stringify(this.currentProject, null, 2);
  }

  // Import project data
  importProject(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      this.setCurrentProject(data);
      return true;
    } catch (e) {
      console.error('Failed to import project:', e);
      return false;
    }
  }
}

// Singleton instance
const store = new AppStore();
export default store;
