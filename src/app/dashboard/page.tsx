"use client";

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Award,
  ArrowRight,
  Star,
  Download,
  Eye,
  Sparkles,
  Target,
  Flame
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface MaterialCard {
  material_id: number;
  title: string;
  description: string;
  category_name: string;
  difficulty: string;
  file_type: string;
  view_count: number;
  download_count: number;
  avg_rating: number;
  similarity_score?: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    materialsViewed: 0,
    materialsBookmarked: 0,
    materialsCompleted: 0,
    avgRating: 0
  });
  const [recentMaterials, setRecentMaterials] = useState<any[]>([]);
  const [recommendedMaterials, setRecommendedMaterials] = useState<MaterialCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchRecommendations();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch stats
      const { data: activityData } = await supabase
        .from('v_user_activity_summary')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (activityData) {
        setStats({
          materialsViewed: activityData.materials_viewed || 0,
          materialsBookmarked: activityData.materials_bookmarked || 0,
          materialsCompleted: 0,
          avgRating: activityData.avg_rating_given || 0
        });
      }

      // Fetch recent materials
      const { data: materials } = await supabase
        .from('user_interactions')
        .select(`
          material_id,
          interaction_time,
          materials (
            title,
            description,
            file_type,
            view_count,
            download_count,
            avg_rating,
            categories (
              category_name,
              icon
            )
          )
        `)
        .eq('user_id', session.user.id)
        .eq('interaction_type', 'view')
        .order('interaction_time', { ascending: false })
        .limit(5);

      setRecentMaterials(materials || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user preferences
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('preferences')
        .eq('user_id', session.user.id)
        .single();

      if (!profile?.preferences) {
        setLoadingRecommendations(false);
        return;
      }

      const preferences = profile.preferences;

      // Get materials based on preferences (simplified recommendation)
      let query = supabase
        .from('v_material_recommendation_data')
        .select('*')
        .eq('difficulty', preferences.difficulty_level);

      // Filter by preferred categories if available
      if (preferences.preferred_categories?.length > 0) {
        // This is a simplified query - in production you'd use a more sophisticated algorithm
        query = query.in('category_name', [
          'Pengembangan Web (Front-End & Back-End)',
          'Manajemen Basis Data',
          'Kecerdasan Buatan & Sains Data'
        ]);
      }

      const { data: materials } = await query
        .order('avg_rating', { ascending: false })
        .order('view_count', { ascending: false })
        .limit(6);

      if (materials) {
        // Add mock similarity score for display
        const materialsWithScore = materials.map((m, idx) => ({
          ...m,
          similarity_score: 0.95 - (idx * 0.05) // Mock score for demo
        }));
        setRecommendedMaterials(materialsWithScore);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const statCards = [
    {
      icon: BookOpen,
      label: 'Materi Dipelajari',
      value: stats.materialsViewed,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: Award,
      label: 'Materi Selesai',
      value: stats.materialsCompleted,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: Star,
      label: 'Rating Rata-rata',
      value: stats.avgRating.toFixed(1),
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
    },
    {
      icon: TrendingUp,
      label: 'Bookmark',
      value: stats.materialsBookmarked,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Selamat datang kembali! Lanjutkan pembelajaran Anda.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommended Materials - Preview */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 overflow-hidden">
          <div className="p-6 border-b border-blue-200 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Rekomendasi Untuk Anda
                    <Flame className="w-5 h-5 text-orange-500" />
                  </h2>
                  <p className="text-sm text-gray-600">
                    Materi yang dipersonalisasi berdasarkan preferensi Anda
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/recommendations"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 bg-white px-4 py-2 rounded-lg hover:shadow-md transition-all"
              >
                Lihat Semua
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-6">
            {loadingRecommendations ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : recommendedMaterials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedMaterials.slice(0, 3).map((material) => (
                  <Link
                    key={material.material_id}
                    href={`/dashboard/materials/${material.material_id}`}
                    className="bg-white rounded-lg p-4 hover:shadow-lg transition-all border border-gray-200 hover:border-blue-300 group"
                  >
                    {/* Match Score Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        material.difficulty === 'Beginner' 
                          ? 'bg-green-100 text-green-700'
                          : material.difficulty === 'Intermediate'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {material.difficulty}
                      </span>
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                        <Target className="w-3 h-3" />
                        <span>{Math.round((material.similarity_score || 0) * 100)}%</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {material.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {material.description}
                    </p>

                    {/* Category */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <BookOpen className="w-3 h-3" />
                      <span className="line-clamp-1">{material.category_name}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {material.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {material.download_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {material.avg_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600">Belum ada rekomendasi tersedia</p>
                <p className="text-sm text-gray-500 mt-1">
                  Mulai explore materi untuk mendapatkan rekomendasi
                </p>
                <Link
                  href="/dashboard/materials"
                  className="inline-block mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Jelajahi Materi
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Materials */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Terakhir Dipelajari
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Materi yang baru saja Anda akses
                </p>
              </div>
              <Link
                href="/dashboard/history"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                Lihat Semua
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : recentMaterials.length > 0 ? (
              <div className="space-y-4">
                {recentMaterials.map((item, idx) => (
                  <Link
                    key={idx}
                    href={`/dashboard/materials/${item.material_id}`}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.materials?.title}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {item.materials?.categories?.category_name}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {item.materials?.view_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {item.materials?.download_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {item.materials?.avg_rating?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Belum ada materi yang dipelajari</p>
                <Link
                  href="/dashboard/materials"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                >
                  Mulai Belajar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}