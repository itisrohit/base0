import { mkdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { StorageProvider } from './index';

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor() {
    // Correctly resolve baseDir based on environment
    // In Docker: /app/uploads
    // Local: ./uploads (relative to root)
    this.baseDir = process.env.STORAGE_PATH || join(process.cwd(), 'uploads');
  }

  async upload(path: string, data: Buffer | Uint8Array, _mimeType: string): Promise<void> {
    const fullPath = join(this.baseDir, path);
    await mkdir(dirname(fullPath), { recursive: true });
    await Bun.write(fullPath, data);
  }

  async download(path: string): Promise<Uint8Array> {
    const fullPath = join(this.baseDir, path);
    const file = Bun.file(fullPath);
    return new Uint8Array(await file.arrayBuffer());
  }

  async delete(path: string): Promise<void> {
    const fullPath = join(this.baseDir, path);
    await unlink(fullPath);
  }

  async getSignedUrl(path: string, _expiresIn: number): Promise<string> {
    // For local storage, we can return a relative path or a special API endpoint
    // For simplicity, let's return the path which our API will serve
    return `/v1/storage/files/${path}/view`;
  }
}
