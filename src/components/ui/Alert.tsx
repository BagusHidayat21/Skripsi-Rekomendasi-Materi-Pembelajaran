import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface AlertProps {
  type: 'error' | 'success';
  message: string;
}

export const Alert: React.FC<AlertProps> = ({ type, message }) => {
  const isError = type === 'error';
  
  return (
    <div className={`p-4 rounded-lg flex items-start gap-3 ${
      isError 
        ? 'bg-red-50 border border-red-200' 
        : 'bg-green-50 border border-green-200'
    }`}>
      {isError ? (
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      ) : (
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      )}
      <p className={`text-sm ${isError ? 'text-red-700' : 'text-green-700'}`}>
        {message}
      </p>
    </div>
  );
};