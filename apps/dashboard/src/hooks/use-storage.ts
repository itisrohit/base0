import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Bucket {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
}

export interface FileDoc {
  id: string;
  bucketId: string;
  name: string;
  size: string;
  mimeType: string;
  path: string;
  createdAt: string;
}

export function useBuckets(projectId: string) {
  return useQuery({
    queryKey: ['buckets', projectId],
    queryFn: async () => {
      const { data } = await api.get<{ buckets: Bucket[] }>(
        `/storage/buckets?projectId=${projectId}`,
      );
      return data.buckets;
    },
    enabled: !!projectId,
  });
}

export function useCreateBucket(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post(`/storage/buckets`, { projectId, name });
      return data.bucket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buckets', projectId] });
    },
  });
}

export function useFiles(bucketId: string) {
  return useQuery({
    queryKey: ['files', bucketId],
    queryFn: async () => {
      const { data } = await api.get<{ files: FileDoc[] }>(`/storage/buckets/${bucketId}/files`);
      return data.files;
    },
    enabled: !!bucketId,
  });
}

export function useUploadFile(bucketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/storage/buckets/${bucketId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.file;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', bucketId] });
    },
  });
}

export function useDeleteBucket(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bucketId: string) => {
      await api.delete(`/storage/buckets/${bucketId}?projectId=${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buckets', projectId] });
    },
  });
}

export function useDeleteFile(bucketId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      await api.delete(`/storage/buckets/${bucketId}/files/${fileId}?projectId=${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', bucketId] });
    },
  });
}
