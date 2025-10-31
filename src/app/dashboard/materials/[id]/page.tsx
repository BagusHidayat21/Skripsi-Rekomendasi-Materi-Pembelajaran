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
  student_profiles: {
    full_name: string;
    nim: string;
  };
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

  useEffect(() => {
    if (materialId) {
      fetchMaterialDetail();
      fetchRatings();
      fetchRelatedMaterials();
      checkBookmark();
      checkUserRating();
      trackView();
    }
  }, [materialId]);

  const fetchMaterialDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('v_material_recommendation_data')
        .select('*')
        .eq('material_id', materialId)
        .single();

      if (error) throw error;
      setMaterial(data);
    } catch (error) {
      console.error('Error fetching material:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const { data } = await supabase
        .from('ratings')
        .select(`
          *,
          student_profiles:users!ratings_user_id_fkey (
            full_name,
            nim,
            student_profiles (
              full_name,
              nim
            )
          )
        `)
        .eq('material_id', materialId)
        .order('created_at', { ascending: false })
        .limit(5);

      setRatings(data || []);
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
          .from('v_material_recommendation_data')
          .select('*')
          .eq('category_id', currentMaterial.category_id)
          .neq('material_id', materialId)
          .limit(3);

        setRelatedMaterials(data || []);
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
        .single();

      setIsBookmarked(!!data);
    } catch (error) {
      // Not bookmarked
    }
  };

  const checkUserRating = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('ratings')
        .select('rating_value, review')
        .eq('user_id', session.user.id)
        .eq('material_id', materialId)
        .single();

      if (data) {
        setUserRating(data.rating_value);
        setUserReview(data.review || '');
      }
    } catch (error) {
      // No rating yet
    }
  };

  const trackView = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase
        .from('user_interactions')
        .insert({
          user_id: session.user.id,
          material_id: parseInt(materialId),
          interaction_type: 'view',
          interaction_time: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (isBookmarked) {
        // Remove bookmark
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', session.user.id)
          .eq('material_id', materialId);

        setIsBookmarked(false);
        setSuccess('Bookmark dihapus');
      } else {
        // Add bookmark
        await supabase
          .from('bookmarks')
          .insert({
            user_id: session.user.id,
            material_id: parseInt(materialId)
          });

        setIsBookmarked(true);
        setSuccess('Berhasil ditambahkan ke bookmark');
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Gagal mengubah bookmark');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDownload = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Track download
      await supabase
        .from('user_interactions')
        .insert({
          user_id: session.user.id,
          material_id: parseInt(materialId),
          interaction_type: 'download',
          interaction_time: new Date().toISOString()
        });

      // Open file (in production, this would be a proper download link)
      window.open(material?.file_path, '_blank');
      
      setSuccess('Download dimulai');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Gagal mendownload materi');
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
      if (!session) return;

      const { error } = await supabase
        .from('ratings')
        .upsert({
          user_id: session.user.id,
          material_id: parseInt(materialId),
          rating_value: userRating,
          review: userReview,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSuccess('Rating berhasil disimpan');
      fetchRatings();
      fetchMaterialDetail();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Gagal menyimpan rating');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmittingRating(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-6 h-6" />;
      case 'video':
        return <Video className="w-6 h-6" />;
      case 'audio':
        return <Headphones className="w-6 h-6" />;
      default:
        return <File className="w-6 h-6" />;
    }
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
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-5 h-5" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                    <button className="p-2 bg-white rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
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
                    {material.view_count} views
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Deskripsi
                </h2>
                <p className="text-gray-600 leading-relaxed">
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

            {/* Rating & Review Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Rating & Review
              </h2>

              {/* Submit Rating */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">
                  Berikan Rating Anda
                </h3>
                
                {/* Star Rating */}
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="transition-transform hover:scale-110"
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
                />

                <button
                  onClick={handleSubmitRating}
                  disabled={submittingRating || userRating === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingRating ? 'Menyimpan...' : 'Kirim Rating'}
                </button>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {ratings.length > 0 ? (
                  ratings.map((rating) => (
                    <div key={rating.rating_id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {rating.student_profiles?.full_name || 'User'}
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
                        </div>
                      </div>
                      {rating.review && (
                        <p className="text-sm text-gray-600 ml-13">
                          {rating.review}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    Belum ada review. Jadilah yang pertama!
                  </p>
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
                    {material.file_type}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mb-3"
              >
                <Download className="w-5 h-5" />
                Download Materi
              </button>

              <p className="text-xs text-gray-500 text-center">
                Ukuran file: {formatFileSize(material.file_size || 0)}
              </p>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Statistik</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <Eye className="w-4 h-4" />
                    Views
                  </span>
                  <span className="font-semibold text-gray-900">
                    {material.view_count}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <Download className="w-4 h-4" />
                    Downloads
                  </span>
                  <span className="font-semibold text-gray-900">
                    {material.download_count}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <Star className="w-4 h-4" />
                    Rating
                  </span>
                  <span className="font-semibold text-gray-900">
                    {material.avg_rating?.toFixed(1) || '0.0'} / 5
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
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                        {related.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {related.avg_rating?.toFixed(1)}
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