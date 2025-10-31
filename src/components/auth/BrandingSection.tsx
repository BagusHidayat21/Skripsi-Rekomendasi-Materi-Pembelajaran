import React from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';

export const BrandingSection: React.FC = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 flex-col justify-between text-white">
      <div>
        <div className="flex items-center gap-3 mb-8">
          <GraduationCap className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-bold">EduRecommend</h1>
            <p className="text-blue-200 text-sm">
              Sistem Rekomendasi Materi Pembelajaran
            </p>
          </div>
        </div>
        
        <div className="space-y-6 mt-12">
          <FeatureItem
            icon={BookOpen}
            title="Rekomendasi Personal"
            description="Materi pembelajaran yang disesuaikan dengan minat dan kebutuhan belajar Anda menggunakan Content-Based Filtering"
          />
          
          <FeatureItem
            icon={GraduationCap}
            title="Pembelajaran Adaptif"
            description="Sistem yang terus belajar dari interaksi Anda untuk memberikan rekomendasi yang lebih baik"
          />
        </div>
      </div>
      
      <div className="text-sm text-blue-200">
        <p>Program Studi Pendidikan Teknik Informatika</p>
        <p className="mt-1">© 2025 PTI - Learning Recommendation System</p>
      </div>
    </div>
  );
};

interface FeatureItemProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ 
  icon: Icon, 
  title, 
  description 
}) => {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-blue-500 bg-opacity-30 p-3 rounded-lg backdrop-blur-sm">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-blue-100 text-sm">{description}</p>
      </div>
    </div>
  );
};