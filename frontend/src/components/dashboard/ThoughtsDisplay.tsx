import { useState } from "react";
import { ChevronDown, ChevronRight, Terminal, Database } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThoughtsDisplay({ thoughts }: { thoughts: any[] }) {
    const [isOpen, setIsOpen] = useState(false);

    const sqlStep = thoughts.find(t => t.tool === 'execute_query');
    const sqlQuery = sqlStep?.params?.query;

    return (
        <div className="w-full max-w-2xl rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden text-sm mt-3 shadow-md">
            {/* SQL Query */}
            {sqlQuery && (
                <div className="p-3 border-b border-white/6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-5 w-5 rounded-md bg-blue-500/15 flex items-center justify-center">
                            <Database className="h-3 w-3 text-blue-400" />
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-blue-400/80 font-medium">SQL Query</span>
                    </div>
                    <div className="font-mono text-xs text-blue-300/90 overflow-x-auto whitespace-pre-wrap bg-black/30 p-3 rounded-lg border border-white/6">
                        {sqlQuery}
                    </div>
                </div>
            )}

            {/* Python Code */}
            {thoughts.filter(t => t.tool === 'run_python').map((step, i) => {
                const resultStep = thoughts.find(t => t.step === step.step + 1 && t.type === 'tool_result');
                return (
                    <div key={i} className="p-3 border-b border-white/6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-5 w-5 rounded-md bg-yellow-500/15 flex items-center justify-center">
                                <Terminal className="h-3 w-3 text-yellow-400" />
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-yellow-400/80 font-medium">Python Analysis</span>
                        </div>
                        <div className="space-y-2">
                            <div className="font-mono text-xs text-yellow-300/80 overflow-x-auto whitespace-pre-wrap bg-black/30 p-3 rounded-lg border border-white/6">
                                {step.params?.code}
                            </div>
                            {resultStep && (
                                <div className="font-mono text-xs text-white/50 overflow-x-auto whitespace-pre-wrap bg-black/20 p-3 rounded-lg border border-dashed border-white/6">
                                    <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-white/30 block mb-1">Result</span>
                                    {typeof resultStep.content === 'string' ? resultStep.content : JSON.stringify(resultStep.content)}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Collapsible Debug */}
            <div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between p-2.5 px-3 bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-xs text-white/40"
                >
                    <span className="flex items-center gap-2">
                        <Terminal className="h-3 w-3" />
                        Debug log
                    </span>
                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>

                {isOpen && (
                    <div className="p-3 bg-black/20 space-y-3 border-t border-white/6">
                        {thoughts.map((step, i) => (
                            <ThoughtStep key={i} step={step} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ThoughtStep({ step }: { step: any }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const content = typeof step.content === 'string' ? step.content : JSON.stringify(step.content, null, 2);
    const isLong = content.split('\n').length > 10;

    return (
        <div className="text-xs">
            <div className="font-semibold text-white/60 flex items-center gap-2 mb-1">
                <span className="bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] px-1.5 py-0.5 rounded text-[9px] uppercase tracking-[0.2em] font-['Space_Grotesk',sans-serif]">
                    Step {step.step}
                </span>
                <span className="text-white/40">{step.type}</span>
            </div>
            <div className="font-mono bg-black/30 p-2.5 rounded-lg border border-white/6 text-white/50 whitespace-pre-wrap overflow-x-auto relative">
                <div className={cn(
                    "overflow-hidden transition-all",
                    !isExpanded && isLong ? "max-h-[150px] mask-linear-fade" : ""
                )}>
                    {content}
                </div>
                {isLong && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mt-2 text-[9px] uppercase tracking-[0.2em] font-bold text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
                    >
                        {isExpanded ? "Show Less" : "Show Full Output"}
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                )}
            </div>
        </div>
    );
}

