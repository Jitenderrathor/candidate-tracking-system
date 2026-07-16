import { Shield, Users, Mail, Settings, LayoutDashboard, UserSearch, BarChart3, FileSpreadsheet, Trash2 } from 'lucide-react';

export const PERMISSION_FEATURES = [
  {
    category: 'Dashboard & Reports',
    features: [
      { id: 'dashboard', label: 'Dashboard Overview', description: 'View overall system metrics and recent activity', icon: LayoutDashboard },
      { id: 'reports', label: 'View Reports', description: 'Access detailed analytical reports', icon: BarChart3 }
    ]
  },
  {
    category: 'Candidates',
    features: [
      { id: 'edit_candidate', label: 'Edit Candidate', description: 'Modify existing candidate details and status', icon: UserSearch },
      { id: 'add_candidate', label: 'Add Candidate', description: 'Register new candidates manually', icon: UserSearch },
      { id: 'assign_candidates', label: 'Assign Candidates', description: 'Assign candidates to other users', icon: Users },
      { id: 'select_multiple', label: 'Select Multiple', description: 'Select multiple candidates for bulk actions', icon: UserSearch },
      { id: 'bulk_email', label: 'Bulk Email', description: 'Send emails to multiple candidates at once', icon: Mail },
      { id: 'export_excel', label: 'Export Excel', description: 'Download candidate data as an Excel file', icon: FileSpreadsheet },
      { id: 'excel_import', label: 'Bulk Excel Import', description: 'Import multiple candidates via Excel', icon: FileSpreadsheet },
      { id: 'recycle_bin', label: 'Recycle Bin Access', description: 'View and restore deleted records', icon: Trash2 }
    ]
  },
  {
    category: 'System & Admin',
    features: [
      { id: 'manage_users', label: 'Manage Standard Users', description: 'Create and manage standard User accounts', icon: Users },
      { id: 'email_templates', label: 'Email Templates', description: 'Manage system email templates', icon: Mail },
      { id: 'system_settings', label: 'System Settings', description: 'Access configuration for SMTP, Accounts, etc.', icon: Settings },
      { id: 'manage_admins', label: 'Full Admin Management', description: 'Create and manage other Admins', icon: Shield },
      { id: 'wipe_data', label: 'Wipe Complete Data', description: 'Ability to delete all candidate records', icon: Trash2 }
    ]
  }
];

export const DEFAULT_ROLE_PERMISSIONS = {
  'User': ['dashboard', 'edit_candidate'],
  'Admin': ['dashboard', 'reports', 'edit_candidate', 'add_candidate', 'assign_candidates', 'select_multiple', 'bulk_email', 'export_excel', 'excel_import', 'manage_users', 'recycle_bin', 'email_templates'],
  'Super Admin': ['dashboard', 'reports', 'edit_candidate', 'add_candidate', 'assign_candidates', 'select_multiple', 'bulk_email', 'export_excel', 'excel_import', 'manage_users', 'recycle_bin', 'email_templates', 'system_settings', 'manage_admins', 'wipe_data']
};
