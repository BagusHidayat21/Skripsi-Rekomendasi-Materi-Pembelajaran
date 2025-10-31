import { useState } from 'react';
import { RegisterFormData, LoginFormData } from '@/types/auth';

export const useAuthForm = (isLogin: boolean) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    nim: '',
    fullName: '',
    angkatan: new Date().getFullYear()
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      nim: '',
      fullName: '',
      angkatan: new Date().getFullYear()
    });
    setError('');
    setSuccess('');
  };

  return {
    formData,
    error,
    success,
    loading,
    setError,
    setSuccess,
    setLoading,
    handleInputChange,
    resetForm
  };
};