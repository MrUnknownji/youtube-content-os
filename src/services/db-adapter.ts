// Database Adapter Service - Circuit Breaker Pattern for Data Persistence
import type { Project, PinnedItem } from '@/types';

interface DBResponse<T> {
  success: boolean;
  data: T | null;
  fallbackUsed: boolean;
  message: string;
}

class DatabaseGateway {
  private apiUrl: string;

  constructor() {
    const isProd = import.meta.env.PROD;
    this.apiUrl = import.meta.env.VITE_API_URL || (isProd ? '/api' : 'http://localhost:3001/api');
  }

  // Check if MongoDB backend is available
  async isMongoAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Project CRUD Operations
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBResponse<Project>> {
    const isMongoUp = await this.isMongoAvailable();
    
    if (isMongoUp) {
      try {
        const response = await fetch(`${this.apiUrl}/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(project)
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            data: data.data,
            fallbackUsed: false,
            message: 'Project saved to database'
          };
        }
      } catch (error) {
        console.warn('MongoDB save failed, falling back to localStorage:', error);
      }
    }

    // Fallback to localStorage
    return this.saveProjectToLocal(project);
  }

  async getProject(id: string): Promise<DBResponse<Project>> {
    const isMongoUp = await this.isMongoAvailable();
    
    if (isMongoUp) {
      try {
        const response = await fetch(`${this.apiUrl}/projects/${id}`);
        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            data: data.data,
            fallbackUsed: false,
            message: 'Project loaded from database'
          };
        }
      } catch (error) {
        console.warn('MongoDB fetch failed, trying localStorage:', error);
      }
    }

    // Fallback to localStorage
    return this.getProjectFromLocal(id);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<DBResponse<Project>> {
    const isMongoUp = await this.isMongoAvailable();
    
    if (isMongoUp) {
      try {
        const response = await fetch(`${this.apiUrl}/projects/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            data: data.data,
            fallbackUsed: false,
            message: 'Project updated in database'
          };
        }
      } catch (error) {
        console.warn('MongoDB update failed, falling back to localStorage:', error);
      }
    }

