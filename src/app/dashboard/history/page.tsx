"use client";

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  History,
  Clock,
  Calendar,
  Eye,
  Download,
  Star,
  FileText,
  Video,
  Headphones,
  File,
  TrendingUp,
  Filter,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface HistoryItem {
  interaction_id: number;
  material_id: number;
  interaction_type: string;
  duration_seconds: number;
  interaction_time: string;
  materials: {
    title: string;
    description: string;
    file_type: string;
    view_count: number;
    download_count: number;
    avg_rating: number;
    categories: {
      category_name: string;
      icon: string;
    };
    difficulty_levels: {
      level_name: string;
    };
  };
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalDownloads: 0,
    totalTime: 0,
    uniqueMaterials: 0
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    filterHistory();
    calculateStats();
  }, [filterType, filterPeriod, history]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_interactions')
        .select(`
          interaction_id,
          material_id,
          interaction_type,
          duration_seconds,
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
            ),
            difficulty_levels (
              level_name
            )
          )
        `)
        .eq('user_id', session.user.id)
        .order('interaction_time', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = [...history];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.interaction_type === filterType);
    }

    // Filter by period
    if (filterPeriod !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (filterPeriod) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(item => 
        new Date(item.interaction_time) >= filterDate
      );
    }

    setFilteredHistory(filtered);
  };

  const calculateStats = () => {
    const views = history.filter(h => h.interaction_type === 'view').length;
    const downloads = history.filter(h => h.interaction_type === 'download').length;
    const totalTime = history
      .filter(h => h.interaction_type === 'view')
      .reduce((sum, h) => sum + (h.duration_seconds || 0), 0);
    const uniqueMaterials = new Set(history.map(h => h.material_id)).size;

    setStats({
      totalViews: views,
      totalDownloads: downloads,
      totalTime: Math.floor(totalTime / 60), // Convert to minutes
      uniqueMaterials
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} jam ${remainingMinutes} menit`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'audio':
        return <Headphones className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const getInteractionBadge = (type: string) => {
    switch (type) {
      case 'view':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Dilihat
        </span>;
      case 'download':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <Download className="w-3 h-3" />
          Didownload
        </span>;
      case 'click_recommendation':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Dari Rekomendasi
        </span>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <History className="w-8 h-8 text-blue-600" />
            Riwayat Belajar
          </h1>
          <p className="text-gray-600 mt-1">
            Lihat aktivitas dan progress pembelajaran Anda
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Views</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalViews}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Downloads</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDownloads}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Download className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Waktu Belajar</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTime}m</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Materi Unik</p>
                <p className="text-3xl font-bold text-gray-900">{stats.uniqueMaterials}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-700 font-medium hover:text-blue-600 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span>Filter</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Aktivitas
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="all">Semua Aktivitas</option>
                  <option value="view">View</option>
                  <option value="download">Download</option>
                  <option value="click_recommendation">Dari Rekomendasi</option>
                </select>
              </div>

              {/* Period Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Periode
                </label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="all">Semua Waktu</option>
                  <option value="today">Hari Ini</option>
                  <option value="week">7 Hari Terakhir</option>
                  <option value="month">30 Hari Terakhir</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* History Timeline */}
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
        ) : filteredHistory.length > 0 ? (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <div
                key={item.interaction_id}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-600">
                      {getFileIcon(item.materials.file_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <Link
                          href={`/dashboard/materials/${item.material_id}`}
                          className="flex-1"
                        >
                          <h3 className="font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                            {item.materials.title}
                          </h3>
                        </Link>
                        {getInteractionBadge(item.interaction_type)}
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {item.materials.description}
                      </p>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.interaction_time)}
                        </span>
                        {item.duration_seconds > 0 && (
                          <>
                            <span>•</span>
                            <span>Durasi: {formatDuration(item.duration_seconds)}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{item.materials.categories.category_name}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full ${
                          item.materials.difficulty_levels?.level_name === 'Beginner' 
                            ? 'bg-green-100 text-green-700'
                            : item.materials.difficulty_levels?.level_name === 'Intermediate'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.materials.difficulty_levels?.level_name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tidak Ada Riwayat
            </h3>
            <p className="text-gray-600 mb-6">
              {filterType !== 'all' || filterPeriod !== 'all'
                ? 'Tidak ada aktivitas sesuai filter yang dipilih'
                : 'Mulai jelajahi materi untuk melihat riwayat pembelajaran Anda'
              }
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