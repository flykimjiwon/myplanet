// IndexedDB 유틸리티 함수

const DB_NAME = 'MyPlanetDB';
const DB_VERSION = 1;
const STORE_NAME = 'travelData';

interface TravelData {
  id?: number;
  photo?: string; // base64 이미지
  title?: string;
  text?: string;
  updatedAt: number;
}

// DB 초기화
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });
}

// 데이터 저장
export async function saveTravelData(data: Partial<TravelData>): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // 기존 데이터가 있으면 업데이트, 없으면 생성
    const getRequest = store.getAll();
    getRequest.onsuccess = () => {
      const existing = getRequest.result[0];
      const travelData: TravelData = {
        ...existing,
        ...data,
        updatedAt: Date.now(),
      };
      
      const request = existing 
        ? store.put({ ...travelData, id: existing.id })
        : store.add(travelData);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// 데이터 로드
export async function loadTravelData(): Promise<TravelData | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const data = request.result[0] || null;
      resolve(data);
    };
    request.onerror = () => reject(request.error);
  });
}

// 사진 삭제
export async function deletePhoto(): Promise<void> {
  const data = await loadTravelData();
  if (data) {
    await saveTravelData({ ...data, photo: undefined });
  }
}

// 이미지를 base64로 변환
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

