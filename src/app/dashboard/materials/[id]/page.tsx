"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  BookOpen,
  Download,
  Eye,
  Star,
  Clock,
  FileText,
  Video,
  Headphones,
  File,
  Bookmark,
  BookmarkCheck,
  Share2,
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  User,
  Calendar,
  Tag,
  TrendingUp,
  Award
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';

interface MaterialDetail {
  material_id: number;
  title: string;
  description: string;
  category_id: number;
  category_name: string;
  difficulty: string;
  file_path: string;
  file_type: string;
  file_size: number;
  view_count: number;
  download_count: number;
  avg_rating: number;
  tags: string;
  keywords: string;
  created_at: string;
  updated_at: string;
  uploaded_by: string;
}

interface Rating {
  rating_id: number;
  rating_value: number;
  review: string;
  created_at: string;
  user_id: string;
  users: {
    student_profiles: {
      full_name: string;
      nim: string;
    };
  };
}

interface MaterialStats {
  view_count: number;
  download_count: number;
  avg_rating: number;
  total_ratings: number;
}

interface ReviewData {
  rating_id: number;
  rating_value: number;
  review: string | null;
  created_at: string;
  user_id: string;
  full_name: string;
  nim: string;
}


export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const materialId = params.id as string;

  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [relatedMaterials, setRelatedMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [hasUserRated, setHasUserRated] = useState(false);
  const [stats, setStats] = useState<MaterialStats>({
    view_count: 0,
    download_count: 0,
    avg_rating: 0,
    total_ratings: 0
  });
  const [fileUrl, setFileUrl] = useState<string>('');

  useEffect(() => {
    if (materialId) {
      initializePage();
    }
  }, [materialId]);

  const initializePage = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
    }
    
    await Promise.all([
      fetchMaterialDetail(),
      fetchRatings(),
      fetchRelatedMaterials(),
      fetchStats(),
      checkBookmark(),
      checkUserRating(),
      trackView()
    ]);
    
    setLoading(false);
  };

  const fetchMaterialDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          categories:category_id (
            category_name
          ),
          difficulty_levels:difficulty_level_id (
            level_name
          )
        `)
        .eq('material_id', materialId)
        .single();

      if (error) throw error;
      
      const materialData: MaterialDetail = {
        material_id: data.material_id,
        title: data.title,
        description: data.description,
        category_id: data.category_id,
        category_name: data.categories?.category_name || '',
        difficulty: data.difficulty_levels?.level_name || '',
        file_path: data.file_path,
        file_type: data.file_type,
        file_size: data.file_size,
        view_count: data.view_count || 0,
        download_count: data.download_count || 0,
        avg_rating: data.avg_rating || 0,
        tags: data.tags || '',
        keywords: data.keywords || '',
        created_at: data.created_at,
        updated_at: data.updated_at,
        uploaded_by: data.uploaded_by
      };
      
      setMaterial(materialData);
      
      // Get file URL from Supabase Storage if it's a storage path
      if (data.file_path && !data.file_path.startsWith('http')) {
        const { data: urlData } = await supabase.storage
          .from('materials')
          .createSignedUrl(data.file_path, 3600); // 1 hour expiry
        
        if (urlData?.signedUrl) {
          setFileUrl(urlData.signedUrl);
        }
      } else {
        setFileUrl(data.file_path);
      }
    } catch (error) {
      console.error('Error fetching material:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Menggunakan service_role atau memanggil fungsi RPC yang bypass RLS
      // untuk mendapatkan statistik dari SEMUA user
      
      // Fetch view count dari SEMUA user
      const { data: viewData, error: viewError } = await supabase
        .rpc('get_material_view_count', { material_id_param: parseInt(materialId) });

      // Fetch download count dari SEMUA user
      const { data: downloadData, error: downloadError } = await supabase
        .rpc('get_material_download_count', { material_id_param: parseInt(materialId) });

      // Fetch rating stats dari SEMUA user
      const { data: ratingStatsData, error: ratingError } = await supabase
        .rpc('get_material_rating_stats', { material_id_param: parseInt(materialId) });

      // Jika RPC functions belum ada, gunakan direct query
      // Note: Ini akan bekerja jika RLS policy sudah diupdate untuk allow SELECT pada statistics
      
      let viewCount = 0;
      let downloadCount = 0;
      let avgRating = 0;
      let totalRatings = 0;

      if (!viewError && viewData !== null) {
        viewCount = viewData;
      } else {
        // Fallback: ambil dari material table (sudah di-trigger update)
        const { data: materialData } = await supabase
          .from('materials')
          .select('view_count')
          .eq('material_id', materialId)
          .single();
        viewCount = materialData?.view_count || 0;
      }

      if (!downloadError && downloadData !== null) {
        downloadCount = downloadData;
      } else {
        // Fallback: ambil dari material table
        const { data: materialData } = await supabase
          .from('materials')
          .select('download_count')
          .eq('material_id', materialId)
          .single();
        downloadCount = materialData?.download_count || 0;
      }

      if (!ratingError && ratingStatsData) {
        avgRating = ratingStatsData.avg_rating || 0;
        totalRatings = ratingStatsData.total_ratings || 0;
      } else {
        // Fallback: ambil dari material table dan count ratings
        const { data: materialData } = await supabase
          .from('materials')
          .select('avg_rating')
          .eq('material_id', materialId)
          .single();
        
        avgRating = materialData?.avg_rating || 0;
        
        // Count total ratings dengan SELECT yang di-allow untuk semua authenticated users
        const { count } = await supabase
          .from('ratings')
          .select('*', { count: 'exact', head: true })
          .eq('material_id', materialId);
        
        totalRatings = count || 0;
      }

      setStats({
        view_count: viewCount,
        download_count: downloadCount,
        avg_rating: avgRating,
        total_ratings: totalRatings
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      
      // Ultimate fallback: ambil dari material table saja
      try {
        const { data: materialData } = await supabase
          .from('materials')
          .select('view_count, download_count, avg_rating')
          .eq('material_id', materialId)
          .single();
        
        if (materialData) {
          setStats({
            view_count: materialData.view_count || 0,
            download_count: materialData.download_count || 0,
            avg_rating: materialData.avg_rating || 0,
            total_ratings: 0
          });
        }
      } catch (fallbackError) {
        console.error('Fallback stats fetch error:', fallbackError);
      }
    }
  };

  const fetchRatings = async () => {
  try {
    // Step 1: Fetch ratings
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('ratings')
      .select('rating_id, rating_value, review, created_at, user_id')
      .eq('material_id', materialId)
      .order('created_at', { ascending: false });

    if (ratingsError) throw ratingsError;

    // Step 2: Fetch user profiles for each rating
    const formattedRatings = await Promise.all(
      (ratingsData || []).map(async (rating) => {
        const { data: profileData } = await supabase
          .from('student_profiles')
          .select('full_name, nim')
          .eq('user_id', rating.user_id)
          .maybeSingle();

        return {
          rating_id: rating.rating_id,
          rating_value: rating.rating_value,
          review: rating.review,
          created_at: rating.created_at,
          user_id: rating.user_id,
          users: {
            student_profiles: {
              full_name: profileData?.full_name || 'Anonymous User',
              nim: profileData?.nim || ''
            }
          }
        };
      })
    );

    console.log('Formatted ratings:', formattedRatings); // Debug log
    setRatings(formattedRatings);
  } catch (error) {
    console.error('Error fetching ratings:', error);
  }
};

  const fetchRelatedMaterials = async () => {
    try {
      const { data: currentMaterial } = await supabase
        .from('materials')
        .select('category_id, difficulty_level_id')
        .eq('material_id', materialId)
        .single();

      if (currentMaterial) {
        const { data } = await supabase
          .from('materials')
          .select(`
            *,
            categories:category_id (
              category_name
            ),
            difficulty_levels:difficulty_level_id (
              level_name
            )
          `)
          .eq('category_id', currentMaterial.category_id)
          .neq('material_id', materialId)
          .eq('is_active', true)
          .limit(3);

        // Get rating for each material
        const materialsWithRatings = await Promise.all(
          (data || []).map(async (mat) => {
            // Ambil avg_rating langsung dari materials table
            return {
              material_id: mat.material_id,
              title: mat.title,
              difficulty: mat.difficulty_levels?.level_name || '',
              avg_rating: mat.avg_rating || 0
            };
          })
        );

        setRelatedMaterials(materialsWithRatings);
      }
    } catch (error) {
      console.error('Error fetching related materials:', error);
    }
  };
  

  const checkBookmark = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('bookmarks')
        .select('bookmark_id')
        .eq('user_id', session.user.id)
        .eq('material_id', materialId)
        .maybeSingle();

      setIsBookmarked(!!data);
    } catch (error) {
      // Not bookmarked
      setIsBookmarked(false);
    }
  };

  const checkUserRating = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('ratings')
        .select('rating_value, review')
        .eq('user_id', session.user.id)
        .eq('material_id', materialId)
        .maybeSingle();

      if (data) {
        setUserRating(data.rating_value);
        setUserReview(data.review || '');
        setHasUserRated(true);
      }
    } catch (error) {
      // No rating yet
      setHasUserRated(false);
    }
  };

  const trackView = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check if user already viewed this material in the last hour
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const { data: recentView } = await supabase
        .from('user_interactions')
        .select('interaction_id')
        .eq('user_id', session.user.id)
        .eq('material_id', parseInt(materialId))
        .eq('interaction_type', 'view')
        .gte('interaction_time', oneHourAgo)
        .maybeSingle();

      // Only track if no recent view
      if (!recentView) {
        await supabase
          .from('user_interactions')
          .insert({
            user_id: session.user.id,
            material_id: parseInt(materialId),
            interaction_type: 'view',
            interaction_time: new Date().toISOString()
          });
        
        // Refresh stats after tracking
        setTimeout(() => fetchStats(), 1000);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Harap login terlebih dahulu');
        setTimeout(() => setError(''), 3000);
        return;
      }

      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', session.user.id)
          .eq('material_id', materialId);

        if (error) throw error;

        setIsBookmarked(false);
        setSuccess('Bookmark dihapus');
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: session.user.id,
            material_id: parseInt(materialId)
          });

        if (error) throw error;

        setIsBookmarked(true);
        setSuccess('Berhasil ditambahkan ke bookmark');
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Gagal mengubah bookmark');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDownload = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Harap login terlebih dahulu');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Track download
      await supabase
        .from('user_interactions')
        .insert({
          user_id: session.user.id,
          material_id: parseInt(materialId),
          interaction_type: 'download',
          interaction_time: new Date().toISOString()
        });

      // Refresh stats after download
      setTimeout(() => fetchStats(), 1000);

      // Download file
      if (fileUrl) {
        window.open(fileUrl, '_blank');
        setSuccess('Download dimulai');
      } else {
        setError('File tidak tersedia');
      }
      
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Gagal mendownload materi');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSubmitRating = async () => {
    if (userRating === 0) {
      setError('Pilih rating terlebih dahulu');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setSubmittingRating(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Harap login terlebih dahulu');
        setTimeout(() => setError(''), 3000);
        return;
      }

      if (hasUserRated) {
        // Update existing rating
        const { error } = await supabase
          .from('ratings')
          .update({
            rating_value: userRating,
            review: userReview.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id)
          .eq('material_id', parseInt(materialId));

        if (error) throw error;
        setSuccess('Rating berhasil diperbarui');
      } else {
        // Insert new rating
        const { error } = await supabase
          .from('ratings')
          .insert({
            user_id: session.user.id,
            material_id: parseInt(materialId),
            rating_value: userRating,
            review: userReview.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        setSuccess('Rating berhasil disimpan');
        setHasUserRated(true);
      }

      // Refresh data
      await Promise.all([
        fetchRatings(),
        fetchStats()
      ]);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Gagal menyimpan rating');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmittingRating(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType?.toLowerCase() || '';
    if (type.includes('pdf')) {
      return <FileText className="w-6 h-6" />;
    } else if (type.includes('video') || type.includes('mp4')) {
      return <Video className="w-6 h-6" />;
    } else if (type.includes('audio') || type.includes('mp3')) {
      return <Headphones className="w-6 h-6" />;
    }
    return <File className="w-6 h-6" />;
  };

  const renderFilePreview = () => {
    if (!fileUrl || !material) return null;

    const fileType = material.file_type?.toLowerCase() || '';
    const filePath = material.file_path?.toLowerCase() || '';

    // YouTube embed
    if (fileUrl.includes('youtube.com') || fileUrl.includes('youtu.be')) {
      let videoId = '';
      if (fileUrl.includes('youtube.com/watch?v=')) {
        videoId = fileUrl.split('v=')[1]?.split('&')[0] || '';
      } else if (fileUrl.includes('youtu.be/')) {
        videoId = fileUrl.split('youtu.be/')[1]?.split('?')[0] || '';
      }

      if (videoId) {
        return (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        );
      }
    }

    // PDF embed
    if (fileType.includes('pdf') || filePath.endsWith('.pdf')) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="h-[600px]">
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              title="PDF Preview"
              className="w-full h-full"
            />
          </div>
        </div>
      );
    }

    // Video embed (MP4, etc.)
    if (fileType.includes('video') || filePath.match(/\.(mp4|webm|ogg)$/)) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <video
            controls
            className="w-full"
            src={fileUrl}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Audio embed
    if (fileType.includes('audio') || filePath.match(/\.(mp3|wav|ogg)$/)) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <audio
            controls
            className="w-full"
            src={fileUrl}
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!material) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Materi Tidak Ditemukan
          </h3>
          <p className="text-gray-600 mb-6">
            Materi yang Anda cari tidak tersedia
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Kembali
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        {/* Alerts */}
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Material Header */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    material.difficulty === 'Beginner' 
                      ? 'bg-green-100 text-green-700'
                      : material.difficulty === 'Intermediate'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {material.difficulty}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBookmark}
                      className={`p-2 rounded-lg transition-colors ${
                        isBookmarked
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                      title={isBookmarked ? 'Hapus bookmark' : 'Tambah bookmark'}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-5 h-5" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                    <button 
                      className="p-2 bg-white rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Bagikan"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        setSuccess('Link disalin ke clipboard');
                        setTimeout(() => setSuccess(''), 3000);
                      }}
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                  {material.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {material.category_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(material.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {stats.view_count.toLocaleString('id-ID')} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {stats.avg_rating.toFixed(1)} ({stats.total_ratings.toLocaleString('id-ID')} rating)
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Deskripsi
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {material.description}
                </p>

                {/* Tags */}
                {material.tags && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {material.tags.split(',').map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {material.keywords && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Keywords
                    </h3>
                    <p className="text-sm text-gray-600">
                      {material.keywords}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* File Preview */}
            {renderFilePreview()}

            {/* Rating & Review Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Rating & Review
              </h2>

              {/* Submit Rating */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">
                  {hasUserRated ? 'Perbarui Rating Anda' : 'Berikan Rating Anda'}
                </h3>
                
                {/* Star Rating */}
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="transition-transform hover:scale-110"
                      type="button"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= userRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {userRating > 0 ? `${userRating}/5` : 'Pilih rating'}
                  </span>
                </div>

                {/* Review Text */}
                <textarea
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  placeholder="Tulis review Anda (opsional)"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none mb-3"
                  maxLength={500}
                />

                <button
                  onClick={handleSubmitRating}
                  disabled={submittingRating || userRating === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  {submittingRating 
                    ? 'Menyimpan...' 
                    : hasUserRated 
                    ? 'Perbarui Rating' 
                    : 'Kirim Rating'
                  }
                </button>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">
                  Semua Review ({ratings.length})
                </h3>
                {ratings.length > 0 ? (
                  ratings.map((rating) => (
                    <div key={rating.rating_id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <p className="font-medium text-gray-900">
                                {rating.users?.student_profiles?.full_name || 'Anonymous User'}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= rating.rating_value
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(rating.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                            {rating.user_id === currentUserId && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Anda
                              </span>
                            )}
                          </div>
                          {rating.review && (
                            <p className="text-sm text-gray-600 mt-2">
                              {rating.review}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Belum ada review. Jadilah yang pertama!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Download Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  {getFileIcon(material.file_type)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">File Type</p>
                  <p className="font-semibold text-gray-900 uppercase">
                    {material.file_type || 'Document'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mb-3"
                type="button"
              >
                <Download className="w-5 h-5" />
                Download Materi
              </button>

              <p className="text-xs text-gray-500 text-center">
                Ukuran file: {formatFileSize(material.file_size || 0)}
              </p>
            </div>

            {/* Stats Card - STATISTIK DARI SEMUA USER */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Statistik</h3>
              <p className="text-xs text-gray-500 mb-4">Data dari semua pengguna</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <span className="flex items-center gap-2 text-sm text-gray-700">
                    <Eye className="w-4 h-4 text-blue-600" />
                    Total Views
                  </span>
                  <span className="font-bold text-blue-600">
                    {stats.view_count.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <span className="flex items-center gap-2 text-sm text-gray-700">
                    <Download className="w-4 h-4 text-green-600" />
                    Total Downloads
                  </span>
                  <span className="font-bold text-green-600">
                    {stats.download_count.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                  <span className="flex items-center gap-2 text-sm text-gray-700">
                    <Star className="w-4 h-4 text-yellow-600" />
                    Rata-rata Rating
                  </span>
                  <span className="font-bold text-yellow-600">
                    {stats.avg_rating.toFixed(2)} / 5.0
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                  <span className="flex items-center gap-2 text-sm text-gray-700">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    Total Ratings
                  </span>
                  <span className="font-bold text-purple-600">
                    {stats.total_ratings.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Materials */}
            {relatedMaterials.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Materi Terkait
                </h3>
                <div className="space-y-3">
                  {relatedMaterials.map((related) => (
                    <Link
                      key={related.material_id}
                      href={`/dashboard/materials/${related.material_id}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                    >
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                        {related.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {related.avg_rating.toFixed(1)}
                        </span>
                        <span>•</span>
                        <span>{related.difficulty}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}