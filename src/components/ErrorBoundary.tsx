import React from 'react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('🔴 GameBoard crashed:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-red-500/30 p-8 max-w-md w-full shadow-2xl text-center">
                        <div className="text-6xl mb-4">💥</div>
                        <h3 className="text-white font-black text-xl mb-2">Something went wrong</h3>
                        <p className="text-red-300/60 text-sm mb-4 font-mono break-words">{this.state.error?.message}</p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
                        >
                            🔄 Reload Game
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
