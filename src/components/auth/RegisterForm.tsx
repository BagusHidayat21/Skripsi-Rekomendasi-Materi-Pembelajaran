import React from 'react';
import { Mail, Lock, User, Calendar, GraduationCap } from 'lucide-react';
import { InputField } from '@/components/ui/InputField';
import { RegisterFormData } from '@/types/auth';

interface RegisterFormProps {
  formData: RegisterFormData;
  loading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  formData,
  loading,
  onInputChange,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <InputField
        label="Nama Lengkap"
        name="fullName"
        type="text"
        value={formData.fullName}
        onChange={onInputChange}
        placeholder="Andi Pratama"
        icon={User}
      />

      <InputField
        label="NIM"
        name="nim"
        type="text"
        value={formData.nim}
        onChange={onInputChange}
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
        onChange={onInputChange}
        placeholder="2025"
        icon={Calendar}
        min={2020}
        max={2030}
      />

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
        placeholder="Minimal 6 karakter"
        icon={Lock}
      />

      <InputField
        label="Konfirmasi Password"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={onInputChange}
        placeholder="Ulangi password"
        icon={Lock}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-6"
      >
        {loading ? 'Memproses...' : 'Daftar Sekarang'}
      </button>
    </form>
  );
};