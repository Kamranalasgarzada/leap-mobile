export function getRoleHome(role?: string): string {
  switch (role) {
    case 'TEACHER': return '/teacher-tabs/dashboard';
    case 'PARENT': return '/parent-tabs/dashboard';
    case 'ADMIN': return '/admin-tabs/dashboard';
    default: return '/tabs/home';
  }
}

export function getRoleTabsPath(role?: string): string {
  switch (role) {
    case 'TEACHER': return '/teacher-tabs';
    case 'PARENT': return '/parent-tabs';
    case 'ADMIN': return '/admin-tabs';
    default: return '/tabs';
  }
}
