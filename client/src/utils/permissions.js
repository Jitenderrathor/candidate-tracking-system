export const hasPermission = (user, permission) => {
  if (!user) return false;
  if (user.role === 'Super Admin') return true;
  
  const userPermissions = user.permissions || [];
  
  if (Array.isArray(permission)) {
     return permission.some(p => userPermissions.includes(p));
  }
  
  return userPermissions.includes(permission);
};
