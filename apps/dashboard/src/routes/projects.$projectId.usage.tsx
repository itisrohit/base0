import { createRoute, useParams } from '@tanstack/react-router';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProjectNav } from '@/components/layout/project-nav';
import { useUsage } from '@/hooks/use-usage';
import { rootRoute } from './__root';

export const projectUsageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId/usage',
  component: () => (
    <DashboardLayout>
      <UsagePage />
    </DashboardLayout>
  ),
});

function UsagePage() {
  const { projectId } = useParams({ from: '/projects/$projectId/usage' });
  const { data: usage, isLoading } = useUsage(projectId);

  if (isLoading) return <div className="p-8 text-center">Loading usage metrics...</div>;
  if (!usage) return <div className="p-8 text-center text-muted-foreground">No data available</div>;

  const storagePercentage = (usage.storage.used / usage.storage.limit) * 100;

  return (
    <div className="space-y-6">
      <ProjectNav />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-sm text-muted-foreground font-medium">Total Requests</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {usage.requests.reduce((acc, curr) => acc + curr.count, 0).toLocaleString()}
            </span>
            <span className="text-xs text-green-500 font-medium">Last 7 days</span>
          </div>
        </div>

        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-sm text-muted-foreground font-medium">Data Storage</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>{usage.storage.used}MB used</span>
              <span>{usage.storage.limit}MB limit</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-sm text-muted-foreground font-medium">Database Collections</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{usage.database.collections}</span>
          </div>
        </div>

        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-sm text-muted-foreground font-medium">Database Documents</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{usage.database.documents.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Requests Chart */}
        <div className="border border-border rounded-lg p-6 bg-card min-w-0 overflow-hidden">
          <h2 className="text-lg font-semibold mb-6">API Requests</h2>
          <div className="w-full aspect-[2/1] min-h-[300px]">
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={usage.requests}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  dy={10}
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return date.toLocaleDateString('en-US', { weekday: 'short' });
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--primary)"
                  fillOpacity={1}
                  fill="url(#colorRequests)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Breakdown */}
        <div className="border border-border rounded-lg p-6 bg-card min-w-0 overflow-hidden">
          <h2 className="text-lg font-semibold mb-6">Daily Breakdown</h2>
          <div className="w-full aspect-[2/1] min-h-[300px]">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={usage.requests}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  dy={10}
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
