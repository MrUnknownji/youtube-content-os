// Storage Adapter Service - Circuit Breaker Pattern for Image Storage
import type { StorageType } from '@/types';

interface UploadResult {
  id: string;
  url: string;
  storageType: StorageType;
  metadata: {
    width?: number;
    height?: number;
    size?: number;
    mimeType?: string;
  };
}

class StorageGateway {
  private cloudinaryConfig: {
    cloudName?: string;
  };

  constructor() {
    this.cloudinaryConfig = {
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    };
  }

  isCloudinaryAvailable(): boolean {
    return !!(
      this.cloudinaryConfig.cloudName
    );
  }

  async uploadImage(file: File): Promise<UploadResult> {
    // Priority 1: Cloudinary (if configured)
    if (this.isCloudinaryAvailable()) {
      try {
        return await this.uploadToCloudinary(file);
      } catch (error) {
        console.warn('Cloudinary upload failed, falling back to base64:', error);
      }
    }

    // Priority 2: Base64 (always works)
    return this.uploadToBase64(file);
  }

  private async uploadToCloudinary(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'youtube_content_os');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      id: data.public_id,
      url: data.secure_url,
      storageType: 'cloudinary',
      metadata: {
        width: data.width,
        height: data.height,
        size: data.bytes,
        mimeType: data.format
      }
    };
  }

  private async uploadToBase64(file: File): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64String = reader.result as string;
        const id = `base64-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Store in localStorage with size limit check
        const maxSizeMB = 2;
        const sizeInMB = base64String.length * 0.75 / (1024 * 1024);
        
        if (sizeInMB > maxSizeMB) {
          reject(new Error(`Image too large: ${sizeInMB.toFixed(2)}MB. Maximum is ${maxSizeMB}MB for local storage.`));
          return;
        }

        // Store in localStorage
        try {
          const storageKey = `yco-asset-${id}`;
          localStorage.setItem(storageKey, base64String);
          
          resolve({
            id,
            url: base64String,
            storageType: 'base64_mongo',
            metadata: {
              size: file.size,
              mimeType: file.type
            }
          });
        } catch (e) {
          // localStorage quota exceeded
          reject(new Error('Storage quota exceeded. Please clear some images or configure Cloudinary.'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async getImage(id: string): Promise<string | null> {
    // Check if it's a Cloudinary ID
    if (!id.startsWith('base64-')) {
      // Return Cloudinary URL
      if (this.cloudinaryConfig.cloudName) {
        return `https://res.cloudinary.com/${this.cloudinaryConfig.cloudName}/image/upload/${id}`;
      }
      return null;
    }

    // Get from localStorage
    const storageKey = `yco-asset-${id}`;
    return localStorage.getItem(storageKey);
  }

  async deleteImage(id: string): Promise<boolean> {
    if (id.startsWith('base64-')) {
      const storageKey = `yco-asset-${id}`;
      localStorage.removeItem(storageKey);
      return true;
    }

    // Cloudinary deletion would require server-side API call
    console.warn('Cloudinary deletion requires server-side implementation');
    return false;
  }

  // Get storage stats
  getStorageStats(): {
    used: number;
    available: number;
    itemCount: number;
  } {
    let used = 0;
    let itemCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('yco-asset-')) {
        const item = localStorage.getItem(key);
        if (item) {
          used += item.length * 2; // UTF-16 encoding
          itemCount++;
        }
      }
    }

    // localStorage is typically 5-10MB
    const maxStorage = 5 * 1024 * 1024;
    
    return {
      used,
      available: maxStorage - used,
      itemCount
    };
  }

  // Clear all stored images
  clearAllImages(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('yco-asset-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

// Singleton instance
let storageGateway: StorageGateway | null = null;

export function getStorageGateway(): StorageGateway {
  if (!storageGateway) {
    storageGateway = new StorageGateway();
  }
  return storageGateway;
}

export { StorageGateway };
export type { UploadResult };
