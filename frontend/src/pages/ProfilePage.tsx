import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Phone, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    username: user?.username || '',
    phone: user?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile(formData);
      toast.success('Profile updated');
      setIsEditing(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in">
      {/* Profile Header */}
      <div className="card p-8 mb-8 text-center">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-bold text-white">
            {user?.full_name?.charAt(0) || 'U'}
          </span>
        </div>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          {user?.full_name}
        </h1>
        <p className="text-gray-500">{user?.email}</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className={`badge ${
            user?.role === 'admin' ? 'badge-purple' :
            user?.role === 'organizer' ? 'badge-blue' : 'badge-green'
          }`}>
            {user?.role}
          </span>
          {user?.is_verified && <span className="badge-green">Verified</span>}
        </div>
      </div>

      {/* Profile Form */}
      <div className="card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Profile Details</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`btn-sm ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input pl-12"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input pl-12"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input pl-12"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input pl-12"
                  disabled={!isEditing}
                  placeholder="Not provided"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Account Info */}
      <div className="card p-8 mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Member Since</span>
            <span className="text-gray-900 font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Role</span>
            <span className="text-gray-900 font-medium capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Account Status</span>
            <span className={`${user?.is_active ? 'text-green-600' : 'text-red-600'} font-medium`}>
              {user?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
