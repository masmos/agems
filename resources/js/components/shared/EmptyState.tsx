import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    buttonComponent?: React.ReactNode;
    onAction?: () => void;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    buttonComponent,
    onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-25 h-25 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-20 h-20 text-muted-foreground stroke-[1.0]" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>

      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        {description}
      </p>

      {/* Render custom component if provided, otherwise render default button */}
      {buttonComponent ? (
        buttonComponent
      ) : (
        actionLabel && onAction && (
          <Button onClick={onAction} className="gap-2">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}