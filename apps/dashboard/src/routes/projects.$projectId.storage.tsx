import { createRoute, useParams } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProjectNav } from '@/components/layout/project-nav';
import { Button } from '@/components/ui/button';
import {
  useBuckets,
  useCreateBucket,
  useDeleteBucket,
  useDeleteFile,
  useFiles,
  useUploadFile,
} from '@/hooks/use-storage';
import { authenticatedLayout } from './_authenticated';

export const projectStorageRoute = createRoute({
  getParentRoute: () => authenticatedLayout,
  path: '/projects/$projectId/storage',
  component: () => (
    <DashboardLayout>
      <StoragePage />
    </DashboardLayout>
  ),
});

function StoragePage() {
  const { projectId } = useParams({ from: '/authenticated/projects/$projectId/storage' });
  const { data: buckets, isLoading: bucketsLoading } = useBuckets(projectId);
  const createBucket = useCreateBucket(projectId);
  const deleteBucket = useDeleteBucket(projectId);

  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);
  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');

  const handleCreateBucket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName) return;
    await createBucket.mutateAsync(newBucketName);
    setShowCreateBucket(false);
    setNewBucketName('');
  };

  const handleDeleteBucket = async (bucketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this bucket? It must be empty.')) {
      try {
        await deleteBucket.mutateAsync(bucketId);
        if (selectedBucketId === bucketId) setSelectedBucketId(null);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } } };
        alert(error.response?.data?.error || 'Failed to delete bucket');
      }
    }
  };

  if (bucketsLoading) return <div className="p-8 text-center">Loading storage...</div>;

  return (
    <div className="space-y-6">
      <ProjectNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Storage</h1>
          <p className="text-muted-foreground mt-1">Manage project buckets and files</p>
        </div>
        <Button onClick={() => setShowCreateBucket(!showCreateBucket)}>
          {showCreateBucket ? 'Cancel' : 'New Bucket'}
        </Button>
      </div>

      {showCreateBucket && (
        <div className="border border-border rounded-lg p-6 bg-card max-w-md">
          <h2 className="text-lg font-semibold mb-4">Create Bucket</h2>
          <form onSubmit={handleCreateBucket} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="bucketName" className="text-sm font-medium">
                Bucket Name
              </label>
              <input
                id="bucketName"
                type="text"
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
                placeholder="my-assets"
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm outline-none"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={createBucket.isPending}>
              {createBucket.isPending ? 'Creating...' : 'Create'}
            </Button>
          </form>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Buckets Sidebar */}
        <div className="lg:col-span-1 border border-border rounded-lg overflow-hidden bg-card">
          <div className="p-3 bg-muted/50 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Buckets
          </div>
          <div className="divide-y divide-border">
            {buckets?.map((bucket) => (
              <div
                key={bucket.id}
                className={`relative group w-full transition-colors hover:bg-muted/50 ${selectedBucketId === bucket.id ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedBucketId(bucket.id)}
                  className={`w-full text-left px-4 py-3 text-sm focus:outline-none ${selectedBucketId === bucket.id ? 'text-primary font-medium' : ''}`}
                >
                  <span className="truncate pr-8 block">{bucket.name}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteBucket(bucket.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all rounded-md hover:bg-destructive/10"
                  title="Delete bucket"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {buckets?.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground italic">
                No buckets found
              </div>
            )}
          </div>
        </div>

        {/* File Explorer */}
        <div className="lg:col-span-3 border border-border rounded-lg overflow-hidden bg-white dark:bg-zinc-950 min-h-[400px]">
          {selectedBucketId ? (
            <FileBrowser bucketId={selectedBucketId} projectId={projectId} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                📁
              </div>
              <h3 className="text-lg font-medium">Select a bucket</h3>
              <p className="text-sm text-muted-foreground">
                Choose a bucket from the sidebar to view and manage files
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FileBrowser({ bucketId, projectId }: { bucketId: string; projectId: string }) {
  const { data: files, isLoading } = useFiles(bucketId);
  const uploadFile = useUploadFile(bucketId);
  const deleteFile = useDeleteFile(bucketId, projectId);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile.mutateAsync(file);
    e.target.value = '';
  };

  const handleDelete = async (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile.mutateAsync(fileId);
    }
  };

  if (isLoading)
    return <div className="p-12 text-center text-muted-foreground">Loading files...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
        <div className="text-sm font-medium">Files ({files?.length || 0})</div>
        <div className="flex items-center gap-2">
          <input type="file" id="file-upload" className="hidden" onChange={handleUpload} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={uploadFile.isPending}
          >
            {uploadFile.isPending ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/10 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Size</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {files?.map((file) => (
              <tr key={file.id} className="hover:bg-muted/10 transition-colors text-sm group">
                <td className="px-4 py-3 flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <span className="font-medium truncate max-w-[200px]" title={file.name}>
                    {file.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground uppercase">
                  {file.mimeType.split('/')[1] || 'FILE'}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {(Number(file.size) / 1024).toFixed(1)} KB
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <a
                    href={`/api/v1/storage/buckets/${bucketId}/files/${file.id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(file.id)}
                    className="text-xs text-destructive hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {files?.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-24 text-center text-muted-foreground text-sm italic"
                >
                  This bucket is empty. Upload your first file to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
