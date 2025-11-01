"use client";

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  Sparkles,
  Target,
  BookOpen,
  Star,
  Eye,
  Download,
  TrendingUp,
  Filter,
  SlidersHorizontal,
  Flame,
  Award,
  Clock,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface MaterialCard {
  material_id: number;
  title: string;
  description: string;
  category_name: string;
  category_id: number;
  difficulty: string;
  difficulty_level_id: number;
  file_type: string;
  view_count: number;
  download_count: number;
  avg_rating: number;
  tags: string;
  created_at: string;
  similarity_score?: number;
  match_reason?: string[];
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<MaterialCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchRecommendations();
    fetchCategories();
  }, [selectedDifficulty, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('category_id, category_name')
        .eq('is_active', true);
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user preferences
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('preferences')
        .eq('user_id', session.user.id)
        .single();

      if (!profile?.preferences) {
        setLoading(false);
        return;
      }

      setUserPreferences(profile.preferences);
      const preferences = profile.preferences;

      // Build query
      let query = supabase
        .from('v_material_recommendation_data')
        .select('*');

      // Apply user-selected filters (overrides preferences)
      if (selectedDifficulty !== 'all') {
        query = query.eq('difficulty', selectedDifficulty);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', parseInt(selectedCategory));
      }

      const { data: materials } = await query
        .order('avg_rating', { ascending: false })
        .order('view_count', { ascending: false })
        .limit(50); // Get more materials for better filtering

      if (materials) {
        // ⭐ IMPROVED SCORING ALGORITHM
        const materialsWithAnalysis = materials.map((material) => {
          const matchReasons: string[] = [];
          let score = 0;

          // 1. DIFFICULTY MATCH (Weight: 30 points)
          const userDifficulty = preferences.difficulty_level?.toLowerCase() || '';
          const materialDifficulty = material.difficulty?.toLowerCase() || '';
          
          if (materialDifficulty === userDifficulty) {
            matchReasons.push(`✅ ${material.difficulty} - sesuai level Anda`);
            score += 30;
          } else if (
            (userDifficulty === 'beginner' && materialDifficulty === 'intermediate') ||
            (userDifficulty === 'intermediate' && materialDifficulty === 'advanced')
          ) {
            matchReasons.push(`📈 ${material.difficulty} - satu level di atas`);
            score += 15;
          }

          // 2. CATEGORY MATCH (Weight: 25 points)
          const userCategories = (preferences.preferred_categories || [])
            .map((c: string) => c.toLowerCase().replace(/[-_\s]/g, ''));
          const materialCategory = (material.category_name || '')
            .toLowerCase()
            .replace(/[-_\s]/g, '');

          const categoryMatch = userCategories.some((userCat: string) =>
            materialCategory.includes(userCat) || userCat.includes(materialCategory)
          );

          if (categoryMatch) {
            matchReasons.push(`🎯 Kategori: ${material.category_name}`);
            score += 25;
          }

          // 3. TAG MATCH (Weight: 20 points)
          const materialTags = (material.tags || '')
            .toLowerCase()
            .split(',')
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0);

          const userTags = (preferences.preferred_tags || [])
            .map((t: string) => t.toLowerCase());

          const tagMatches = materialTags.filter((materialTag: string) =>
            userTags.some((userTag: string) =>
              materialTag.includes(userTag) || userTag.includes(materialTag)
            )
          );

          if (tagMatches.length > 0) {
            matchReasons.push(`🏷️ Tags: ${tagMatches.slice(0, 2).join(', ')}`);
            score += Math.min(tagMatches.length * 10, 20); // Max 20 points
          }

          // 4. PREFERRED MATERIALS MATCH (Weight: 15 points)
          const preferredMaterials = (preferences.preferred_materials || [])
            .map((m: string) => m.toLowerCase());
          
          const materialTitle = material.title?.toLowerCase() || '';
          const materialDesc = material.description?.toLowerCase() || '';

          const materialMatch = preferredMaterials.some((prefMat: string) =>
            materialTitle.includes(prefMat) || materialDesc.includes(prefMat)
          );

          if (materialMatch) {
            const matchedMaterial = preferredMaterials.find((m: string) =>
              materialTitle.includes(m) || materialDesc.includes(m)
            );
            matchReasons.push(`💡 Topik: ${matchedMaterial}`);
            score += 15;
          }

          // 5. FORMAT MATCH (Weight: 10 points)
          const userFormats = (preferences.preferred_formats || [])
            .map((f: string) => f.toLowerCase());
          const materialFormat = material.file_type?.toLowerCase() || '';

          if (userFormats.includes(materialFormat)) {
            matchReasons.push(`📄 Format: ${material.file_type.toUpperCase()}`);
            score += 10;
          }

          // 6. QUALITY BONUS (Max 10 points)
          if (material.avg_rating >= 4.5) {
            matchReasons.push('⭐ Rating sangat tinggi (4.5+)');
            score += 5;
          } else if (material.avg_rating >= 4.0) {
            matchReasons.push('⭐ Rating tinggi (4.0+)');
            score += 3;
          }

          if (material.view_count > 500) {
            matchReasons.push('🔥 Sangat populer');
            score += 3;
          } else if (material.view_count > 100) {
            matchReasons.push('👀 Populer');
            score += 2;
          }

          // Convert to percentage (0-100)
          const similarityScore = Math.min(score / 100, 0.99);

          return {
            ...material,
            similarity_score: similarityScore,
            match_reason: matchReasons,
            raw_score: score
          };
        });

        // Sort by score (highest first)
        materialsWithAnalysis.sort((a, b) => (b.raw_score || 0) - (a.raw_score || 0));

        // Only show materials with score >= 20%
        const filteredMaterials = materialsWithAnalysis.filter(m => (m.raw_score || 0) >= 20);

        setRecommendations(filteredMaterials.slice(0, 20)); // Show top 20
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 0.5) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (score >= 0.3) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.7) return 'Sangat Cocok';
    if (score >= 0.5) return 'Cocok';
    if (score >= 0.3) return 'Cukup Cocok';
    return 'Mungkin Cocok';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Rekomendasi Untuk Anda
                <Flame className="w-6 h-6 text-orange-300" />
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                Materi pembelajaran yang dipersonalisasi berdasarkan preferensi dan aktivitas Anda
              </p>
            </div>
          </div>

          {/* User Preferences Summary */}
          {userPreferences && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                📊 {userPreferences.difficulty_level}
              </span>
              {userPreferences.preferred_formats?.slice(0, 2).map((format: string) => (
                <span key={format} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm capitalize">
                  📄 {format}
                </span>
              ))}
              {userPreferences.preferred_categories?.slice(0, 2).map((cat: string) => (
                <span key={cat} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm capitalize">
                  🎯 {cat.replace('-', ' ')}
                </span>
              ))}
              {userPreferences.preferred_tags?.slice(0, 3).map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                  🏷️ {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-700 font-medium hover:text-blue-600 transition-colors w-full md:w-auto"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filter & Urutkan</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tingkat Kesulitan
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="all">Semua Tingkat</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {!loading && recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <Target className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Ditemukan <strong>{recommendations.length} materi</strong> yang cocok dengan preferensi Anda
              {recommendations.length > 0 && (
                <span className="ml-1">
                  • Match terbaik: <strong>{Math.round((recommendations[0]?.similarity_score || 0) * 100)}%</strong>
                </span>
              )}
            </p>
          </div>
        )}

        {/* Recommendations Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((material, idx) => (
              <Link
                key={material.material_id}
                href={`/dashboard/materials/${material.material_id}`}
                className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all group overflow-hidden"
              >
                {/* Header with Score */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getScoreColor(material.similarity_score || 0)}`}>
                      <Target className="w-4 h-4" />
                      <span>{Math.round((material.similarity_score || 0) * 100)}% Match</span>
                    </div>
                    {idx < 3 && (
                      <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                        <Award className="w-3.5 h-3.5" />
                        Top {idx + 1}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    material.difficulty === 'Beginner' 
                      ? 'bg-green-100 text-green-700'
                      : material.difficulty === 'Intermediate'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {material.difficulty}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors text-lg">
                    {material.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {material.description}
                  </p>

                  {/* Category */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <BookOpen className="w-4 h-4" />
                    <span className="line-clamp-1">{material.category_name}</span>
                  </div>

                  {/* Match Reasons */}
                  {material.match_reason && material.match_reason.length > 0 && (
                    <div className="mb-4 space-y-1.5 bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Kenapa cocok:</p>
                      {material.match_reason.slice(0, 4).map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-blue-700">
                          <span className="text-[10px] mt-0.5">{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {material.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      {material.download_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      {material.avg_rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(material.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Belum Ada Rekomendasi
            </h3>
            <p className="text-gray-600 mb-6">
              Coba ubah filter atau lengkapi preferensi Anda untuk mendapatkan rekomendasi yang lebih baik
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/dashboard/materials"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Jelajahi Materi
              </Link>
              <Link
                href="/dashboard/preferences"
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Atur Preferensi
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}