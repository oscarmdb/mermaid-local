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
}

// ============================================
// Database Class
// ============================================

export class MermaidDatabase extends Dexie {
  customers!: Table<Customer>;
  applications!: Table<Application>;
  diagrams!: Table<Diagram>;
  diagramVersions!: Table<DiagramVersion>;

  constructor() {
    super('MermaidHostDB');
    
    this.version(1).stores({
      customers: 'id, name, sortOrder, createdAt',
      applications: 'id, customerId, name, sortOrder, createdAt',
      diagrams: 'id, applicationId, name, type, sortOrder, createdAt, updatedAt',
      diagramVersions: 'id, diagramId, createdAt, autoSave',
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
