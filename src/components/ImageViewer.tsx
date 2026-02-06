import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Maximize2, Download, X } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageViewer({ src, alt, className = '' }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = async () => {
    try {
      if (src.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = src;
        link.download = `${alt.replace(/\s+/g, '_')}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(src);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${alt.replace(/\s+/g, '_')}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <>
      <div className={`relative group ${className}`}>
        <img 
          src={src} 
          alt={alt}
          className="w-full h-40 object-cover cursor-pointer transition-opacity group-hover:opacity-90"
          onClick={() => setIsOpen(true)}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            title="View fullscreen"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            title="Download image"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-black/95 border-border">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <DialogDescription className="sr-only">Full size preview of {alt}</DialogDescription>
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 z-10 h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="absolute top-2 left-2 z-10 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3 mr-2" />
                Download
              </Button>
            </div>
            <img 
              src={src} 
              alt={alt}
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
