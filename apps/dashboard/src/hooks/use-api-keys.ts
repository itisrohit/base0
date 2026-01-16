import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ApiKey {
  id: string;
  name: string;
  keyId: string;
  projectId: string;
  scopes: string[];
  createdAt: string;
}

export interface CreateApiKeyResponse {
  message: string;
  apiKey: string; // The full key like "b0_xxxxx_yyyyy"
  id: string;
  name: string;
  keyId: string;
  projectId: string;
  scopes: string[];
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
    mutationFn: async (vars: { name: string; scopes: string[] }) => {
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
