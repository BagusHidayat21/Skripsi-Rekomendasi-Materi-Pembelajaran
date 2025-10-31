"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  GraduationCap, 
  Calendar, 
  CheckCircle,
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
  Lock,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';
import { PreferenceCard } from '@/components/ui/PreferenceCard';
import { useCompleteProfile } from '@/hooks/useCompleteProfile';
import { profileService } from '@/services/profile.service';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [authProvider, setAuthProvider] = useState('');
  
  const {
    formData,
    error,
    loading,
    currentStep,
    isOAuthUser,
    setError,
    setLoading,
    setCurrentStep,
    setIsOAuthUser,
    handleInputChange,
    handlePreferenceChange,
    validateForm
  } = useCompleteProfile();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/auth');
      return;
    }

    setUserId(session.user.id);
    setUserEmail(session.user.email || '');

    // Check auth provider
    const provider = session.user.app_metadata?.provider || 'email';
    setAuthProvider(provider);
    setIsOAuthUser(provider !== 'email');

    // Cek apakah profile sudah lengkap
    const isComplete = await profileService.checkProfileCompletion(session.user.id);
    if (isComplete) {
      router.push('/dashboard');
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validasi step 1
      if (!formData.nim || !formData.fullName || !formData.angkatan) {
        setError('Semua field harus diisi');
        return;
      }
      
      if (!/^\d{9}$/.test(formData.nim)) {
        setError('Format NIM tidak valid (9 digit angka)');
        return;
      }

      // Validasi password untuk OAuth users
      if (isOAuthUser && formData.password) {
        if (formData.password.length < 6) {
          setError('Password minimal 6 karakter');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Konfirmasi password tidak cocok');
          return;
        }
      }
    }
    
    setError('');
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const result = await profileService.completeProfile(userId, formData);

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Gagal melengkapi profile');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem');
      console.error('Complete profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format Options (PDF & Video)
  const formatOptions = [
    { 
      value: 'pdf', 
      label: 'PDF/Dokumen', 
      icon: FileText, 
      description: 'Materi dalam bentuk dokumen tertulis' 
    },
    { 
      value: 'video', 
      label: 'Video Tutorial', 
      icon: Video, 
      description: 'Video pembelajaran dan tutorial' 
    }
  ];

  // Materi/Mata Kuliah Options
  const materialOptions = [
    'Pemrograman Web',
    'Pemrograman Mobile',
    'Basis Data',
    'Algoritma & Struktur Data',
    'Jaringan Komputer',
    'Sistem Operasi',
    'Rekayasa Perangkat Lunak',
    'Kecerdasan Buatan',
    'Machine Learning',
    'Data Mining',
    'Keamanan Siber',
    'Komputasi Awan'
  ];

  // Category Options
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

  // Tag Options (Programming Languages & Technologies)
  const tagOptions = [
    'JavaScript', 'Python', 'Java', 'PHP', 'C++', 'C#', 'Go', 'Rust', 'TypeScript',
    'React', 'Vue.js', 'Angular', 'Node.js', 'Laravel', 'Django', 'Flask',
    'Spring Boot', 'Flutter', 'React Native', 'MySQL', 'PostgreSQL', 'MongoDB',
    'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git', 'Linux'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 my-8">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} dari 3
            </span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round((currentStep / 3) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {currentStep === 1 && 'Informasi Dasar'}
            {currentStep === 2 && 'Preferensi Pembelajaran'}
            {currentStep === 3 && 'Minat Pembelajaran'}
          </h1>
          <p className="text-gray-600 text-sm">
            {currentStep === 1 && 'Lengkapi data diri Anda'}
            {currentStep === 2 && 'Pilih format dan tingkat kesulitan yang sesuai'}
            {currentStep === 3 && 'Pilih materi, kategori, dan teknologi yang diminati'}
          </p>
          {userEmail && currentStep === 1 && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-sm text-blue-700">
              <CheckCircle className="w-4 h-4" />
              <span>{userEmail}</span>
            </div>
          )}
        </div>

        {/* Alert */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} />
          </div>
        )}

        {/* OAuth Info */}
        {isOAuthUser && currentStep === 1 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Login dengan {authProvider === 'google' ? 'Google' : authProvider}</p>
                <p>Anda dapat mengatur password (opsional) untuk login dengan email di kemudian hari.</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          
          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <InputField
                label="Nama Lengkap"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Andi Pratama"
                icon={User}
              />

              <InputField
                label="NIM"
                name="nim"
                type="text"
                value={formData.nim}
                onChange={handleInputChange}
                placeholder="250101001"
                icon={GraduationCap}
                maxLength={9}
                helperText="Format: 9 digit angka"
              />

              <InputField
                label="Angkatan"
                name="angkatan"
                type="number"
                value={formData.angkatan}
                onChange={handleInputChange}
                placeholder="2025"
                icon={Calendar}
                min={2020}
                max={2030}
              />

              {/* Password Section - Only for OAuth Users */}
              {isOAuthUser && (
                <>
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Password (Opsional)
                    </h3>
                    <p className="text-xs text-gray-600 mb-4">
                      Atur password jika Anda ingin login dengan email dan password
                    </p>
                  </div>

                  <InputField
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={handleInputChange}
                    placeholder="Minimal 6 karakter"
                    icon={Lock}
                    helperText="Kosongkan jika tidak ingin mengatur password"
                  />

                  {formData.password && (
                    <InputField
                      label="Konfirmasi Password"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword || ''}
                      onChange={handleInputChange}
                      placeholder="Ulangi password"
                      icon={Lock}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 2: Format & Difficulty */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Format Materi */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Format Materi <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Pilih format materi yang Anda sukai (bisa pilih keduanya)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formatOptions.map(option => (
                    <PreferenceCard
                      key={option.value}
                      icon={option.icon}
                      label={option.label}
                      description={option.description}
                      selected={formData.preferences.preferred_formats.includes(option.value)}
                      onClick={() => handlePreferenceChange('preferred_formats', option.value, true)}
                    />
                  ))}
                </div>
              </div>

              {/* Tingkat Kesulitan */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Tingkat Kesulitan <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Pilih tingkat kesulitan yang sesuai dengan kemampuan Anda saat ini
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handlePreferenceChange('difficulty_level', 'beginner')}
                    className={`
                      px-4 py-4 rounded-lg border-2 font-medium transition-all
                      ${formData.preferences.difficulty_level === 'beginner'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🌱</div>
                      <div className="font-semibold">Pemula</div>
                      <div className="text-xs text-gray-500 mt-1">Dasar</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePreferenceChange('difficulty_level', 'intermediate')}
                    className={`
                      px-4 py-4 rounded-lg border-2 font-medium transition-all
                      ${formData.preferences.difficulty_level === 'intermediate'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🚀</div>
                      <div className="font-semibold">Menengah</div>
                      <div className="text-xs text-gray-500 mt-1">Lanjutan</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePreferenceChange('difficulty_level', 'advanced')}
                    className={`
                      px-4 py-4 rounded-lg border-2 font-medium transition-all
                      ${formData.preferences.difficulty_level === 'advanced'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">⚡</div>
                      <div className="font-semibold">Lanjut</div>
                      <div className="text-xs text-gray-500 mt-1">Expert</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Materials, Categories & Tags */}
          {currentStep === 3 && (
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
              {/* Materi/Mata Kuliah */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Materi yang Diminati <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Pilih mata kuliah atau materi yang ingin Anda pelajari
                </p>
                <div className="flex flex-wrap gap-2">
                  {materialOptions.map(material => (
                    <button
                      key={material}
                      type="button"
                      onClick={() => handlePreferenceChange('preferred_materials', material, true)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all border
                        ${formData.preferences.preferred_materials.includes(material)
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
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Kategori Pembelajaran <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Pilih bidang atau kategori yang Anda minati
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryOptions.map(option => (
                    <PreferenceCard
                      key={option.value}
                      icon={option.icon}
                      label={option.label}
                      selected={formData.preferences.preferred_categories.includes(option.value)}
                      onClick={() => handlePreferenceChange('preferred_categories', option.value, true)}
                    />
                  ))}
                </div>
              </div>

              {/* Tags/Teknologi */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Teknologi & Bahasa Pemrograman (Opsional)
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Pilih teknologi atau bahasa pemrograman yang ingin Anda pelajari
                </p>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handlePreferenceChange('preferred_tags', tag, true)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${formData.preferences.preferred_tags.includes(tag)
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
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50"
              >
                Kembali
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
              >
                Lanjut
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Menyimpan...' : 'Selesai & Mulai Belajar'}
              </button>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/auth');
            }}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}