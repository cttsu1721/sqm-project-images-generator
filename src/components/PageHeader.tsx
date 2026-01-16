import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[var(--sqm-text-primary)] tracking-wide">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-2 text-[var(--sqm-text-secondary)] text-sm max-w-xl">
              {subtitle}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Decorative divider */}
      <div className="mt-6 sqm-divider" />
    </header>
  );
}
