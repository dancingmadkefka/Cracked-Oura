import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Trash2, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    isEditing?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    className?: string;
    headerContent?: React.ReactNode;
}

export function WidgetCard({
    title,
    subtitle,
    children,
    isEditing = false,
    onEdit,
    onDelete,
    className,
    headerContent
}: WidgetCardProps) {
    return (
        <Card className={cn("relative flex h-full flex-col overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,20,29,0.96),rgba(10,12,18,0.94))] shadow-[0_18px_60px_rgba(0,0,0,0.22)]", className)}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_24%)]" />
            {isEditing && (
                <div
                    className="drag-handle absolute left-1/2 top-0 z-[100] flex h-6 w-14 -translate-x-1/2 items-center justify-center rounded-b-xl border-x border-b border-white/10 bg-white/10 backdrop-blur-[6px] opacity-0 shadow-sm transition-all group-hover:opacity-100 cursor-move"
                    title="Drag to move"
                >
                    <GripHorizontal className="h-4 w-4 text-white/65" />
                </div>
            )}
            <CardHeader className={cn("relative z-[50] flex flex-row items-center justify-between space-y-0 px-5 pb-3 pt-5")}>
                <div className="flex flex-col">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">Widget</p>
                    <CardTitle className="mt-1 font-['Space_Grotesk',sans-serif] text-base font-semibold tracking-tight text-white">{title}</CardTitle>
                    {subtitle && <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{subtitle}</p>}
                </div>
                <div className="relative z-[60] flex items-center gap-2">
                    {headerContent}

                    {isEditing && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-xl text-white/65 hover:bg-white/8 hover:text-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit?.();
                                }}
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-xl text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete?.();
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                </div>
            </CardHeader>
            <CardContent className="relative z-[1] flex-1 min-h-0 p-5 pt-0">
                {children}
            </CardContent>
        </Card >
    );
}
