import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import HomePage from '../pages/HomePage'
import { AuthCallbackPage } from '../features/auth/AuthCallbackPage'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: AuthCallbackPage,
})

const routeTree = rootRoute.addChildren([indexRoute, authCallbackRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
