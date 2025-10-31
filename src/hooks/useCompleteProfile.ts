import { useState } from 'react';
import { CompleteProfileData, UserPreferences } from '@/types/auth';

export const useCompleteProfile = () => {
  const [formData, setFormData] = useState<CompleteProfileData>({
    nim: '',
    fullName: '',
    angkatan: new Date().getFullYear(),
    password: '',
    confirmPassword: '',
    preferences: {
      difficulty_level: 'beginner',
      preferred_formats: [],
      preferred_materials: [],
      preferred_categories: [],
      preferred_tags: []
    }
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'angkatan' ? parseInt(value) : value
    }));
    setError('');
  };

  const handlePreferenceChange = (
    key: keyof UserPreferences,
    value: any,
    isMultiple: boolean = false
  ) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: isMultiple 
          ? (prev.preferences[key] as string[]).includes(value)
            ? (prev.preferences[key] as string[]).filter(item => item !== value)
            : [...(prev.preferences[key] as string[]), value]
          : value
      }
    }));
    setError('');
  };

  const validateForm = (): boolean => {
    // Step 1 validation
    if (!formData.nim || !formData.fullName || !formData.angkatan) {
      setError('Semua field harus diisi');
      return false;
    }

    if (!/^\d{9}$/.test(formData.nim)) {
      setError('Format NIM tidak valid (9 digit angka)');
      return false;
    }

    if (formData.fullName.length < 3) {
      setError('Nama lengkap minimal 3 karakter');
      return false;
    }

    // Password validation for OAuth users
    if (isOAuthUser) {
      if (formData.password && formData.password.length < 6) {
        setError('Password minimal 6 karakter');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Password tidak cocok');
        return false;
      }
    }

    const currentYear = new Date().getFullYear();
    if (formData.angkatan < 2020 || formData.angkatan > currentYear + 1) {
      setError('Angkatan tidak valid');
      return false;
    }

    // Step 2 validation
    if (formData.preferences.preferred_formats.length === 0) {
      setError('Pilih minimal 1 format materi');
      return false;
    }

    if (formData.preferences.preferred_materials.length === 0) {
      setError('Pilih minimal 1 materi yang diminati');
      return false;
    }

    if (formData.preferences.preferred_categories.length === 0) {
      setError('Pilih minimal 1 kategori');
      return false;
    }

    return true;
  };

  return {
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
  };
};