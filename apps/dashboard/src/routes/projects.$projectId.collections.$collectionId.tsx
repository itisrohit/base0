import { createRoute, Link, useParams } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { useCollections } from '@/hooks/use-collections';
import { useCreateDocument, useDeleteDocument, useDocuments } from '@/hooks/use-documents';
import { authenticatedLayout } from './_authenticated';

export const projectCollectionDataRoute = createRoute({
  getParentRoute: () => authenticatedLayout,
  path: '/projects/$projectId/collections/$collectionId',
  component: () => (
    <DashboardLayout>
      <DataExplorerPage />
    </DashboardLayout>
  ),
});

function DataExplorerPage() {
  const { projectId, collectionId } = useParams({
    from: '/authenticated/projects/$projectId/collections/$collectionId',
  });

  const { data: collections } = useCollections(projectId);
  const collection = useMemo(
    () => collections?.find((c) => c.id === collectionId),
    [collections, collectionId],
  );

  const { data: docsRes, isLoading } = useDocuments(projectId, collectionId);
  const createDoc = useCreateDocument(projectId, collectionId);
  const deleteDoc = useDeleteDocument(projectId, collectionId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const handleCreate = async () => {
    await createDoc.mutateAsync(formData);
    setShowAddForm(false);
    setFormData({});
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this record?')) {
      await deleteDoc.mutateAsync(id);
    }
  };

  if (!collection && !isLoading) return <div className="p-8">Collection not found.</div>;
  if (isLoading) return <div className="p-8 text-center">Loading data...</div>;

  const fields = collection?.schemaDef.fields || [];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/projects/$projectId/collections"
          params={{ projectId }}
          className="hover:text-foreground"
        >
          Collections
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{collection?.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{collection?.name} Data</h1>
          <p className="text-muted-foreground mt-1">Manage records for this collection</p>
        </div>
        <Button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setFormData({});
          }}
        >
          {showAddForm ? 'Cancel' : 'Add Record'}
        </Button>
      </div>

      {showAddForm && (
        <div className="border border-border rounded-lg p-6 bg-card space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold">New Record</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className="space-y-1">
                <label
                  htmlFor={`field-${field.name}`}
                  className="text-xs font-medium flex items-center gap-1"
                >
                  {field.name}
                  <span className="text-muted-foreground font-normal">({field.type})</span>
                  {field.required && <span className="text-destructive">*</span>}
                </label>
                {field.type === 'boolean' ? (
                  <select
                    id={`field-${field.name}`}
                    value={(formData[field.name] as string) ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.name]: e.target.value === 'true' })
                    }
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : field.type === 'json' ? (
                  <textarea
                    id={`field-${field.name}`}
                    placeholder="{}"
                    onChange={(e) => {
                      try {
                        setFormData({ ...formData, [field.name]: JSON.parse(e.target.value) });
                      } catch {}
                    }}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm outline-none font-mono min-h-[80px]"
                  />
                ) : (
                  <input
                    id={`field-${field.name}`}
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={(formData[field.name] as string | number) ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [field.name]:
                          field.type === 'number' ? Number(e.target.value) : e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm outline-none"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleCreate} disabled={createDoc.isPending}>
              {createDoc.isPending ? 'Saving...' : 'Save Record'}
            </Button>
          </div>
        </div>
      )}

      <div className="border border-border rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="px-4 py-3 min-w-[150px]">ID</th>
                {fields.map((f) => (
                  <th key={f.name} className="px-4 py-3">
                    {f.name}
                  </th>
                ))}
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {docsRes?.documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/20 transition-colors text-sm group">
                  <td
                    className="px-4 py-3 font-mono text-[10px] text-muted-foreground truncate max-w-[100px]"
                    title={doc.id}
                  >
                    {doc.id}
                  </td>
                  {fields.map((field) => (
                    <td key={field.name} className="px-4 py-3">
                      {field.type === 'json' ? (
                        <span className="text-xs font-mono bg-secondary px-1 rounded">JSON</span>
                      ) : field.type === 'boolean' ? (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${doc.data[field.name] ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                        >
                          {doc.data[field.name] ? 'True' : 'False'}
                        </span>
                      ) : (
                        String(doc.data[field.name] ?? '')
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(doc.id)}
                    >
                      ×
                    </Button>
                  </td>
                </tr>
              ))}
              {docsRes?.documents.length === 0 && (
                <tr>
                  <td
                    colSpan={fields.length + 3}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
