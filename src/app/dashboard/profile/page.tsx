"use client";

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  User, 
  Mail, 
  Calendar, 
  GraduationCap,
  Camera,
  Save,
  X,
  Edit2,
  Lock,
  Shield
} from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { profileService, UpdateProfileData } from '@/services/profile.service';
import { Alert } from '@/components/ui/Alert';
import { ChangePasswordModal } from '@/components/profile/ChangePasswordModal';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<UpdateProfileData>({
    full_name: '',
    nim: '',
    angkatan: new Date().getFullYear(),
    bio: '',
    photo_url: ''
  });

  useEffect(() => {
    fetchProfile();
    checkPasswordStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const result = await profileService.getUserProfile(session.user.id);
      
      if (result.success && result.data) {
        setProfile(result.data);
        setFormData({
          full_name: result.data.full_name,
          nim: result.data.nim,
          angkatan: result.data.angkatan,
          bio: result.data.bio || '',
          photo_url: result.data.photo_url || ''
        });
        setIsOAuthUser(result.data.users?.auth_provider !== 'email');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Gagal memuat data profile');
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordStatus = async () => {
    const hasPass = await profileService.hasPassword();
    setHasPassword(hasPass);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'angkatan' ? parseInt(value) : value
    }));
    setError('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran foto maksimal 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const result = await profileService.uploadPhoto(session.user.id, file);

      if (result.success && result.photoUrl) {
        setFormData(prev => ({ ...prev, photo_url: result.photoUrl! }));
        setSuccess('Foto berhasil diupload');
        await fetchProfile();
      } else {
        setError(result.error || 'Gagal upload foto');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat upload foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.nim || !formData.angkatan) {
      setError('Nama, NIM, dan Angkatan harus diisi');
      return;
    }

    if (!/^\d{9}$/.test(formData.nim)) {
      setError('Format NIM tidak valid (9 digit angka)');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const result = await profileService.updateProfile(session.user.id, formData);

      if (result.success) {
        setSuccess('Profile berhasil diupdate');
        setEditing(false);
        await fetchProfile();
      } else {
        setError(result.error || 'Gagal update profile');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setSuccess('');
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        nim: profile.nim,
        angkatan: profile.angkatan,
        bio: profile.bio || '',
        photo_url: profile.photo_url || ''
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Saya</h1>
            <p className="text-gray-600 mt-1">Kelola informasi profile Anda</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Batal</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Alert */}
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                  {formData.photo_url ? (
                    <Image
                      src={formData.photo_url}
                      alt={formData.full_name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-4xl font-bold">
                      {formData.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                
                {editing && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                  </label>
                )}
                
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
              </div>

              {/* NIM & Angkatan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIM
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="nim"
                      value={formData.nim}
                      onChange={handleInputChange}
                      disabled={!editing}
                      maxLength={9}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Angkatan
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="angkatan"
                      value={formData.angkatan}
                      onChange={handleInputChange}
                      disabled={!editing}
                      min={2020}
                      max={2030}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={profile?.users?.email || ''}
                    disabled
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!editing}
                  rows={4}
                  placeholder="Ceritakan sedikit tentang diri Anda..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600 resize-none"
                />
              </div>

              {/* Security Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Keamanan
                </h3>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors w-full text-left"
                >
                  <Lock className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {hasPassword ? 'Ubah Password' : 'Atur Password'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {hasPassword 
                        ? 'Ganti password untuk keamanan akun' 
                        : isOAuthUser 
                          ? 'Atur password untuk login dengan email'
                          : 'Update password Anda'
                      }
                    </p>
                  </div>
                </button>
              </div>

              {/* Account Info */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Informasi Akun</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Terdaftar sejak</p>
                    <p className="font-medium text-gray-900">
                      {new Date(profile?.users?.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Login terakhir</p>
                    <p className="font-medium text-gray-900">
                      {profile?.users?.last_login 
                        ? new Date(profile.users.last_login).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Auth Provider</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {profile?.users?.auth_provider || 'Email'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          checkPasswordStatus(); // Refresh password status after modal closes
        }}
        requireCurrentPassword={hasPassword}
      />
    </DashboardLayout>
  );
}