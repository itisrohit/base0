import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Project {
    id: string;
    name: string;
    ownerId: string;
    config: Record<string, unknown>;
    createdAt?: string;
    role?: string;
}

export function useProjects() {
    return useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const { data } = await api.get<{ projects: Project[] }>('/projects');
            return data.projects || [];
        },
    });
}

export function useProject(id: string) {
    return useQuery({
        queryKey: ['projects', id],
        queryFn: async () => {
            const { data } = await api.get<{ project: Project }>(`/projects/${id}`);
            return data.project;
        },
        enabled: !!id,
        retry: 0,
        refetchOnWindowFocus: false,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (vars: { name: string; config?: Record<string, unknown> }) => {
            const { data } = await api.post<{ project: Project }>('/projects', vars);
            return data.project;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'], exact: true });
        },
    });
}

export function useUpdateProject(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (vars: { name?: string; config?: Record<string, unknown> }) => {
            const { data } = await api.patch<{ project: Project }>(`/projects/${id}`, vars);
            return data.project;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'], exact: true });
            queryClient.invalidateQueries({ queryKey: ['projects', id] });
        },
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/projects/${id}`);
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['projects'], exact: true });
            queryClient.removeQueries({ queryKey: ['projects', id] });
        },
    });
}
