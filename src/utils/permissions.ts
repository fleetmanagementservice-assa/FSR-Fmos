/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OperationUser } from '../types';

export type MenuId = 'dashboard' | 'fsr-monitoring' | 'fsr-form' | 'master-data' | 'activity-logs';

/**
 * Check whether a user with a given role and permission settings is allowed to access a menu tab
 */
export function isMenuAllowed(menuId: MenuId | string, user: OperationUser | null | undefined): boolean {
  if (!user || user.status !== 'Active') return false;

  const role = user.role_operation;

  // 1. Super Admin has unrestricted access to all menus
  if (role === 'Super Admin') return true;

  // 2. Custom permission overrides if explicitly disabled
  if (user.permissions?.allowedMenus) {
    if (menuId === 'dashboard' && user.permissions.allowedMenus.dashboard === false) return false;
    if (menuId === 'fsr-monitoring' && user.permissions.allowedMenus.fsrMonitoring === false) return false;
    if (menuId === 'master-data' && user.permissions.allowedMenus.masterData === false && role !== 'Leader Operation') return false;
    if (menuId === 'activity-logs' && user.permissions.allowedMenus.activityLogs === false && role !== 'Leader Operation') return false;
  }

  // 3. Strict Role-based access rules
  switch (menuId) {
    case 'dashboard':
      // Dashboard is accessible to all active roles
      return true;

    case 'fsr-monitoring':
      // FSR Monitoring is accessible to all active roles
      return true;

    case 'fsr-form':
      // Pengajuan FSR is ONLY accessible to Admin Customer (Super Admin handled above)
      return role === 'Admin Customer';

    case 'master-data':
      // Master Data ERP is accessible to Leader Operation (Super Admin handled above)
      return role === 'Leader Operation';

    case 'activity-logs':
      // Activity Logs is accessible to Leader Operation (Super Admin handled above)
      return role === 'Leader Operation';

    default:
      return false;
  }
}

/**
 * Get the default starting tab for a user based on their allowed permissions
 */
export function getStartTabForUser(user: OperationUser | null | undefined): MenuId {
  if (!user) return 'dashboard';
  if (isMenuAllowed('dashboard', user)) return 'dashboard';
  if (isMenuAllowed('fsr-monitoring', user)) return 'fsr-monitoring';
  if (isMenuAllowed('fsr-form', user)) return 'fsr-form';
  if (isMenuAllowed('master-data', user)) return 'master-data';
  if (isMenuAllowed('activity-logs', user)) return 'activity-logs';
  return 'dashboard';
}
