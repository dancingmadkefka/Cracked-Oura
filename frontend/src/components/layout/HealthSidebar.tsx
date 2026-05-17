import { cn } from '@/lib/utils';
import {
  CalendarDays,
  Moon,
  Brain,
  Activity,
  Shield,
  TrendingUp,
  BookOpen,
  LayoutDashboard,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export type AppView =
  | 'today'
  | 'sleep'
  | 'readiness'
  | 'activity'
  | 'resilience'
  | 'trends'
  | 'journal'
  | 'dashboards'
  | 'ai';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ElementType;
  section?: 'health' | 'tools';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'today', label: 'Today', icon: CalendarDays, section: 'health' },
  { id: 'sleep', label: 'Sleep', icon: Moon, section: 'health' },
  { id: 'readiness', label: 'Readiness', icon: Brain, section: 'health' },
  { id: 'activity', label: 'Activity', icon: Activity, section: 'health' },
  { id: 'resilience', label: 'Resilience', icon: Shield, section: 'health' },
  { id: 'trends', label: 'Trends', icon: TrendingUp, section: 'tools' },
  { id: 'journal', label: 'Journal', icon: BookOpen, section: 'tools' },
  { id: 'dashboards', label: 'Dashboards', icon: LayoutDashboard, section: 'tools' },
  { id: 'ai', label: 'AI Analyst', icon: Sparkles, section: 'tools' },
];

interface HealthSidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onSettingsClick?: () => void;
  className?: string;
}

export function HealthSidebar({
  activeView,
  onViewChange,
  collapsed = false,
  onToggleCollapse,
  onSettingsClick,
  className,
}: HealthSidebarProps) {
  const sections = ['health', 'tools'] as const;

  return (
    <div className={cn(
      'flex flex-col border-r border-white/[0.04] bg-[#060608]/95 backdrop-blur-xl text-white/70',
      collapsed ? 'w-[60px]' : 'w-[220px]',
      className
    )}>
      <div className="border-b border-white/[0.04] px-4 py-4">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-xl ring-1 ring-white/10">
            <img src="icon.png" alt="Logo" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-['Space_Grotesk',sans-serif] text-[14px] font-medium tracking-tight text-white/95">
                Cracked Oura
              </p>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 py-3">
        <div className="px-2 space-y-4">
          {sections.map((section) => (
            <div key={section}>
              {!collapsed && (
                <p className="px-3 text-[10px] font-semibold tracking-widest text-white/25 uppercase mb-1.5">
                  {section}
                </p>
              )}
              <div className="space-y-0.5">
                {NAV_ITEMS.filter(n => n.section === section).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={cn(
                        'h-9 w-full rounded-lg justify-start gap-2.5 transition-all text-sm font-medium',
                        collapsed ? 'px-0 justify-center' : 'px-3',
                        isActive
                          ? 'bg-white/[0.07] text-white/95'
                          : 'text-white/45 hover:bg-white/[0.04] hover:text-white/70'
                      )}
                      onClick={() => onViewChange(item.id)}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="space-y-0.5 p-2 border-t border-white/[0.04]">
        {onSettingsClick && (
          <Button
            variant="ghost"
            className={cn(
              'h-9 w-full rounded-lg justify-start gap-2.5 text-sm font-medium text-white/40 hover:bg-white/[0.04] hover:text-white/70',
              collapsed && 'px-0 justify-center'
            )}
            onClick={onSettingsClick}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Button>
        )}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-full rounded-lg text-white/30 hover:bg-white/[0.04] hover:text-white/60"
            onClick={onToggleCollapse}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
    </div>
  );
}
