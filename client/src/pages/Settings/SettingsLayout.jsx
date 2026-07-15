import { useSearchParams } from 'react-router-dom';
import { Shield, Settings as SettingsIcon, User, Mail, Server, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/auth';
import { AccountSettingsForm } from './AccountSettingsForm';
import { SMTPSettingsForm } from './SMTPSettingsForm';
import { EmailSettingsForm } from './EmailSettingsForm';
import { UserListPage } from '../UserListPage';
import { hasPermission } from '@/utils/permissions';

export function SettingsLayout() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'account';

  const setActiveTab = (tabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      // Clean up UserListPage query params if changing away from users tab
      if (tabId !== 'users') {
        next.delete('mode');
        next.delete('id');
        next.delete('page');
        next.delete('search');
        next.delete('role');
        next.delete('status');
      }
      return next;
    });
  };

  const tabs = [
    { id: 'account', label: 'Account Settings', icon: User },
    { id: 'smtp', label: 'SMTP Configuration', icon: Server },
    { id: 'email', label: 'Email Defaults', icon: Mail },
  ];

  if (hasPermission(user, 'manage_users')) {
    tabs.push({ id: 'users', label: 'Manage Users', icon: Users });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        {/* Horizontal Folder Tabs */}
        <nav className="flex space-x-2 sm:space-x-1 overflow-x-auto" aria-label="Settings Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative z-10
                  border border-b-0 rounded-t-xl whitespace-nowrap
                  ${isActive 
                    ? 'bg-white border-slate-200 text-brand-600' 
                    : 'bg-slate-50 border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }
                `}
              >
                <Icon className={`size-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                {tab.label}
                {isActive && <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white" />}
              </button>
            );
          })}
        </nav>

        {/* Tab Content Box */}
        <div className="bg-white border border-slate-200 rounded-b-xl rounded-tr-xl shadow-sm p-6 sm:p-8 -mt-px relative z-0 min-h-[400px]">
          <main className="w-full">
            {activeTab === 'account' && <AccountSettingsForm />}
            {activeTab === 'smtp' && <SMTPSettingsForm />}
            {activeTab === 'email' && <EmailSettingsForm />}
            {activeTab === 'users' && <UserListPage />}
          </main>
        </div>
      </div>
    </div>
  );
}
