import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Trash2 } from "lucide-react";
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
        <Card className={cn(
            "group relative flex h-full flex-col overflow-hidden rounded-2xl glass-card transition-colors hover:bg-white/[0.07]",
            isEditing && "ring-1 ring-white/[0.08]",
            className
        )}>
            {isEditing && (
                <div
                    className="drag-handle absolute inset-x-0 top-0 z-[100] h-6 flex cursor-move items-center justify-center bg-white/[0.02] opacity-0 transition-opacity group-hover:opacity-100"
                    title="Drag to move"
                >
                    <div className="h-1 w-8 rounded-full bg-white/20" />
                </div>
            )}
            <CardHeader className={cn("relative z-[50] flex flex-row items-center justify-between space-y-0 px-6 pb-2 pt-6")}>
                <div className="flex flex-col gap-0.5">
                    <CardTitle className="font-['Space_Grotesk',sans-serif] text-[15px] font-medium tracking-tight text-white/90">
                        {title}
                    </CardTitle>
                    {subtitle && <p className="text-[11px] font-medium text-white/40 tracking-wide">{subtitle}</p>}
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
        </Card>
    );
}
