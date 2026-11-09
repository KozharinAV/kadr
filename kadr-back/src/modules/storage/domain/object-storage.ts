export interface StoredObject {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface ObjectStorage {
  put(object: StoredObject): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  presign(key: string, expiresInSeconds: number): Promise<string>;
}

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');
