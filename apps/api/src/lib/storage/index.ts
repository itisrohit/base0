import { LocalStorageProvider } from './local';

export interface StorageProvider {
  upload(path: string, data: Buffer | Uint8Array, mimeType: string): Promise<void>;
  download(path: string): Promise<Uint8Array>;
  delete(path: string): Promise<void>;
  getSignedUrl(path: string, expiresIn: number): Promise<string>;
}

/**
 * Storage factory to get the configured provider
 */
export async function getStorageProvider(): Promise<StorageProvider> {
  const driver = process.env.STORAGE_DRIVER || 'local';

  if (driver === 'local') {
    return new LocalStorageProvider();
  }

  // Future: S3 provider
  throw new Error(`Unsupported storage driver: ${driver}`);
}
