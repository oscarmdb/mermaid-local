/**
 * Review Panel
 *
 * Lets a solutions architect capture architecture review findings and
 * follow-up action items directly alongside the diagram being discussed
 * with a customer. Findings are grouped by a MongoDB review rubric
 * (workload/data model, indexing, scalability, HA/DR, security, ops,
 * migration, cost) but every field stays editable - this is a guide,
 * not a mandatory gate or an implied MongoDB sign-off.
 */

import { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ClipboardList,
  ListChecks,
  Pencil,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FINDING_CATEGORY_LABELS,
  CAPABILITY_PRIORITY_LABELS,
  CAPABILITY_STATUS_LABELS,
  type FindingCategory,
  type FindingSeverity,
  type FindingStatus,
  type ActionItemStatus,
  type ReviewFinding,
  type ActionItem,
  type RequiredCapability,
  type CapabilityPriority,
  type CapabilityStatus,
} from '@/lib/db';
import {
  useFindings,
  createFinding,
  updateFinding,
  deleteFinding,
  useActionItems,
  createActionItem,
  updateActionItem,
  deleteActionItem,
  isActionItemOverdue,
  useCapabilities,
  createCapability,
  updateCapability,
  deleteCapability,
} from '@/hooks/useDatabase';

interface ReviewPanelProps {
  diagramId: string | null;
}

const CATEGORY_OPTIONS = Object.keys(FINDING_CATEGORY_LABELS) as FindingCategory[];

const SEVERITY_STYLES: Record<FindingSeverity, string> = {
  low: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  medium: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
  high: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300',
  critical: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
};

const STATUS_STYLES: Record<FindingStatus, string> = {
  open: 'text-amber-600 dark:text-amber-400',
  'accepted-risk': 'text-slate-500',
  resolved: 'text-green-600 dark:text-green-400',
};

const CAPABILITY_PRIORITY_OPTIONS = Object.keys(CAPABILITY_PRIORITY_LABELS) as CapabilityPriority[];

const CAPABILITY_STATUS_STYLES: Record<CapabilityStatus, string> = {
  identified: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  covered: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
  gap: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
};

