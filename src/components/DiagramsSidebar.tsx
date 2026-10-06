/**
 * Diagrams Sidebar Component
 * 
 * Hierarchical tree view: Customer → Application → Diagram
 * With create/rename/delete functionality and context menus.
 */

import { useState, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Folder,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Download,
  Upload,
} from 'lucide-react';
import {
  useCustomers,
  useAllApplications,
  useAllDiagrams,
  createCustomer,
  createApplication,
  createDiagram,
  updateCustomer,
  updateApplication,
  updateDiagram,
  deleteCustomer,
  deleteApplication,
  deleteDiagram,
} from '@/hooks/useDatabase';
import { getDiagramTypeIcon, exportAllData, importAllData, type DiagramType } from '@/lib/db';
import { cn } from '@/lib/utils';

interface DiagramsSidebarProps {
  activeDiagramId: string | null;
  onSelectDiagram: (diagramId: string, code: string) => void;
  onNewDiagram: (diagramId: string) => void;
}

interface ContextMenuState {
  type: 'customer' | 'application' | 'diagram' | null;
  id: string;
  x: number;
  y: number;
}

export function DiagramsSidebar({
  activeDiagramId,
  onSelectDiagram,
  onNewDiagram,
}: DiagramsSidebarProps) {
  const customers = useCustomers();
  const applications = useAllApplications();
  const diagrams = useAllDiagrams();
  
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showNewCustomerInput, setShowNewCustomerInput] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [showNewAppInput, setShowNewAppInput] = useState<string | null>(null); // customerId
  const [newAppName, setNewAppName] = useState('');
  const [showNewDiagramInput, setShowNewDiagramInput] = useState<string | null>(null); // appId
  const [newDiagramName, setNewDiagramName] = useState('');
  
  // Get applications for a customer
  const getCustomerApps = useCallback((customerId: string) => {
    return applications.filter(a => a.customerId === customerId);
  }, [applications]);
  
  // Get diagrams for an application
  const getAppDiagrams = useCallback((appId: string) => {
    return diagrams.filter(d => d.applicationId === appId);
  }, [diagrams]);
  
  // Toggle customer expansion
  const toggleCustomer = useCallback((id: string) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  
  // Toggle app expansion
  const toggleApp = useCallback((id: string) => {
    setExpandedApps(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  
  // Handle context menu
  const handleContextMenu = useCallback((
    e: React.MouseEvent,
    type: 'customer' | 'application' | 'diagram',
    id: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ type, id, x: e.clientX, y: e.clientY });
  }, []);
  
  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);
  
  // Start editing
  const startEditing = useCallback((id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
    closeContextMenu();
  }, [closeContextMenu]);
  
  // Save edit
  const saveEdit = useCallback(async (type: 'customer' | 'application' | 'diagram') => {
    if (!editingId || !editingName.trim()) {
      setEditingId(null);
      return;
    }
    
    try {
      if (type === 'customer') {
        await updateCustomer(editingId, { name: editingName.trim() });
      } else if (type === 'application') {
        await updateApplication(editingId, { name: editingName.trim() });
      } else {
        await updateDiagram(editingId, { name: editingName.trim() });
      }
    } catch (error) {
      console.error('Failed to update:', error);
    }
    
    setEditingId(null);
    setEditingName('');
  }, [editingId, editingName]);
  
  // Handle delete
  const handleDelete = useCallback(async (type: 'customer' | 'application' | 'diagram', id: string) => {
    const confirmMessages = {
      customer: 'Delete this customer and ALL their applications and diagrams?',
      application: 'Delete this application and ALL its diagrams?',
      diagram: 'Delete this diagram?',
    };
    
    if (!confirm(confirmMessages[type])) {
      closeContextMenu();
      return;
    }
    
    try {
      if (type === 'customer') {
        await deleteCustomer(id);
      } else if (type === 'application') {
        await deleteApplication(id);
      } else {
        await deleteDiagram(id);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
    
    closeContextMenu();
  }, [closeContextMenu]);
  
  // Create new customer
  const handleCreateCustomer = useCallback(async () => {
    if (!newCustomerName.trim()) {
      setShowNewCustomerInput(false);
      return;
    }
    
    try {
      const customer = await createCustomer(newCustomerName.trim());
      setExpandedCustomers(prev => new Set(prev).add(customer.id));
      setNewCustomerName('');
      setShowNewCustomerInput(false);
    } catch (error) {
      console.error('Failed to create customer:', error);
    }
  }, [newCustomerName]);
  
  // Create new application
  const handleCreateApplication = useCallback(async (customerId: string) => {
    if (!newAppName.trim()) {
      setShowNewAppInput(null);
      return;
    }
    
    try {
      const app = await createApplication(customerId, newAppName.trim());
      setExpandedApps(prev => new Set(prev).add(app.id));
      setNewAppName('');
      setShowNewAppInput(null);
    } catch (error) {
      console.error('Failed to create application:', error);
    }
  }, [newAppName]);
  
  // Create new diagram
  const handleCreateDiagram = useCallback(async (appId: string) => {
    if (!newDiagramName.trim()) {
      setShowNewDiagramInput(null);
      return;
    }
    
    try {
      const diagram = await createDiagram(appId, newDiagramName.trim(), '');
      setNewDiagramName('');
      setShowNewDiagramInput(null);
      onNewDiagram(diagram.id);
    } catch (error) {
      console.error('Failed to create diagram:', error);
    }
  }, [newDiagramName, onNewDiagram]);
  
  // Export all data
  const handleExport = useCallback(async () => {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mermaid-diagrams-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    }
  }, []);
  
  // Import data
  const handleImport = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      if (!confirm('This will replace ALL existing data. Continue?')) {
        return;
      }
      
      try {
        const text = await file.text();
        const result = await importAllData(text);
        
        if (result.success) {
          alert('Import successful!');
          window.location.reload();
        } else {
          alert(`Import failed: ${result.error}`);
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import data');
      }
    };
    
    input.click();
  }, []);
  
  return (
    <>
      {/* Sidebar */}
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 border-b border-border flex items-center justify-between px-3 shrink-0">
          <span className="text-sm font-semibold">Customers & Apps</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewCustomerInput(true)}
              className="btn btn-ghost btn-icon h-7 w-7"
              title="Add Customer"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={handleExport}
              className="btn btn-ghost btn-icon h-7 w-7"
              title="Export All"
            >
              <Download size={16} />
            </button>
            <button
              onClick={handleImport}
              className="btn btn-ghost btn-icon h-7 w-7"
              title="Import"
            >
              <Upload size={16} />
            </button>
          </div>
        </div>
        
        {/* Tree View */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* New Customer Input */}
          {showNewCustomerInput && (
            <div className="mb-2 flex items-center gap-1">
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateCustomer();
                  if (e.key === 'Escape') setShowNewCustomerInput(false);
                }}
                placeholder="Customer name..."
                className="flex-1 px-2 py-1 text-sm bg-background-secondary border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <button
                onClick={handleCreateCustomer}
                className="btn btn-ghost btn-icon h-7 w-7 text-green-500"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => setShowNewCustomerInput(false)}
                className="btn btn-ghost btn-icon h-7 w-7 text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          {customers.length === 0 && !showNewCustomerInput ? (
            <div className="text-center text-foreground-muted py-8">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No customers yet</p>
              <button
                onClick={() => setShowNewCustomerInput(true)}
                className="text-primary text-sm mt-2 hover:underline"
              >
                Add your first customer
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {customers.map((customer) => (
                <CustomerNode
                  key={customer.id}
                  customer={customer}
                  isExpanded={expandedCustomers.has(customer.id)}
                  onToggle={() => toggleCustomer(customer.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'customer', customer.id)}
                  editingId={editingId}
                  editingName={editingName}
                  onEditNameChange={setEditingName}
                  onSaveEdit={() => saveEdit('customer')}
                  showNewAppInput={showNewAppInput}
                  setShowNewAppInput={setShowNewAppInput}
                  newAppName={newAppName}
                  setNewAppName={setNewAppName}
                  onCreateApp={() => handleCreateApplication(customer.id)}
                >
                  {getCustomerApps(customer.id).map((app) => (
                    <ApplicationNode
                      key={app.id}
                      application={app}
                      isExpanded={expandedApps.has(app.id)}
                      onToggle={() => toggleApp(app.id)}
                      onContextMenu={(e) => handleContextMenu(e, 'application', app.id)}
                      editingId={editingId}
                      editingName={editingName}
                      onEditNameChange={setEditingName}
                      onSaveEdit={() => saveEdit('application')}
                      showNewDiagramInput={showNewDiagramInput}
                      setShowNewDiagramInput={setShowNewDiagramInput}
                      newDiagramName={newDiagramName}
                      setNewDiagramName={setNewDiagramName}
                      onCreateDiagram={() => handleCreateDiagram(app.id)}
                    >
                      {getAppDiagrams(app.id).map((diagram) => (
                        <DiagramNode
                          key={diagram.id}
                          diagram={diagram}
                          isActive={diagram.id === activeDiagramId}
                          onSelect={() => onSelectDiagram(diagram.id, '')}
                          onContextMenu={(e) => handleContextMenu(e, 'diagram', diagram.id)}
                          editingId={editingId}
                          editingName={editingName}
                          onEditNameChange={setEditingName}
                          onSaveEdit={() => saveEdit('diagram')}
                        />
                      ))}
                    </ApplicationNode>
                  ))}
                </CustomerNode>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-border text-xs text-foreground-muted text-center">
          All data stays on your device
        </div>
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onRename={() => {
            const item = contextMenu.type === 'customer'
              ? customers.find(c => c.id === contextMenu.id)
              : contextMenu.type === 'application'
              ? applications.find(a => a.id === contextMenu.id)
              : diagrams.find(d => d.id === contextMenu.id);
            if (item) startEditing(contextMenu.id, item.name);
          }}
          onDelete={() => handleDelete(contextMenu.type!, contextMenu.id)}
        />
      )}
    </>
  );
}

