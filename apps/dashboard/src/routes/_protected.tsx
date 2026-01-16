import { createRoute, redirect } from '@tanstack/react-router';
import Cookies from 'js-cookie';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { rootRoute } from './__root';

// Protected route wrapper that checks authentication
export const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_protected',
  beforeLoad: async () => {
    const token = Cookies.get('auth_token');
    if (!token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: window.location.pathname,
        },
      });
    }
  },
  component: () => (
    <DashboardLayout>
      <div />
    </DashboardLayout>
  ),
});