export function ReviewPanel({ diagramId }: ReviewPanelProps) {
  const findings = useFindings(diagramId);
  const actionItems = useActionItems(diagramId);

  const [showNewFinding, setShowNewFinding] = useState(false);
  const [newCategory, setNewCategory] = useState<FindingCategory>('workload-data-model');
  const [newSeverity, setNewSeverity] = useState<FindingSeverity>('medium');
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const [showNewAction, setShowNewAction] = useState(false);
  const [newActionDesc, setNewActionDesc] = useState('');
  const [newActionOwner, setNewActionOwner] = useState('');
  const [newActionDue, setNewActionDue] = useState('');

  const handleAddFinding = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagramId || !newTitle.trim()) return;
    await createFinding(diagramId, {
      category: newCategory,
      severity: newSeverity,
      title: newTitle.trim(),
      notes: newNotes.trim() || undefined,
    });
    setNewTitle('');
    setNewNotes('');
    setShowNewFinding(false);
  }, [diagramId, newCategory, newSeverity, newTitle, newNotes]);

  const handleQuickAddCategory = useCallback((category: FindingCategory) => {
    setNewCategory(category);
    setShowNewFinding(true);
  }, []);

  const handleAddAction = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagramId || !newActionDesc.trim()) return;
    await createActionItem(diagramId, {
      description: newActionDesc.trim(),
      owner: newActionOwner.trim() || undefined,
      dueDate: newActionDue ? new Date(newActionDue) : undefined,
    });
    setNewActionDesc('');
    setNewActionOwner('');
    setNewActionDue('');
    setShowNewAction(false);
  }, [diagramId, newActionDesc, newActionOwner, newActionDue]);

  if (!diagramId) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-foreground-muted">
          <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-medium">No Diagram Selected</p>
          <p className="text-sm mt-1">Select or create a diagram to start a review</p>
        </div>
      </div>
    );
  }

  const openFindings = findings.filter((f) => f.status === 'open');
  const openActions = actionItems.filter((a) => a.status !== 'done');

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-6">
      {/* Required capabilities */}
      <CapabilitiesSection diagramId={diagramId} />

      {/* Guided checklist */}
      <section>
        <h3 className="text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2">
          Quick Add Finding by Category
        </h3>
        <p className="text-xs text-foreground-muted mb-2">
          A guide for common MongoDB review areas - not a required checklist or an official approval.
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((category) => (
            <button
              key={category}
              onClick={() => handleQuickAddCategory(category)}
              className="text-xs px-2.5 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-accent transition-colors"
            >
              {FINDING_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </section>

      {/* Findings */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert size={16} />
            Findings
            {openFindings.length > 0 && (
              <span className="text-xs font-normal text-foreground-muted">
                ({openFindings.length} open)
              </span>
            )}
          </h3>
          <button
            onClick={() => setShowNewFinding((v) => !v)}
            className="btn btn-ghost btn-icon"
            aria-label="Add finding"
          >
            <Plus size={16} />
          </button>
        </div>

        {showNewFinding && (
          <form onSubmit={handleAddFinding} className="mb-3 p-3 rounded-lg border border-border bg-accent/30 space-y-2">
            <div className="flex gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as FindingCategory)}
                className="flex-1 text-sm rounded-lg border border-border bg-background px-2 py-1.5"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{FINDING_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as FindingSeverity)}
                className="text-sm rounded-lg border border-border bg-background px-2 py-1.5"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Finding summary (e.g. No dedicated config server replica set)"
              className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5"
              required
            />
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Evidence, rationale, or recommendation (optional)"
              rows={2}
              className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowNewFinding(false)} className="btn btn-secondary btn-icon">
                <X size={16} />
              </button>
              <button type="submit" className="btn btn-primary">
                Add Finding
              </button>
            </div>
          </form>
        )}

        {findings.length === 0 && !showNewFinding ? (
          <p className="text-sm text-foreground-muted italic">No findings recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {findings.map((finding) => (
              <FindingItem key={finding.id} finding={finding} />
            ))}
          </ul>
        )}
      </section>

      {/* Action Items */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} />
            Action Items
            {openActions.length > 0 && (
              <span className="text-xs font-normal text-foreground-muted">
                ({openActions.length} open)
              </span>
            )}
          </h3>
          <button
            onClick={() => setShowNewAction((v) => !v)}
            className="btn btn-ghost btn-icon"
            aria-label="Add action item"
          >
            <Plus size={16} />
          </button>
        </div>

        {showNewAction && (
          <form onSubmit={handleAddAction} className="mb-3 p-3 rounded-lg border border-border bg-accent/30 space-y-2">
            <input
              type="text"
              autoFocus
              value={newActionDesc}
              onChange={(e) => setNewActionDesc(e.target.value)}
              placeholder="Action item (e.g. Confirm RPO/RTO targets with customer)"
              className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5"
              required
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newActionOwner}
                onChange={(e) => setNewActionOwner(e.target.value)}
                placeholder="Owner (optional)"
                className="flex-1 text-sm rounded-lg border border-border bg-background px-3 py-1.5"
              />
              <input
                type="date"
                value={newActionDue}
                onChange={(e) => setNewActionDue(e.target.value)}
                className="text-sm rounded-lg border border-border bg-background px-3 py-1.5"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowNewAction(false)} className="btn btn-secondary btn-icon">
                <X size={16} />
              </button>
              <button type="submit" className="btn btn-primary">
                Add Action
              </button>
            </div>
          </form>
        )}

        {actionItems.length === 0 && !showNewAction ? (
          <p className="text-sm text-foreground-muted italic">No action items recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {actionItems.map((item) => (
              <ActionItemRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ============================================
// Finding item with inline editing
// ============================================

function FindingItem({ finding }: { finding: ReviewFinding }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(finding.title);
  const [editNotes, setEditNotes] = useState(finding.notes ?? '');
  const [editCategory, setEditCategory] = useState<FindingCategory>(finding.category);
  const [editSeverity, setEditSeverity] = useState<FindingSeverity>(finding.severity);

  const startEditing = useCallback(() => {
    setEditTitle(finding.title);
    setEditNotes(finding.notes ?? '');
    setEditCategory(finding.category);
    setEditSeverity(finding.severity);
    setIsEditing(true);
  }, [finding]);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    await updateFinding(finding.id, {
      title: editTitle.trim(),
      notes: editNotes.trim() || undefined,
      category: editCategory,
      severity: editSeverity,
    });
    setIsEditing(false);
  }, [finding.id, editTitle, editNotes, editCategory, editSeverity]);

  if (isEditing) {
    return (
      <li className="p-3 rounded-lg border border-primary/50 bg-accent/30">
        <form onSubmit={handleSave} className="space-y-2">
          <div className="flex gap-2">
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as FindingCategory)}
              className="flex-1 text-sm rounded-lg border border-border bg-background px-2 py-1.5"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{FINDING_CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <select
              value={editSeverity}
              onChange={(e) => setEditSeverity(e.target.value as FindingSeverity)}
              className="text-sm rounded-lg border border-border bg-background px-2 py-1.5"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <input
            type="text"
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5"
            required
          />
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Evidence, rationale, or recommendation (optional)"
            rows={2}
            className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary btn-icon" aria-label="Cancel edit">
              <X size={16} />
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="p-3 rounded-lg border border-border">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase', SEVERITY_STYLES[finding.severity])}>
              {finding.severity}
            </span>
            <span className="text-[11px] text-foreground-muted">
              {FINDING_CATEGORY_LABELS[finding.category]}
            </span>
          </div>
          <p className="text-sm font-medium break-words">{finding.title}</p>
          {finding.notes && (
            <p className="text-xs text-foreground-muted mt-1 whitespace-pre-wrap break-words">{finding.notes}</p>
          )}
        </div>
        <div className="flex shrink-0">
          <button
            onClick={startEditing}
            className="btn btn-ghost btn-icon"
            aria-label="Edit finding"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => deleteFinding(finding.id)}
            className="btn btn-ghost btn-icon"
            aria-label="Delete finding"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <label className="text-xs text-foreground-muted">Status</label>
        <select
          value={finding.status}
          onChange={(e) => updateFinding(finding.id, { status: e.target.value as FindingStatus })}
          className={cn('text-xs rounded-md border border-border bg-background px-2 py-1', STATUS_STYLES[finding.status])}
        >
          <option value="open">Open</option>
          <option value="accepted-risk">Accepted Risk</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
    </li>
  );
}

// ============================================
// Action item row with inline editing
// ============================================

function toDateInputValue(date: Date | undefined): string {
  if (!date) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function ActionItemRow({ item }: { item: ActionItem }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(item.description);
  const [editOwner, setEditOwner] = useState(item.owner ?? '');
  const [editDue, setEditDue] = useState(toDateInputValue(item.dueDate));

  const overdue = isActionItemOverdue(item);

  const startEditing = useCallback(() => {
    setEditDesc(item.description);
    setEditOwner(item.owner ?? '');
    setEditDue(toDateInputValue(item.dueDate));
    setIsEditing(true);
  }, [item]);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDesc.trim()) return;
    await updateActionItem(item.id, {
      description: editDesc.trim(),
      owner: editOwner.trim() || undefined,
      dueDate: editDue ? new Date(editDue) : undefined,
    });
    setIsEditing(false);
  }, [item.id, editDesc, editOwner, editDue]);

  if (isEditing) {
    return (
      <li className="p-3 rounded-lg border border-primary/50 bg-accent/30">
        <form onSubmit={handleSave} className="space-y-2">
          <input
            type="text"
            autoFocus
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5"
            required
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={editOwner}
              onChange={(e) => setEditOwner(e.target.value)}
              placeholder="Owner (optional)"
              className="flex-1 text-sm rounded-lg border border-border bg-background px-3 py-1.5"
            />
            <input
              type="date"
              value={editDue}
              onChange={(e) => setEditDue(e.target.value)}
              className="text-sm rounded-lg border border-border bg-background px-3 py-1.5"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary btn-icon" aria-label="Cancel edit">
              <X size={16} />
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="p-3 rounded-lg border border-border flex items-start gap-2">
      <input
        type="checkbox"
        checked={item.status === 'done'}
        onChange={(e) => updateActionItem(item.id, { status: e.target.checked ? 'done' : 'open' })}
        className="mt-1"
        aria-label={`Mark "${item.description}" as done`}
      />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm break-words', item.status === 'done' && 'line-through text-foreground-muted')}>
          {item.description}
        </p>
        <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-foreground-muted">
          {item.owner && <span>Owner: {item.owner}</span>}
          {item.dueDate && (
            <span className={cn('flex items-center gap-1', overdue && 'text-red-500 font-medium')}>
              {overdue && <AlertTriangle size={12} />}
              Due {item.dueDate.toLocaleDateString()}
            </span>
          )}
          {item.status !== 'done' && (
            <select
              value={item.status}
              onChange={(e) => updateActionItem(item.id, { status: e.target.value as ActionItemStatus })}
              className="text-xs rounded-md border border-border bg-background px-1.5 py-0.5"
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
            </select>
          )}
        </div>
      </div>
      <div className="flex shrink-0">
        <button
          onClick={startEditing}
          className="btn btn-ghost btn-icon"
          aria-label="Edit action item"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => deleteActionItem(item.id)}
          className="btn btn-ghost btn-icon"
          aria-label="Delete action item"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

// ============================================
// Required capabilities section
// ============================================

function CapabilitiesSection({ diagramId }: { diagramId: string }) {
  const capabilities = useCapabilities(diagramId);

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPriority, setNewPriority] = useState<CapabilityPriority>('must-have');

  const handleAdd = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createCapability(diagramId, {
      name: newName.trim(),
      notes: newNotes.trim() || undefined,
      priority: newPriority,
    });
    setNewName('');
    setNewNotes('');
    setShowNew(false);
  }, [diagramId, newName, newNotes, newPriority]);

  const gaps = capabilities.filter((c) => c.status === 'gap');

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ListChecks size={16} />
          Required Capabilities
          {gaps.length > 0 && (
            <span className="text-xs font-normal text-red-500">
              ({gaps.length} gap{gaps.length > 1 ? 's' : ''})
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="btn btn-ghost btn-icon"
          aria-label="Add capability"
        >
          <Plus size={16} />
        </button>
      </div>
      <p className="text-xs text-foreground-muted mb-2">
        Capabilities this architecture must provide (e.g. multi-region failover, full-text search, RPO &lt; 1m).
      </p>

      {showNew && (
        <form onSubmit={handleAdd} className="mb-3 p-3 rounded-lg border border-border bg-accent/30 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Capability (e.g. Multi-region failover)"
              className="flex-1 text-sm rounded-lg border border-border bg-background px-3 py-1.5"
              required
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as CapabilityPriority)}
              className="text-sm rounded-lg border border-border bg-background px-2 py-1.5"
            >
              {CAPABILITY_PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{CAPABILITY_PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Details or acceptance criteria (optional)"
            rows={2}
            className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowNew(false)} className="btn btn-secondary btn-icon">
              <X size={16} />
            </button>
            <button type="submit" className="btn btn-primary">
              Add Capability
            </button>
          </div>
        </form>
      )}

      {capabilities.length === 0 && !showNew ? (
        <p className="text-sm text-foreground-muted italic">No capabilities captured yet.</p>
      ) : (
        <ul className="space-y-2">
          {capabilities.map((capability) => (
            <CapabilityItem key={capability.id} capability={capability} />
          ))}
        </ul>
      )}
    </section>
  );
}

