import React from 'react';
import Link from 'next/link';
import { FolderOpen, LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  description: string;
  icon?: LucideIcon;
  compact?: boolean;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export function EmptyState({
  title = 'Belum ada data tersedia',
  description,
  icon: Icon = FolderOpen,
  compact = false,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center border border-dashed border-[#E8E2D8] rounded-3xl bg-white text-center shadow-xs max-w-2xl mx-auto my-6 ${
        compact ? 'py-8 px-5' : 'py-16 px-6'
      }`}
    >
      <div
        className={`bg-[#FAF8F5] rounded-2xl text-[#C8A46A] mb-3 shadow-xs border border-[#E8E2D8] ${
          compact ? 'p-3' : 'p-4'
        }`}
      >
        <Icon className={compact ? 'w-6 h-6 text-[#C8A46A]' : 'w-8 h-8 text-[#C8A46A]'} />
      </div>
      <h4 className={`font-serif font-semibold text-[#1A1A1A] mb-2 tracking-tight ${compact ? 'text-lg' : 'text-xl'}`}>
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-[#1A1A1A]/70 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel || action || children) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && (
            actionHref ? (
              <Link
                href={actionHref}
                className="px-5 py-2.5 rounded-2xl bg-[#C8A46A] hover:bg-[#b59157] text-white text-xs font-semibold shadow-xs transition active:scale-95"
              >
                {actionLabel}
              </Link>
            ) : onAction ? (
              <button
                type="button"
                onClick={onAction}
                className="px-5 py-2.5 rounded-2xl bg-[#C8A46A] hover:bg-[#b59157] text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              >
                {actionLabel}
              </button>
            ) : null
          )}
          {secondaryActionLabel && (
            secondaryActionHref ? (
              <Link
                href={secondaryActionHref}
                className="px-5 py-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#E8E2D8] text-[#1A1A1A] text-xs font-semibold border border-[#E8E2D8] transition active:scale-95"
              >
                {secondaryActionLabel}
              </Link>
            ) : onSecondaryAction ? (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="px-5 py-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#E8E2D8] text-[#1A1A1A] text-xs font-semibold border border-[#E8E2D8] transition active:scale-95 cursor-pointer"
              >
                {secondaryActionLabel}
              </button>
            ) : null
          )}
          {action}
          {children}
        </div>
      )}
    </div>
  );
}
