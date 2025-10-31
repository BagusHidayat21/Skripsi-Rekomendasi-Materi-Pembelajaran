import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PreferenceCardProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

export const PreferenceCard: React.FC<PreferenceCardProps> = ({
  icon: Icon,
  label,
  description,
  selected,
  onClick
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        p-4 rounded-lg border-2 transition-all text-left w-full
        ${selected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          p-2 rounded-lg flex-shrink-0
          ${selected ? 'bg-blue-100' : 'bg-gray-100'}
        `}>
          <Icon className={`w-5 h-5 ${selected ? 'text-blue-600' : 'text-gray-600'}`} />
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${selected ? 'text-blue-900' : 'text-gray-900'}`}>
            {label}
          </h4>
          {description && (
            <p className="text-xs text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {selected && (
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </button>
  );
};