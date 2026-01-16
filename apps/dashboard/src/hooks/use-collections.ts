import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CollectionField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'json';
  required: boolean;
}

export interface Collection {
  id: string;
  name: string;
  projectId: string;
  schemaDef: {
    fields: CollectionField[];
  };
  permissions: Record<string, unknown>;
  createdAt: string;
}

export function useCollections(projectId: string) {
  return useQuery({
    queryKey: ['collections', projectId],
    queryFn: async () => {
      const { data } = await api.get<{ collections: Collection[] }>(
        `/projects/${projectId}/collections`,
      );
      return data.collections || [];
    },
    enabled: !!projectId,
  });
}

export function useCreateCollection(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      name: string;
      schemaDef: { fields: CollectionField[] };
      permissions?: Record<string, unknown>;
    }) => {
      const { data } = await api.post<{ collection: Collection }>(
        `/projects/${projectId}/collections`,
        vars,
      );
      return data.collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', projectId] });
    },
  });
}

export function useDeleteCollection(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionId: string) => {
      await api.delete(`/projects/${projectId}/collections/${collectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', projectId] });
    },
  });
}
