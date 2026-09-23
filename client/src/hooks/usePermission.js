import { useAuthStore } from '../store/authStore';

/** RBAC hook for the UI: const canEdit = usePermission('users:write'); */
export function usePermission(permission) {
  return useAuthStore((state) => state.can(permission));
}