function CapabilityItem({ capability }: { capability: RequiredCapability }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(capability.name);
  const [editNotes, setEditNotes] = useState(capability.notes ?? '');
  const [editPriority, setEditPriority] = useState<CapabilityPriority>(capability.priority);

  const startEditing = useCallback(() => {
    setEditName(capability.name);
    setEditNotes(capability.notes ?? '');
    setEditPriority(capability.priority);
    setIsEditing(true);
  }, [capability]);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    await updateCapability(capability.id, {
      name: editName.trim(),
      notes: editNotes.trim() || undefined,
      priority: editPriority,
    });
    setIsEditing(false);
  }, [capability.id, editName, editNotes, editPriority]);

  if (isEditing) {
    return (
      <li className="p-3 rounded-lg border border-primary/50 bg-accent/30">
        <form onSubmit={handleSave} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 text-sm rounded-lg border border-border bg-background px-3 py-1.5"
              required
            />
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as CapabilityPriority)}
              className="text-sm rounded-lg border border-border bg-background px-2 py-1.5"
            >
              {CAPABILITY_PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{CAPABILITY_PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Details or acceptance criteria (optional)"
            rows={2}
            className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary btn-icon" aria-label="Cancel edit">
              <X size={16} />
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="p-3 rounded-lg border border-border">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase', CAPABILITY_STATUS_STYLES[capability.status])}>
              {CAPABILITY_STATUS_LABELS[capability.status]}
            </span>
            <span className="text-[11px] text-foreground-muted">
              {CAPABILITY_PRIORITY_LABELS[capability.priority]}
            </span>
          </div>
          <p className="text-sm font-medium break-words">{capability.name}</p>
          {capability.notes && (
            <p className="text-xs text-foreground-muted mt-1 whitespace-pre-wrap break-words">{capability.notes}</p>
          )}
        </div>
        <div className="flex shrink-0">
          <button
            onClick={startEditing}
            className="btn btn-ghost btn-icon"
            aria-label="Edit capability"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => deleteCapability(capability.id)}
            className="btn btn-ghost btn-icon"
            aria-label="Delete capability"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <label className="text-xs text-foreground-muted">Status</label>
        <select
          value={capability.status}
          onChange={(e) => updateCapability(capability.id, { status: e.target.value as CapabilityStatus })}
          className="text-xs rounded-md border border-border bg-background px-2 py-1"
        >
          <option value="identified">Identified</option>
          <option value="covered">Covered by Design</option>
          <option value="gap">Gap</option>
        </select>
      </div>
    </li>
  );
}
