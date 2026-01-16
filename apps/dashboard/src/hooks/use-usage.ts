import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface UsageData {
  requests: { date: string; count: number }[];
  storage: {
    used: number;
    limit: number;
  };
  database: {
    documents: number;
    collections: number;
  };
}

export function useUsage(projectId: string) {
  return useQuery({
    queryKey: ['usage', projectId],
    queryFn: async () => {
      const { data } = await api.get<{ usage: UsageData }>(`/projects/${projectId}/usage`);
      return data.usage;
    },
    enabled: !!projectId,
  });
}
