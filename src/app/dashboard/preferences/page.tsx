"use client";

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  Settings,
  FileText,
  Video,
  Code,
  Database,
  Globe,
  Smartphone,
  BarChart,
  Shield,
  Cloud,
  Layers,
  Save,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { profileService } from '@/services/profile.service';
import { Alert } from '@/components/ui/Alert';
import { PreferenceCard } from '@/components/ui/PreferenceCard';
import { UserPreferences } from '@/types/auth';

export default function PreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    difficulty_level: 'beginner',
    preferred_formats: [],
    preferred_materials: [],
    preferred_categories: [],
    preferred_tags: []
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const result = await profileService.getUserProfile(session.user.id);
      
      if (result.success && result.data?.preferences) {
        setPreferences(result.data.preferences);
        setOriginalPreferences(result.data.preferences);
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError('Gagal memuat preferensi');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (
    key: keyof UserPreferences,
    value: any,
    isMultiple: boolean = false
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: isMultiple 
        ? (prev[key] as string[]).includes(value)
          ? (prev[key] as string[]).filter(item => item !== value)
          : [...(prev[key] as string[]), value]
        : value
    }));
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    // Validation
    if (preferences.preferred_formats.length === 0) {
      setError('Pilih minimal 1 format materi');
      return;
    }
    if (preferences.preferred_materials.length === 0) {
      setError('Pilih minimal 1 materi');
      return;
    }
    if (preferences.preferred_categories.length === 0) {
      setError('Pilih minimal 1 kategori');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const result = await profileService.updatePreferences(session.user.id, preferences);

      if (result.success) {
        setSuccess('Preferensi berhasil diupdate');
        setOriginalPreferences(preferences);
      } else {
        setError(result.error || 'Gagal update preferensi');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalPreferences) {
      setPreferences(originalPreferences);
      setError('');
      setSuccess('');
    }
  };

  // Options
  const formatOptions = [
    { value: 'pdf', label: 'PDF/Dokumen', icon: FileText, description: 'Materi dalam bentuk dokumen tertulis' },
    { value: 'video', label: 'Video Tutorial', icon: Video, description: 'Video pembelajaran dan tutorial' }
  ];

  const materialOptions = [
    'Pemrograman Web', 'Pemrograman Mobile', 'Basis Data',
    'Algoritma & Struktur Data', 'Jaringan Komputer', 'Sistem Operasi',
    'Rekayasa Perangkat Lunak', 'Kecerdasan Buatan', 'Machine Learning',
    'Data Mining', 'Keamanan Siber', 'Komputasi Awan'
  ];

  const categoryOptions = [
    { value: 'frontend', label: 'Frontend Development', icon: Globe },
    { value: 'backend', label: 'Backend Development', icon: Code },
    { value: 'mobile', label: 'Mobile Development', icon: Smartphone },
    { value: 'database', label: 'Database & Data', icon: Database },
    { value: 'data-science', label: 'Data Science & AI', icon: BarChart },
    { value: 'security', label: 'Cybersecurity', icon: Shield },
    { value: 'cloud', label: 'Cloud Computing', icon: Cloud },
    { value: 'devops', label: 'DevOps & Infrastructure', icon: Layers }
  ];

  const tagOptions = [
    'JavaScript', 'Python', 'Java', 'PHP', 'C++', 'C#', 'Go', 'Rust', 'TypeScript',
    'React', 'Vue.js', 'Angular', 'Node.js', 'Laravel', 'Django', 'Flask',
    'Spring Boot', 'Flutter', 'React Native', 'MySQL', 'PostgreSQL', 'MongoDB',
    'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git', 'Linux'
  ];

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
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Preferensi Pembelajaran</h1>
            <p className="text-gray-600 mt-1">
              Sesuaikan preferensi untuk mendapatkan rekomendasi yang lebih personal
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>

        {/* Alert */}
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* Preferences Form */}
        <div className="space-y-6">
          
          {/* Format Materi */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Format Materi <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Pilih format materi yang Anda sukai (bisa pilih keduanya)
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formatOptions.map(option => (
                <PreferenceCard
                  key={option.value}
                  icon={option.icon}
                  label={option.label}
                  description={option.description}
                  selected={preferences.preferred_formats.includes(option.value)}
                  onClick={() => handlePreferenceChange('preferred_formats', option.value, true)}
                />
              ))}
            </div>
          </div>

          {/* Tingkat Kesulitan */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Tingkat Kesulitan <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Pilih tingkat kesulitan yang sesuai dengan kemampuan Anda
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => handlePreferenceChange('difficulty_level', level)}
                  className={`
                    p-6 rounded-lg border-2 transition-all
                    ${preferences.difficulty_level === level
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {level === 'beginner' && '🌱'}
                      {level === 'intermediate' && '🚀'}
                      {level === 'advanced' && '⚡'}
                    </div>
                    <div className="font-semibold text-gray-900">
                      {level === 'beginner' && 'Pemula'}
                      {level === 'intermediate' && 'Menengah'}
                      {level === 'advanced' && 'Lanjut'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {level === 'beginner' && 'Dasar'}
                      {level === 'intermediate' && 'Lanjutan'}
                      {level === 'advanced' && 'Expert'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Materi yang Diminati */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Materi yang Diminati <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Pilih mata kuliah atau materi yang ingin Anda pelajari
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {materialOptions.map(material => (
                <button
                  key={material}
                  onClick={() => handlePreferenceChange('preferred_materials', material, true)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all border
                    ${preferences.preferred_materials.includes(material)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }
                  `}
                >
                  {material}
                </button>
              ))}
            </div>
          </div>

          {/* Kategori */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Kategori Pembelajaran <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Pilih bidang atau kategori yang Anda minati
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryOptions.map(option => (
                <PreferenceCard
                  key={option.value}
                  icon={option.icon}
                  label={option.label}
                  selected={preferences.preferred_categories.includes(option.value)}
                  onClick={() => handlePreferenceChange('preferred_categories', option.value, true)}
                />
              ))}
            </div>
          </div>

          {/* Tags/Teknologi */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Teknologi & Bahasa Pemrograman
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Pilih teknologi atau bahasa pemrograman yang ingin Anda pelajari (opsional)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map(tag => (
                <button
                  key={tag}
                  onClick={() => handlePreferenceChange('preferred_tags', tag, true)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${preferences.preferred_tags.includes(tag)
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Save Button (Bottom) */}
        <div className="flex justify-end gap-2 pb-6">
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}