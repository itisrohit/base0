import { createRoute, Link } from '@tanstack/react-router';
import { rootRoute } from './__root';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardHome,
});

function DashboardHome() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Mission Control</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm font-medium">Total Projects</h3>
          <p className="text-4xl font-bold mt-2">12</p>
        </div>
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm font-medium">API Requests (24h)</h3>
          <p className="text-4xl font-bold mt-2">1.2M</p>
        </div>
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm font-medium">Storage Used</h3>
          <p className="text-4xl font-bold mt-2">45.2 GB</p>
        </div>
      </div>
      <div className="mt-8">
        <Link to="/login" className="text-blue-500 hover:underline">
          Go to Login
        </Link>
      </div>
    </div>
  );
}
