import { BarChart3, FileSpreadsheet, LayoutDashboard, Users, UserSearch, Trash2, History, Mail, Settings } from 'lucide-react';
import { ROLES } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';

export const DASHBOARD_NAVIGATION = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Candidates', path: ROUTES.CANDIDATES, icon: UserSearch },
  { label: 'Excel Import', path: ROUTES.EXCEL_IMPORT, icon: FileSpreadsheet, permissions: ['excel_import'] },
  { label: 'Import History', path: '/import-history', icon: History, permissions: ['excel_import'] },
  { label: 'Reports', path: ROUTES.REPORTS, icon: BarChart3, permissions: ['reports'] },
  { label: 'Email Templates', path: ROUTES.EMAIL_TEMPLATES, icon: Mail, permissions: ['email_templates'] },
  { label: 'Recycle Bin', path: ROUTES.TRASH, icon: Trash2, permissions: ['recycle_bin'] },
  { label: 'Settings', path: ROUTES.SETTINGS, icon: Settings, permissions: ['system_settings', 'manage_users', 'manage_admins'] },
];
