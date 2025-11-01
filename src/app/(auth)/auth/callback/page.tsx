"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { profileService } from '@/services/profile.service';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // ⭐ Get session from URL hash (for OAuth)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        router.push('/auth?error=auth_failed');
        return;
      }

      if (!session) {
        // ⭐ Try to exchange code for session
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data, error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setError || !data.session) {
            console.error('Session set error:', setError);
            router.push('/auth?error=session_failed');
            return;
          }

          // Continue with the new session
          await processSession(data.session.user.id);
        } else {
          router.push('/auth');
        }
        return;
      }

      await processSession(session.user.id);
    } catch (err) {
      console.error('Callback error:', err);
      router.push('/auth?error=unexpected');
    }
  };

  const processSession = async (userId: string) => {
    try {
      // Cek apakah profile sudah lengkap
      const isComplete = await profileService.checkProfileCompletion(userId);

      // ⭐ Use replace instead of push to prevent back button issues
      if (isComplete) {
        router.replace('/dashboard');
      } else {
        router.replace('/complete-profile');
      }
    } catch (err) {
      console.error('Process session error:', err);
      router.replace('/dashboard'); // Fallback
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