"use client";

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  Bookmark,
  BookmarkX,
  Search,
  Star,
  Eye,
  Download,
  FileText,
  Video,
  Headphones,
  File,
  Calendar,
  StickyNote,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';

// Type definitions
interface Category {
  category_name: string;
}

interface DifficultyLevel {
  level_name: string;
}

interface Material {
  title: string;
  description: string;
  file_type: string;
  view_count: number;
  download_count: number;
  avg_rating: number | null;
  categories: Category;
  difficulty_levels: DifficultyLevel | null;
}

interface BookmarkItem {
  bookmark_id: number;
  material_id: number;
  notes: string | null;
  created_at: string;
  materials: Material;
}

interface SupabaseBookmarkResponse {
  bookmark_id: number;
  material_id: number;
  notes: string | null;
  created_at: string;
  materials: Array<{
    title: string;
    description: string;
    file_type: string;
    view_count: number;
    download_count: number;
    avg_rating: number | null;
    categories: Category[];
    difficulty_levels: DifficultyLevel[];
  }>;
}

export default function BookmarksPage(): React.JSX.Element {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    void fetchBookmarks();
  }, []);

  useEffect(() => {
    filterBookmarks();
  }, [searchQuery, bookmarks]);

  const fetchBookmarks = async (): Promise<void> => {
  try {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error: fetchError } = await supabase
      .from('bookmarks')
      .select(`
        bookmark_id,
        material_id,
        notes,
        created_at,
        materials (
          title,
          description,
          file_type,
          view_count,
          download_count,
          avg_rating,
          categories (
            category_name
          ),
          difficulty_levels (
            level_name
          )
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;
    setBookmarks((data as unknown as BookmarkItem[]) || []);
  } catch (fetchError) {
    console.error('Error fetching bookmarks:', fetchError);
    setError('Gagal memuat bookmarks');
    setTimeout(() => setError(''), 3000);
  } finally {
    setLoading(false);
  }
};

  const filterBookmarks = (): void => {
    if (!searchQuery) {
      setFilteredBookmarks(bookmarks);
      return;
    }

    const filtered = bookmarks.filter((bookmark) =>
      bookmark.materials.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.materials.categories.category_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredBookmarks(filtered);
  };

  const handleDeleteBookmark = async (bookmarkId: number): Promise<void> => {
    if (!window.confirm('Hapus bookmark ini?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('bookmark_id', bookmarkId);

      if (deleteError) throw deleteError;

      setBookmarks(bookmarks.filter(b => b.bookmark_id !== bookmarkId));
      setSuccess('Bookmark berhasil dihapus');
      setTimeout(() => setSuccess(''), 3000);
    } catch (deleteError) {
      console.error('Error deleting bookmark:', deleteError);
      setError('Gagal menghapus bookmark');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSaveNote = async (bookmarkId: number): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('bookmarks')
        .update({ notes: noteText })
        .eq('bookmark_id', bookmarkId);

      if (updateError) throw updateError;

      setBookmarks(bookmarks.map(b => 
        b.bookmark_id === bookmarkId ? { ...b, notes: noteText } : b
      ));
      setEditingNote(null);
      setNoteText('');
      setSuccess('Catatan berhasil disimpan');
      setTimeout(() => setSuccess(''), 3000);
    } catch (updateError) {
      console.error('Error saving note:', updateError);
      setError('Gagal menyimpan catatan');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditNote = (bookmarkId: number, currentNote: string | null): void => {
    setEditingNote(bookmarkId);
    setNoteText(currentNote || '');
  };

  const handleCancelEdit = (): void => {
    setEditingNote(null);
    setNoteText('');
  };

  const getFileIcon = (fileType: string): React.JSX.Element => {
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

  const getDifficultyColor = (levelName: string | undefined): string => {
    switch (levelName) {
      case 'Beginner':
        return 'bg-green-100 text-green-700';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'Advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-blue-600" />
            Bookmark Saya
          </h1>
          <p className="text-gray-600 mt-1">
            Materi yang telah Anda simpan untuk dipelajari nanti
          </p>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari bookmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              aria-label="Cari bookmark"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Bookmark</p>
              <p className="text-3xl font-bold text-gray-900">{bookmarks.length}</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-lg">
              <Bookmark className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Bookmarks List */}
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
        ) : filteredBookmarks.length > 0 ? (
          <div className="space-y-4">
            {filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.bookmark_id}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-600">
                      {getFileIcon(bookmark.materials.file_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <Link
                          href={`/dashboard/materials/${bookmark.material_id}`}
                          className="flex-1"
                        >
                          <h3 className="font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                            {bookmark.materials.title}
                          </h3>
                        </Link>
                        {bookmark.materials.difficulty_levels && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${getDifficultyColor(bookmark.materials.difficulty_levels.level_name)}`}>
                            {bookmark.materials.difficulty_levels.level_name}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {bookmark.materials.description}
                      </p>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Disimpan {formatDate(bookmark.created_at)}
                        </span>
                        <span>•</span>
                        <span>{bookmark.materials.categories.category_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {bookmark.materials.view_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {bookmark.materials.download_count}
                        </span>
                        {bookmark.materials.avg_rating !== null && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {bookmark.materials.avg_rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      {/* Notes Section */}
                      {editingNote === bookmark.bookmark_id ? (
                        <div className="mt-3">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Tambahkan catatan..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
                            aria-label="Edit catatan"
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => void handleSaveNote(bookmark.bookmark_id)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : bookmark.notes ? (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <StickyNote className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-700">{bookmark.notes}</p>
                              <button
                                type="button"
                                onClick={() => handleEditNote(bookmark.bookmark_id, bookmark.notes)}
                                className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                              >
                                Edit catatan
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEditNote(bookmark.bookmark_id, null)}
                          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mt-2"
                        >
                          <StickyNote className="w-4 h-4" />
                          Tambah catatan
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <Link
                    href={`/dashboard/materials/${bookmark.material_id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    Lihat Detail
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDeleteBookmark(bookmark.bookmark_id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookmarkX className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Tidak Ada Hasil' : 'Belum Ada Bookmark'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Coba ubah kata kunci pencarian Anda'
                : 'Mulai bookmark materi yang ingin Anda pelajari nanti'
              }
            </p>
            {!searchQuery && (
              <Link
                href="/dashboard/materials"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Jelajahi Materi
              </Link>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}