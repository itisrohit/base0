import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ApiKey {
  id: string;
  keyId: string;
  name: string;
  scope: 'read' | 'write' | 'admin';
  createdAt: string;
  lastUsed?: string;
}

export interface CreateApiKeyResponse {
  keyId: string;
  secret: string;
  apiKey: ApiKey;
}

export function useApiKeys(projectId: string) {
  return useQuery({
    queryKey: ['apiKeys', projectId],
    queryFn: async () => {
      const { data } = await api.get<{ keys: ApiKey[] }>(`/projects/${projectId}/keys`);
      return data.keys || [];
    },
    enabled: !!projectId,
  });
}

export function useCreateApiKey(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { name: string; scope: 'read' | 'write' | 'admin' }) => {
      const { data } = await api.post<CreateApiKeyResponse>(`/projects/${projectId}/keys`, vars);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys', projectId] });
    },
  });
}

export function useRevokeApiKey(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      await api.delete(`/projects/${projectId}/keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys', projectId] });
    },
  });
}
