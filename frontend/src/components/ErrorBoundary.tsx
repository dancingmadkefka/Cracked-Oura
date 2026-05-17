import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <p className="text-sm font-medium text-white/70">Widget Error</p>
                    <p className="text-[10px] text-white/30 max-w-[200px] truncate mt-1" title={this.state.error?.message}>
                        {this.state.error?.message || "Unknown error"}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
