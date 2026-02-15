import { useState } from 'react';
import { 
  X, 
  Lightbulb, 
  FileText, 
  Clapperboard, 
  Tag, 
  Database,
  Trash2,
  Scissors
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useProjectStore } from '@/state/projectStore';
import { getDatabaseGateway } from '@/services/db-adapter';
import { toast } from 'sonner';
import type { PinnedItem } from '@/types';

interface PinnedItemsSidebarProps {
  onClose: () => void;
}

export function PinnedItemsSidebar({ onClose }: PinnedItemsSidebarProps) {
  const { pinnedItems, removePinnedItem } = useProjectStore();
  const db = getDatabaseGateway();
  const [activeTab, setActiveTab] = useState('all');

  const handleUnpin = async (id: string) => {
    try {
      const result = await db.deletePinnedItem(id);
      if (result.success) {
        removePinnedItem(id);
        toast.success('Item unpinned');
      } else {
        toast.error('Failed to unpin item');
      }
    } catch {
      toast.error('Error removing item');
    }
  };

  const filteredItems = activeTab === 'all' 
    ? pinnedItems 
    : pinnedItems.filter(item => item.itemType === activeTab);

  const getIcon = (type: string) => {
    switch (type) {
      case 'topic': return Lightbulb;
      case 'script': return FileText;
      case 'storyboard': return Clapperboard;
      case 'title': return Tag;
      case 'description': return FileText;
      case 'thumbnail_concept': return Tag;
      case 'shorts': return Scissors;
      default: return Database;
    }
  };

  const renderContent = (item: PinnedItem) => {
    const data = item.content as unknown as Record<string, unknown>;
    
    switch (item.itemType) {
      case 'topic':
        return (
          <>
            <h4 className="font-medium text-sm mb-1">{String(data.title)}</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{String(data.predictedScore)} Score</Badge>
            </div>
          </>
        );
      case 'script':
        return (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs uppercase">{String(data.format)}</Badge>
              <span className="text-xs text-muted-foreground">{String(data.estimatedDuration)}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3 font-mono bg-muted/50 p-2 rounded">
              {String(data.content)?.substring(0, 100)}...
            </p>
          </>
        );
      case 'storyboard':
        return (
          <>
            <div className="flex items-center gap-2 mb-2">
               <Badge variant="outline" className="text-xs">{Array.isArray(data) ? data.length : 0} Scenes</Badge>
            </div>
            {Array.isArray(data) && data[0] && (
               <p className="text-xs text-muted-foreground line-clamp-2">
                 Scene 1: {String(data[0].visualDescription)}
               </p>
            )}
          </>
        );
      case 'title':
        return <h4 className="font-medium text-sm">{String(data)}</h4>;
      case 'description':
        return <p className="text-xs text-muted-foreground line-clamp-4">{String(data)}</p>;
      case 'thumbnail_concept':
        return (
          <>
            <h4 className="font-medium text-sm mb-1">{String(data.title)}</h4>
            <p className="text-xs text-muted-foreground">{String(data.description)}</p>
          </>
        );
      case 'shorts':
        return (
          <>
            <h4 className="font-medium text-sm mb-1">{String(data.title)}</h4>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">{String(data.duration)}s</Badge>
              <Badge variant="secondary" className="text-xs uppercase">{String(data.contentType)}</Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{String(data.hookText)}</p>
          </>
        );
      default:
        return <pre className="text-xs overflow-hidden">{JSON.stringify(data, null, 2).slice(0, 100)}...</pre>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-background border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <h3 className="font-semibold text-foreground">Pinned Items</h3>
            <Badge variant="secondary">{pinnedItems.length}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-4 pt-4 flex-shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="topic">Topics</TabsTrigger>
              <TabsTrigger value="script">Scripts</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="mx-auto h-8 w-8 mb-3 opacity-20" />
                <p>No pinned items found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const Icon = getIcon(item.itemType);
                  return (
                    <Card key={item.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-muted rounded-md mt-0.5 flex-shrink-0">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                {item.itemType.replace('_', ' ')}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive/70 hover:text-destructive flex-shrink-0"
                                onClick={() => handleUnpin(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            {renderContent(item)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
