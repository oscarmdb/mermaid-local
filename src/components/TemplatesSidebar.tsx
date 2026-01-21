import React from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { DiagramTemplate, getTemplatesByCategory } from '@/lib/templates';
import { cn } from '@/lib/utils';

interface TemplatesSidebarProps {
  onSelectTemplate: (template: DiagramTemplate) => void;
  currentTemplateId?: string;
}

export function TemplatesSidebar({
  onSelectTemplate,
  currentTemplateId,
}: TemplatesSidebarProps) {
  const templatesByCategory = getTemplatesByCategory();
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>('Flowchart');

  const handleTemplateClick = (template: DiagramTemplate) => {
    onSelectTemplate(template);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center px-4 shrink-0">
        <Sparkles size={18} className="text-primary mr-2" />
        <span className="font-semibold text-sm">Starter Templates</span>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto py-2">
          {Array.from(templatesByCategory.entries()).map(([category, templates]) => (
            <div key={category} className="mb-1">
              {/* Category header */}
              <button
                onClick={() =>
                  setExpandedCategory(expandedCategory === category ? null : category)
                }
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <ChevronRight
                  size={16}
                  className={cn(
                    'transition-transform',
                    expandedCategory === category && 'rotate-90'
                  )}
                />
                <span>{category}</span>
                <span className="ml-auto text-xs bg-accent rounded-full px-2 py-0.5">
                  {templates.length}
                </span>
              </button>

              {/* Templates in category */}
              {expandedCategory === category && (
                <div className="ml-4 border-l border-border animate-fade-in">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateClick(template)}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm transition-colors',
                        'hover:bg-accent hover:text-foreground',
                        'border-l-2 -ml-px',
                        currentTemplateId === template.id
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-transparent text-foreground-muted'
                      )}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs opacity-70 truncate">
                        {template.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border text-xs text-foreground-muted text-center">
          Select a template to start
        </div>
      </div>
  );
}
