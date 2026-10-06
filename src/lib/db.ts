/**
 * IndexedDB Database Schema using Dexie.js
 * 
 * SECURITY: All data stays local - no network calls.
 * This provides structured storage for diagrams with version history.
 */

import Dexie, { type Table } from 'dexie';

// ============================================
// Data Models
// ============================================

export interface Customer {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  sortOrder: number;
}

export interface Application {
  id: string;
  customerId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  sortOrder: number;
}

export type DiagramType = 
  | 'flowchart' 
  | 'sequence' 
  | 'class' 
  | 'state' 
  | 'er' 
  | 'gantt' 
  | 'pie' 
  | 'git' 
  | 'mindmap' 
  | 'timeline'
  | 'architecture'
  | 'other';

export interface Diagram {
  id: string;
  applicationId: string;
  name: string;
  description?: string;
  type: DiagramType;
  currentVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  sortOrder: number;
}

export interface DiagramVersion {
  id: string;
  diagramId: string;
  code: string;
  createdAt: Date;
  autoSave: boolean;
  label?: string;
  aiGenerated?: boolean; // True if this version was created by AI chat
}

// ============================================
// Chat Messages
// ============================================

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  diagramId: string;
  role: ChatRole;
  content: string;
  codeSnapshot?: string; // The diagram code at the time of this message
  createdAt: Date;
}

// ============================================
// Ollama Settings
// ============================================

export interface OllamaSettings {
  id: string;  // Use 'default' as singleton key
  endpointUrl: string;
  selectedModel: string | null;
  isEnabled: boolean;
  lastConnectedAt: Date | null;
  availableModels: string[];
}

export const DEFAULT_OLLAMA_SETTINGS: OllamaSettings = {
  id: 'default',
  endpointUrl: 'http://localhost:11434',
  selectedModel: null,
  isEnabled: false,
  lastConnectedAt: null,
  availableModels: [],
};

// ============================================
// Architecture Review: Findings & Action Items
//
// Scoped to a Diagram (e.g. "Target Architecture") so a solutions architect
// can capture review findings and follow-up actions directly alongside the
// diagram being discussed with the customer. Categories map to a MongoDB
// architecture review rubric, but severity/status/notes remain freeform so
// the checklist stays a guide rather than a mandatory gate.
// ============================================

export type FindingCategory =
  | 'workload-data-model'
  | 'indexing-queries'
  | 'scalability'
  | 'availability-dr'
  | 'security-networking'
  | 'observability-ops'
  | 'migration'
  | 'cost'
  | 'other';

export type FindingSeverity = 'low' | 'medium' | 'high' | 'critical';

export type FindingStatus = 'open' | 'accepted-risk' | 'resolved';

export interface ReviewFinding {
  id: string;
  diagramId: string;
  category: FindingCategory;
  severity: FindingSeverity;
  status: FindingStatus;
  title: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const FINDING_CATEGORY_LABELS: Record<FindingCategory, string> = {
  'workload-data-model': 'Workload & Data Model',
  'indexing-queries': 'Indexing & Queries',
  'scalability': 'Scalability',
  'availability-dr': 'Availability & DR',
  'security-networking': 'Security & Networking',
  'observability-ops': 'Observability & Operations',
  'migration': 'Migration',
  'cost': 'Cost',
  'other': 'Other',
};

export type ActionItemStatus = 'open' | 'in-progress' | 'done';

export interface ActionItem {
  id: string;
  diagramId: string;
  description: string;
  owner?: string;
  dueDate?: Date;
  status: ActionItemStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Diagram Annotations (pen strokes & comment pins)
//
// Coordinates are stored in the diagram's natural (unscaled) coordinate
// space so annotations stay anchored to the architecture at any zoom level.
// ============================================

export interface AnnotationStroke {
  id: string;
  diagramId: string;
  color: string;
  size: number;
  /** Points in the diagram's natural coordinate space */
  points: { x: number; y: number }[];
  createdAt: Date;
}

export interface AnnotationComment {
  id: string;
  diagramId: string;
  /** Position in the diagram's natural coordinate space */
  x: number;
  y: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Required Capabilities
//
// Lets a solutions architect capture the capabilities a customer's
// architecture must provide (e.g. "Multi-region failover", "Full-text
// search") and track whether the proposed design covers them.
// ============================================

export type CapabilityPriority = 'must-have' | 'should-have' | 'nice-to-have';

export type CapabilityStatus = 'identified' | 'covered' | 'gap';

export interface RequiredCapability {
  id: string;
  diagramId: string;
  name: string;
  notes?: string;
  priority: CapabilityPriority;
  status: CapabilityStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const CAPABILITY_PRIORITY_LABELS: Record<CapabilityPriority, string> = {
  'must-have': 'Must Have',
  'should-have': 'Should Have',
  'nice-to-have': 'Nice to Have',
};

export const CAPABILITY_STATUS_LABELS: Record<CapabilityStatus, string> = {
  identified: 'Identified',
  covered: 'Covered by Design',
  gap: 'Gap',
};

// ============================================
// Database Class
// ============================================

export class MermaidDatabase extends Dexie {
  customers!: Table<Customer>;
  applications!: Table<Application>;
  diagrams!: Table<Diagram>;
  diagramVersions!: Table<DiagramVersion>;
  chatMessages!: Table<ChatMessage>;
  ollamaSettings!: Table<OllamaSettings>;
  reviewFindings!: Table<ReviewFinding>;
  actionItems!: Table<ActionItem>;
  annotationStrokes!: Table<AnnotationStroke>;
  annotationComments!: Table<AnnotationComment>;
  capabilities!: Table<RequiredCapability>;

