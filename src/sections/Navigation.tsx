// Navigation Stepper and Layout Component
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Upload, 
  Lightbulb, 
  FileText, 
  Clapperboard, 
  Tag,
  Check,
  Database,
  Cloud,
  Sparkles,
  Menu,
  X,
  Bookmark,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useProjectStore } from '@/state/projectStore';
import { PinnedItemsSidebar } from '@/sections/PinnedItemsSidebar';
import { SettingsDialog, AIModeToggle } from '@/components/SettingsDialog';
import { ThemeToggle } from '@/components/theme-toggle';
import type { WorkflowStage } from '@/types';

interface NavigationProps {
  currentStage: WorkflowStage;
  onStageChange: (stage: WorkflowStage) => void;
}

const STAGES: { id: WorkflowStage; label: string; icon: React.ElementType }[] = [
  { id: 'ingestion', label: 'Data', icon: Upload },
  { id: 'topics', label: 'Topics', icon: Lightbulb },
  { id: 'script', label: 'Script', icon: FileText },
  { id: 'storyboard', label: 'Visuals', icon: Clapperboard },
  { id: 'metadata', label: 'Meta', icon: Tag },
  { id: 'complete', label: 'Done', icon: Check },
];

const STATUS_COLORS = {
  connected: 'bg-chart-1',
  disconnected: 'bg-destructive',
  mock: 'bg-chart-3',
  unknown: 'bg-muted'
};

export function Navigation({ currentStage, onStageChange }: NavigationProps) {
  const { currentProject, pinnedItems, serviceStatus, createNewProject: storeCreateNewProject } = useProjectStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPinnedSidebar, setShowPinnedSidebar] = useState(false);

  const pinnedCount = pinnedItems.length;

  const getStageStatus = (stageId: WorkflowStage) => {
    if (!currentProject) return 'locked';

    const stageOrder = ['ingestion', 'topics', 'script', 'storyboard', 'metadata', 'complete'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const stageIndex = stageOrder.indexOf(stageId);

    if (stageIndex < currentIndex) return 'completed';
    if (stageId === currentStage) return 'active';
    if (stageIndex === currentIndex + 1) return 'available';
    return 'locked';
  };

  const handleStageClick = (stageId: WorkflowStage) => {
    const status = getStageStatus(stageId);
    if (status === 'locked') {
      return;
    }
    onStageChange(stageId);
    setIsMobileMenuOpen(false);
  };

  const createNewProject = () => {
    storeCreateNewProject();
    onStageChange('ingestion');
    toast.success('New project created');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-sans font-semibold text-sidebar-foreground text-sm">
                Content OS
              </h1>
              <p className="text-xs text-sidebar-foreground/60">YouTube Studio</p>
            </div>
          </div>
        </div>

        {/* New Project Button */}
        <div className="p-4">
          <Button
            onClick={createNewProject}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Stage Navigation */}
        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1">
            {STAGES.map((stage) => {
              const Icon = stage.icon;
              const status = getStageStatus(stage.id);
              
              return (
                <button
                  key={stage.id}
                  onClick={() => handleStageClick(stage.id)}
                  disabled={status === 'locked'}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium
                    transition-colors duration-200
                    ${status === 'active' 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                      : status === 'completed'
                      ? 'text-sidebar-foreground hover:bg-sidebar-accent'
                      : status === 'available'
                      ? 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      : 'text-sidebar-foreground/40 cursor-not-allowed'}
                  `}
                >
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs
                    ${status === 'active' 
                      ? 'bg-sidebar-primary-foreground text-sidebar-primary' 
                      : status === 'completed'
                      ? 'bg-chart-1 text-primary-foreground'
                      : 'bg-sidebar-accent text-sidebar-accent-foreground'}
                  `}>
                    {status === 'completed' ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Icon className="h-3 w-3" />
                    )}
                  </div>
                  <span>{stage.label}</span>
                  {status === 'active' && (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* AI Mode Toggle & Service Status */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          {/* AI Mode Toggle & Theme */}
          <div className="flex items-center justify-between">
            <AIModeToggle />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <SettingsDialog />
            </div>
          </div>
          
          {/* Service Status */}
          <div>
            <p className="text-xs text-sidebar-foreground/60 mb-1">Services</p>
            <div className="flex gap-2">
              <div className="flex items-center gap-1" title="MongoDB">
                <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[serviceStatus.mongodb]}`} />
                <Database className="h-3 w-3 text-sidebar-foreground/60" />
              </div>
              <div className="flex items-center gap-1" title="Cloudinary">
                <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[serviceStatus.cloudinary]}`} />
                <Cloud className="h-3 w-3 text-sidebar-foreground/60" />
              </div>
              <div className="flex items-center gap-1" title="AI">
                <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[serviceStatus.ai]}`} />
                <Sparkles className="h-3 w-3 text-sidebar-foreground/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Pinned Items */}
        <div className="p-4 border-t border-sidebar-border">
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-start gap-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors px-2"
            onClick={() => setShowPinnedSidebar(prev => !prev)}
          >
            <Bookmark className="h-4 w-4" />
            <span>Pinned Items</span>
            {pinnedCount > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {pinnedCount}
              </Badge>
            )}
          </Button>
        </div>
      </aside>

      {/* Pinned Items Sidebar Overlay */}
      {showPinnedSidebar && <PinnedItemsSidebar onClose={() => setShowPinnedSidebar(false)} />}

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-sans font-semibold text-foreground">Content OS</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Service indicators */}
            <div className="flex gap-1 mr-2">
              <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[serviceStatus.mongodb]}`} />
              <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[serviceStatus.cloudinary]}`} />
              <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[serviceStatus.ai]}`} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-border bg-background p-4">
            <div className="flex items-center justify-between mb-4">
               <Button
                onClick={createNewProject}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground mr-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
              <ThemeToggle />
            </div>
            <nav className="space-y-1">
              {STAGES.map((stage) => {
                const Icon = stage.icon;
                const status = getStageStatus(stage.id);
                
                return (
                  <button
                    key={stage.id}
                    onClick={() => handleStageClick(stage.id)}
                    disabled={status === 'locked'}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
                      ${status === 'active' 
                        ? 'bg-primary text-primary-foreground' 
                        : status === 'completed'
                        ? 'text-foreground hover:bg-muted'
                        : status === 'available'
                        ? 'text-foreground/70 hover:bg-muted'
                        : 'text-foreground/40 cursor-not-allowed'}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{stage.label}</span>
                    {status === 'completed' && <Check className="ml-auto h-4 w-4" />}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Mobile Stage Progress */}
        <div className="flex border-t border-border">
          {STAGES.map((stage) => {
            const status = getStageStatus(stage.id);
            return (
              <div
                key={stage.id}
                className={`
                  flex-1 h-1
                  ${status === 'completed' ? 'bg-chart-1' : 
                    status === 'active' ? 'bg-primary' : 'bg-muted'}
                `}
              />
            );
          })}
        </div>
      </header>
    </>
  );
}
