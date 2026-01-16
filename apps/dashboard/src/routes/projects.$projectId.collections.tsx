import { createRoute, Link, useParams } from '@tanstack/react-router';
import { customAlphabet } from 'nanoid';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProjectNav } from '@/components/layout/project-nav';
import { Button } from '@/components/ui/button';
import {
  type CollectionField,
  useCollections,
  useCreateCollection,
  useDeleteCollection,
} from '@/hooks/use-collections';
import { rootRoute } from './__root';

const nanoid = customAlphabet('1234567890abcdef', 8);

export const projectCollectionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/collections',
  component: () => (
    <DashboardLayout>
      <CollectionsPage />
    </DashboardLayout>
  ),
});

function CollectionsPage() {
  const { projectId } = useParams({ from: '/projects/$projectId/collections' });
  const { data: collections, isLoading } = useCollections(projectId);
  const createCollection = useCreateCollection(projectId);
  const deleteCollection = useDeleteCollection(projectId);

  const [showCreate, setShowCreate] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [fields, setFields] = useState<(CollectionField & { id: string })[]>([
    { id: nanoid(), name: 'title', type: 'string', required: true },
  ]);

  const handleAddField = () => {
    setFields([...fields, { id: nanoid(), name: '', type: 'string', required: false }]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (
    index: number,
    key: keyof CollectionField,
    value: string | boolean,
  ) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  const handleCreate = async () => {
    if (!newCollectionName.trim() || fields.some((f) => !f.name.trim())) return;

    await createCollection.mutateAsync({
      name: newCollectionName,
      schemaDef: { fields },
    });

    setShowCreate(false);
    setNewCollectionName('');
    setFields([{ id: nanoid(), name: 'title', type: 'string', required: true }]);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this collection and ALL its data?')) {
      await deleteCollection.mutateAsync(id);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading collections...</div>;

  return (
    <div className="space-y-6">
      <ProjectNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collections</h1>
          <p className="text-muted-foreground mt-1">Define your data structures and schemas</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'Create Collection'}
        </Button>
      </div>

      {showCreate && (
        <div className="border border-border rounded-lg p-6 bg-card space-y-6">
          <div className="grid gap-4">
            <div>
              <label htmlFor="coll-name" className="block text-sm font-medium mb-1">
                Collection Name
              </label>
              <input
                id="coll-name"
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g. blog_posts"
                className="w-full px-4 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Schema Fields</span>
                <Button variant="outline" size="sm" onClick={handleAddField}>
                  Add Field
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-4 items-end border border-border/50 p-4 rounded-lg bg-background/50"
                >
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor={`field-name-${index}`}
                      className="text-xs text-muted-foreground"
                    >
                      Field Name
                    </label>
                    <input
                      id={`field-name-${index}`}
                      type="text"
                      value={field.name}
                      onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                      placeholder="field_name"
                      className="w-full px-3 py-1.5 bg-background border border-input rounded-md text-sm outline-none"
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <label
                      htmlFor={`field-type-${index}`}
                      className="text-xs text-muted-foreground"
                    >
                      Type
                    </label>
                    <select
                      id={`field-type-${index}`}
                      value={field.type}
                      onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                      className="w-full px-3 py-1.5 bg-background border border-input rounded-md text-sm outline-none"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 h-10 px-2">
                    <input
                      type="checkbox"
                      id={`req-${index}`}
                      checked={field.required}
                      onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-primary"
                    />
                    <label htmlFor={`req-${index}`} className="text-xs cursor-pointer">
                      Required
                    </label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-9 w-9"
                    onClick={() => handleRemoveField(index)}
                    disabled={fields.length === 1}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleCreate}
              disabled={
                createCollection.isPending ||
                !newCollectionName.trim() ||
                fields.some((f) => !f.name.trim())
              }
            >
              {createCollection.isPending ? 'Creating...' : 'Finalize Collection'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {collections?.map((collection) => (
          <div
            key={collection.id}
            className="border border-border rounded-lg p-6 bg-card space-y-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{collection.name}</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(collection.id)}
                  className="text-destructive"
                >
                  Delete
                </Button>
              </div>
            </div>

            <div className="bg-background/50 rounded-lg p-3 space-y-2 border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Schema
              </p>
              <div className="grid gap-2">
                {collection.schemaDef.fields.map((field) => (
                  <div key={field.name} className="flex items-center justify-between text-sm">
                    <span className="font-mono">{field.name}</span>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-secondary-foreground">
                        {field.type}
                      </span>
                      {field.required && (
                        <span className="text-[10px] text-primary font-bold uppercase">
                          Required
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-muted-foreground">
                Created {new Date(collection.createdAt).toLocaleDateString()}
              </span>
              <Link
                to="/projects/$projectId/collections/$collectionId"
                params={{ projectId, collectionId: collection.id }}
                className="text-sm font-medium text-primary hover:underline"
              >
                View Data →
              </Link>
            </div>
          </div>
        ))}

        {collections?.length === 0 && !showCreate && (
          <div className="col-span-2 py-12 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground mb-4">No collections in this project yet.</p>
            <Button variant="outline" onClick={() => setShowCreate(true)}>
              Create your first collection
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
