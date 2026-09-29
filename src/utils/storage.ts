import { Project } from '../types/editor';

const DB_NAME = 'editpro_database';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const ACTIVE_PROJECT_KEY = 'editpro_active_project_id';

// Initialize IndexedDB
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Save project to IndexedDB and backup
export async function saveProject(project: Project): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const updated = { ...project, lastEdited: Date.now() };

    // Strip un-cloneable videoElement or audioBuffer instances
    const cleanClips = updated.clips.map((c) => {
      const { videoElement, imageElement, audioBuffer, ...rest } = c;
      return rest;
    });

    const cleanProject = { ...updated, clips: cleanClips };

    await new Promise<void>((resolve, reject) => {
      const req = store.put(cleanProject);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
  } catch (err) {
    console.warn('IndexedDB save failed, falling back to localStorage:', err);
    try {
      localStorage.setItem(`editpro_proj_${project.id}`, JSON.stringify(project));
      localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  }
}

// Load all projects
export async function getAllProjects(): Promise<Project[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const list = await new Promise<Project[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (list.length > 0) {
      return list.sort((a, b) => b.lastEdited - a.lastEdited);
    }
  } catch (err) {
    console.warn('IndexedDB read failed, checking localStorage:', err);
  }

  // Fallback to localStorage scan
  const fallbackList: Project[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('editpro_proj_')) {
      try {
        const val = localStorage.getItem(k);
        if (val) fallbackList.push(JSON.parse(val));
      } catch (e) {}
    }
  }

  return fallbackList.sort((a, b) => b.lastEdited - a.lastEdited);
}

// Load a single project by id
export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return await new Promise<Project | null>((resolve) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    const local = localStorage.getItem(`editpro_proj_${id}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
    return null;
  }
}

// Delete project
export async function deleteProject(id: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
  } catch (err) {}

  localStorage.removeItem(`editpro_proj_${id}`);
  if (localStorage.getItem(ACTIVE_PROJECT_KEY) === id) {
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
  }
}

// Get last active project id
export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

// Set active project id
export function setActiveProjectId(id: string | null) {
  if (id) {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
  }
}