// ============================================
// Sub-components
// ============================================

interface CustomerNodeProps {
  customer: { id: string; name: string };
  isExpanded: boolean;
  onToggle: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  editingId: string | null;
  editingName: string;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
  showNewAppInput: string | null;
  setShowNewAppInput: (id: string | null) => void;
  newAppName: string;
  setNewAppName: (name: string) => void;
  onCreateApp: () => void;
  children: React.ReactNode;
}

function CustomerNode({
  customer,
  isExpanded,
  onToggle,
  onContextMenu,
  editingId,
  editingName,
  onEditNameChange,
  onSaveEdit,
  showNewAppInput,
  setShowNewAppInput,
  newAppName,
  setNewAppName,
  onCreateApp,
  children,
}: CustomerNodeProps) {
  const isEditing = editingId === customer.id;
  
  return (
    <div>
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-accent cursor-pointer group"
        onClick={onToggle}
        onContextMenu={onContextMenu}
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Building2 size={14} className="text-blue-500" />
        
        {isEditing ? (
          <input
            type="text"
            value={editingName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit();
              if (e.key === 'Escape') onSaveEdit();
            }}
            onBlur={onSaveEdit}
            className="flex-1 px-1 text-sm bg-background-secondary border border-primary rounded focus:outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm font-medium truncate">{customer.name}</span>
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowNewAppInput(customer.id);
          }}
          className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-icon h-5 w-5"
          title="Add Application"
        >
          <Plus size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e);
          }}
          className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-icon h-5 w-5"
        >
          <MoreHorizontal size={12} />
        </button>
      </div>
      
      {isExpanded && (
        <div className="ml-4 pl-2 border-l border-border">
          {showNewAppInput === customer.id && (
            <div className="flex items-center gap-1 py-1">
              <input
                type="text"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCreateApp();
                  if (e.key === 'Escape') setShowNewAppInput(null);
                }}
                placeholder="Application name..."
                className="flex-1 px-2 py-1 text-sm bg-background-secondary border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <button onClick={onCreateApp} className="text-green-500">
                <Plus size={14} />
              </button>
              <button onClick={() => setShowNewAppInput(null)} className="text-red-500">
                <X size={14} />
              </button>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

interface ApplicationNodeProps {
  application: { id: string; name: string };
  isExpanded: boolean;
  onToggle: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  editingId: string | null;
  editingName: string;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
  showNewDiagramInput: string | null;
  setShowNewDiagramInput: (id: string | null) => void;
  newDiagramName: string;
  setNewDiagramName: (name: string) => void;
  onCreateDiagram: () => void;
  children: React.ReactNode;
}

function ApplicationNode({
  application,
  isExpanded,
  onToggle,
  onContextMenu,
  editingId,
  editingName,
  onEditNameChange,
  onSaveEdit,
  showNewDiagramInput,
  setShowNewDiagramInput,
  newDiagramName,
  setNewDiagramName,
  onCreateDiagram,
  children,
}: ApplicationNodeProps) {
  const isEditing = editingId === application.id;
  
  return (
    <div>
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-accent cursor-pointer group"
        onClick={onToggle}
        onContextMenu={onContextMenu}
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Folder size={14} className="text-amber-500" />
        
        {isEditing ? (
          <input
            type="text"
            value={editingName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit();
              if (e.key === 'Escape') onSaveEdit();
            }}
            onBlur={onSaveEdit}
            className="flex-1 px-1 text-sm bg-background-secondary border border-primary rounded focus:outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm truncate">{application.name}</span>
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowNewDiagramInput(application.id);
          }}
          className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-icon h-5 w-5"
          title="Add Diagram"
        >
          <Plus size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e);
          }}
          className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-icon h-5 w-5"
        >
          <MoreHorizontal size={12} />
        </button>
      </div>
      
      {isExpanded && (
        <div className="ml-4 pl-2 border-l border-border">
          {showNewDiagramInput === application.id && (
            <div className="flex items-center gap-1 py-1">
              <input
                type="text"
                value={newDiagramName}
                onChange={(e) => setNewDiagramName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCreateDiagram();
                  if (e.key === 'Escape') setShowNewDiagramInput(null);
                }}
                placeholder="Diagram name..."
                className="flex-1 px-2 py-1 text-sm bg-background-secondary border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <button onClick={onCreateDiagram} className="text-green-500">
                <Plus size={14} />
              </button>
              <button onClick={() => setShowNewDiagramInput(null)} className="text-red-500">
                <X size={14} />
              </button>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

interface DiagramNodeProps {
  diagram: { id: string; name: string; type: DiagramType };
  isActive: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  editingId: string | null;
  editingName: string;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
}

function DiagramNode({
  diagram,
  isActive,
  onSelect,
  onContextMenu,
  editingId,
  editingName,
  onEditNameChange,
  onSaveEdit,
}: DiagramNodeProps) {
  const isEditing = editingId === diagram.id;
  
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer group',
        isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
      )}
      onClick={onSelect}
      onContextMenu={onContextMenu}
    >
      <span className="text-sm">{getDiagramTypeIcon(diagram.type)}</span>
      
      {isEditing ? (
        <input
          type="text"
          value={editingName}
          onChange={(e) => onEditNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit();
            if (e.key === 'Escape') onSaveEdit();
          }}
          onBlur={onSaveEdit}
          className="flex-1 px-1 text-sm bg-background-secondary border border-primary rounded focus:outline-none"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 text-sm truncate">{diagram.name}</span>
      )}
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu(e);
        }}
        className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-icon h-5 w-5"
      >
        <MoreHorizontal size={12} />
      </button>
    </div>
  );
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function ContextMenu({ x, y, onClose, onRename, onDelete }: ContextMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 bg-background border border-border rounded-lg shadow-xl py-1 min-w-[120px]"
        style={{ left: x, top: y }}
      >
        <button
          onClick={onRename}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
        >
          <Pencil size={14} />
          Rename
        </button>
        <button
          onClick={onDelete}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-red-500"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </>
  );
}
