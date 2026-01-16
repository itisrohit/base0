import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Document {
  id: string;
  collectionId: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface ListDocumentsResponse {
  documents: Document[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}

export function useDocuments(projectId: string, collectionId: string) {
  return useQuery({
    queryKey: ['documents', projectId, collectionId],
    queryFn: async () => {
      const { data } = await api.get<ListDocumentsResponse>(
        `/projects/${projectId}/collections/${collectionId}/documents`,
      );
      return data;
    },
    enabled: !!projectId && !!collectionId,
  });
}

export function useCreateDocument(projectId: string, collectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (docData: Record<string, unknown>) => {
      const { data } = await api.post<{ document: Document }>(
        `/projects/${projectId}/collections/${collectionId}/documents`,
        { data: docData },
      );
      return data.document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId, collectionId] });
    },
  });
}

export function useUpdateDocument(projectId: string, collectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: docData }: { id: string; data: Record<string, unknown> }) => {
      const { data } = await api.patch<{ document: Document }>(
        `/projects/${projectId}/collections/${collectionId}/documents/${id}`,
        docData,
      );
      return data.document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId, collectionId] });
    },
  });
}

export function useDeleteDocument(projectId: string, collectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${projectId}/collections/${collectionId}/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId, collectionId] });
    },
  });
}
