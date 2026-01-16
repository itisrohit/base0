import { createRoute, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/use-api-keys';
import { rootRoute } from './__root';

export const projectKeysRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/keys',
  component: () => (
    <DashboardLayout>
      <ApiKeysPage />
    </DashboardLayout>
  ),
});

function ApiKeysPage() {
  const { projectId } = useParams({ from: '/projects/$projectId/keys' });
  const { data: keys, isLoading } = useApiKeys(projectId);
  const createKey = useCreateApiKey(projectId);
  const revokeKey = useRevokeApiKey(projectId);

  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState<'read' | 'write' | 'admin'>('read');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    const result = await createKey.mutateAsync({ name: newKeyName, scope: newKeyScope });
    setCreatedSecret(result.secret);
    setNewKeyName('');
    setShowCreate(false);
  };

  const handleRevoke = async (keyId: string) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      await revokeKey.mutateAsync(keyId);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading API keys...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">Manage API keys for programmatic access</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'Create API Key'}
        </Button>
      </div>

      {createdSecret && (
        <div className="border border-green-500 rounded-lg p-6 bg-green-950/20 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-green-400">API Key Created!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Copy this secret now. You won't be able to see it again.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCreatedSecret(null)}>
              Dismiss
            </Button>
          </div>
          <div className="bg-background rounded p-4 font-mono text-sm break-all">
            {createdSecret}
          </div>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(createdSecret);
            }}
          >
            Copy to Clipboard
          </Button>
        </div>
      )}

      {showCreate && (
        <div className="border border-border rounded-lg p-6 bg-card space-y-4">
          <h2 className="text-xl font-semibold">Create New API Key</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="key-name" className="block text-sm font-medium mb-2">
                Key Name
              </label>
              <input
                id="key-name"
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API Key"
                className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="key-scope" className="block text-sm font-medium mb-2">
                Scope
              </label>
              <select
                id="key-scope"
                value={newKeyScope}
                onChange={(e) => setNewKeyScope(e.target.value as 'read' | 'write' | 'admin')}
                className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="read">Read - View data only</option>
                <option value="write">Write - Create and update data</option>
                <option value="admin">Admin - Full access including deletion</option>
              </select>
            </div>
            <Button onClick={handleCreate} disabled={createKey.isPending}>
              {createKey.isPending ? 'Creating...' : 'Create Key'}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {keys?.map((key) => (
          <div key={key.id} className="border border-border rounded-lg p-6 bg-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{key.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      key.scope === 'admin'
                        ? 'bg-red-500/20 text-red-400'
                        : key.scope === 'write'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {key.scope}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 font-mono">Key ID: {key.keyId}</p>
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                  {key.lastUsed && (
                    <span>Last used: {new Date(key.lastUsed).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRevoke(key.id)}
                disabled={revokeKey.isPending}
              >
                Revoke
              </Button>
            </div>
          </div>
        ))}
      </div>

      {keys?.length === 0 && !showCreate && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">No API keys yet</p>
          <Button onClick={() => setShowCreate(true)}>Create your first API key</Button>
        </div>
      )}
    </div>
  );
}
