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
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read']);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!keyName.trim()) return;
    const result = await createKey.mutateAsync({ name: keyName, scopes: selectedScopes });
    setCreatedKey(result.apiKey);
    setShowCreate(false);
    setKeyName('');
    setSelectedScopes(['read']);
  };

  const handleRevoke = async (keyId: string) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      await revokeKey.mutateAsync(keyId);
    }
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
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

      {createdKey && (
        <div className="border border-green-500 rounded-lg p-6 bg-green-950/20 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-green-400">API Key Created!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Copy this key now. You won't be able to see it again.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCreatedKey(null)}>
              Dismiss
            </Button>
          </div>
          <div className="bg-background rounded p-4 font-mono text-sm break-all border border-green-500/30">
            {createdKey}
          </div>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(createdKey);
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
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g., Production API Key"
                className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <div className="block text-sm font-medium mb-3">Scopes</div>
              <div className="space-y-2">
                {['read', 'write', 'delete'].map((scope) => (
                  <label key={scope} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                    <span className="text-sm capitalize">{scope}</span>
                    <span className="text-xs text-muted-foreground">
                      {scope === 'read' && '- View data only'}
                      {scope === 'write' && '- Create and update data'}
                      {scope === 'delete' && '- Delete data'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={createKey.isPending || selectedScopes.length === 0 || !keyName.trim()}
            >
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
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{key.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground font-mono mb-3">{key.keyId}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {key.scopes?.map((scope) => (
                    <span
                      key={scope}
                      className={`px-2 py-1 text-xs rounded-full ${
                        scope === 'delete'
                          ? 'bg-red-500/20 text-red-400'
                          : scope === 'write'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {scope}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(key.createdAt).toLocaleString()}
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
