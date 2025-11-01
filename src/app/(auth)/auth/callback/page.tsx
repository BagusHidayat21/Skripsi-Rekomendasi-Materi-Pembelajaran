"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { profileService } from '@/services/profile.service';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // ⭐ Exchange code for session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        router.replace('/auth?error=auth_failed');
        return;
      }

      if (!session) {
        router.replace('/auth');
        return;
      }

      // Cek apakah profile sudah lengkap
      const isComplete = await profileService.checkProfileCompletion(session.user.id);

      // ⭐ Force a hard navigation to refresh cookies
      if (isComplete) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/complete-profile';
      }
    } catch (err) {
      console.error('Callback error:', err);
      router.replace('/auth?error=unexpected');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700 font-medium">Memproses autentikasi...</p>
        <p className="text-gray-500 text-sm mt-2">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
}