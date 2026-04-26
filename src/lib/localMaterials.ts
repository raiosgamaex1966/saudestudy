// Local Materials Service — IndexedDB for file storage + localStorage for metadata
// Works WITHOUT Supabase. When Supabase is connected, data syncs automatically.

const DB_NAME = "saudestudy_materials_db";
const DB_VERSION = 1;
const FILES_STORE = "files";
const META_STORE = "materials_meta";

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

export interface LocalMaterial {
  id: number;
  title: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  subject_id: number;
  uploaded_by: number;
  is_public: boolean;
  is_official: boolean;
  created_at: string;
}

// ─── CRUD Operations ───

export async function getLocalMaterials(subjectId?: number, officialOnly?: boolean): Promise<LocalMaterial[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readonly");
    const store = tx.objectStore(META_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      let results: LocalMaterial[] = req.result || [];
      if (subjectId) {
        results = results.filter((m) => m.subject_id === subjectId);
      }
      if (officialOnly) {
        results = results.filter((m) => m.is_official);
      }
      // Sort by created_at desc
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalMaterial(
  file: File,
  title: string,
  subjectId: number,
  userId: number,
  isOfficial: boolean = false
): Promise<{ success: boolean; material?: LocalMaterial; error?: string }> {
  try {
    const db = await openDB();

    // Generate ID and create blob URL
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const blobUrl = URL.createObjectURL(file);

    // Save file blob to IndexedDB
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FILES_STORE, "readwrite");
      const store = tx.objectStore(FILES_STORE);
      const req = store.put({ id, blob: file, name: file.name });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Save metadata
    const material: LocalMaterial = {
      id,
      title: title || file.name,
      file_url: blobUrl,
      file_size: file.size,
      mime_type: file.type || "application/pdf",
      subject_id: subjectId,
      uploaded_by: userId,
      is_public: true,
      is_official: isOfficial,
      created_at: new Date().toISOString(),
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(META_STORE, "readwrite");
      const store = tx.objectStore(META_STORE);
      const req = store.put(material);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return { success: true, material };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro ao salvar material localmente" };
  }
}

export async function deleteLocalMaterial(id: number): Promise<boolean> {
  try {
    const db = await openDB();

    // Get material to revoke blob URL
    const meta: LocalMaterial | undefined = await new Promise((resolve, reject) => {
      const tx = db.transaction(META_STORE, "readonly");
      const store = tx.objectStore(META_STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (meta && meta.file_url.startsWith("blob:")) {
      URL.revokeObjectURL(meta.file_url);
    }

    // Delete file blob
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FILES_STORE, "readwrite");
      const store = tx.objectStore(FILES_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Delete metadata
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(META_STORE, "readwrite");
      const store = tx.objectStore(META_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return true;
  } catch {
    return false;
  }
}

export async function getMaterialFileBlob(id: number): Promise<Blob | null> {
  try {
    const db = await openDB();
    const result: any = await new Promise((resolve, reject) => {
      const tx = db.transaction(FILES_STORE, "readonly");
      const store = tx.objectStore(FILES_STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return result?.blob || null;
  } catch {
    return null;
  }
}

// ─── Stats ───

export async function getLocalMaterialCount(): Promise<number> {
  const materials = await getLocalMaterials();
  return materials.length;
}

export async function getLocalMaterialsBySubject(subjectId: number): Promise<number> {
  const materials = await getLocalMaterials(subjectId);
  return materials.length;
}

// ─── Download helper ───

export function downloadMaterial(material: LocalMaterial) {
  const a = document.createElement("a");
  a.href = material.file_url;
  a.download = material.title;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
