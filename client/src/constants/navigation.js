import { BarChart3, FileSpreadsheet, LayoutDashboard, Users, UserSearch, Trash2 } from 'lucide-react';
import { ROLES } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';

export const DASHBOARD_NAVIGATION = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Candidates', path: ROUTES.CANDIDATES, icon: UserSearch },
  { label: 'Users', path: ROUTES.USERS, icon: Users, roles: [ROLES.ADMIN] },
  { label: 'Excel Import', path: ROUTES.EXCEL_IMPORT, icon: FileSpreadsheet, roles: [ROLES.ADMIN] },
  { label: 'Reports', path: ROUTES.REPORTS, icon: BarChart3 },
  { label: 'Recycle Bin', path: ROUTES.TRASH, icon: Trash2, roles: [ROLES.ADMIN] },
];
