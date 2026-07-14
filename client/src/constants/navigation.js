import { BarChart3, FileSpreadsheet, LayoutDashboard, Users, UserSearch, Trash2, History, Mail, Settings } from 'lucide-react';
import { ROLES } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';

export const DASHBOARD_NAVIGATION = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Candidates', path: ROUTES.CANDIDATES, icon: UserSearch },
  { label: 'Excel Import', path: ROUTES.EXCEL_IMPORT, icon: FileSpreadsheet, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { label: 'Import History', path: '/import-history', icon: History, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { label: 'Reports', path: ROUTES.REPORTS, icon: BarChart3 },
  { label: 'Email Templates', path: ROUTES.EMAIL_TEMPLATES, icon: Mail, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { label: 'Recycle Bin', path: ROUTES.TRASH, icon: Trash2, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { label: 'Settings', path: ROUTES.SETTINGS, icon: Settings, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
];
