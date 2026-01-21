/**
 * Database Hooks for CRUD operations
 * 
 * Provides React hooks for managing customers, applications, and diagrams.
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { 
  db, 
  type Customer, 
  type Application, 
  type Diagram, 
  type DiagramVersion,
  detectDiagramType,
  cleanupOldVersions,
} from '@/lib/db';

// ============================================
// Customer Hooks
// ============================================

export function useCustomers(): Customer[] {
  const customers = useLiveQuery(
    () => db.customers.orderBy('sortOrder').toArray(),
    []
  );
  
  return customers ?? [];
}

export async function createCustomer(name: string): Promise<Customer> {
  const now = new Date();
  const maxSortOrder = await db.customers.orderBy('sortOrder').last();
  
  const customer: Customer = {
    id: uuidv4(),
    name,
    createdAt: now,
    updatedAt: now,
    sortOrder: (maxSortOrder?.sortOrder ?? 0) + 1,
  };
  
  await db.customers.add(customer);
  return customer;
}

export async function updateCustomer(id: string, updates: Partial<Pick<Customer, 'name' | 'sortOrder'>>): Promise<void> {
  await db.customers.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await db.transaction('rw', [db.customers, db.applications, db.diagrams, db.diagramVersions], async () => {
    // Get all applications for this customer
    const applications = await db.applications.where('customerId').equals(id).toArray();
    
    for (const app of applications) {
      // Get all diagrams for this application
      const diagrams = await db.diagrams.where('applicationId').equals(app.id).toArray();
      
      for (const diagram of diagrams) {
        // Delete all versions for this diagram
        await db.diagramVersions.where('diagramId').equals(diagram.id).delete();
      }
      
      // Delete all diagrams for this application
      await db.diagrams.where('applicationId').equals(app.id).delete();
    }
    
    // Delete all applications for this customer
    await db.applications.where('customerId').equals(id).delete();
    
    // Delete the customer
    await db.customers.delete(id);
  });
}

// ============================================
// Application Hooks
// ============================================

export function useApplications(customerId: string | null): Application[] {
  const applications = useLiveQuery(
    () => customerId 
      ? db.applications.where('customerId').equals(customerId).sortBy('sortOrder')
      : Promise.resolve([] as Application[]),
    [customerId]
  );
  
  return applications ?? [];
}

export function useAllApplications(): Application[] {
  const applications = useLiveQuery(
    () => db.applications.orderBy('sortOrder').toArray(),
    []
  );
  
  return applications ?? [];
}

export async function createApplication(customerId: string, name: string, description?: string): Promise<Application> {
  const now = new Date();
  const existing = await db.applications.where('customerId').equals(customerId).toArray();
  const maxSortOrder = existing.reduce((max, a) => Math.max(max, a.sortOrder), 0);
  
  const application: Application = {
    id: uuidv4(),
    customerId,
    name,
    description,
    createdAt: now,
    updatedAt: now,
    sortOrder: maxSortOrder + 1,
  };
  
  await db.applications.add(application);
  return application;
}

export async function updateApplication(id: string, updates: Partial<Pick<Application, 'name' | 'description' | 'sortOrder'>>): Promise<void> {
  await db.applications.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteApplication(id: string): Promise<void> {
  await db.transaction('rw', [db.applications, db.diagrams, db.diagramVersions], async () => {
    // Get all diagrams for this application
    const diagrams = await db.diagrams.where('applicationId').equals(id).toArray();
    
    for (const diagram of diagrams) {
      // Delete all versions for this diagram
      await db.diagramVersions.where('diagramId').equals(diagram.id).delete();
    }
    
    // Delete all diagrams for this application
    await db.diagrams.where('applicationId').equals(id).delete();
    
    // Delete the application
    await db.applications.delete(id);
  });
}

// ============================================
// Diagram Hooks
// ============================================

export function useDiagrams(applicationId: string | null): Diagram[] {
  const diagrams = useLiveQuery(
    () => applicationId
      ? db.diagrams.where('applicationId').equals(applicationId).sortBy('sortOrder')
      : Promise.resolve([] as Diagram[]),
    [applicationId]
  );
  
  return diagrams ?? [];
}

export function useAllDiagrams(): Diagram[] {
  const diagrams = useLiveQuery(
    () => db.diagrams.orderBy('updatedAt').reverse().toArray(),
    []
  );
  
  return diagrams ?? [];
}

export function useDiagram(id: string | null): Diagram | undefined {
  return useLiveQuery(
    () => id ? db.diagrams.get(id) : undefined,
    [id]
  );
}

export async function createDiagram(
  applicationId: string, 
  name: string, 
  code: string = ''
): Promise<Diagram> {
  const now = new Date();
  const existing = await db.diagrams.where('applicationId').equals(applicationId).toArray();
  const maxSortOrder = existing.reduce((max, d) => Math.max(max, d.sortOrder), 0);
  
  const diagramId = uuidv4();
  const versionId = uuidv4();
  
  // Create initial version
  const version: DiagramVersion = {
    id: versionId,
    diagramId,
    code,
    createdAt: now,
    autoSave: false,
    label: 'Initial version',
  };
  
  const diagram: Diagram = {
    id: diagramId,
    applicationId,
    name,
    type: detectDiagramType(code),
    currentVersionId: versionId,
    createdAt: now,
    updatedAt: now,
    sortOrder: maxSortOrder + 1,
  };
  
  await db.transaction('rw', [db.diagrams, db.diagramVersions], async () => {
    await db.diagramVersions.add(version);
    await db.diagrams.add(diagram);
  });
  
  return diagram;
}

export async function updateDiagram(id: string, updates: Partial<Pick<Diagram, 'name' | 'type' | 'sortOrder' | 'description'>>): Promise<void> {
  await db.diagrams.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteDiagram(id: string): Promise<void> {
  await db.transaction('rw', [db.diagrams, db.diagramVersions], async () => {
    await db.diagramVersions.where('diagramId').equals(id).delete();
    await db.diagrams.delete(id);
  });
}

// ============================================
// Version Hooks
// ============================================

export function useDiagramVersions(diagramId: string | null, limit: number = 20): DiagramVersion[] {
  const versions = useLiveQuery(
    () => diagramId
      ? db.diagramVersions
          .where('diagramId')
          .equals(diagramId)
          .reverse()
          .sortBy('createdAt')
      : Promise.resolve([] as DiagramVersion[]),
    [diagramId]
  );
  
  // Return limited and sorted (newest first)
  return (versions ?? []).slice(0, limit);
}

export function useCurrentVersion(diagramId: string | null): DiagramVersion | undefined {
  const diagram = useDiagram(diagramId);
  
  return useLiveQuery(
    () => diagram?.currentVersionId 
      ? db.diagramVersions.get(diagram.currentVersionId)
      : undefined,
    [diagram?.currentVersionId]
  );
}

export async function createVersion(
  diagramId: string, 
  code: string, 
  autoSave: boolean = true,
  label?: string,
  aiGenerated?: boolean
): Promise<DiagramVersion> {
  const now = new Date();
  const versionId = uuidv4();
  
  const version: DiagramVersion = {
    id: versionId,
    diagramId,
    code,
    createdAt: now,
    autoSave,
    label,
    aiGenerated,
  };
  
  await db.transaction('rw', [db.diagrams, db.diagramVersions], async () => {
    await db.diagramVersions.add(version);
    await db.diagrams.update(diagramId, {
      currentVersionId: versionId,
      type: detectDiagramType(code),
      updatedAt: now,
    });
  });
  
  // Cleanup old versions in background
  cleanupOldVersions(diagramId).catch(console.error);
  
  return version;
}

export async function rollbackToVersion(diagramId: string, versionId: string): Promise<void> {
  const version = await db.diagramVersions.get(versionId);
  if (!version) throw new Error('Version not found');
  
  // Create a new version with the old code (so history is preserved)
  await createVersion(diagramId, version.code, false, `Rollback to ${formatRelativeTime(version.createdAt)}`);
}

// ============================================
// Utility Functions
// ============================================

export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return date.toLocaleDateString();
}