    // Fallback to localStorage
    return this.updateProjectInLocal(id, updates);
  }

  async deleteProject(id: string): Promise<DBResponse<void>> {
    const isMongoUp = await this.isMongoAvailable();
    
    if (isMongoUp) {
      try {
        const response = await fetch(`${this.apiUrl}/projects/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          return {
            success: true,
            data: null,
            fallbackUsed: false,
            message: 'Project deleted from database'
          };
        }
      } catch (error) {
        console.warn('MongoDB delete failed, falling back to localStorage:', error);
      }
    }

    // Fallback to localStorage
    return this.deleteProjectFromLocal(id);
  }

  async getAllProjects(): Promise<DBResponse<Project[]>> {
    const isMongoUp = await this.isMongoAvailable();
    
    if (isMongoUp) {
      try {
        const response = await fetch(`${this.apiUrl}/projects`);
        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            data: data.data,
            fallbackUsed: false,
            message: 'Projects loaded from database'
          };
        }
      } catch (error) {
        console.warn('MongoDB fetch failed, falling back to localStorage:', error);
      }
    }

    // Fallback to localStorage
    return this.getAllProjectsFromLocal();
  }

  // Pinned Items Operations
  async addPinnedItem(item: Omit<PinnedItem, 'id' | 'pinnedAt'>): Promise<DBResponse<PinnedItem>> {
    const isMongoUp = await this.isMongoAvailable();
    
    if (isMongoUp) {
      try {
        const response = await fetch(`${this.apiUrl}/pins`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            data: data.data,
            fallbackUsed: false,
            message: 'Item pinned to database'
          };
        }
      } catch (error) {
        console.warn('MongoDB pin failed, falling back to localStorage:', error);
      }
    }

    // Fallback to localStorage
    return this.addPinnedItemToLocal(item);
  }

  async getPinnedItems(): Promise<DBResponse<PinnedItem[]>> {
    const isMongoUp = await this.isMongoAvailable();
    
    if (isMongoUp) {
      try {
        const response = await fetch(`${this.apiUrl}/pins`);
        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            data: data.data,
            fallbackUsed: false,
            message: 'Pinned items loaded from database'
          };
        }
      } catch (error) {
        console.warn('MongoDB fetch failed, falling back to localStorage:', error);
      }
    }

    // Fallback to localStorage
    return this.getPinnedItemsFromLocal();
  }

  async deletePinnedItem(id: string): Promise<DBResponse<void>> {
    const isMongoUp = await this.isMongoAvailable();
    
    if (isMongoUp) {
      try {
        const response = await fetch(`${this.apiUrl}/pins/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          return {
            success: true,
            data: null,
            fallbackUsed: false,
            message: 'Item unpinned from database'
          };
        }
      } catch (error) {
        console.warn('MongoDB unpin failed, falling back to localStorage:', error);
      }
    }

    // Fallback to localStorage
    return this.deletePinnedItemFromLocal(id);
  }

  // LocalStorage Implementation (Fallback)
  private saveProjectToLocal(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): DBResponse<Project> {
    try {
      const id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const newProject: Project = {
        ...project,
        id,
        createdAt: now,
        updatedAt: now
      };

      const projects = this.getLocalProjects();
      projects.push(newProject);
      localStorage.setItem('yco-projects', JSON.stringify(projects));

      return {
        success: true,
        data: newProject,
        fallbackUsed: true,
        message: 'Project saved locally (MongoDB unavailable)'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        fallbackUsed: true,
        message: `Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private getProjectFromLocal(id: string): DBResponse<Project> {
    try {
      const projects = this.getLocalProjects();
      const project = projects.find(p => p.id === id);
      
      if (project) {
        return {
          success: true,
          data: project,
          fallbackUsed: true,
          message: 'Project loaded from local storage'
        };
      }

      return {
        success: false,
        data: null,
        fallbackUsed: true,
        message: 'Project not found in local storage'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        fallbackUsed: true,
        message: `Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private updateProjectInLocal(id: string, updates: Partial<Project>): DBResponse<Project> {
    try {
      const projects = this.getLocalProjects();
      const index = projects.findIndex(p => p.id === id);
      
      if (index === -1) {
        return {
          success: false,
          data: null,
          fallbackUsed: true,
          message: 'Project not found in local storage'
        };
      }

      projects[index] = {
        ...projects[index],
        ...updates,
        updatedAt: new Date()
      };

      localStorage.setItem('yco-projects', JSON.stringify(projects));

      return {
        success: true,
        data: projects[index],
        fallbackUsed: true,
        message: 'Project updated in local storage'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        fallbackUsed: true,
        message: `Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private deleteProjectFromLocal(id: string): DBResponse<void> {
    try {
      const projects = this.getLocalProjects();
      const filtered = projects.filter(p => p.id !== id);
      localStorage.setItem('yco-projects', JSON.stringify(filtered));

      return {
        success: true,
        data: null,
        fallbackUsed: true,
        message: 'Project deleted from local storage'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        fallbackUsed: true,
        message: `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private getAllProjectsFromLocal(): DBResponse<Project[]> {
    try {
      const projects = this.getLocalProjects();
      return {
        success: true,
        data: projects,
        fallbackUsed: true,
        message: 'Projects loaded from local storage'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        fallbackUsed: true,
        message: `Failed to load projects: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private getLocalProjects(): Project[] {
    try {
      const stored = localStorage.getItem('yco-projects');
      if (stored) {
        const projects = JSON.parse(stored);
        // Convert date strings back to Date objects
        return projects.map((p: Project) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          selectedTopic: p.selectedTopic ? {
            ...p.selectedTopic,
            finalizedAt: new Date(p.selectedTopic.finalizedAt)
          } : null
        }));
      }
    } catch (e) {
      console.error('Error parsing local projects:', e);
    }
    return [];
  }

  // Pinned Items LocalStorage
  private addPinnedItemToLocal(item: Omit<PinnedItem, 'id' | 'pinnedAt'>): DBResponse<PinnedItem> {
    try {
      const id = `pin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newItem: PinnedItem = {
        ...item,
        id,
        pinnedAt: new Date()
      };

      const items = this.getLocalPinnedItems();
      items.push(newItem);
      localStorage.setItem('yco-pins', JSON.stringify(items));

      return {
        success: true,
        data: newItem,
        fallbackUsed: true,
        message: 'Item pinned locally (MongoDB unavailable)'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        fallbackUsed: true,
        message: `Failed to pin item: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private getPinnedItemsFromLocal(): DBResponse<PinnedItem[]> {
    try {
      const items = this.getLocalPinnedItems();
      return {
        success: true,
        data: items,
        fallbackUsed: true,
        message: 'Pinned items loaded from local storage'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        fallbackUsed: true,
        message: `Failed to load pinned items: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private deletePinnedItemFromLocal(id: string): DBResponse<void> {
    try {
      const items = this.getLocalPinnedItems();
      const filtered = items.filter(i => i.id !== id);
      localStorage.setItem('yco-pins', JSON.stringify(filtered));

      return {
        success: true,
        data: null,
        fallbackUsed: true,
        message: 'Item unpinned from local storage'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        fallbackUsed: true,
        message: `Failed to unpin item: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private getLocalPinnedItems(): PinnedItem[] {
    try {
      const stored = localStorage.getItem('yco-pins');
      if (stored) {
        const items = JSON.parse(stored);
        return items.map((i: PinnedItem) => ({
          ...i,
          pinnedAt: new Date(i.pinnedAt)
        }));
      }
    } catch (e) {
      console.error('Error parsing local pinned items:', e);
    }
    return [];
  }

  // Export/Import for backup
  exportAllData(): string {
    const data = {
      projects: this.getLocalProjects(),
      pins: this.getLocalPinnedItems(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.projects) {
        localStorage.setItem('yco-projects', JSON.stringify(data.projects));
      }
      if (data.pins) {
        localStorage.setItem('yco-pins', JSON.stringify(data.pins));
      }
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  }
}

// Singleton instance
let dbGateway: DatabaseGateway | null = null;

export function getDatabaseGateway(): DatabaseGateway {
  if (!dbGateway) {
    dbGateway = new DatabaseGateway();
  }
  return dbGateway;
}

export { DatabaseGateway };
export type { DBResponse };
