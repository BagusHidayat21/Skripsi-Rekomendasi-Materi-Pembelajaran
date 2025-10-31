"use client";

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  Star,
  MessageSquare,
  Edit2,
  Trash2,
  Calendar,
  BookOpen,
  TrendingUp,
  Award
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';

interface RatingItem {
  rating_id: number;
  material_id: number;
  rating_value: number;
  review: string;
  created_at: string;
  updated_at: string;
  materials: {
    title: string;
    description: string;
    categories: {
      category_name: string;
    };
  };
}

export default function RatingsPage() {
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRating, setEditingRating] = useState<number | null>(null);
  const [editRatingValue, setEditRatingValue] = useState(0);
  const [editReview, setEditReview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalRatings: 0,
    avgRating: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  useEffect(() => {
    fetchRatings();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [ratings]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('ratings')
        .select(`
          rating_id,
          material_id,
          rating_value,
          review,
          created_at,
          updated_at,
          materials (
            title,
            description,
            categories (
              category_name
            )
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRatings(data || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = ratings.length;
    const avg = total > 0 
      ? ratings.reduce((sum, r) => sum + r.rating_value, 0) / total 
      : 0;
    
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      dist[r.rating_value as keyof typeof dist]++;
    });

    setStats({
      totalRatings: total,
      avgRating: avg,
      distribution: dist
    });
  };

  const handleEditStart = (rating: RatingItem) => {
    setEditingRating(rating.rating_id);
    setEditRatingValue(rating.rating_value);
    setEditReview(rating.review || '');
  };

  const handleEditCancel = () => {
    setEditingRating(null);
    setEditRatingValue(0);
    setEditReview('');
  };

  const handleEditSave = async (ratingId: number) => {
    if (editRatingValue === 0) {
      setError('Pilih rating terlebih dahulu');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const { error } = await supabase
        .from('ratings')
        .update({
          rating_value: editRatingValue,
          review: editReview,
          updated_at: new Date().toISOString()
        })
        .eq('rating_id', ratingId);

      if (error) throw error;

      setRatings(ratings.map(r => 
        r.rating_id === ratingId 
          ? { ...r, rating_value: editRatingValue, review: editReview, updated_at: new Date().toISOString() }
          : r
      ));

      setEditingRating(null);
      setSuccess('Rating berhasil diupdate');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Gagal update rating');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (ratingId: number) => {
    if (!confirm('Hapus rating ini?')) return;

    try {
      const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('rating_id', ratingId);

      if (error) throw error;

      setRatings(ratings.filter(r => r.rating_id !== ratingId));
      setSuccess('Rating berhasil dihapus');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Gagal menghapus rating');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            Rating & Review Saya
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola rating dan review yang telah Anda berikan
          </p>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Ratings */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Rating</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalRatings}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rating Rata-rata</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
              </div>
            </div>
          </div>

          {/* Distribution */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Distribusi Rating</p>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-4">{star}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{
                        width: `${stats.totalRatings > 0 
                          ? (stats.distribution[star as keyof typeof stats.distribution] / stats.totalRatings) * 100 
                          : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-8 text-right">
                    {stats.distribution[star as keyof typeof stats.distribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ratings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : ratings.length > 0 ? (
          <div className="space-y-4">
            {ratings.map((rating) => (
              <div
                key={rating.rating_id}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all"
              >
                {editingRating === rating.rating_id ? (
                  /* Edit Mode */
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4">
                      {rating.materials.title}
                    </h3>

                    {/* Star Rating */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setEditRatingValue(star)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= editRatingValue
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review Text */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Review
                      </label>
                      <textarea
                        value={editReview}
                        onChange={(e) => setEditReview(e.target.value)}
                        placeholder="Tulis review Anda..."
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSave(rating.rating_id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <Link
                        href={`/dashboard/materials/${rating.material_id}`}
                        className="flex-1"
                      >
                        <h3 className="font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                          {rating.materials.title}
                        </h3>
                      </Link>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditStart(rating)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rating.rating_id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= rating.rating_value
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {rating.rating_value}/5
                      </span>
                    </div>

                    {/* Review */}
                    {rating.review && (
                      <p className="text-gray-700 mb-4 bg-gray-50 p-3 rounded-lg">
                        {rating.review}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {rating.materials.categories.category_name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(rating.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      {rating.created_at !== rating.updated_at && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">
                            Diupdate {new Date(rating.updated_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Belum Ada Rating
            </h3>
            <p className="text-gray-600 mb-6">
              Mulai berikan rating dan review untuk materi yang telah Anda pelajari
            </p>
            <Link
              href="/dashboard/materials"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Jelajahi Materi
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}