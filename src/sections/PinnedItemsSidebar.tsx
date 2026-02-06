import { useState } from 'react';
import { 
  X, 
  Lightbulb, 
  FileText, 
  Clapperboard, 
  Tag, 
  Database,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    } catch (error) {
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
      case 'thumbnail_concept': return Tag; // Or ImageIcon if imported
      default: return Database;
    }
  };

  const renderContent = (item: PinnedItem) => {
    const data = item.content as any;
    
    switch (item.itemType) {
      case 'topic':
        return (
          <>
            <h4 className="font-medium text-sm mb-1">{data.title}</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{data.predictedScore} Score</Badge>
            </div>
          </>
        );
      case 'script':
        return (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs uppercase">{data.format}</Badge>
              <span className="text-xs text-muted-foreground">{data.estimatedDuration}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3 font-mono bg-muted/50 p-2 rounded">
              {data.content?.substring(0, 100)}...
            </p>
          </>
        );
      case 'storyboard':
        return (
          <>
            <div className="flex items-center gap-2 mb-2">
               <Badge variant="outline" className="text-xs">{data.length} Scenes</Badge>
            </div>
            {data[0] && (
               <p className="text-xs text-muted-foreground line-clamp-2">
                 Scene 1: {data[0].visualDescription}
               </p>
            )}
          </>
        );
      case 'title':
        return <h4 className="font-medium text-sm">{data}</h4>;
      case 'description':
        return <p className="text-xs text-muted-foreground line-clamp-4">{data}</p>;
      case 'thumbnail_concept':
        return (
          <>
            <h4 className="font-medium text-sm mb-1">{data.title}</h4>
            <p className="text-xs text-muted-foreground">{data.description}</p>
          </>
        );
      default:
        return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l border-border shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <h3 className="font-semibold text-foreground">Pinned Items</h3>
          <Badge variant="secondary" className="ml-2">{pinnedItems.length}</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="topic">Topics</TabsTrigger>
            <TabsTrigger value="script">Scripts</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 p-4">
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
                        <div className="p-2 bg-muted rounded-md mt-0.5">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                              {item.itemType.replace('_', ' ')}
                            </span>
                            <div className="flex gap-1">
                               {/* Future: Add 'Go to Item' Feature */}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive/70 hover:text-destructive"
                                onClick={() => handleUnpin(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
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
        </ScrollArea>
      </Tabs>
    </div>
  );
}
