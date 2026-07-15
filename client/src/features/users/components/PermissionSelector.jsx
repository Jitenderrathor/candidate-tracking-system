import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PERMISSION_FEATURES } from '@/constants/permissions';

export function PermissionSelector({ permissions = [], onChange, disabled = false }) {
  const [expandedCategories, setExpandedCategories] = useState(
    PERMISSION_FEATURES.reduce((acc, cat) => ({ ...acc, [cat.category]: true }), {})
  );

  const handleTogglePermission = (permissionId) => {
    if (disabled) return;
    const newPermissions = permissions.includes(permissionId)
      ? permissions.filter(p => p !== permissionId)
      : [...permissions, permissionId];
    onChange(newPermissions);
  };

  const handleToggleCategory = (category, categoryPermissions, isAllSelected) => {
    if (disabled) return;
    if (isAllSelected) {
      onChange(permissions.filter(p => !categoryPermissions.includes(p)));
    } else {
      const newPerms = new Set([...permissions, ...categoryPermissions]);
      onChange(Array.from(newPerms));
    }
  };

  const toggleCategoryExpand = (category) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="text-slate-700">
      <div className="space-y-4">
        {PERMISSION_FEATURES.map((category) => {
          const categoryPermissions = category.features.map(f => f.id);
          const selectedCount = categoryPermissions.filter(p => permissions.includes(p)).length;
          const totalCount = categoryPermissions.length;
          const isAllSelected = selectedCount === totalCount;
          const isExpanded = expandedCategories[category.category];

          return (
            <div key={category.category}>
              <div 
                className={`flex items-center justify-between p-3 cursor-pointer rounded-lg hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}
                onClick={() => toggleCategoryExpand(category.category)}
              >
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    checked={isAllSelected} 
                    onChange={() => handleToggleCategory(category.category, categoryPermissions, isAllSelected)}
                    disabled={disabled}
                    className="w-4 h-4 text-brand-600 bg-white border-slate-300 rounded focus:ring-brand-600 focus:ring-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="font-medium text-slate-800">{category.category}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-sm">
                  <span>{selectedCount}/{totalCount}</span>
                  {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </div>
              </div>
              
              {isExpanded && (
                <div className="pl-12 py-2 bg-white">
                  {category.features.map((feature) => (
                    <div key={feature.id} className="flex items-center py-2 hover:bg-slate-50 -ml-12 pl-12">
                      <input 
                        type="checkbox"
                        checked={permissions.includes(feature.id)}
                        onChange={() => handleTogglePermission(feature.id)}
                        disabled={disabled}
                        className="w-4 h-4 text-brand-600 bg-white border-slate-300 rounded focus:ring-brand-600 focus:ring-2 mr-3 mt-1 self-start"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">{feature.label}</div>
                        <div className="text-xs text-slate-500 mt-1">{feature.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