  constructor() {
    super('MermaidHostDB');
    
    this.version(1).stores({
      customers: 'id, name, sortOrder, createdAt',
      applications: 'id, customerId, name, sortOrder, createdAt',
      diagrams: 'id, applicationId, name, type, sortOrder, createdAt, updatedAt',
      diagramVersions: 'id, diagramId, createdAt, autoSave',
    });
    
    // Version 2: Add Ollama settings table
    this.version(2).stores({
      customers: 'id, name, sortOrder, createdAt',
      applications: 'id, customerId, name, sortOrder, createdAt',
      diagrams: 'id, applicationId, name, type, sortOrder, createdAt, updatedAt',
      diagramVersions: 'id, diagramId, createdAt, autoSave',
      ollamaSettings: 'id',
    });

    // Version 3: Add chat messages table
    this.version(3).stores({
      customers: 'id, name, sortOrder, createdAt',
      applications: 'id, customerId, name, sortOrder, createdAt',
      diagrams: 'id, applicationId, name, type, sortOrder, createdAt, updatedAt',
      diagramVersions: 'id, diagramId, createdAt, autoSave',
      ollamaSettings: 'id',
      chatMessages: 'id, diagramId, createdAt',
    });

    // Version 4: Add review findings & action items tables (architecture review workflow)
    this.version(4).stores({
      customers: 'id, name, sortOrder, createdAt',
      applications: 'id, customerId, name, sortOrder, createdAt',
      diagrams: 'id, applicationId, name, type, sortOrder, createdAt, updatedAt',
      diagramVersions: 'id, diagramId, createdAt, autoSave',
      ollamaSettings: 'id',
      chatMessages: 'id, diagramId, createdAt',
      reviewFindings: 'id, diagramId, category, severity, status, createdAt',
      actionItems: 'id, diagramId, status, dueDate, createdAt',
    });

    // Version 5: Add diagram annotations (pen strokes, comment pins) and required capabilities
    this.version(5).stores({
      customers: 'id, name, sortOrder, createdAt',
      applications: 'id, customerId, name, sortOrder, createdAt',
      diagrams: 'id, applicationId, name, type, sortOrder, createdAt, updatedAt',
      diagramVersions: 'id, diagramId, createdAt, autoSave',
      ollamaSettings: 'id',
      chatMessages: 'id, diagramId, createdAt',
      reviewFindings: 'id, diagramId, category, severity, status, createdAt',
      actionItems: 'id, diagramId, status, dueDate, createdAt',
      annotationStrokes: 'id, diagramId, createdAt',
      annotationComments: 'id, diagramId, createdAt',
      capabilities: 'id, diagramId, priority, status, createdAt',
    });
  }
}

// Singleton database instance
export const db = new MermaidDatabase();

// ============================================
// Version Retention Settings
// ============================================

export const VERSION_RETENTION = {
  autoSave: {
    maxCount: 50,
    maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  manual: {
    maxCount: 100,
    maxAgeMs: null, // Never auto-delete manual saves
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Detect diagram type from mermaid code
 */
export function detectDiagramType(code: string): DiagramType {
  const trimmed = code.trim().toLowerCase();
  
  if (trimmed.startsWith('flowchart') || trimmed.startsWith('graph')) return 'flowchart';
  if (trimmed.startsWith('sequencediagram')) return 'sequence';
  if (trimmed.startsWith('classdiagram')) return 'class';
  if (trimmed.startsWith('statediagram')) return 'state';
  if (trimmed.startsWith('erdiagram')) return 'er';
  if (trimmed.startsWith('gantt')) return 'gantt';
  if (trimmed.startsWith('pie')) return 'pie';
  if (trimmed.startsWith('gitgraph')) return 'git';
  if (trimmed.startsWith('mindmap')) return 'mindmap';
  if (trimmed.startsWith('timeline')) return 'timeline';
  if (trimmed.startsWith('architecture')) return 'architecture';
  
  return 'other';
}

/**
 * Get icon for diagram type
 */
export function getDiagramTypeIcon(type: DiagramType): string {
  const icons: Record<DiagramType, string> = {
    flowchart: '🔀',
    sequence: '⏱️',
    class: '📐',
    state: '🔄',
    er: '🗃️',
    gantt: '📊',
    pie: '🥧',
    git: '🌳',
    mindmap: '🧠',
    timeline: '📅',
    architecture: '🏗️',
    other: '📄',
  };
  return icons[type];
}

/**
 * Clean up old auto-save versions
 */
export async function cleanupOldVersions(diagramId: string): Promise<void> {
  const now = Date.now();
  const { maxCount, maxAgeMs } = VERSION_RETENTION.autoSave;
  
  // Get all auto-save versions for this diagram, sorted by date
  const autoSaveVersions = await db.diagramVersions
    .where('diagramId')
    .equals(diagramId)
    .filter(v => v.autoSave)
    .sortBy('createdAt');
  
  // Reverse to get newest first
  autoSaveVersions.reverse();
  
  const versionsToDelete: string[] = [];
  
  autoSaveVersions.forEach((version, index) => {
    const age = now - version.createdAt.getTime();
    
    // Keep if within count limit and age limit
    if (index < maxCount && age < maxAgeMs) {
      return;
    }
    
    versionsToDelete.push(version.id);
  });
  
  if (versionsToDelete.length > 0) {
    await db.diagramVersions.bulkDelete(versionsToDelete);
  }
}

/**
 * Export all data as JSON for backup
 */
export async function exportAllData(): Promise<string> {
  const [customers, applications, diagrams, versions] = await Promise.all([
    db.customers.toArray(),
    db.applications.toArray(),
    db.diagrams.toArray(),
    db.diagramVersions.toArray(),
  ]);
  
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    version: 1,
    data: {
      customers,
      applications,
      diagrams,
      diagramVersions: versions,
    },
  }, null, 2);
}

/**
 * Import data from JSON backup
 */
export async function importAllData(jsonString: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = JSON.parse(jsonString);
    
    if (!data.data) {
      return { success: false, error: 'Invalid backup format' };
    }
    
    await db.transaction('rw', [db.customers, db.applications, db.diagrams, db.diagramVersions], async () => {
      // Clear existing data
      await Promise.all([
        db.customers.clear(),
        db.applications.clear(),
        db.diagrams.clear(),
        db.diagramVersions.clear(),
      ]);
      
      // Import new data
      if (data.data.customers) {
        await db.customers.bulkAdd(data.data.customers.map((c: Customer) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })));
      }
      
      if (data.data.applications) {
        await db.applications.bulkAdd(data.data.applications.map((a: Application) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
        })));
      }
      
      if (data.data.diagrams) {
        await db.diagrams.bulkAdd(data.data.diagrams.map((d: Diagram) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
        })));
      }
      
      if (data.data.diagramVersions) {
        await db.diagramVersions.bulkAdd(data.data.diagramVersions.map((v: DiagramVersion) => ({
          ...v,
          createdAt: new Date(v.createdAt),
        })));
      }
    });
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to import data' 
    };
  }
}
