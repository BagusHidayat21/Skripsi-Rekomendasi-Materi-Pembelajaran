import { supabase } from '@/lib/supabase/client';
import { RegisterFormData, LoginFormData, AuthResponse } from '@/types/auth';

export const authService = {
  // Login dengan Email/Password
  async signIn(data: LoginFormData): Promise<AuthResponse> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return {
          success: false,
          error: error.message === 'Invalid login credentials' 
            ? 'Email atau password salah' 
            : error.message
        };
      }

      return { success: true, message: 'Login berhasil!' };
    } catch (err) {
      console.error('Login error:', err);
      return { 
        success: false, 
        error: 'Terjadi kesalahan sistem. Silakan coba lagi.' 
      };
    }
  },

  // Register dengan Email/Password
  async signUp(data: RegisterFormData): Promise<AuthResponse> {
    try {
      // Validasi
      if (!data.email || !data.password || !data.nim || !data.fullName) {
        return { success: false, error: 'Semua field harus diisi' };
      }

      if (data.password.length < 6) {
        return { success: false, error: 'Password minimal 6 karakter' };
      }

      if (data.password !== data.confirmPassword) {
        return { success: false, error: 'Password tidak cocok' };
      }

      if (!/^\d{9}$/.test(data.nim)) {
        return { 
          success: false, 
          error: 'Format NIM tidak valid (9 digit angka)' 
        };
      }

      // Register ke Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nim: data.nim,
            full_name: data.fullName,
            angkatan: data.angkatan
          }
        }
      });

      if (authError) {
        return {
          success: false,
          error: authError.message.includes('already registered') 
            ? 'Email sudah terdaftar' 
            : authError.message
        };
      }

      if (!authData.user) {
        return { success: false, error: 'Gagal membuat akun' };
      }

      // Simpan ke tabel users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          user_id: authData.user.id,
          email: data.email,
          role: 'mahasiswa',
          is_active: true
        });

      if (userError) {
        console.error('User insert error:', userError);
      }

      // Simpan ke tabel student_profiles
      const { error: profileError } = await supabase
        .from('student_profiles')
        .insert({
          user_id: authData.user.id,
          nim: data.nim,
          full_name: data.fullName,
          angkatan: parseInt(data.angkatan.toString()),
          preferences: {
            preferred_format: ['pdf', 'video'],
            difficult_level: 'beginner'
          }
        });

      if (profileError) {
        console.error('Profile insert error:', profileError);
      }

      return { 
        success: true, 
        message: 'Registrasi berhasil! Silakan cek email untuk verifikasi.' 
      };
    } catch (err) {
      console.error('Register error:', err);
      return { 
        success: false, 
        error: 'Terjadi kesalahan sistem. Silakan coba lagi.' 
      };
    }
  },

  // Login dengan Google
  async signInWithGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (err) {
      console.error('Google login error:', err);
      throw err;
    }
  },

  // Logout
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  }
};