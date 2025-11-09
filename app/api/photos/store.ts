export type PhotoStatus = 'approved' | 'rejected';

export interface PhotoMeta {
  id: string;
  username: string;
  timestamp: string;
  driveUrl: string;
}

const statusMap = new Map<string, PhotoStatus>();
const metaMap = new Map<string, PhotoMeta>();

export function setPhotoStatus(id: string, status: PhotoStatus, meta?: PhotoMeta) {
  statusMap.set(id, status);
  if (meta) metaMap.set(id, meta);
}

export function getPhotoStatus(id: string): PhotoStatus | undefined {
  return statusMap.get(id);
}

export function getPhotosByStatus(status: PhotoStatus): PhotoMeta[] {
  const result: PhotoMeta[] = [];
  statusMap.forEach((s, id) => {
    if (s === status) {
      const meta = metaMap.get(id);
      if (meta) result.push(meta);
    }
  });
  return result;
}









