export interface Rating {
  rating_id: number;
  rating_value: number;
  review: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  material_id: number;
}

export interface RatingWithProfile extends Rating {
  student_profiles: {
    full_name: string;
    nim: string;
    photo_url?: string;
  } | null;
}