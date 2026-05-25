"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/lib/logger";
import { GlassCard, GoldButton } from "./index";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("[ErrorBoundary] Unhandled render error captured:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full w-full items-center justify-center p-6 text-center">
          <GlassCard className="max-w-sm p-6 border border-velora-rose/25 bg-velora-rose/5" hover={false}>
            <div className="mx-auto w-12 h-12 rounded-full bg-velora-rose/10 flex items-center justify-center mb-4">
              <AlertTriangle className="text-velora-rose" size={24} />
            </div>
            <h3 className="text-heading text-sm text-velora-text mb-2">
              Une erreur est survenue
            </h3>
            <p className="text-xs text-velora-text-muted mb-6 leading-relaxed">
              Nous avons rencontré un problème lors du chargement de cet onglet. Veuillez réinitialiser ou rafraîchir.
            </p>
            <GoldButton onClick={this.handleReset} fullWidth size="sm">
              Réinitialiser l&apos;onglet
            </GoldButton>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const ComponentWithErrorBoundary = (props: P) => (
    <AppErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </AppErrorBoundary>
  );

  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";
  ComponentWithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}
