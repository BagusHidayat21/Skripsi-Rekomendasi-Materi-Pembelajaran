"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    BookOpen,
    Heart,
    History,
    Star,
    TrendingUp,
    Settings,
    User,
    LogOut,
    GraduationCap,
    BarChart3,
    Bookmark
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const pathname = usePathname();

    const menuItems = [
        {
            section: 'Main',
            items: [
                { icon: Home, label: 'Dashboard', href: '/dashboard' },
                { icon: BookOpen, label: 'Materi Belajar', href: '/dashboard/materials' },
                { icon: TrendingUp, label: 'Rekomendasi', href: '/dashboard/recommendations' },
            ]
        },
        {
            section: 'Library',
            items: [
                { icon: Bookmark, label: 'Bookmark Saya', href: '/dashboard/bookmarks' },
                { icon: History, label: 'Riwayat Belajar', href: '/dashboard/history' },
                { icon: Star, label: 'Rating & Review', href: '/dashboard/ratings' },
            ]
        },
        {
            section: 'Analytics',
            items: [
                { icon: BarChart3, label: 'Progress Saya', href: '/dashboard/progress' },
            ]
        },
        {
            section: 'Account',
            items: [
                { icon: User, label: 'Profile Saya', href: '/dashboard/profile' },
                { icon: Settings, label: 'Preferensi', href: '/dashboard/preferences' },
            ]
        }
    ];

    const isActive = (href: string) => {
        return pathname === href;
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                {/* Logo - Fixed Height */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 flex-shrink-0">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">EduRecommend</h1>
                        <p className="text-xs text-gray-500">PTI Learning System</p>
                    </div>
                </div>

                {/* Navigation - Scrollable */}
                <nav className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="space-y-6">
                        {menuItems.map((section, idx) => (
                            <div key={idx}>
                                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    {section.section}
                                </h3>
                                <ul className="space-y-1">
                                    {section.items.map((item, itemIdx) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href);

                                        return (
                                            <li key={itemIdx}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => onClose()}
                                                    className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg
                            transition-all duration-200
                            ${active
                                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                        }
                          `}
                                                >
                                                    <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                                                    <span>{item.label}</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                </nav>
            </aside>
        </>
    );
};