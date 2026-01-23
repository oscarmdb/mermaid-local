import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';

export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  nodeType: 'service' | 'database' | 'cloud' | 'user' | 'process';
  onLabelChange?: (id: string, label: string) => void;
}

interface BaseNodeProps {
  id: string;
  data: BaseNodeData;
  selected?: boolean;
  icon: React.ReactNode;
  className: string;
  shape?: 'rectangle' | 'rounded' | 'cylinder' | 'circle' | 'diamond';
}

export const BaseNode = memo(({ id, data, selected, icon, className, shape = 'rounded' }: BaseNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    setEditValue(data.label);
    setIsEditing(true);
  }, [data.label]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== data.label) {
      data.onLabelChange?.(id, editValue.trim());
    }
  }, [id, editValue, data]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(data.label);
      setIsEditing(false);
    }
  }, [handleBlur, data.label]);

  const shapeClasses = {
    rectangle: 'rounded-none',
    rounded: 'rounded-lg',
    cylinder: 'rounded-lg',
    circle: 'rounded-full aspect-square',
    diamond: 'rounded-lg rotate-45',
  };

  return (
    <div
      className={`
        relative min-w-[120px] px-4 py-3 border-2 transition-all
        ${className}
        ${shapeClasses[shape]}
        ${selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
        ${shape === 'cylinder' ? 'before:absolute before:inset-x-0 before:-top-2 before:h-4 before:bg-inherit before:rounded-t-full before:border-2 before:border-inherit before:border-b-0' : ''}
      `}
      onDoubleClick={handleDoubleClick}
    >
      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />

      {/* Content */}
      <div className={`flex items-center gap-2 ${shape === 'diamond' ? '-rotate-45' : ''}`}>
        <span className="shrink-0">{icon}</span>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none text-sm font-medium min-w-[60px] w-full"
          />
        ) : (
          <span className="text-sm font-medium whitespace-nowrap">{data.label}</span>
        )}
      </div>

      {/* Output handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </div>
  );
});

BaseNode.displayName = 'BaseNode';
