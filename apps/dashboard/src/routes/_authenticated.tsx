import { createRoute, Outlet, redirect } from '@tanstack/react-router';
import Cookies from 'js-cookie';
import { rootRoute } from './__root';

export const authenticatedLayout = createRoute({
  id: 'authenticated',
  getParentRoute: () => rootRoute,
  beforeLoad: () => {
    const token = Cookies.get('auth_token');
    if (!token) {
      throw redirect({
        to: '/login',
      });
    }
  },
  component: Outlet,
});
