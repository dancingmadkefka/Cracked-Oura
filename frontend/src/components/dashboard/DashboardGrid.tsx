import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import RGL, { WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { WidgetCard } from './WidgetCard';
import { WidgetRegistry } from '../WidgetRegistry';
import type { WidgetInstance } from '@/types';
import { cn, isIntradayKey } from '@/lib/utils';

import { DateRangeSelector } from './DateRangeSelector';

import { ErrorBoundary } from '../ErrorBoundary';

const GridLayout = WidthProvider(RGL);


interface DashboardGridProps {
    widgets: WidgetInstance[];
    layout: any[];
    isEditing: boolean;
    onLayoutChange: (layout: any[]) => void;
    onEditWidget?: (widget: WidgetInstance) => void;
    onWidgetChange?: (widget: WidgetInstance) => void;
    onDeleteWidget?: (widgetId: string) => void;

    data?: any;
    selectedDate: Date;
}

export function DashboardGrid({
    widgets,
    layout,
    isEditing,
    onLayoutChange,
    onEditWidget,
    onWidgetChange,
    onDeleteWidget,
    data,
    selectedDate
}: DashboardGridProps) {
    // Fix for RGL mounting issue
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    if (!widgets.length) {
        return (
            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-10 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
                <div className="max-w-2xl space-y-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                        Empty dashboard
                    </p>
                    <h2 className="font-['Space_Grotesk',sans-serif] text-4xl font-semibold tracking-tight text-white">
                        Build a dashboard that answers one question fast.
                    </h2>
                    <p className="text-base text-[hsl(var(--muted-foreground))]">
                        Turn on layout editing, add a small number of decisive widgets, and use separate dashboards for daily focus,
                        trends, and deeper review instead of mixing everything into one wall.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("w-full rounded-[30px] border border-white/8 bg-black/10 shadow-[0_24px_80px_rgba(0,0,0,0.16)]", isEditing && "border-dashed border-white/20 bg-white/5")}>
            {isEditing ? (
                <GridLayout
                    className="layout"
                    layout={layout}
                    cols={12}
                    rowHeight={60}
                    isDraggable={isEditing}
                    isResizable={isEditing}
                    onLayoutChange={onLayoutChange as any}
                    margin={[16, 16]}
                    containerPadding={[16, 16]}
                    draggableHandle=".drag-handle"
                >
                    {widgets.map((widget) => {
                        const layoutItem = layout.find(l => l.i === widget.id);
                        if (!layoutItem) return null;
                        // This ensures the button is always visible for charts that support it, INCLUDING intraday ones (so user can pick "Selected Day")
                        const supportsDateRange = widget.type === 'trend' || widget.type === 'bar';
                        const showDateSelector = (!!widget.config.dateRange || supportsDateRange) && widget.type !== 'table';

                        return (
                            <div key={widget.id} className="relative group">
                                <WidgetCard
                                    title={widget.title}
                                    subtitle={undefined}
                                    isEditing={isEditing}
                                    onEdit={() => onEditWidget?.(widget)}
                                    onDelete={() => onDeleteWidget?.(widget.id)}
                                    className="h-full"
                                    headerContent={showDateSelector && (
                                        <DateRangeSelector
                                            widget={widget}
                                            onUpdate={(updates) => onWidgetChange?.({ ...widget, ...updates })}
                                            selectedDate={selectedDate}
                                            isLocked={isIntradayKey(widget.config.dataKey || widget.config.dataKeys?.[0] || '')}
                                        />
                                    )}
                                >
                                    <div className="h-full pt-2">
                                        <ErrorBoundary>
                                            <WidgetRegistry widget={widget} data={data} date={format(selectedDate, 'yyyy-MM-dd')} />
                                        </ErrorBoundary>
                                    </div>
                                </WidgetCard>
                            </div>
                        );
                    })}
                </GridLayout >
            ) : (
                <div
                    className="grid grid-cols-12 gap-4 p-4"
                    style={{
                        gridAutoRows: '60px'
                    }}
                >
                    {widgets.map((widget) => {
                        const layoutItem = layout.find(l => l.i === widget.id);
                        if (!layoutItem) return null;
                        // This ensures the button is always visible for charts that support it, INCLUDING intraday ones (so user can pick "Selected Day")
                        const supportsDateRange = widget.type === 'trend' || widget.type === 'bar';
                        const showDateSelector = (!!widget.config.dateRange || supportsDateRange) && widget.type !== 'table';

                        return (
                            <div
                                key={widget.id}
                                className="relative group"
                                style={{
                                    gridColumn: `${(layoutItem.x || 0) + 1} / span ${layoutItem.w || 1}`,
                                    gridRow: `${(layoutItem.y || 0) + 1} / span ${layoutItem.h || 1}`
                                }}
                            >
                                <WidgetCard
                                    title={widget.title}
                                    subtitle={undefined}
                                    isEditing={isEditing}
                                    onEdit={() => onEditWidget?.(widget)}
                                    onDelete={() => onDeleteWidget?.(widget.id)}
                                    className="h-full"
                                    headerContent={showDateSelector && (
                                        <DateRangeSelector
                                            widget={widget}
                                            onUpdate={(updates) => onWidgetChange?.({ ...widget, ...updates })}
                                            selectedDate={selectedDate}
                                            isLocked={isIntradayKey(widget.config.dataKey || widget.config.dataKeys?.[0] || '')}
                                        />
                                    )}
                                >
                                    <div className="h-full pt-2">
                                        <ErrorBoundary>
                                            <WidgetRegistry widget={widget} data={data} date={format(selectedDate, 'yyyy-MM-dd')} />
                                        </ErrorBoundary>
                                    </div>
                                </WidgetCard>
                            </div>
                        );
                    })}
                </div >
            )
            }
        </div >
    );
}
