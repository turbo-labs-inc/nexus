export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          full_name: string | null;
          avatar_url: string | null;
          email: string | null;
          role: string;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          role?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      teams: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          owner_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          description?: string | null;
          logo_url?: string | null;
          owner_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          owner_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      companies: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          domain: string | null;
          logo_url: string | null;
          owner_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          domain?: string | null;
          logo_url?: string | null;
          owner_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          domain?: string | null;
          logo_url?: string | null;
          owner_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "companies_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      team_members: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          team_id: string;
          role: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          team_id: string;
          role?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          team_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      company_teams: {
        Row: {
          id: string;
          created_at: string;
          company_id: string;
          team_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          company_id: string;
          team_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          company_id?: string;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_teams_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_teams_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      projects: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          description: string | null;
          team_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          description?: string | null;
          team_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          description?: string | null;
          team_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      mcp_configs: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          config: Json;
          user_id: string | null;
          team_id: string | null;
          is_shared: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          config: Json;
          user_id?: string | null;
          team_id?: string | null;
          is_shared?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          config?: Json;
          user_id?: string | null;
          team_id?: string | null;
          is_shared?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "mcp_configs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mcp_configs_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      workflow_templates: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          description: string | null;
          flow_data: Json;
          user_id: string | null;
          team_id: string | null;
          is_public: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          description?: string | null;
          flow_data: Json;
          user_id?: string | null;
          team_id?: string | null;
          is_public?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          description?: string | null;
          flow_data?: Json;
          user_id?: string | null;
          team_id?: string | null;
          is_public?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_templates_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_templates_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_sessions: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          user_id: string;
          project_id: string | null;
          mcp_config_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          user_id: string;
          project_id?: string | null;
          mcp_config_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          user_id?: string;
          project_id?: string | null;
          mcp_config_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_sessions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_sessions_mcp_config_id_fkey";
            columns: ["mcp_config_id"];
            isOneToOne: false;
            referencedRelation: "mcp_configs";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_messages: {
        Row: {
          id: string;
          created_at: string;
          session_id: string;
          content: string;
          role: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          session_id: string;
          content: string;
          role: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          session_id?: string;
          content?: string;
          role?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "chat_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "admin" | "user" | "guest";
    };
  };
}
