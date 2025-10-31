export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  nim: string;
  fullName: string;
  angkatan: number;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface CompleteProfileData {
  nim: string;
  fullName: string;
  angkatan: number;
  password?: string; // Optional untuk OAuth users
  confirmPassword?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  preferred_formats: string[];
  preferred_materials: string[];
  preferred_categories: string[];
  preferred_tags: string[];
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
}