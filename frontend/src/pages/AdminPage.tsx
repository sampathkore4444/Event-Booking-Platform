import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { apiClient } from '../services/api';
import {
  Users, Shield, Search,
  CheckCircle, XCircle, UserPlus, AlertTriangle,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  phone?: string;
  created_at: string;
}

const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [confirmRoleChange, setConfirmRoleChange] = useState<{
    userId: string;
    userName: string;
    currentRole: string;
    newRole: string;
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {
        skip: page * pageSize,
        limit: pageSize,
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const data = await apiClient.get<AdminUser[]>('/users', params);
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleChangeRole = (userId: string, userName: string, currentRole: string, newRole: string) => {
    if (currentRole === newRole) return;
    setConfirmRoleChange({ userId, userName, currentRole, newRole });
  };

  const executeRoleChange = async () => {
    if (!confirmRoleChange) return;
    const { userId, newRole } = confirmRoleChange;
    setChangingRole(userId);
    setConfirmRoleChange(null);
    try {
      await apiClient.put(`/users/${userId}/role`, { role: newRole });
      toast.success(`User role changed to ${newRole}`);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error?.response?.data?.detail || t('common.error'));
    } finally {
      setChangingRole(null);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await apiClient.post(`/users/${userId}/deactivate`);
        toast.success('User deactivated');
      } else {
        await apiClient.post(`/users/${userId}/activate`);
        toast.success('User activated');
      }
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error?.response?.data?.detail || t('common.error'));
    }
  };

  const handleVerify = async (userId: string) => {
    try {
      await apiClient.post(`/users/${userId}/verify`);
      toast.success('User verified');
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error?.response?.data?.detail || t('common.error'));
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center animate-fade-in">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400">You need admin privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">Admin Panel</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Shield className="w-4 h-4" />
          Logged in as <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <Users className="w-8 h-8 text-brand-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Users (current page)</div>
        </div>
        <div className="card p-5">
          <Shield className="w-8 h-8 text-purple-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Admins</div>
        </div>
        <div className="card p-5">
          <UserPlus className="w-8 h-8 text-blue-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {users.filter(u => u.role === 'organizer').length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Organizers</div>
        </div>
        <div className="card p-5">
          <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {users.filter(u => u.is_verified).length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Verified</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['', 'attendee', 'organizer', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => { setRoleFilter(role); setPage(0); }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {role || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Verified</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                          {u.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {u.full_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            @{u.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, u.full_name || u.username, u.role, e.target.value)}
                        disabled={changingRole === u.id}
                        className={`text-xs font-medium rounded-lg px-2.5 py-1.5 border-0 cursor-pointer transition-colors ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : u.role === 'organizer'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        <option value="attendee">Attendee</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                          u.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-400'
                        }`}
                      >
                        {u.is_active ? (
                          <><CheckCircle className="w-3 h-3" /> Active</>
                        ) : (
                          <><XCircle className="w-3 h-3" /> Inactive</>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      ) : !u.is_active ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <button
                          onClick={() => handleVerify(u.id)}
                          className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Verify now
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs text-gray-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing {users.length} users (page {page + 1})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-ghost btn-sm disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={users.length < pageSize}
              className="btn-ghost btn-sm disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Role Change Confirmation Modal */}
      {confirmRoleChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmRoleChange(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Role Change</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action affects user permissions</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">User</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{confirmRoleChange.userName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Current Role</span>
                <span className="text-sm font-medium capitalize px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {confirmRoleChange.currentRole}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">New Role</span>
                <span className="text-sm font-medium capitalize px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {confirmRoleChange.newRole}
                </span>
              </div>
              {confirmRoleChange.newRole === 'admin' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Granting admin access gives full system control including user management, event management, and all other permissions.
                </p>
              )}
              {confirmRoleChange.newRole === 'attendee' && confirmRoleChange.currentRole !== 'attendee' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Demoting to attendee will remove all organizer privileges (create events, analytics, QR payment confirmation).
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmRoleChange(null)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={executeRoleChange}
                disabled={changingRole === confirmRoleChange.userId}
                className="btn-primary btn-sm"
              >
                {changingRole === confirmRoleChange.userId ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                {changingRole === confirmRoleChange.userId ? 'Changing...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
