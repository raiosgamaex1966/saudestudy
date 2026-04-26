export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          email: string | null;
          name: string | null;
          role: string;
          credits: number;
          plan: string;
          blocked: boolean;
          block_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          email?: string | null;
          name?: string | null;
          role?: string;
          credits?: number;
          plan?: string;
          blocked?: boolean;
          block_reason?: string | null;
          created_at?: string;
        };
      };
      subjects: {
        Row: {
          id: number;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          category: string | null;
          is_active: boolean;
          created_at: string;
        };
      };
      materials: {
        Row: {
          id: number;
          title: string;
          file_url: string;
          file_size: number;
          mime_type: string | null;
          subject_id: number | null;
          uploaded_by: number | null;
          is_public: boolean;
          is_official: boolean;
          created_at: string;
        };
        Insert: {
          title: string;
          file_url: string;
          file_size: number;
          mime_type?: string | null;
          subject_id?: number | null;
          uploaded_by?: number | null;
          is_public?: boolean;
          is_official?: boolean;
        };
      };
      simulations: {
        Row: {
          id: number;
          title: string;
          type: string;
          subject_id: number | null;
          material_id: number | null;
          created_by: number | null;
          questions: any;
          config: any;
          is_public: boolean;
          credit_cost: number;
          created_at: string;
        };
      };
      attempts: {
        Row: {
          id: number;
          simulation_id: number;
          user_id: number;
          answers: any;
          score: number | null;
          correct_count: number | null;
          total_questions: number | null;
          time_spent: number | null;
          completed_at: string | null;
          created_at: string;
        };
      };
      credit_transactions: {
        Row: {
          id: number;
          user_id: number;
          type: string;
          amount: number;
          description: string | null;
          created_at: string;
        };
      };
      api_keys: {
        Row: {
          id: number;
          provider: string;
          key_value: string;
          is_active: boolean;
          created_at: string;
        };
      };
      admin_contents: {
        Row: {
          id: number;
          title: string;
          content: string;
          subject_id: number;
          is_active: boolean;
          created_at: string;
        };
      };
    };
  };
};
