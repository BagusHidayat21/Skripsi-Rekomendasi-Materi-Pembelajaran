import React from 'react';
import { Mail, Lock } from 'lucide-react';
import { InputField } from '@/components/ui/InputField';
import { LoginFormData } from '@/types/auth';

interface LoginFormProps {
  formData: LoginFormData;
  loading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  formData,
  loading,
  onInputChange,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <InputField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={onInputChange}
        placeholder="mahasiswa@student.pti.ac.id"
        icon={Mail}
      />

      <InputField
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={onInputChange}
        placeholder="••••••••"
        icon={Lock}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input 
            type="checkbox" 
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
          />
          <span className="ml-2 text-sm text-gray-600">Ingat saya</span>
        </label>
        <button 
          type="button"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Lupa password?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Memproses...' : 'Login'}
      </button>
    </form>
  );
};