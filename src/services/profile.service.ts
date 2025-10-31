import { supabase } from '@/lib/supabase/client';
import { CompleteProfileData } from '@/types/auth';

export interface UpdateProfileData {
  full_name: string;
  nim: string;
  angkatan: number;
  bio?: string;
  photo_url?: string;
}

export interface ChangePasswordData {
  currentPassword?: string; // Optional for OAuth users who set password first time
  newPassword: string;
  confirmPassword: string;
}

export const profileService = {
  // Check if user is OAuth user
  async isOAuthUser(userId: string): Promise<boolean> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('auth_provider')
        .eq('user_id', userId)
        .single();

      return user?.auth_provider !== 'email';
    } catch (err) {
      console.error('Check OAuth error:', err);
      return false;
    }
  },

  // Check if user has password set
  async hasPassword(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Check if user has password provider in identities
      return user?.identities?.some(identity => identity.provider === 'email') || false;
    } catch (err) {
      console.error('Check password error:', err);
      return false;
    }
  },

  // Cek apakah profile sudah lengkap
  async checkProfileCompletion(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('nim, full_name, angkatan, preferences')
        .eq('user_id', userId)
        .single();

      if (error || !data) return false;

      return !!(
        data.nim && 
        data.full_name && 
        data.angkatan && 
        data.preferences?.difficulty_level &&
        data.preferences?.preferred_formats?.length > 0 &&
        data.preferences?.preferred_materials?.length > 0 &&
        data.preferences?.preferred_categories?.length > 0
      );
    } catch (err) {
      console.error('Check profile error:', err);
      return false;
    }
  },

  // Complete profile untuk OAuth users dan new users
  async completeProfile(userId: string, data: CompleteProfileData) {
    try {
      // Update password jika user OAuth dan mengisi password
      if (data.password && data.password.length >= 6) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.password
        });

        if (passwordError) {
          console.error('Password update error:', passwordError);
        }
      }

      const { data: existingUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (!existingUser) {
        const { data: authUser } = await supabase.auth.getUser();
        
        const { error: userError } = await supabase
          .from('users')
          .insert({
            user_id: userId,
            email: authUser.user?.email,
            role: 'mahasiswa',
            is_active: true,
            auth_provider: authUser.user?.app_metadata?.provider || 'email'
          });

        if (userError) throw userError;
      }

      const { data: existingProfile } = await supabase
        .from('student_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      const profileData = {
        nim: data.nim,
        full_name: data.fullName,
        angkatan: data.angkatan,
        preferences: data.preferences
      };

      if (existingProfile) {
        const { error } = await supabase
          .from('student_profiles')
          .update(profileData)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_profiles')
          .insert({
            user_id: userId,
            ...profileData
          });

        if (error) throw error;
      }

      return { success: true, message: 'Profile berhasil dilengkapi' };
    } catch (err) {
      console.error('Complete profile error:', err);
      return { success: false, error: 'Gagal melengkapi profile' };
    }
  },

  // Get user profile
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select(`
          *,
          users (
            email,
            role,
            created_at,
            last_login,
            auth_provider
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('Get profile error:', err);
      return { success: false, error: 'Gagal mengambil data profile' };
    }
  },

  // Update profile
  async updateProfile(userId: string, data: UpdateProfileData) {
    try {
      const { error } = await supabase
        .from('student_profiles')
        .update({
          full_name: data.full_name,
          nim: data.nim,
          angkatan: data.angkatan,
          bio: data.bio,
          photo_url: data.photo_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, message: 'Profile berhasil diupdate' };
    } catch (err) {
      console.error('Update profile error:', err);
      return { success: false, error: 'Gagal update profile' };
    }
  },

  // Change password
  async changePassword(data: ChangePasswordData, requireCurrentPassword: boolean = true) {
    try {
      // Validation
      if (data.newPassword.length < 6) {
        return { success: false, error: 'Password baru minimal 6 karakter' };
      }

      if (data.newPassword !== data.confirmPassword) {
        return { success: false, error: 'Konfirmasi password tidak cocok' };
      }

      // For users with existing password, verify current password first
      if (requireCurrentPassword && data.currentPassword) {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Try to sign in with current password to verify
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user?.email || '',
          password: data.currentPassword
        });

        if (verifyError) {
          return { success: false, error: 'Password saat ini salah' };
        }
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Password berhasil diubah' };
    } catch (err) {
      console.error('Change password error:', err);
      return { success: false, error: 'Gagal mengubah password' };
    }
  },

  // Update preferences only
  async updatePreferences(userId: string, preferences: any) {
    try {
      const { error } = await supabase
        .from('student_profiles')
        .update({
          preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, message: 'Preferensi berhasil diupdate' };
    } catch (err) {
      console.error('Update preferences error:', err);
      return { success: false, error: 'Gagal update preferensi' };
    }
  },

  // Upload photo profile
  async uploadPhoto(userId: string, file: File) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('student_profiles')
        .update({ photo_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      return { success: true, photoUrl: publicUrl };
    } catch (err) {
      console.error('Upload photo error:', err);
      return { success: false, error: 'Gagal upload foto' };
    }
  }
};