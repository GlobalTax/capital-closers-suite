export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      about_content: {
        Row: {
          content: string | null
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          label: string | null
          section: string
          subtitle: string | null
          title: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          label?: string | null
          section: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          label?: string | null
          section?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      accountex_leads: {
        Row: {
          brevo_sent: boolean | null
          brevo_sent_at: string | null
          company: string
          created_at: string
          email: string
          email_sent: boolean | null
          email_sent_at: string | null
          full_name: string
          id: string
          ip_address: unknown
          message: string | null
          phone: string | null
          preferred_meeting_date: string | null
          priority: string | null
          processed_at: string | null
          processed_by: string | null
          referrer: string | null
          sectors_of_interest: string | null
          status: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          brevo_sent?: boolean | null
          brevo_sent_at?: string | null
          company: string
          created_at?: string
          email: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name: string
          id?: string
          ip_address?: unknown
          message?: string | null
          phone?: string | null
          preferred_meeting_date?: string | null
          priority?: string | null
          processed_at?: string | null
          processed_by?: string | null
          referrer?: string | null
          sectors_of_interest?: string | null
          status?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          brevo_sent?: boolean | null
          brevo_sent_at?: string | null
          company?: string
          created_at?: string
          email?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name?: string
          id?: string
          ip_address?: unknown
          message?: string | null
          phone?: string | null
          preferred_meeting_date?: string | null
          priority?: string | null
          processed_at?: string | null
          processed_by?: string | null
          referrer?: string | null
          sectors_of_interest?: string | null
          status?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      acquisition_channels: {
        Row: {
          category: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      acquisition_leads: {
        Row: {
          acquisition_channel_id: string | null
          acquisition_type: string | null
          additional_details: string | null
          apollo_candidates: Json | null
          apollo_error: string | null
          apollo_last_enriched_at: string | null
          apollo_org_data: Json | null
          apollo_org_id: string | null
          apollo_people_data: Json | null
          apollo_status: string | null
          brevo_deleted_at: string | null
          brevo_lists: number[] | null
          brevo_unsubscribed_lists: number[] | null
          company: string
          company_description: string | null
          company_enriched_at: string | null
          company_enriched_data: Json | null
          company_sector: string | null
          company_size: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          email: string
          email_bounce_type: string | null
          email_bounced: boolean | null
          email_clicked: boolean | null
          email_delivered: boolean | null
          email_delivered_at: string | null
          email_domain: string | null
          email_opens_count: number | null
          email_sent: boolean | null
          email_sent_at: string | null
          email_unsubscribed: boolean | null
          email_unsubscribed_at: string | null
          email_valid: boolean | null
          full_name: string
          id: string
          investment_range: string | null
          ip_address: unknown
          is_deleted: boolean | null
          last_campaign_id: number | null
          last_campaign_name: string | null
          last_email_click_at: string | null
          lead_form: string | null
          phone: string | null
          referrer: string | null
          sectors_of_interest: string | null
          status: string
          target_timeline: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          acquisition_channel_id?: string | null
          acquisition_type?: string | null
          additional_details?: string | null
          apollo_candidates?: Json | null
          apollo_error?: string | null
          apollo_last_enriched_at?: string | null
          apollo_org_data?: Json | null
          apollo_org_id?: string | null
          apollo_people_data?: Json | null
          apollo_status?: string | null
          brevo_deleted_at?: string | null
          brevo_lists?: number[] | null
          brevo_unsubscribed_lists?: number[] | null
          company: string
          company_description?: string | null
          company_enriched_at?: string | null
          company_enriched_data?: Json | null
          company_sector?: string | null
          company_size?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          email: string
          email_bounce_type?: string | null
          email_bounced?: boolean | null
          email_clicked?: boolean | null
          email_delivered?: boolean | null
          email_delivered_at?: string | null
          email_domain?: string | null
          email_opens_count?: number | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          email_unsubscribed?: boolean | null
          email_unsubscribed_at?: string | null
          email_valid?: boolean | null
          full_name: string
          id?: string
          investment_range?: string | null
          ip_address?: unknown
          is_deleted?: boolean | null
          last_campaign_id?: number | null
          last_campaign_name?: string | null
          last_email_click_at?: string | null
          lead_form?: string | null
          phone?: string | null
          referrer?: string | null
          sectors_of_interest?: string | null
          status?: string
          target_timeline?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          acquisition_channel_id?: string | null
          acquisition_type?: string | null
          additional_details?: string | null
          apollo_candidates?: Json | null
          apollo_error?: string | null
          apollo_last_enriched_at?: string | null
          apollo_org_data?: Json | null
          apollo_org_id?: string | null
          apollo_people_data?: Json | null
          apollo_status?: string | null
          brevo_deleted_at?: string | null
          brevo_lists?: number[] | null
          brevo_unsubscribed_lists?: number[] | null
          company?: string
          company_description?: string | null
          company_enriched_at?: string | null
          company_enriched_data?: Json | null
          company_sector?: string | null
          company_size?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          email?: string
          email_bounce_type?: string | null
          email_bounced?: boolean | null
          email_clicked?: boolean | null
          email_delivered?: boolean | null
          email_delivered_at?: string | null
          email_domain?: string | null
          email_opens_count?: number | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          email_unsubscribed?: boolean | null
          email_unsubscribed_at?: string | null
          email_valid?: boolean | null
          full_name?: string
          id?: string
          investment_range?: string | null
          ip_address?: unknown
          is_deleted?: boolean | null
          last_campaign_id?: number | null
          last_campaign_name?: string | null
          last_email_click_at?: string | null
          lead_form?: string | null
          phone?: string | null
          referrer?: string | null
          sectors_of_interest?: string | null
          status?: string
          target_timeline?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acquisition_leads_acquisition_channel_id_fkey"
            columns: ["acquisition_channel_id"]
            isOneToOne: false
            referencedRelation: "acquisition_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquisition_leads_lead_form_fkey"
            columns: ["lead_form"]
            isOneToOne: false
            referencedRelation: "lead_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_conversions: {
        Row: {
          company_domain: string | null
          conversion_name: string | null
          conversion_type: string
          conversion_value: number | null
          created_at: string
          gclid: string | null
          id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
        }
        Insert: {
          company_domain?: string | null
          conversion_name?: string | null
          conversion_type: string
          conversion_value?: number | null
          created_at?: string
          gclid?: string | null
          id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Update: {
          company_domain?: string | null
          conversion_name?: string | null
          conversion_type?: string
          conversion_value?: number | null
          created_at?: string
          gclid?: string | null
          id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          target_user_email: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          target_user_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          target_user_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_leads: {
        Row: {
          auto_match_attempted_at: string | null
          cif: string | null
          company_name: string
          company_name_normalized: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contacto_id: string | null
          country: string | null
          created_at: string | null
          ebitda: number | null
          email_domain: string | null
          empleados: number | null
          empresa_id: string | null
          facturacion: number | null
          first_seen_at: string | null
          id: string
          last_updated_at: string | null
          location: string | null
          match_status: string | null
          raw_data: Json | null
          sector: string | null
          source_id: string | null
          source_table: string | null
          source_type: string | null
          subsector: string | null
          website_domain: string | null
        }
        Insert: {
          auto_match_attempted_at?: string | null
          cif?: string | null
          company_name: string
          company_name_normalized?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contacto_id?: string | null
          country?: string | null
          created_at?: string | null
          ebitda?: number | null
          email_domain?: string | null
          empleados?: number | null
          empresa_id?: string | null
          facturacion?: number | null
          first_seen_at?: string | null
          id?: string
          last_updated_at?: string | null
          location?: string | null
          match_status?: string | null
          raw_data?: Json | null
          sector?: string | null
          source_id?: string | null
          source_table?: string | null
          source_type?: string | null
          subsector?: string | null
          website_domain?: string | null
        }
        Update: {
          auto_match_attempted_at?: string | null
          cif?: string | null
          company_name?: string
          company_name_normalized?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contacto_id?: string | null
          country?: string | null
          created_at?: string | null
          ebitda?: number | null
          email_domain?: string | null
          empleados?: number | null
          empresa_id?: string | null
          facturacion?: number | null
          first_seen_at?: string | null
          id?: string
          last_updated_at?: string | null
          location?: string | null
          match_status?: string | null
          raw_data?: Json | null
          sector?: string | null
          source_id?: string | null
          source_table?: string | null
          source_type?: string | null
          subsector?: string | null
          website_domain?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_leads_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "admin_leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          read_at: string | null
          read_by: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          read_by?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          read_by?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      admin_notifications_log: {
        Row: {
          created_at: string
          email_id: string | null
          error_message: string | null
          id: string
          notification_type: string
          recipient_email: string
          sent_at: string
          status: string
        }
        Insert: {
          created_at?: string
          email_id?: string | null
          error_message?: string | null
          id?: string
          notification_type: string
          recipient_email: string
          sent_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          email_id?: string | null
          error_message?: string | null
          id?: string
          notification_type?: string
          recipient_email?: string
          sent_at?: string
          status?: string
        }
        Relationships: []
      }
      admin_notifications_news: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          credentials_sent_at: string | null
          daily_capacity_hours: number | null
          email: string | null
          full_name: string | null
          id: string
          info_access_count: number | null
          is_active: boolean | null
          last_info_access_at: string | null
          last_login: string | null
          needs_credentials: boolean | null
          role: Database["public"]["Enums"]["admin_role"]
          skills: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credentials_sent_at?: string | null
          daily_capacity_hours?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          info_access_count?: number | null
          is_active?: boolean | null
          last_info_access_at?: string | null
          last_login?: string | null
          needs_credentials?: boolean | null
          role?: Database["public"]["Enums"]["admin_role"]
          skills?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credentials_sent_at?: string | null
          daily_capacity_hours?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          info_access_count?: number | null
          is_active?: boolean | null
          last_info_access_at?: string | null
          last_login?: string | null
          needs_credentials?: boolean | null
          role?: Database["public"]["Enums"]["admin_role"]
          skills?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_videos: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_locations: string[] | null
          duration_seconds: number | null
          file_size_bytes: number | null
          file_type: string
          file_url: string
          id: string
          is_active: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_locations?: string[] | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          file_type: string
          file_url: string
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_locations?: string[] | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          file_type?: string
          file_url?: string
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_videos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_videos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
        ]
      }
      advisor_ebitda_multiples_by_range: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          multiple: number
          range_max: number | null
          range_min: number
          sector_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          multiple: number
          range_max?: number | null
          range_min?: number
          sector_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          multiple?: number
          range_max?: number | null
          range_min?: number
          sector_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      advisor_netprofit_multiples_by_range: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          multiple: number
          range_max: number | null
          range_min: number
          sector_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          multiple: number
          range_max?: number | null
          range_min?: number
          sector_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          multiple?: number
          range_max?: number | null
          range_min?: number
          sector_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      advisor_revenue_multiples_by_range: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          multiple: number
          range_max: number | null
          range_min: number
          sector_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          multiple: number
          range_max?: number | null
          range_min?: number
          sector_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          multiple?: number
          range_max?: number | null
          range_min?: number
          sector_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      advisor_valuation_multiples: {
        Row: {
          created_at: string
          description: string | null
          display_locations: string[] | null
          display_order: number | null
          ebitda_multiple_max: number
          ebitda_multiple_median: number
          ebitda_multiple_min: number
          id: string
          is_active: boolean | null
          net_profit_multiple_max: number
          net_profit_multiple_median: number
          net_profit_multiple_min: number
          revenue_multiple_max: number
          revenue_multiple_median: number
          revenue_multiple_min: number
          sector_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_locations?: string[] | null
          display_order?: number | null
          ebitda_multiple_max: number
          ebitda_multiple_median: number
          ebitda_multiple_min: number
          id?: string
          is_active?: boolean | null
          net_profit_multiple_max: number
          net_profit_multiple_median: number
          net_profit_multiple_min: number
          revenue_multiple_max: number
          revenue_multiple_median: number
          revenue_multiple_min: number
          sector_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_locations?: string[] | null
          display_order?: number | null
          ebitda_multiple_max?: number
          ebitda_multiple_median?: number
          ebitda_multiple_min?: number
          id?: string
          is_active?: boolean | null
          net_profit_multiple_max?: number
          net_profit_multiple_median?: number
          net_profit_multiple_min?: number
          revenue_multiple_max?: number
          revenue_multiple_median?: number
          revenue_multiple_min?: number
          sector_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      advisor_valuation_multiples_by_range: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          ebitda_multiple: number
          ebitda_range_max: number | null
          ebitda_range_min: number
          id: string
          is_active: boolean | null
          net_profit_multiple: number
          net_profit_range_max: number | null
          net_profit_range_min: number
          revenue_multiple: number
          revenue_range_max: number | null
          revenue_range_min: number
          sector_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          ebitda_multiple: number
          ebitda_range_max?: number | null
          ebitda_range_min?: number
          id?: string
          is_active?: boolean | null
          net_profit_multiple: number
          net_profit_range_max?: number | null
          net_profit_range_min?: number
          revenue_multiple: number
          revenue_range_max?: number | null
          revenue_range_min?: number
          sector_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          ebitda_multiple?: number
          ebitda_range_max?: number | null
          ebitda_range_min?: number
          id?: string
          is_active?: boolean | null
          net_profit_multiple?: number
          net_profit_range_max?: number | null
          net_profit_range_min?: number
          revenue_multiple?: number
          revenue_range_max?: number | null
          revenue_range_min?: number
          sector_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      advisor_valuations: {
        Row: {
          acquisition_channel_id: string | null
          apollo_candidates: Json | null
          apollo_error: string | null
          apollo_last_enriched_at: string | null
          apollo_org_data: Json | null
          apollo_org_id: string | null
          apollo_people_data: Json | null
          apollo_status: string | null
          cif: string
          company_enriched_at: string | null
          company_enriched_data: Json | null
          company_name: string
          contact_name: string
          created_at: string
          ebitda: number
          ebitda_multiple: number | null
          ebitda_range_max: number | null
          ebitda_range_min: number | null
          ebitda_valuation: number | null
          email: string
          email_domain: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          employee_range: string
          final_valuation: number | null
          firm_type: string
          id: string
          ip_address: string | null
          lead_form: string | null
          pdf_url: string | null
          phone: string | null
          phone_e164: string | null
          revenue: number
          revenue_multiple: number | null
          revenue_range_max: number | null
          revenue_range_min: number | null
          revenue_valuation: number | null
          source: string | null
          updated_at: string
          user_agent: string | null
          whatsapp_opt_in: boolean | null
        }
        Insert: {
          acquisition_channel_id?: string | null
          apollo_candidates?: Json | null
          apollo_error?: string | null
          apollo_last_enriched_at?: string | null
          apollo_org_data?: Json | null
          apollo_org_id?: string | null
          apollo_people_data?: Json | null
          apollo_status?: string | null
          cif: string
          company_enriched_at?: string | null
          company_enriched_data?: Json | null
          company_name: string
          contact_name: string
          created_at?: string
          ebitda: number
          ebitda_multiple?: number | null
          ebitda_range_max?: number | null
          ebitda_range_min?: number | null
          ebitda_valuation?: number | null
          email: string
          email_domain?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          employee_range: string
          final_valuation?: number | null
          firm_type: string
          id?: string
          ip_address?: string | null
          lead_form?: string | null
          pdf_url?: string | null
          phone?: string | null
          phone_e164?: string | null
          revenue: number
          revenue_multiple?: number | null
          revenue_range_max?: number | null
          revenue_range_min?: number | null
          revenue_valuation?: number | null
          source?: string | null
          updated_at?: string
          user_agent?: string | null
          whatsapp_opt_in?: boolean | null
        }
        Update: {
          acquisition_channel_id?: string | null
          apollo_candidates?: Json | null
          apollo_error?: string | null
          apollo_last_enriched_at?: string | null
          apollo_org_data?: Json | null
          apollo_org_id?: string | null
          apollo_people_data?: Json | null
          apollo_status?: string | null
          cif?: string
          company_enriched_at?: string | null
          company_enriched_data?: Json | null
          company_name?: string
          contact_name?: string
          created_at?: string
          ebitda?: number
          ebitda_multiple?: number | null
          ebitda_range_max?: number | null
          ebitda_range_min?: number | null
          ebitda_valuation?: number | null
          email?: string
          email_domain?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          employee_range?: string
          final_valuation?: number | null
          firm_type?: string
          id?: string
          ip_address?: string | null
          lead_form?: string | null
          pdf_url?: string | null
          phone?: string | null
          phone_e164?: string | null
          revenue?: number
          revenue_multiple?: number | null
          revenue_range_max?: number | null
          revenue_range_min?: number | null
          revenue_valuation?: number | null
          source?: string | null
          updated_at?: string
          user_agent?: string | null
          whatsapp_opt_in?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_valuations_acquisition_channel_id_fkey"
            columns: ["acquisition_channel_id"]
            isOneToOne: false
            referencedRelation: "acquisition_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_valuations_lead_form_fkey"
            columns: ["lead_form"]
            isOneToOne: false
            referencedRelation: "lead_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_imports: {
        Row: {
          contacto_id: string | null
          created_at: string
          created_by: string | null
          empresa_id: string | null
          error_message: string | null
          extracted_data: Json
          id: string
          image_url: string
          status: string
          updated_at: string
        }
        Insert: {
          contacto_id?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          error_message?: string | null
          extracted_data?: Json
          id?: string
          image_url: string
          status?: string
          updated_at?: string
        }
        Update: {
          contacto_id?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          error_message?: string | null
          extracted_data?: Json
          id?: string
          image_url?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_imports_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_imports_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_imports_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "ai_imports_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string | null
          description: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      api_usage_log: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          credits_used: number | null
          function_name: string | null
          id: string
          metadata: Json | null
          operation: string
          service: string
          tokens_used: number | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          credits_used?: number | null
          function_name?: string | null
          id?: string
          metadata?: Json | null
          operation: string
          service: string
          tokens_used?: number | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          credits_used?: number | null
          function_name?: string | null
          id?: string
          metadata?: Json | null
          operation?: string
          service?: string
          tokens_used?: number | null
        }
        Relationships: []
      }
      apollo_sector_mapping: {
        Row: {
          apollo_industries: string[] | null
          apollo_keywords: string[]
          created_at: string | null
          id: string
          is_active: boolean | null
          sector_id: string | null
          sector_name: string
          sic_codes: string[] | null
          updated_at: string | null
        }
        Insert: {
          apollo_industries?: string[] | null
          apollo_keywords?: string[]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          sector_id?: string | null
          sector_name: string
          sic_codes?: string[] | null
          updated_at?: string | null
        }
        Update: {
          apollo_industries?: string[] | null
          apollo_keywords?: string[]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          sector_id?: string | null
          sector_name?: string
          sic_codes?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apollo_sector_mapping_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: true
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      apollo_visitor_imports: {
        Row: {
          created_at: string
          created_by: string | null
          error_count: number | null
          error_message: string | null
          id: string
          import_type: string
          imported_count: number | null
          list_id: string
          list_type: string
          results: Json | null
          skipped_count: number | null
          status: string
          total_found: number | null
          updated_at: string
          updated_count: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          import_type?: string
          imported_count?: number | null
          list_id: string
          list_type?: string
          results?: Json | null
          skipped_count?: number | null
          status?: string
          total_found?: number | null
          updated_at?: string
          updated_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          import_type?: string
          imported_count?: number | null
          list_id?: string
          list_type?: string
          results?: Json | null
          skipped_count?: number | null
          status?: string
          total_found?: number | null
          updated_at?: string
          updated_count?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banner_events: {
        Row: {
          banner_id: string
          created_at: string
          event: string
          id: string
          ip_address: unknown
          path: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          banner_id: string
          created_at?: string
          event: string
          id?: string
          ip_address?: unknown
          path: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          banner_id?: string
          created_at?: string
          event?: string
          id?: string
          ip_address?: unknown
          path?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banner_events_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          align: string
          audience: string[]
          color_primary: string
          color_secondary: string | null
          created_at: string | null
          cta_href: string | null
          cta_text: string | null
          dismissible: boolean
          end_at: string | null
          exclusive: boolean | null
          id: string
          max_width: string
          name: string
          pages: string[]
          position: string
          priority: number
          rounded: string
          shadow: boolean
          slug: string
          start_at: string | null
          subtitle: string | null
          text_on_primary: string | null
          title: string
          updated_at: string | null
          variant: string
          version: number
          visible: boolean
        }
        Insert: {
          align?: string
          audience?: string[]
          color_primary?: string
          color_secondary?: string | null
          created_at?: string | null
          cta_href?: string | null
          cta_text?: string | null
          dismissible?: boolean
          end_at?: string | null
          exclusive?: boolean | null
          id?: string
          max_width?: string
          name: string
          pages?: string[]
          position?: string
          priority?: number
          rounded?: string
          shadow?: boolean
          slug: string
          start_at?: string | null
          subtitle?: string | null
          text_on_primary?: string | null
          title: string
          updated_at?: string | null
          variant?: string
          version?: number
          visible?: boolean
        }
        Update: {
          align?: string
          audience?: string[]
          color_primary?: string
          color_secondary?: string | null
          created_at?: string | null
          cta_href?: string | null
          cta_text?: string | null
          dismissible?: boolean
          end_at?: string | null
          exclusive?: boolean | null
          id?: string
          max_width?: string
          name?: string
          pages?: string[]
          position?: string
          priority?: number
          rounded?: string
          shadow?: boolean
          slug?: string
          start_at?: string | null
          subtitle?: string | null
          text_on_primary?: string | null
          title?: string
          updated_at?: string | null
          variant?: string
          version?: number
          visible?: boolean
        }
        Relationships: []
      }
      billing_rates: {
        Row: {
          created_at: string | null
          currency: string
          description: string | null
          effective_from: string
          effective_to: string | null
          hourly_rate: number
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          hourly_rate?: number
          id?: string
          is_active?: boolean | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          hourly_rate?: number
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_analytics: {
        Row: {
          id: string
          ip_address: unknown
          post_id: string
          post_slug: string
          reading_time: number | null
          referrer: string | null
          scroll_percentage: number | null
          session_id: string | null
          user_agent: string | null
          viewed_at: string
          visitor_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: unknown
          post_id: string
          post_slug: string
          reading_time?: number | null
          referrer?: string | null
          scroll_percentage?: number | null
          session_id?: string | null
          user_agent?: string | null
          viewed_at?: string
          visitor_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: unknown
          post_id?: string
          post_slug?: string
          reading_time?: number | null
          referrer?: string | null
          scroll_percentage?: number | null
          session_id?: string | null
          user_agent?: string | null
          viewed_at?: string
          visitor_id?: string | null
        }
        Relationships: []
      }
      blog_post_metrics: {
        Row: {
          avg_reading_time: number | null
          avg_scroll_percentage: number | null
          created_at: string
          id: string
          last_viewed: string | null
          post_id: string
          post_slug: string
          total_views: number | null
          unique_views: number | null
          updated_at: string
        }
        Insert: {
          avg_reading_time?: number | null
          avg_scroll_percentage?: number | null
          created_at?: string
          id?: string
          last_viewed?: string | null
          post_id: string
          post_slug: string
          total_views?: number | null
          unique_views?: number | null
          updated_at?: string
        }
        Update: {
          avg_reading_time?: number | null
          avg_scroll_percentage?: number | null
          created_at?: string
          id?: string
          last_viewed?: string | null
          post_id?: string
          post_slug?: string
          total_views?: number | null
          unique_views?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_metrics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_avatar_url: string | null
          author_name: string
          category: string
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time: number
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_name?: string
          category: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time?: number
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_avatar_url?: string | null
          author_name?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time?: number
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_assignment_history: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          booking_id: string
          created_at: string | null
          id: string
          notes: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          booking_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          booking_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_assignment_history_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "booking_assignment_history_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "booking_assignment_history_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "booking_assignment_history_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "booking_assignment_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "calendar_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_config: {
        Row: {
          config_type: string
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          updated_at: string | null
          value: string
        }
        Insert: {
          config_type: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          value: string
        }
        Update: {
          config_type?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      brand_kits: {
        Row: {
          accent_color: string | null
          background_dark: string | null
          background_light: string | null
          created_at: string | null
          created_by: string | null
          disclaimer_text: string | null
          font_body: string | null
          font_heading: string | null
          footer_text: string | null
          id: string
          is_default: boolean | null
          logo_dark_url: string | null
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
          watermark_text: string | null
        }
        Insert: {
          accent_color?: string | null
          background_dark?: string | null
          background_light?: string | null
          created_at?: string | null
          created_by?: string | null
          disclaimer_text?: string | null
          font_body?: string | null
          font_heading?: string | null
          footer_text?: string | null
          id?: string
          is_default?: boolean | null
          logo_dark_url?: string | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          watermark_text?: string | null
        }
        Update: {
          accent_color?: string | null
          background_dark?: string | null
          background_light?: string | null
          created_at?: string | null
          created_by?: string | null
          disclaimer_text?: string | null
          font_body?: string | null
          font_heading?: string | null
          footer_text?: string | null
          id?: string
          is_default?: boolean | null
          logo_dark_url?: string | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          watermark_text?: string | null
        }
        Relationships: []
      }
      brevo_contacts: {
        Row: {
          attributes: Json | null
          brevo_created_at: string | null
          brevo_id: number | null
          brevo_modified_at: string | null
          company: string | null
          crm_entity_id: string | null
          crm_entity_type: string | null
          email: string
          email_blacklisted: boolean | null
          first_name: string | null
          id: string
          import_batch_id: string | null
          imported_at: string
          is_synced_to_crm: boolean | null
          last_name: string | null
          list_ids: number[] | null
          list_names: string[] | null
          notes: string | null
          sms: string | null
          sms_blacklisted: boolean | null
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          brevo_created_at?: string | null
          brevo_id?: number | null
          brevo_modified_at?: string | null
          company?: string | null
          crm_entity_id?: string | null
          crm_entity_type?: string | null
          email: string
          email_blacklisted?: boolean | null
          first_name?: string | null
          id?: string
          import_batch_id?: string | null
          imported_at?: string
          is_synced_to_crm?: boolean | null
          last_name?: string | null
          list_ids?: number[] | null
          list_names?: string[] | null
          notes?: string | null
          sms?: string | null
          sms_blacklisted?: boolean | null
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          brevo_created_at?: string | null
          brevo_id?: number | null
          brevo_modified_at?: string | null
          company?: string | null
          crm_entity_id?: string | null
          crm_entity_type?: string | null
          email?: string
          email_blacklisted?: boolean | null
          first_name?: string | null
          id?: string
          import_batch_id?: string | null
          imported_at?: string
          is_synced_to_crm?: boolean | null
          last_name?: string | null
          list_ids?: number[] | null
          list_names?: string[] | null
          notes?: string | null
          sms?: string | null
          sms_blacklisted?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      brevo_sync_log: {
        Row: {
          attributes_sent: Json | null
          brevo_id: string | null
          created_at: string | null
          duration_ms: number | null
          entity_id: string
          entity_type: string
          id: string
          last_sync_at: string | null
          response_data: Json | null
          sync_attempts: number | null
          sync_error: string | null
          sync_status: string
          sync_type: string | null
          updated_at: string | null
        }
        Insert: {
          attributes_sent?: Json | null
          brevo_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          entity_id: string
          entity_type: string
          id?: string
          last_sync_at?: string | null
          response_data?: Json | null
          sync_attempts?: number | null
          sync_error?: string | null
          sync_status?: string
          sync_type?: string | null
          updated_at?: string | null
        }
        Update: {
          attributes_sent?: Json | null
          brevo_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          last_sync_at?: string | null
          response_data?: Json | null
          sync_attempts?: number | null
          sync_error?: string | null
          sync_status?: string
          sync_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      brevo_sync_queue: {
        Row: {
          action: string
          attempts: number | null
          created_at: string | null
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          max_attempts: number | null
          next_retry_at: string | null
          payload: Json | null
          priority: number | null
          processed_at: string | null
          status: string | null
        }
        Insert: {
          action: string
          attempts?: number | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          next_retry_at?: string | null
          payload?: Json | null
          priority?: number | null
          processed_at?: string | null
          status?: string | null
        }
        Update: {
          action?: string
          attempts?: number | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          next_retry_at?: string | null
          payload?: Json | null
          priority?: number | null
          processed_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      bulk_inquiries: {
        Row: {
          company_name: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          ip_address: unknown
          message: string | null
          operation_ids: string[]
          operation_names: string[] | null
          phone: string | null
          processed_at: string | null
          processed_by: string | null
          referrer: string | null
          status: string | null
          updated_at: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          ip_address?: unknown
          message?: string | null
          operation_ids: string[]
          operation_names?: string[] | null
          phone?: string | null
          processed_at?: string | null
          processed_by?: string | null
          referrer?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          ip_address?: unknown
          message?: string | null
          operation_ids?: string[]
          operation_names?: string[] | null
          phone?: string | null
          processed_at?: string | null
          processed_by?: string | null
          referrer?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      business_metrics: {
        Row: {
          avg_deal_size: number
          conversion_rate: number
          created_at: string
          deal_count: number
          id: string
          period_end: string
          period_start: string
          revenue_amount: number
          updated_at: string
        }
        Insert: {
          avg_deal_size?: number
          conversion_rate?: number
          created_at?: string
          deal_count?: number
          id?: string
          period_end: string
          period_start: string
          revenue_amount?: number
          updated_at?: string
        }
        Update: {
          avg_deal_size?: number
          conversion_rate?: number
          created_at?: string
          deal_count?: number
          id?: string
          period_end?: string
          period_start?: string
          revenue_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      buy_side_mandates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ebitda_max: number | null
          ebitda_min: number | null
          geographic_scope: string
          id: string
          is_active: boolean | null
          is_new: boolean | null
          requirements: string[] | null
          revenue_max: number | null
          revenue_min: number | null
          sector: string
          subsector: string | null
          teaser_en_filename: string | null
          teaser_en_uploaded_at: string | null
          teaser_en_url: string | null
          teaser_es_filename: string | null
          teaser_es_uploaded_at: string | null
          teaser_es_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ebitda_max?: number | null
          ebitda_min?: number | null
          geographic_scope: string
          id?: string
          is_active?: boolean | null
          is_new?: boolean | null
          requirements?: string[] | null
          revenue_max?: number | null
          revenue_min?: number | null
          sector: string
          subsector?: string | null
          teaser_en_filename?: string | null
          teaser_en_uploaded_at?: string | null
          teaser_en_url?: string | null
          teaser_es_filename?: string | null
          teaser_es_uploaded_at?: string | null
          teaser_es_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ebitda_max?: number | null
          ebitda_min?: number | null
          geographic_scope?: string
          id?: string
          is_active?: boolean | null
          is_new?: boolean | null
          requirements?: string[] | null
          revenue_max?: number | null
          revenue_min?: number | null
          sector?: string
          subsector?: string | null
          teaser_en_filename?: string | null
          teaser_en_uploaded_at?: string | null
          teaser_en_url?: string | null
          teaser_es_filename?: string | null
          teaser_es_uploaded_at?: string | null
          teaser_es_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      buyer_contact_imports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duplicate_emails: number | null
          error_log: Json | null
          failed_imports: number | null
          filename: string
          id: string
          imported_by: string | null
          status: string | null
          successful_imports: number | null
          total_rows: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duplicate_emails?: number | null
          error_log?: Json | null
          failed_imports?: number | null
          filename: string
          id?: string
          imported_by?: string | null
          status?: string | null
          successful_imports?: number | null
          total_rows?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duplicate_emails?: number | null
          error_log?: Json | null
          failed_imports?: number | null
          filename?: string
          id?: string
          imported_by?: string | null
          status?: string | null
          successful_imports?: number | null
          total_rows?: number | null
        }
        Relationships: []
      }
      buyer_contacts: {
        Row: {
          campaign_name: string | null
          campaign_type: string | null
          company: string | null
          created_at: string | null
          email: string
          first_name: string
          first_seen_at: string | null
          full_name: string | null
          id: string
          import_batch_id: string | null
          import_filename: string | null
          imported_at: string | null
          imported_by: string | null
          internal_notes: string | null
          investment_range: string | null
          investor_type: string | null
          last_activity_at: string | null
          last_name: string | null
          origin: string
          phone: string | null
          position: string | null
          preferred_language: string | null
          preferred_location: string | null
          rod_downloads_count: number | null
          sectors_of_interest: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_name?: string | null
          campaign_type?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          first_name: string
          first_seen_at?: string | null
          full_name?: string | null
          id?: string
          import_batch_id?: string | null
          import_filename?: string | null
          imported_at?: string | null
          imported_by?: string | null
          internal_notes?: string | null
          investment_range?: string | null
          investor_type?: string | null
          last_activity_at?: string | null
          last_name?: string | null
          origin?: string
          phone?: string | null
          position?: string | null
          preferred_language?: string | null
          preferred_location?: string | null
          rod_downloads_count?: number | null
          sectors_of_interest?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_name?: string | null
          campaign_type?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          first_seen_at?: string | null
          full_name?: string | null
          id?: string
          import_batch_id?: string | null
          import_filename?: string | null
          imported_at?: string | null
          imported_by?: string | null
          internal_notes?: string | null
          investment_range?: string | null
          investor_type?: string | null
          last_activity_at?: string | null
          last_name?: string | null
          origin?: string
          phone?: string | null
          position?: string | null
          preferred_language?: string | null
          preferred_location?: string | null
          rod_downloads_count?: number | null
          sectors_of_interest?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      buyer_preferences: {
        Row: {
          alert_frequency: string | null
          company_size_preferences: string[] | null
          created_at: string | null
          deal_type_preferences: string[] | null
          email: string
          id: string
          is_active: boolean | null
          max_valuation: number | null
          min_valuation: number | null
          preferred_locations: string[] | null
          preferred_sectors: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_frequency?: string | null
          company_size_preferences?: string[] | null
          created_at?: string | null
          deal_type_preferences?: string[] | null
          email: string
          id?: string
          is_active?: boolean | null
          max_valuation?: number | null
          min_valuation?: number | null
          preferred_locations?: string[] | null
          preferred_sectors?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_frequency?: string | null
          company_size_preferences?: string[] | null
          created_at?: string | null
          deal_type_preferences?: string[] | null
          email?: string
          id?: string
          is_active?: boolean | null
          max_valuation?: number | null
          min_valuation?: number | null
          preferred_locations?: string[] | null
          preferred_sectors?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      buyer_testimonials: {
        Row: {
          avatar_initials: string
          buyer_company: string
          buyer_name: string
          buyer_position: string
          buyer_sector: string
          created_at: string | null
          display_order: number | null
          id: string
          investment_range: string | null
          is_active: boolean | null
          operation_type: string | null
          rating: number
          satisfaction_score: string | null
          testimonial_text: string
          time_to_close: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_initials: string
          buyer_company: string
          buyer_name: string
          buyer_position: string
          buyer_sector: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          investment_range?: string | null
          is_active?: boolean | null
          operation_type?: string | null
          rating: number
          satisfaction_score?: string | null
          testimonial_text: string
          time_to_close?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_initials?: string
          buyer_company?: string
          buyer_name?: string
          buyer_position?: string
          buyer_sector?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          investment_range?: string | null
          is_active?: boolean | null
          operation_type?: string | null
          rating?: number
          satisfaction_score?: string | null
          testimonial_text?: string
          time_to_close?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      calculator_error_alerts: {
        Row: {
          alert_sent_at: string
          created_at: string
          error_count: number
          error_types: Json | null
          id: string
          recipients: string[]
          sample_errors: Json | null
          time_window_end: string
          time_window_start: string
        }
        Insert: {
          alert_sent_at?: string
          created_at?: string
          error_count: number
          error_types?: Json | null
          id?: string
          recipients?: string[]
          sample_errors?: Json | null
          time_window_end: string
          time_window_start: string
        }
        Update: {
          alert_sent_at?: string
          created_at?: string
          error_count?: number
          error_types?: Json | null
          id?: string
          recipients?: string[]
          sample_errors?: Json | null
          time_window_end?: string
          time_window_start?: string
        }
        Relationships: []
      }
      calculator_errors: {
        Row: {
          action: string
          company_data: Json | null
          component: string
          created_at: string
          current_step: number | null
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          ip_address: unknown
          source_project: string | null
          unique_token: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          company_data?: Json | null
          component: string
          created_at?: string
          current_step?: number | null
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          ip_address?: unknown
          source_project?: string | null
          unique_token?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          company_data?: Json | null
          component?: string
          created_at?: string
          current_step?: number | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          ip_address?: unknown
          source_project?: string | null
          unique_token?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      calendar_bookings: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          booking_date: string
          booking_datetime: string
          booking_time: string
          cancellation_reason: string | null
          cancelled_at: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          company_name: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          lead_id: string | null
          lead_type: string | null
          meeting_format: string
          meeting_type: string
          notes: string | null
          status: string
          updated_at: string
          valuation_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          booking_date: string
          booking_datetime: string
          booking_time: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          company_name?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          lead_type?: string | null
          meeting_format?: string
          meeting_type?: string
          notes?: string | null
          status?: string
          updated_at?: string
          valuation_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          booking_date?: string
          booking_datetime?: string
          booking_time?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          company_name?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          lead_type?: string | null
          meeting_format?: string
          meeting_type?: string
          notes?: string | null
          status?: string
          updated_at?: string
          valuation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_bookings_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_bookings_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_bookings_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_bookings_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_bookings_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "company_valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_bookings_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_cost_history: {
        Row: {
          amount: number | null
          campaign_cost_id: string
          campaign_name: string | null
          change_type: string | null
          changed_by: string | null
          channel: string | null
          cost_per_result: number | null
          daily_budget: number | null
          delivery_status: string | null
          id: string
          internal_status: string | null
          monthly_budget: number | null
          notes: string | null
          recorded_at: string
          results: number | null
          target_cpl: number | null
        }
        Insert: {
          amount?: number | null
          campaign_cost_id: string
          campaign_name?: string | null
          change_type?: string | null
          changed_by?: string | null
          channel?: string | null
          cost_per_result?: number | null
          daily_budget?: number | null
          delivery_status?: string | null
          id?: string
          internal_status?: string | null
          monthly_budget?: number | null
          notes?: string | null
          recorded_at?: string
          results?: number | null
          target_cpl?: number | null
        }
        Update: {
          amount?: number | null
          campaign_cost_id?: string
          campaign_name?: string | null
          change_type?: string | null
          changed_by?: string | null
          channel?: string | null
          cost_per_result?: number | null
          daily_budget?: number | null
          delivery_status?: string | null
          id?: string
          internal_status?: string | null
          monthly_budget?: number | null
          notes?: string | null
          recorded_at?: string
          results?: number | null
          target_cpl?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_cost_history_campaign_cost_id_fkey"
            columns: ["campaign_cost_id"]
            isOneToOne: false
            referencedRelation: "campaign_costs"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_cost_snapshots: {
        Row: {
          amount_spent: number | null
          campaign_id: string
          created_at: string | null
          created_by: string | null
          daily_budget: number | null
          id: string
          internal_status: string | null
          monthly_budget: number | null
          notes: string | null
          results: number | null
          snapshot_date: string
          target_cpl: number | null
          updated_at: string | null
        }
        Insert: {
          amount_spent?: number | null
          campaign_id: string
          created_at?: string | null
          created_by?: string | null
          daily_budget?: number | null
          id?: string
          internal_status?: string | null
          monthly_budget?: number | null
          notes?: string | null
          results?: number | null
          snapshot_date?: string
          target_cpl?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_spent?: number | null
          campaign_id?: string
          created_at?: string | null
          created_by?: string | null
          daily_budget?: number | null
          id?: string
          internal_status?: string | null
          monthly_budget?: number | null
          notes?: string | null
          results?: number | null
          snapshot_date?: string
          target_cpl?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_cost_snapshots_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_costs: {
        Row: {
          amount: number
          campaign_name: string | null
          channel: string
          clicks: number | null
          cpc: number | null
          created_at: string
          created_by: string | null
          ctr: number | null
          daily_budget: number | null
          delivery_status: string | null
          id: string
          impressions: number | null
          internal_status: string | null
          monthly_budget: number | null
          notes: string | null
          period_end: string
          period_start: string
          results: number | null
          target_cpl: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          campaign_name?: string | null
          channel: string
          clicks?: number | null
          cpc?: number | null
          created_at?: string
          created_by?: string | null
          ctr?: number | null
          daily_budget?: number | null
          delivery_status?: string | null
          id?: string
          impressions?: number | null
          internal_status?: string | null
          monthly_budget?: number | null
          notes?: string | null
          period_end: string
          period_start: string
          results?: number | null
          target_cpl?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          campaign_name?: string | null
          channel?: string
          clicks?: number | null
          cpc?: number | null
          created_at?: string
          created_by?: string | null
          ctr?: number | null
          daily_budget?: number | null
          delivery_status?: string | null
          id?: string
          impressions?: number | null
          internal_status?: string | null
          monthly_budget?: number | null
          notes?: string | null
          period_end?: string
          period_start?: string
          results?: number | null
          target_cpl?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          archived: boolean | null
          channel: string
          created_at: string | null
          created_by: string | null
          delivery_status: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          channel?: string
          created_at?: string | null
          created_by?: string | null
          delivery_status?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          channel?: string
          created_at?: string | null
          created_by?: string | null
          delivery_status?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      capittal_contact_sync_log: {
        Row: {
          completed_at: string | null
          contacts_archived: number | null
          contacts_created: number | null
          contacts_processed: number | null
          contacts_skipped: number | null
          contacts_updated: number | null
          created_at: string | null
          error_message: string | null
          errors: Json | null
          id: string
          last_capittal_timestamp: string | null
          started_at: string | null
          status: string | null
          triggered_by: string
        }
        Insert: {
          completed_at?: string | null
          contacts_archived?: number | null
          contacts_created?: number | null
          contacts_processed?: number | null
          contacts_skipped?: number | null
          contacts_updated?: number | null
          created_at?: string | null
          error_message?: string | null
          errors?: Json | null
          id?: string
          last_capittal_timestamp?: string | null
          started_at?: string | null
          status?: string | null
          triggered_by: string
        }
        Update: {
          completed_at?: string | null
          contacts_archived?: number | null
          contacts_created?: number | null
          contacts_processed?: number | null
          contacts_skipped?: number | null
          contacts_updated?: number | null
          created_at?: string | null
          error_message?: string | null
          errors?: Json | null
          id?: string
          last_capittal_timestamp?: string | null
          started_at?: string | null
          status?: string | null
          triggered_by?: string
        }
        Relationships: []
      }
      capittal_sync_state: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          last_modified_timestamp: string | null
          last_sync_at: string | null
          polling_interval_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_modified_timestamp?: string | null
          last_sync_at?: string | null
          polling_interval_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_modified_timestamp?: string | null
          last_sync_at?: string | null
          polling_interval_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      carousel_logos: {
        Row: {
          company_name: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      carousel_testimonials: {
        Row: {
          client_company: string
          client_name: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          quote: string
          updated_at: string
        }
        Insert: {
          client_company: string
          client_name: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          quote: string
          updated_at?: string
        }
        Update: {
          client_company?: string
          client_name?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          quote?: string
          updated_at?: string
        }
        Relationships: []
      }
      case_studies: {
        Row: {
          company_size: string | null
          created_at: string
          description: string
          display_locations: string[] | null
          featured_image_url: string | null
          highlights: string[] | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_value_confidential: boolean | null
          logo_url: string | null
          sector: string
          title: string
          updated_at: string
          value_amount: number | null
          value_currency: string | null
          year: number | null
        }
        Insert: {
          company_size?: string | null
          created_at?: string
          description: string
          display_locations?: string[] | null
          featured_image_url?: string | null
          highlights?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_value_confidential?: boolean | null
          logo_url?: string | null
          sector: string
          title: string
          updated_at?: string
          value_amount?: number | null
          value_currency?: string | null
          year?: number | null
        }
        Update: {
          company_size?: string | null
          created_at?: string
          description?: string
          display_locations?: string[] | null
          featured_image_url?: string | null
          highlights?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_value_confidential?: boolean | null
          logo_url?: string | null
          sector?: string
          title?: string
          updated_at?: string
          value_amount?: number | null
          value_currency?: string | null
          year?: number | null
        }
        Relationships: []
      }
      checklist_fases: {
        Row: {
          activo: boolean | null
          color: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          orden: number
          tipo_operacion: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          orden: number
          tipo_operacion: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          orden?: number
          tipo_operacion?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      collaborator_applications: {
        Row: {
          acquisition_channel_id: string | null
          apollo_candidates: Json | null
          apollo_error: string | null
          apollo_last_enriched_at: string | null
          apollo_org_data: Json | null
          apollo_org_id: string | null
          apollo_people_data: Json | null
          apollo_status: string | null
          assigned_at: string | null
          assigned_to: string | null
          brevo_deleted_at: string | null
          brevo_lists: number[] | null
          brevo_unsubscribed_lists: number[] | null
          company: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          email: string
          email_bounce_type: string | null
          email_bounced: boolean | null
          email_clicked: boolean | null
          email_delivered: boolean | null
          email_delivered_at: string | null
          email_domain: string | null
          email_message_id: string | null
          email_opened: boolean | null
          email_opened_at: string | null
          email_opens_count: number | null
          email_sent: boolean | null
          email_sent_at: string | null
          email_unsubscribed: boolean | null
          email_unsubscribed_at: string | null
          email_valid: boolean | null
          experience: string | null
          full_name: string
          id: string
          ip_address: unknown
          is_deleted: boolean | null
          last_campaign_id: number | null
          last_campaign_name: string | null
          last_email_click_at: string | null
          lead_form: string | null
          lead_status_crm: Database["public"]["Enums"]["lead_status"] | null
          motivation: string | null
          notes: string | null
          phone: string
          profession: string
          status: string
          status_updated_at: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          acquisition_channel_id?: string | null
          apollo_candidates?: Json | null
          apollo_error?: string | null
          apollo_last_enriched_at?: string | null
          apollo_org_data?: Json | null
          apollo_org_id?: string | null
          apollo_people_data?: Json | null
          apollo_status?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          brevo_deleted_at?: string | null
          brevo_lists?: number[] | null
          brevo_unsubscribed_lists?: number[] | null
          company?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          email: string
          email_bounce_type?: string | null
          email_bounced?: boolean | null
          email_clicked?: boolean | null
          email_delivered?: boolean | null
          email_delivered_at?: string | null
          email_domain?: string | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_opens_count?: number | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          email_unsubscribed?: boolean | null
          email_unsubscribed_at?: string | null
          email_valid?: boolean | null
          experience?: string | null
          full_name: string
          id?: string
          ip_address?: unknown
          is_deleted?: boolean | null
          last_campaign_id?: number | null
          last_campaign_name?: string | null
          last_email_click_at?: string | null
          lead_form?: string | null
          lead_status_crm?: Database["public"]["Enums"]["lead_status"] | null
          motivation?: string | null
          notes?: string | null
          phone: string
          profession: string
          status?: string
          status_updated_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          acquisition_channel_id?: string | null
          apollo_candidates?: Json | null
          apollo_error?: string | null
          apollo_last_enriched_at?: string | null
          apollo_org_data?: Json | null
          apollo_org_id?: string | null
          apollo_people_data?: Json | null
          apollo_status?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          brevo_deleted_at?: string | null
          brevo_lists?: number[] | null
          brevo_unsubscribed_lists?: number[] | null
          company?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          email?: string
          email_bounce_type?: string | null
          email_bounced?: boolean | null
          email_clicked?: boolean | null
          email_delivered?: boolean | null
          email_delivered_at?: string | null
          email_domain?: string | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_opens_count?: number | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          email_unsubscribed?: boolean | null
          email_unsubscribed_at?: string | null
          email_valid?: boolean | null
          experience?: string | null
          full_name?: string
          id?: string
          ip_address?: unknown
          is_deleted?: boolean | null
          last_campaign_id?: number | null
          last_campaign_name?: string | null
          last_email_click_at?: string | null
          lead_form?: string | null
          lead_status_crm?: Database["public"]["Enums"]["lead_status"] | null
          motivation?: string | null
          notes?: string | null
          phone?: string
          profession?: string
          status?: string
          status_updated_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_applications_acquisition_channel_id_fkey"
            columns: ["acquisition_channel_id"]
            isOneToOne: false
            referencedRelation: "acquisition_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborator_applications_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "collaborator_applications_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "collaborator_applications_lead_form_fkey"
            columns: ["lead_form"]
            isOneToOne: false
            referencedRelation: "lead_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      company_acquisition_inquiries: {
        Row: {
          acquisition_channel_id: string | null
          acquisition_type: string | null
          apollo_candidates: Json | null
          apollo_error: string | null
          apollo_last_enriched_at: string | null
          apollo_org_data: Json | null
          apollo_org_id: string | null
          apollo_people_data: Json | null
          apollo_status: string | null
          brevo_deleted_at: string | null
          brevo_lists: number[] | null
          brevo_unsubscribed_lists: number[] | null
          company: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          email: string
          email_bounce_type: string | null
          email_bounced: boolean | null
          email_clicked: boolean | null
          email_delivered: boolean | null
          email_delivered_at: string | null
          email_domain: string | null
          email_message_id: string | null
          email_opened: boolean | null
          email_opened_at: string | null
          email_opens_count: number | null
          email_sent: boolean | null
          email_sent_at: string | null
          email_unsubscribed: boolean | null
          email_unsubscribed_at: string | null
          email_valid: boolean | null
          full_name: string
          id: string
          investment_budget: string | null
          ip_address: unknown
          is_deleted: boolean | null
          last_campaign_id: number | null
          last_campaign_name: string | null
          last_email_click_at: string | null
          lead_form: string | null
          message: string | null
          notes: string | null
          page_origin: string
          phone: string | null
          preferred_location: string | null
          priority: string
          processed_at: string | null
          processed_by: string | null
          referrer: string | null
          sectors_of_interest: string | null
          status: string
          target_timeline: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          acquisition_channel_id?: string | null
          acquisition_type?: string | null
          apollo_candidates?: Json | null
          apollo_error?: string | null
          apollo_last_enriched_at?: string | null
          apollo_org_data?: Json | null
          apollo_org_id?: string | null
          apollo_people_data?: Json | null
          apollo_status?: string | null
          brevo_deleted_at?: string | null
          brevo_lists?: number[] | null
          brevo_unsubscribed_lists?: number[] | null
          company: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          email: string
          email_bounce_type?: string | null
          email_bounced?: boolean | null
          email_clicked?: boolean | null
          email_delivered?: boolean | null
          email_delivered_at?: string | null
          email_domain?: string | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_opens_count?: number | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          email_unsubscribed?: boolean | null
          email_unsubscribed_at?: string | null
          email_valid?: boolean | null
          full_name: string
          id?: string
          investment_budget?: string | null
          ip_address?: unknown
          is_deleted?: boolean | null
          last_campaign_id?: number | null
          last_campaign_name?: string | null
          last_email_click_at?: string | null
          lead_form?: string | null
          message?: string | null
          notes?: string | null
          page_origin?: string
          phone?: string | null
          preferred_location?: string | null
          priority?: string
          processed_at?: string | null
          processed_by?: string | null
          referrer?: string | null
          sectors_of_interest?: string | null
          status?: string
          target_timeline?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          acquisition_channel_id?: string | null
          acquisition_type?: string | null
          apollo_candidates?: Json | null
          apollo_error?: string | null
          apollo_last_enriched_at?: string | null
          apollo_org_data?: Json | null
          apollo_org_id?: string | null
          apollo_people_data?: Json | null
          apollo_status?: string | null
          brevo_deleted_at?: string | null
          brevo_lists?: number[] | null
          brevo_unsubscribed_lists?: number[] | null
          company?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          email?: string
          email_bounce_type?: string | null
          email_bounced?: boolean | null
          email_clicked?: boolean | null
          email_delivered?: boolean | null
          email_delivered_at?: string | null
          email_domain?: string | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_opens_count?: number | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          email_unsubscribed?: boolean | null
          email_unsubscribed_at?: string | null
          email_valid?: boolean | null
          full_name?: string
          id?: string
          investment_budget?: string | null
          ip_address?: unknown
          is_deleted?: boolean | null
          last_campaign_id?: number | null
          last_campaign_name?: string | null
          last_email_click_at?: string | null
          lead_form?: string | null
          message?: string | null
          notes?: string | null
          page_origin?: string
          phone?: string | null
          preferred_location?: string | null
          priority?: string
          processed_at?: string | null
          processed_by?: string | null
          referrer?: string | null
          sectors_of_interest?: string | null
          status?: string
          target_timeline?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_acquisition_inquiries_acquisition_channel_id_fkey"
            columns: ["acquisition_channel_id"]
            isOneToOne: false
            referencedRelation: "acquisition_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_acquisition_inquiries_lead_form_fkey"
            columns: ["lead_form"]
            isOneToOne: false
            referencedRelation: "lead_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acquisition_inquiries_processed_by"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_acquisition_inquiries_processed_by"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
        ]
      }
      company_operations: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          company_name: string
          company_size_employees: string | null
          created_at: string
          deal_type: string | null
          deleted_at: string | null
          description: string
          description_ca: string | null
          description_en: string | null
          display_locations: string[] | null
          ebitda_amount: number | null
          ebitda_multiple: number | null
          expected_market_text: string | null
          featured_image_url: string | null
          geographic_location: string | null
          growth_percentage: number | null
          highlights: string[] | null
          highlights_ca: string[] | null
          highlights_en: string[] | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          is_featured: boolean | null
          is_new_override: string | null
          logo_url: string | null
          project_status: string | null
          revenue_amount: number | null
          sector: string
          sector_pe: string | null
          short_description: string | null
          short_description_ca: string | null
          short_description_en: string | null
          source_lead_id: string | null
          source_lead_type: string | null
          status: string | null
          subsector: string | null
          updated_at: string
          valuation_amount: number
          valuation_currency: string | null
          year: number
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          company_name: string
          company_size_employees?: string | null
          created_at?: string
          deal_type?: string | null
          deleted_at?: string | null
          description: string
          description_ca?: string | null
          description_en?: string | null
          display_locations?: string[] | null
          ebitda_amount?: number | null
          ebitda_multiple?: number | null
          expected_market_text?: string | null
          featured_image_url?: string | null
          geographic_location?: string | null
          growth_percentage?: number | null
          highlights?: string[] | null
          highlights_ca?: string[] | null
          highlights_en?: string[] | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_featured?: boolean | null
          is_new_override?: string | null
          logo_url?: string | null
          project_status?: string | null
          revenue_amount?: number | null
          sector: string
          sector_pe?: string | null
          short_description?: string | null
          short_description_ca?: string | null
          short_description_en?: string | null
          source_lead_id?: string | null
          source_lead_type?: string | null
          status?: string | null
          subsector?: string | null
          updated_at?: string
          valuation_amount: number
          valuation_currency?: string | null
          year: number
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          company_name?: string
          company_size_employees?: string | null
          created_at?: string
          deal_type?: string | null
          deleted_at?: string | null
          description?: string
          description_ca?: string | null
          description_en?: string | null
          display_locations?: string[] | null
          ebitda_amount?: number | null
          ebitda_multiple?: number | null
          expected_market_text?: string | null
          featured_image_url?: string | null
          geographic_location?: string | null
          growth_percentage?: number | null
          highlights?: string[] | null
          highlights_ca?: string[] | null
          highlights_en?: string[] | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_featured?: boolean | null
          is_new_override?: string | null
          logo_url?: string | null
          project_status?: string | null
          revenue_amount?: number | null
          sector?: string
          sector_pe?: string | null
          short_description?: string | null
          short_description_ca?: string | null
          short_description_en?: string | null
          source_lead_id?: string | null
          source_lead_type?: string | null
          status?: string | null
          subsector?: string | null
          updated_at?: string
          valuation_amount?: number
          valuation_currency?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_operations_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "company_operations_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "company_operations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "company_operations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "company_operations_sector_pe_fkey"
            columns: ["sector_pe"]
            isOneToOne: false
            referencedRelation: "pe_sector_taxonomy"
            referencedColumns: ["id"]
          },
        ]
      }
      company_valuations: {
        Row: {
          acquisition_channel_id: string | null
          activity_description: string | null
          adjustment_amount: number | null
          ai_company_summary: string | null
          ai_company_summary_at: string | null
          apollo_candidates: Json | null
          apollo_error: string | null
          apollo_last_enriched_at: string | null
          apollo_org_data: Json | null
          apollo_org_id: string | null
          apollo_people_data: Json | null
          apollo_status: string | null
          assigned_at: string | null
          assigned_to: string | null
          brevo_deleted_at: string | null
          brevo_lists: number[] | null
          brevo_unsubscribed_lists: number[] | null
          call_attempts_count: number | null
          cif: string | null
          company_name: string
          competitive_advantage: string | null
          completion_percentage: number | null
          contact_lastname: string | null
          contact_name: string
          created_at: string
          crm_contacto_id: string | null
          crm_synced_at: string | null
          current_step: number | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          ebitda: number | null
          ebitda_multiple_used: number | null
          email: string
          email_block_reason: string | null
          email_blocked: boolean | null
          email_bounce_reason: string | null
          email_bounce_type: string | null
          email_bounced: boolean | null
          email_clicked: boolean | null
          email_delivered: boolean | null
          email_delivered_at: string | null
          email_domain: string | null
          email_message_id: string | null
          email_opened: boolean | null
          email_opened_at: string | null
          email_opens_count: number | null
          email_outbox_id: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          email_soft_bounced: boolean | null
          email_spam_reported: boolean | null
          email_spam_reported_at: string | null
          email_unsubscribed: boolean | null
          email_unsubscribed_at: string | null
          email_valid: boolean | null
          employee_range: string
          empresa_id: string | null
          fbclid: string | null
          final_valuation: number | null
          followup_count: number | null
          form_submitted_at: string | null
          gclid: string | null
          growth_rate: number | null
          has_adjustments: boolean | null
          id: string
          industry: string
          ip_address: unknown
          is_deleted: boolean | null
          last_activity_at: string | null
          last_call_attempt_at: string | null
          last_campaign_id: number | null
          last_campaign_name: string | null
          last_clicked_url: string | null
          last_email_click_at: string | null
          last_modified_field: string | null
          lead_entry_date: string | null
          lead_form: string | null
          lead_source: string | null
          lead_source_detail: string | null
          lead_status_crm: Database["public"]["Enums"]["lead_status"] | null
          location: string | null
          net_profit_margin: number | null
          notes: string | null
          ownership_participation: string | null
          phone: string | null
          phone_e164: string | null
          precall_email_sent: boolean | null
          precall_email_sent_at: string | null
          referrer: string | null
          revenue: number | null
          source_project: string | null
          status_updated_at: string | null
          time_spent_seconds: number | null
          token_expires_at: string | null
          token_hash: string | null
          token_used_at: string | null
          unique_token: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valuation_range_max: number | null
          valuation_range_min: number | null
          valuation_status: string | null
          whatsapp_opt_in: boolean | null
          whatsapp_sent: boolean | null
          whatsapp_sent_at: string | null
          years_of_operation: number | null
        }
        Insert: {
          acquisition_channel_id?: string | null
          activity_description?: string | null
          adjustment_amount?: number | null
          ai_company_summary?: string | null
          ai_company_summary_at?: string | null
          apollo_candidates?: Json | null
          apollo_error?: string | null
          apollo_last_enriched_at?: string | null
          apollo_org_data?: Json | null
          apollo_org_id?: string | null
          apollo_people_data?: Json | null
          apollo_status?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          brevo_deleted_at?: string | null
          brevo_lists?: number[] | null
          brevo_unsubscribed_lists?: number[] | null
          call_attempts_count?: number | null
          cif?: string | null
          company_name: string
          competitive_advantage?: string | null
          completion_percentage?: number | null
          contact_lastname?: string | null
          contact_name: string
          created_at?: string
          crm_contacto_id?: string | null
          crm_synced_at?: string | null
          current_step?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          ebitda?: number | null
          ebitda_multiple_used?: number | null
          email: string
          email_block_reason?: string | null
          email_blocked?: boolean | null
          email_bounce_reason?: string | null
          email_bounce_type?: string | null
          email_bounced?: boolean | null
          email_clicked?: boolean | null
          email_delivered?: boolean | null
          email_delivered_at?: string | null
          email_domain?: string | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_opens_count?: number | null
          email_outbox_id?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          email_soft_bounced?: boolean | null
          email_spam_reported?: boolean | null
          email_spam_reported_at?: string | null
          email_unsubscribed?: boolean | null
          email_unsubscribed_at?: string | null
          email_valid?: boolean | null
          employee_range: string
          empresa_id?: string | null
          fbclid?: string | null
          final_valuation?: number | null
          followup_count?: number | null
          form_submitted_at?: string | null
          gclid?: string | null
          growth_rate?: number | null
          has_adjustments?: boolean | null
          id?: string
          industry: string
          ip_address?: unknown
          is_deleted?: boolean | null
          last_activity_at?: string | null
          last_call_attempt_at?: string | null
          last_campaign_id?: number | null
          last_campaign_name?: string | null
          last_clicked_url?: string | null
          last_email_click_at?: string | null
          last_modified_field?: string | null
          lead_entry_date?: string | null
          lead_form?: string | null
          lead_source?: string | null
          lead_source_detail?: string | null
          lead_status_crm?: Database["public"]["Enums"]["lead_status"] | null
          location?: string | null
          net_profit_margin?: number | null
          notes?: string | null
          ownership_participation?: string | null
          phone?: string | null
          phone_e164?: string | null
          precall_email_sent?: boolean | null
          precall_email_sent_at?: string | null
          referrer?: string | null
          revenue?: number | null
          source_project?: string | null
          status_updated_at?: string | null
          time_spent_seconds?: number | null
          token_expires_at?: string | null
          token_hash?: string | null
          token_used_at?: string | null
          unique_token?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valuation_range_max?: number | null
          valuation_range_min?: number | null
          valuation_status?: string | null
          whatsapp_opt_in?: boolean | null
          whatsapp_sent?: boolean | null
          whatsapp_sent_at?: string | null
          years_of_operation?: number | null
        }
        Update: {
          acquisition_channel_id?: string | null
          activity_description?: string | null
          adjustment_amount?: number | null
          ai_company_summary?: string | null
          ai_company_summary_at?: string | null
          apollo_candidates?: Json | null
          apollo_error?: string | null
          apollo_last_enriched_at?: string | null
          apollo_org_data?: Json | null
          apollo_org_id?: string | null
          apollo_people_data?: Json | null
          apollo_status?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          brevo_deleted_at?: string | null
          brevo_lists?: number[] | null
          brevo_unsubscribed_lists?: number[] | null
          call_attempts_count?: number | null
          cif?: string | null
          company_name?: string
          competitive_advantage?: string | null
          completion_percentage?: number | null
          contact_lastname?: string | null
          contact_name?: string
          created_at?: string
          crm_contacto_id?: string | null
          crm_synced_at?: string | null
          current_step?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          ebitda?: number | null
          ebitda_multiple_used?: number | null
          email?: string
          email_block_reason?: string | null
          email_blocked?: boolean | null
          email_bounce_reason?: string | null
          email_bounce_type?: string | null
          email_bounced?: boolean | null
          email_clicked?: boolean | null
          email_delivered?: boolean | null
          email_delivered_at?: string | null
          email_domain?: string | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_opens_count?: number | null
          email_outbox_id?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          email_soft_bounced?: boolean | null
          email_spam_reported?: boolean | null
          email_spam_reported_at?: string | null
          email_unsubscribed?: boolean | null
          email_unsubscribed_at?: string | null
          email_valid?: boolean | null
          employee_range?: string
          empresa_id?: string | null
          fbclid?: string | null
          final_valuation?: number | null
          followup_count?: number | null
          form_submitted_at?: string | null
          gclid?: string | null
          growth_rate?: number | null
          has_adjustments?: boolean | null
          id?: string
          industry?: string
          ip_address?: unknown
          is_deleted?: boolean | null
          last_activity_at?: string | null
          last_call_attempt_at?: string | null
          last_campaign_id?: number | null
          last_campaign_name?: string | null
          last_clicked_url?: string | null
          last_email_click_at?: string | null
          last_modified_field?: string | null
          lead_entry_date?: string | null
          lead_form?: string | null
          lead_source?: string | null
          lead_source_detail?: string | null
          lead_status_crm?: Database["public"]["Enums"]["lead_status"] | null
          location?: string | null
          net_profit_margin?: number | null
          notes?: string | null
          ownership_participation?: string | null
          phone?: string | null
          phone_e164?: string | null
          precall_email_sent?: boolean | null
          precall_email_sent_at?: string | null
          referrer?: string | null
          revenue?: number | null
          source_project?: string | null
          status_updated_at?: string | null
          time_spent_seconds?: number | null
          token_expires_at?: string | null
          token_hash?: string | null
          token_used_at?: string | null
          unique_token?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valuation_range_max?: number | null
          valuation_range_min?: number | null
          valuation_status?: string | null
          whatsapp_opt_in?: boolean | null
          whatsapp_sent?: boolean | null
          whatsapp_sent_at?: string | null
          years_of_operation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_valuations_acquisition_channel_id_fkey"
            columns: ["acquisition_channel_id"]
            isOneToOne: false
            referencedRelation: "acquisition_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_valuations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "company_valuations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "company_valuations_crm_contacto_id_fkey"
            columns: ["crm_contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_valuations_email_outbox_id_fkey"
            columns: ["email_outbox_id"]
            isOneToOne: false
            referencedRelation: "email_outbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_valuations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_valuations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "company_valuations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_valuations_lead_form_fkey"
            columns: ["lead_form"]
            isOneToOne: false
            referencedRelation: "lead_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_leads: {
        Row: {
          acquisition_channel_id: string | null
          ai_company_summary: string | null
          ai_company_summary_at: string | null
          apollo_candidates: Json | null
          apollo_error: string | null
          apollo_last_enriched_at: string | null
          apollo_org_data: Json | null
          apollo_org_id: string | null
          apollo_people_data: Json | null
          apollo_status: string | null
          assigned_at: string | null
          assigned_to: string | null
          brevo_deleted_at: string | null
          brevo_lists: number[] | null
          brevo_unsubscribed_lists: number[] | null
          cif: string | null
          company: string
          company_size: string | null
          country: string | null
          created_at: string
          crm_contacto_id: string | null
          crm_empresa_id: string | null
          crm_synced_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          email: string
          email_block_reason: string | null
          email_blocked: boolean | null
          email_bounce_reason: string | null
          email_bounce_type: string | null
          email_bounced: boolean | null
          email_clicked: boolean | null
          email_delivered: boolean | null
          email_delivered_at: string | null
          email_domain: string | null
          email_message_id: string | null
          email_opened: boolean | null
          email_opened_at: string | null
          email_opens_count: number | null
          email_sent: boolean | null
          email_sent_at: string | null
          email_soft_bounced: boolean | null
          email_spam_reported: boolean | null
          email_spam_reported_at: string | null
          email_unsubscribed: boolean | null
          email_unsubscribed_at: string | null
          email_valid: boolean | null
          empresa_id: string | null
          full_name: string
          id: string
          investment_budget: string | null
          ip_address: unknown
          is_deleted: boolean | null
          last_campaign_id: number | null
          last_campaign_name: string | null
          last_clicked_url: string | null
          last_email_click_at: string | null
          lead_entry_date: string | null
          lead_form: string | null
          lead_status_crm: Database["public"]["Enums"]["lead_status"] | null
          notes: string | null
          phone: string | null
          referral: string | null
          sectors_of_interest: string | null
          service_type: Database["public"]["Enums"]["service_type_enum"] | null
          status: string
          status_updated_at: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          acquisition_channel_id?: string | null
          ai_company_summary?: string | null
          ai_company_summary_at?: string | null
          apollo_candidates?: Json | null
          apollo_error?: string | null
          apollo_last_enriched_at?: string | null
          apollo_org_data?: Json | null
          apollo_org_id?: string | null
          apollo_people_data?: Json | null
          apollo_status?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          brevo_deleted_at?: string | null
          brevo_lists?: number[] | null
          brevo_unsubscribed_lists?: number[] | null
          cif?: string | null
          company: string
          company_size?: string | null
          country?: string | null
          created_at?: string
          crm_contacto_id?: string | null
          crm_empresa_id?: string | null
          crm_synced_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          email: string
          email_block_reason?: string | null
          email_blocked?: boolean | null
          email_bounce_reason?: string | null
          email_bounce_type?: string | null
          email_bounced?: boolean | null
          email_clicked?: boolean | null
          email_delivered?: boolean | null
          email_delivered_at?: string | null
          email_domain?: string | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_opens_count?: number | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          email_soft_bounced?: boolean | null
          email_spam_reported?: boolean | null
          email_spam_reported_at?: string | null
          email_unsubscribed?: boolean | null
          email_unsubscribed_at?: string | null
          email_valid?: boolean | null
          empresa_id?: string | null
          full_name: string
          id?: string
          investment_budget?: string | null
          ip_address?: unknown
          is_deleted?: boolean | null
          last_campaign_id?: number | null
          last_campaign_name?: string | null
          last_clicked_url?: string | null
          last_email_click_at?: string | null
          lead_entry_date?: string | null
          lead_form?: string | null
          lead_status_crm?: Database["public"]["Enums"]["lead_status"] | null
          notes?: string | null
          phone?: string | null
          referral?: string | null
          sectors_of_interest?: string | null
          service_type?: Database["public"]["Enums"]["service_type_enum"] | null
          status?: string
          status_updated_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          acquisition_channel_id?: string | null
          ai_company_summary?: string | null
          ai_company_summary_at?: string | null
          apollo_candidates?: Json | null
          apollo_error?: string | null
          apollo_last_enriched_at?: string | null
          apollo_org_data?: Json | null
          apollo_org_id?: string | null
          apollo_people_data?: Json | null
          apollo_status?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          brevo_deleted_at?: string | null
          brevo_lists?: number[] | null
          brevo_unsubscribed_lists?: number[] | null
          cif?: string | null
          company?: string
          company_size?: string | null
          country?: string | null
          created_at?: string
          crm_contacto_id?: string | null
          crm_empresa_id?: string | null
          crm_synced_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          email?: string
          email_block_reason?: string | null
          email_blocked?: boolean | null
          email_bounce_reason?: string | null
          email_bounce_type?: string | null
          email_bounced?: boolean | null
          email_clicked?: boolean | null
          email_delivered?: boolean | null
          email_delivered_at?: string | null
          email_domain?: string | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_opens_count?: number | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          email_soft_bounced?: boolean | null
          email_spam_reported?: boolean | null
          email_spam_reported_at?: string | null
          email_unsubscribed?: boolean | null
          email_unsubscribed_at?: string | null
          email_valid?: boolean | null
          empresa_id?: string | null
          full_name?: string
          id?: string
          investment_budget?: string | null
          ip_address?: unknown
          is_deleted?: boolean | null
          last_campaign_id?: number | null
          last_campaign_name?: string | null
          last_clicked_url?: string | null
          last_email_click_at?: string | null
          lead_entry_date?: string | null
          lead_form?: string | null
          lead_status_crm?: Database["public"]["Enums"]["lead_status"] | null
          notes?: string | null
          phone?: string | null
          referral?: string | null
          sectors_of_interest?: string | null
          service_type?: Database["public"]["Enums"]["service_type_enum"] | null
          status?: string
          status_updated_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_leads_acquisition_channel_id_fkey"
            columns: ["acquisition_channel_id"]
            isOneToOne: false
            referencedRelation: "acquisition_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contact_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "contact_leads_crm_contacto_id_fkey"
            columns: ["crm_contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_leads_crm_empresa_id_fkey"
            columns: ["crm_empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_leads_crm_empresa_id_fkey"
            columns: ["crm_empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "contact_leads_crm_empresa_id_fkey"
            columns: ["crm_empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "contact_leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_leads_lead_form_fkey"
            columns: ["lead_form"]
            isOneToOne: false
            referencedRelation: "lead_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_lists: {
        Row: {
          contact_count: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          list_type: string
          name: string
          updated_at: string
        }
        Insert: {
          contact_count?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          list_type?: string
          name: string
          updated_at?: string
        }
        Update: {
          contact_count?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          list_type?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_segments: {
        Row: {
          auto_update: boolean | null
          contact_count: number | null
          created_at: string
          created_by: string | null
          criteria: Json
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          auto_update?: boolean | null
          contact_count?: number | null
          created_at?: string
          created_by?: string | null
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          auto_update?: boolean | null
          contact_count?: number | null
          created_at?: string
          created_by?: string | null
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_statuses: {
        Row: {
          color: string
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean
          label: string
          position: number
          status_key: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          label: string
          position?: number
          status_key: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          label?: string
          position?: number
          status_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_tags: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      contacto_documentos: {
        Row: {
          compartido_por: string | null
          contacto_id: string
          created_at: string | null
          documento_id: string
          fecha_compartido: string | null
          id: string
          notas: string | null
        }
        Insert: {
          compartido_por?: string | null
          contacto_id: string
          created_at?: string | null
          documento_id: string
          fecha_compartido?: string | null
          id?: string
          notas?: string | null
        }
        Update: {
          compartido_por?: string | null
          contacto_id?: string
          created_at?: string | null
          documento_id?: string
          fecha_compartido?: string | null
          id?: string
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacto_documentos_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacto_documentos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacto_documentos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "v_documentos_con_versiones"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos: {
        Row: {
          apellidos: string | null
          avatar: string | null
          brevo_id: string | null
          brevo_last_modified_at: string | null
          brevo_synced_at: string | null
          capittal_synced_at: string | null
          cargo: string | null
          created_at: string | null
          email: string
          empresa_principal_id: string | null
          external_capittal_id: string | null
          id: string
          import_log_id: string | null
          linkedin: string | null
          merged_into_contacto_id: string | null
          nombre: string
          notas: string | null
          source: string | null
          telefono: string | null
          updated_at: string | null
          valuation_id: string | null
        }
        Insert: {
          apellidos?: string | null
          avatar?: string | null
          brevo_id?: string | null
          brevo_last_modified_at?: string | null
          brevo_synced_at?: string | null
          capittal_synced_at?: string | null
          cargo?: string | null
          created_at?: string | null
          email: string
          empresa_principal_id?: string | null
          external_capittal_id?: string | null
          id?: string
          import_log_id?: string | null
          linkedin?: string | null
          merged_into_contacto_id?: string | null
          nombre: string
          notas?: string | null
          source?: string | null
          telefono?: string | null
          updated_at?: string | null
          valuation_id?: string | null
        }
        Update: {
          apellidos?: string | null
          avatar?: string | null
          brevo_id?: string | null
          brevo_last_modified_at?: string | null
          brevo_synced_at?: string | null
          capittal_synced_at?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string
          empresa_principal_id?: string | null
          external_capittal_id?: string | null
          id?: string
          import_log_id?: string | null
          linkedin?: string | null
          merged_into_contacto_id?: string | null
          nombre?: string
          notas?: string | null
          source?: string | null
          telefono?: string | null
          updated_at?: string | null
          valuation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contactos_empresa_principal_id_fkey"
            columns: ["empresa_principal_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactos_empresa_principal_id_fkey"
            columns: ["empresa_principal_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "contactos_empresa_principal_id_fkey"
            columns: ["empresa_principal_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactos_import_log_id_fkey"
            columns: ["import_log_id"]
            isOneToOne: false
            referencedRelation: "import_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactos_merged_into_contacto_id_fkey"
            columns: ["merged_into_contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactos_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "company_valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactos_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos_backup_20260124: {
        Row: {
          apellidos: string | null
          avatar: string | null
          brevo_id: string | null
          brevo_last_modified_at: string | null
          brevo_synced_at: string | null
          capittal_synced_at: string | null
          cargo: string | null
          created_at: string | null
          email: string | null
          empresa_principal_id: string | null
          external_capittal_id: string | null
          id: string | null
          import_log_id: string | null
          linkedin: string | null
          merged_into_contacto_id: string | null
          nombre: string | null
          notas: string | null
          source: string | null
          telefono: string | null
          updated_at: string | null
          valuation_id: string | null
        }
        Insert: {
          apellidos?: string | null
          avatar?: string | null
          brevo_id?: string | null
          brevo_last_modified_at?: string | null
          brevo_synced_at?: string | null
          capittal_synced_at?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          empresa_principal_id?: string | null
          external_capittal_id?: string | null
          id?: string | null
          import_log_id?: string | null
          linkedin?: string | null
          merged_into_contacto_id?: string | null
          nombre?: string | null
          notas?: string | null
          source?: string | null
          telefono?: string | null
          updated_at?: string | null
          valuation_id?: string | null
        }
        Update: {
          apellidos?: string | null
          avatar?: string | null
          brevo_id?: string | null
          brevo_last_modified_at?: string | null
          brevo_synced_at?: string | null
          capittal_synced_at?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          empresa_principal_id?: string | null
          external_capittal_id?: string | null
          id?: string | null
          import_log_id?: string | null
          linkedin?: string | null
          merged_into_contacto_id?: string | null
          nombre?: string | null
          notas?: string | null
          source?: string | null
          telefono?: string | null
          updated_at?: string | null
          valuation_id?: string | null
        }
        Relationships: []
      }
      content_analytics: {
        Row: {
          avg_time_on_page: number
          blog_post_id: string | null
          bounce_rate: number
          created_at: string
          engagement_score: number
          id: string
          page_views: number
          period_date: string
          unique_visitors: number
          updated_at: string
        }
        Insert: {
          avg_time_on_page?: number
          blog_post_id?: string | null
          bounce_rate?: number
          created_at?: string
          engagement_score?: number
          id?: string
          page_views?: number
          period_date: string
          unique_visitors?: number
          updated_at?: string
        }
        Update: {
          avg_time_on_page?: number
          blog_post_id?: string | null
          bounce_rate?: number
          created_at?: string
          engagement_score?: number
          id?: string
          page_views?: number
          period_date?: string
          unique_visitors?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_analytics_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_buyers: {
        Row: {
          buyer_type: string | null
          cities: string[] | null
          country_base: string | null
          created_at: string | null
          deal_size_max: number | null
          deal_size_min: number | null
          description: string | null
          ebitda_max: number | null
          ebitda_min: number | null
          enriched_at: string | null
          enriched_data: Json | null
          enrichment_source: string | null
          geography_focus: string[] | null
          id: string
          investment_thesis: string | null
          is_active: boolean | null
          is_deleted: boolean | null
          key_highlights: string[] | null
          name: string
          notes_internal: string | null
          revenue_max: number | null
          revenue_min: number | null
          search_keywords: string[] | null
          sector_exclusions: string[] | null
          sector_focus: string[] | null
          source_url: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          buyer_type?: string | null
          cities?: string[] | null
          country_base?: string | null
          created_at?: string | null
          deal_size_max?: number | null
          deal_size_min?: number | null
          description?: string | null
          ebitda_max?: number | null
          ebitda_min?: number | null
          enriched_at?: string | null
          enriched_data?: Json | null
          enrichment_source?: string | null
          geography_focus?: string[] | null
          id?: string
          investment_thesis?: string | null
          is_active?: boolean | null
          is_deleted?: boolean | null
          key_highlights?: string[] | null
          name: string
          notes_internal?: string | null
          revenue_max?: number | null
          revenue_min?: number | null
          search_keywords?: string[] | null
          sector_exclusions?: string[] | null
          sector_focus?: string[] | null
          source_url?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          buyer_type?: string | null
          cities?: string[] | null
          country_base?: string | null
          created_at?: string | null
          deal_size_max?: number | null
          deal_size_min?: number | null
          description?: string | null
          ebitda_max?: number | null
          ebitda_min?: number | null
          enriched_at?: string | null
          enriched_data?: Json | null
          enrichment_source?: string | null
          geography_focus?: string[] | null
          id?: string
          investment_thesis?: string | null
          is_active?: boolean | null
          is_deleted?: boolean | null
          key_highlights?: string[] | null
          name?: string
          notes_internal?: string | null
          revenue_max?: number | null
          revenue_min?: number | null
          search_keywords?: string[] | null
          sector_exclusions?: string[] | null
          sector_focus?: string[] | null
          source_url?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      corporate_contacts: {
        Row: {
          buyer_id: string
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_deleted: boolean | null
          is_primary_contact: boolean | null
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          role: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_deleted?: boolean | null
          is_primary_contact?: boolean | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_deleted?: boolean | null
          is_primary_contact?: boolean | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_contacts_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "corporate_buyers"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_favorites: {
        Row: {
          added_by: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      corporate_outreach: {
        Row: {
          buyer_id: string | null
          channel: string | null
          contact_id: string | null
          content: string | null
          created_at: string | null
          email_mode: string | null
          error_message: string | null
          id: string
          notes: string | null
          operation_id: string | null
          outreach_type: string
          provider_message_id: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id?: string | null
          channel?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string | null
          email_mode?: string | null
          error_message?: string | null
          id?: string
          notes?: string | null
          operation_id?: string | null
          outreach_type?: string
          provider_message_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string | null
          channel?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string | null
          email_mode?: string | null
          error_message?: string | null
          id?: string
          notes?: string | null
          operation_id?: string | null
          outreach_type?: string
          provider_message_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_outreach_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "corporate_buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_outreach_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "corporate_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      cr_apollo_imports: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          credits_used: number | null
          error_count: number | null
          error_message: string | null
          id: string
          import_results: Json | null
          import_type: string | null
          imported_count: number | null
          preview_data: Json | null
          search_criteria: Json | null
          skipped_count: number | null
          started_at: string | null
          status: string | null
          total_results: number | null
          updated_count: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          credits_used?: number | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          import_results?: Json | null
          import_type?: string | null
          imported_count?: number | null
          preview_data?: Json | null
          search_criteria?: Json | null
          skipped_count?: number | null
          started_at?: string | null
          status?: string | null
          total_results?: number | null
          updated_count?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          credits_used?: number | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          import_results?: Json | null
          import_type?: string | null
          imported_count?: number | null
          preview_data?: Json | null
          search_criteria?: Json | null
          skipped_count?: number | null
          started_at?: string | null
          status?: string | null
          total_results?: number | null
          updated_count?: number | null
        }
        Relationships: []
      }
      cr_deals: {
        Row: {
          company_name: string
          country: string | null
          created_at: string
          deal_type: string | null
          deal_value: number | null
          deal_year: number | null
          deleted_at: string | null
          description: string | null
          fund_id: string
          id: string
          is_deleted: boolean | null
          notes: string | null
          portfolio_id: string | null
          sector: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          country?: string | null
          created_at?: string
          deal_type?: string | null
          deal_value?: number | null
          deal_year?: number | null
          deleted_at?: string | null
          description?: string | null
          fund_id: string
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          portfolio_id?: string | null
          sector?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          country?: string | null
          created_at?: string
          deal_type?: string | null
          deal_value?: number | null
          deal_year?: number | null
          deleted_at?: string | null
          description?: string | null
          fund_id?: string
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          portfolio_id?: string | null
          sector?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cr_deals_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "cr_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cr_deals_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "cr_portfolio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cr_deals_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "v_cr_portfolio_con_actividad"
            referencedColumns: ["id"]
          },
        ]
      }
      cr_favorites: {
        Row: {
          added_by: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      cr_fund_audit_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          field_name: string | null
          fund_id: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          field_name?: string | null
          fund_id: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          field_name?: string | null
          fund_id?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cr_fund_audit_log_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "cr_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      cr_fund_lps: {
        Row: {
          commitment_size: number | null
          created_at: string
          fund_id: string
          id: string
          lp_id: string
          notes: string | null
          since_year: number | null
        }
        Insert: {
          commitment_size?: number | null
          created_at?: string
          fund_id: string
          id?: string
          lp_id: string
          notes?: string | null
          since_year?: number | null
        }
        Update: {
          commitment_size?: number | null
          created_at?: string
          fund_id?: string
          id?: string
          lp_id?: string
          notes?: string | null
          since_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cr_fund_lps_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "cr_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cr_fund_lps_lp_id_fkey"
            columns: ["lp_id"]
            isOneToOne: false
            referencedRelation: "cr_lps"
            referencedColumns: ["id"]
          },
        ]
      }
      cr_funds: {
        Row: {
          aum: number | null
          cities: string[] | null
          country_base: string | null
          created_at: string
          current_fund_number: number | null
          current_fund_size: number | null
          deal_types: string[] | null
          deleted_at: string | null
          description: string | null
          ebitda_max: number | null
          ebitda_min: number | null
          enriched_at: string | null
          enriched_data: Json | null
          enrichment_source: string | null
          founded_year: number | null
          fund_type: string | null
          geography_focus: string[] | null
          id: string
          investment_stage: string[] | null
          investment_thesis: string | null
          is_deleted: boolean | null
          last_diff_scan_at: string | null
          last_news_scan_at: string | null
          last_portfolio_diff_at: string | null
          last_portfolio_scraped_at: string | null
          last_scraped_at: string | null
          last_web_etag: string | null
          last_web_modified: string | null
          name: string
          notable_exits: string[] | null
          notes_internal: string | null
          portfolio_diff_enabled: boolean | null
          portfolio_url: string | null
          revenue_max: number | null
          revenue_min: number | null
          scrape_data: Json | null
          scrape_source_urls: string[] | null
          sector_exclusions: string[] | null
          sector_focus: string[] | null
          source_last_verified_at: string | null
          source_url: string | null
          status: string | null
          team_size_estimate: number | null
          ticket_max: number | null
          ticket_min: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          aum?: number | null
          cities?: string[] | null
          country_base?: string | null
          created_at?: string
          current_fund_number?: number | null
          current_fund_size?: number | null
          deal_types?: string[] | null
          deleted_at?: string | null
          description?: string | null
          ebitda_max?: number | null
          ebitda_min?: number | null
          enriched_at?: string | null
          enriched_data?: Json | null
          enrichment_source?: string | null
          founded_year?: number | null
          fund_type?: string | null
          geography_focus?: string[] | null
          id?: string
          investment_stage?: string[] | null
          investment_thesis?: string | null
          is_deleted?: boolean | null
          last_diff_scan_at?: string | null
          last_news_scan_at?: string | null
          last_portfolio_diff_at?: string | null
          last_portfolio_scraped_at?: string | null
          last_scraped_at?: string | null
          last_web_etag?: string | null
          last_web_modified?: string | null
          name: string
          notable_exits?: string[] | null
          notes_internal?: string | null
          portfolio_diff_enabled?: boolean | null
          portfolio_url?: string | null
          revenue_max?: number | null
          revenue_min?: number | null
          scrape_data?: Json | null
          scrape_source_urls?: string[] | null
          sector_exclusions?: string[] | null
          sector_focus?: string[] | null
          source_last_verified_at?: string | null
          source_url?: string | null
          status?: string | null
          team_size_estimate?: number | null
          ticket_max?: number | null
          ticket_min?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          aum?: number | null
          cities?: string[] | null
          country_base?: string | null
          created_at?: string
          current_fund_number?: number | null
          current_fund_size?: number | null
          deal_types?: string[] | null
          deleted_at?: string | null
          description?: string | null
          ebitda_max?: number | null
          ebitda_min?: number | null
          enriched_at?: string | null
          enriched_data?: Json | null
          enrichment_source?: string | null
          founded_year?: number | null
          fund_type?: string | null
          geography_focus?: string[] | null
          id?: string
          investment_stage?: string[] | null
          investment_thesis?: string | null
          is_deleted?: boolean | null
          last_diff_scan_at?: string | null
          last_news_scan_at?: string | null
          last_portfolio_diff_at?: string | null
          last_portfolio_scraped_at?: string | null
          last_scraped_at?: string | null
          last_web_etag?: string | null
          last_web_modified?: string | null
          name?: string
          notable_exits?: string[] | null
          notes_internal?: string | null
          portfolio_diff_enabled?: boolean | null
          portfolio_url?: string | null
          revenue_max?: number | null
          revenue_min?: number | null
          scrape_data?: Json | null
          scrape_source_urls?: string[] | null
          sector_exclusions?: string[] | null
          sector_focus?: string[] | null
          source_last_verified_at?: string | null
          source_url?: string | null
          status?: string | null
          team_size_estimate?: number | null
          ticket_max?: number | null
          ticket_min?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      cr_lps: {
        Row: {
          aum: number | null
          contact_email: string | null
          contact_name: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean | null
          name: string
          notes: string | null
          type: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          aum?: number | null
          contact_email?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          name: string
          notes?: string | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          aum?: number | null
          contact_email?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          notes?: string | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      cr_matches: {
        Row: {
          contacted_at: string | null
          created_at: string
          crm_entity_id: string
          crm_entity_type: string
          fund_id: string
          id: string
          last_scored_at: string | null
          match_reasons: Json | null
          match_score: number | null
          notes: string | null
          owner_user_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          contacted_at?: string | null
          created_at?: string
          crm_entity_id: string
          crm_entity_type: string
          fund_id: string
          id?: string
          last_scored_at?: string | null
          match_reasons?: Json | null
          match_score?: number | null
          notes?: string | null
          owner_user_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          contacted_at?: string | null
          created_at?: string
          crm_entity_id?: string
          crm_entity_type?: string
          fund_id?: string
          id?: string
          last_scored_at?: string | null
          match_reasons?: Json | null
          match_score?: number | null
          notes?: string | null
          owner_user_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cr_matches_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "cr_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      cr_people: {
        Row: {
          bio: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          enriched_at: string | null
          enriched_data: Json | null
          enrichment_source: string | null
          expertise_areas: string[] | null
          full_name: string
          fund_id: string
          id: string
          is_deleted: boolean | null
          is_email_verified: boolean | null
          is_primary_contact: boolean | null
          linkedin_url: string | null
          location: string | null
          media_mentions: string[] | null
          notes: string | null
          phone: string | null
          role: string | null
          sector_expertise: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          enriched_at?: string | null
          enriched_data?: Json | null
          enrichment_source?: string | null
          expertise_areas?: string[] | null
          full_name: string
          fund_id: string
          id?: string
          is_deleted?: boolean | null
          is_email_verified?: boolean | null
          is_primary_contact?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          media_mentions?: string[] | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          sector_expertise?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          enriched_at?: string | null
          enriched_data?: Json | null
          enrichment_source?: string | null
          expertise_areas?: string[] | null
          full_name?: string
          fund_id?: string
          id?: string
          is_deleted?: boolean | null
          is_email_verified?: boolean | null
          is_primary_contact?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          media_mentions?: string[] | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          sector_expertise?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cr_people_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "cr_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      cr_portfolio: {
        Row: {
          company_name: string
          country: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          employee_count_estimate: number | null
          enriched_at: string | null
          enriched_data: Json | null
          enrichment_source: string | null
          exit_type: string | null
          exit_year: number | null
          fund_id: string
          fund_name: string | null
          id: string
          investment_type: string | null
          investment_year: number | null
          is_deleted: boolean | null
          key_people: Json | null
          last_news_scan_at: string | null
          last_web_check_at: string | null
          news_alert_count: number | null
          notes: string | null
          ownership_type: string | null
          revenue_estimate: string | null
          scan_priority: string | null
          sector: string | null
          sector_pe: string | null
          skip_news_scan: boolean | null
          social_links: Json | null
          source_url: string | null
          status: string | null
          technologies: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          company_name: string
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          employee_count_estimate?: number | null
          enriched_at?: string | null
          enriched_data?: Json | null
          enrichment_source?: string | null
          exit_type?: string | null
          exit_year?: number | null
          fund_id: string
          fund_name?: string | null
          id?: string
          investment_type?: string | null
          investment_year?: number | null
          is_deleted?: boolean | null
          key_people?: Json | null
          last_news_scan_at?: string | null
          last_web_check_at?: string | null
          news_alert_count?: number | null
          notes?: string | null
          ownership_type?: string | null
          revenue_estimate?: string | null
          scan_priority?: string | null
          sector?: string | null
          sector_pe?: string | null
          skip_news_scan?: boolean | null
          social_links?: Json | null
          source_url?: string | null
          status?: string | null
          technologies?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          company_name?: string
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          employee_count_estimate?: number | null
          enriched_at?: string | null
          enriched_data?: Json | null
          enrichment_source?: string | null
          exit_type?: string | null
          exit_year?: number | null
          fund_id?: string
          fund_name?: string | null
          id?: string
          investment_type?: string | null
          investment_year?: number | null
          is_deleted?: boolean | null
          key_people?: Json | null
          last_news_scan_at?: string | null
          last_web_check_at?: string | null
          news_alert_count?: number | null
          notes?: string | null
          ownership_type?: string | null
          revenue_estimate?: string | null
          scan_priority?: string | null
          sector?: string | null
          sector_pe?: string | null
          skip_news_scan?: boolean | null
          social_links?: Json | null
          source_url?: string | null
          status?: string | null
          technologies?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cr_portfolio_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "cr_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      cr_portfolio_interactions: {
        Row: {
          body: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          created_by: string | null
          id: string
          interaction_type: string
          metadata: Json | null
          portfolio_id: string
          sent_at: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          portfolio_id: string
          sent_at?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          portfolio_id?: string
          sent_at?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cr_portfolio_interactions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "cr_portfolio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cr_portfolio_interactions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "v_cr_portfolio_con_actividad"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sync_log: {
        Row: {
          completed_at: string | null
          contactos_created: number | null
          empresas_created: number | null
          errors: Json | null
          id: string
          leads_processed: number | null
          started_at: string
          status: string
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          contactos_created?: number | null
          empresas_created?: number | null
          errors?: Json | null
          id?: string
          leads_processed?: number | null
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          contactos_created?: number | null
          empresas_created?: number | null
          errors?: Json | null
          id?: string
          leads_processed?: number | null
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      custom_newsletter_templates: {
        Row: {
          base_template_type: string
          created_at: string
          created_by: string | null
          default_intro: string | null
          description: string | null
          footer_config: Json | null
          header_config: Json | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject_template: string | null
          theme_id: string | null
          updated_at: string
        }
        Insert: {
          base_template_type?: string
          created_at?: string
          created_by?: string | null
          default_intro?: string | null
          description?: string | null
          footer_config?: Json | null
          header_config?: Json | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject_template?: string | null
          theme_id?: string | null
          updated_at?: string
        }
        Update: {
          base_template_type?: string
          created_at?: string
          created_by?: string | null
          default_intro?: string | null
          description?: string | null
          footer_config?: Json | null
          header_config?: Json | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject_template?: string | null
          theme_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_widgets: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          permissions: string[]
          updated_at: string
          user_id: string
          widget_config: Json
          widget_name: string
          widget_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          permissions?: string[]
          updated_at?: string
          user_id: string
          widget_config?: Json
          widget_name: string
          widget_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          permissions?: string[]
          updated_at?: string
          user_id?: string
          widget_config?: Json
          widget_name?: string
          widget_type?: string
        }
        Relationships: []
      }
      daily_plan_items: {
        Row: {
          actual_time_entry_id: string | null
          assigned_by_admin: boolean | null
          completed: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_minutes: number
          id: string
          linked_task_id: string | null
          mandate_lead_id: string | null
          mandato_id: string | null
          order_index: number | null
          plan_id: string
          priority: string | null
          title: string
          work_task_type_id: string | null
        }
        Insert: {
          actual_time_entry_id?: string | null
          assigned_by_admin?: boolean | null
          completed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_minutes?: number
          id?: string
          linked_task_id?: string | null
          mandate_lead_id?: string | null
          mandato_id?: string | null
          order_index?: number | null
          plan_id: string
          priority?: string | null
          title: string
          work_task_type_id?: string | null
        }
        Update: {
          actual_time_entry_id?: string | null
          assigned_by_admin?: boolean | null
          completed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_minutes?: number
          id?: string
          linked_task_id?: string | null
          mandate_lead_id?: string | null
          mandato_id?: string | null
          order_index?: number | null
          plan_id?: string
          priority?: string | null
          title?: string
          work_task_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_plan_items_actual_time_entry_id_fkey"
            columns: ["actual_time_entry_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_plan_items_linked_task_id_fkey"
            columns: ["linked_task_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_plan_items_mandate_lead_id_fkey"
            columns: ["mandate_lead_id"]
            isOneToOne: false
            referencedRelation: "mandate_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_plan_items_mandate_lead_id_fkey"
            columns: ["mandate_lead_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandate_lead_id"]
          },
          {
            foreignKeyName: "daily_plan_items_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "daily_plan_items_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_plan_items_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "daily_plan_items_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_plan_items_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_plan_items_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "daily_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_plan_items_work_task_type_id_fkey"
            columns: ["work_task_type_id"]
            isOneToOne: false
            referencedRelation: "work_task_types"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_plans: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          modified_after_submit: boolean | null
          planned_for_date: string
          status: string
          submitted_at: string | null
          total_estimated_minutes: number | null
          updated_at: string | null
          user_id: string
          user_notes: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          modified_after_submit?: boolean | null
          planned_for_date: string
          status?: string
          submitted_at?: string | null
          total_estimated_minutes?: number | null
          updated_at?: string | null
          user_id: string
          user_notes?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          modified_after_submit?: boolean | null
          planned_for_date?: string
          status?: string
          submitted_at?: string | null
          total_estimated_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          user_notes?: string | null
        }
        Relationships: []
      }
      dashboard_highlights: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string
          id: string
          is_active: boolean
          position: number
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          position?: number
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          position?: number
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      document_access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          documento_id: string
          documento_nombre: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          access_type?: string
          accessed_at?: string
          documento_id: string
          documento_nombre?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_email?: string | null
          user_id?: string
        }
        Update: {
          access_type?: string
          accessed_at?: string
          documento_id?: string
          documento_nombre?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      document_downloads: {
        Row: {
          created_at: string | null
          document_id: string
          download_method: string | null
          downloaded_at: string | null
          id: string
          ip_address: unknown
          page_url: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_company: string | null
          user_email: string
          user_id: string | null
          user_name: string | null
          user_phone: string | null
          user_position: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          download_method?: string | null
          downloaded_at?: string | null
          id?: string
          ip_address?: unknown
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_company?: string | null
          user_email: string
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
          user_position?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          download_method?: string | null
          downloaded_at?: string | null
          id?: string
          ip_address?: unknown
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_company?: string | null
          user_email?: string
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
          user_position?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_downloads_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folders: {
        Row: {
          created_at: string | null
          fase_asociada: string | null
          folder_type: string | null
          icon: string | null
          id: string
          is_data_room: boolean | null
          mandato_id: string
          name: string
          orden: number | null
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fase_asociada?: string | null
          folder_type?: string | null
          icon?: string | null
          id?: string
          is_data_room?: boolean | null
          mandato_id: string
          name: string
          orden?: number | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fase_asociada?: string | null
          folder_type?: string | null
          icon?: string | null
          id?: string
          is_data_room?: boolean | null
          mandato_id?: string
          name?: string
          orden?: number | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "document_folders_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "document_folders_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "document_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          fase_aplicable: string | null
          file_name: string | null
          file_size_bytes: number | null
          id: string
          is_active: boolean | null
          mime_type: string | null
          name: string
          template_url: string | null
          tipo_operacion: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fase_aplicable?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          is_active?: boolean | null
          mime_type?: string | null
          name: string
          template_url?: string | null
          tipo_operacion?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fase_aplicable?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          is_active?: boolean | null
          mime_type?: string | null
          name?: string
          template_url?: string | null
          tipo_operacion?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      documentos: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          descripcion: string | null
          file_name: string
          file_size_bytes: number
          folder_id: string | null
          id: string
          idioma: string | null
          is_latest_version: boolean | null
          mandato_id: string | null
          mime_type: string
          parent_document_id: string | null
          published_at: string | null
          status: string | null
          storage_path: string
          tags: string[] | null
          tipo: string | null
          updated_at: string | null
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          descripcion?: string | null
          file_name: string
          file_size_bytes: number
          folder_id?: string | null
          id?: string
          idioma?: string | null
          is_latest_version?: boolean | null
          mandato_id?: string | null
          mime_type: string
          parent_document_id?: string | null
          published_at?: string | null
          status?: string | null
          storage_path: string
          tags?: string[] | null
          tipo?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          descripcion?: string | null
          file_name?: string
          file_size_bytes?: number
          folder_id?: string | null
          id?: string
          idioma?: string | null
          is_latest_version?: boolean | null
          mandato_id?: string | null
          mime_type?: string
          parent_document_id?: string | null
          published_at?: string | null
          status?: string | null
          storage_path?: string
          tags?: string[] | null
          tipo?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "documentos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "documentos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "documentos_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "v_documentos_con_versiones"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          access_level: string
          author_name: string | null
          category: string
          created_at: string | null
          created_by: string | null
          cta_text: string | null
          description: string | null
          download_count: number | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          is_featured: boolean | null
          landing_page_id: string | null
          lead_conversion_count: number | null
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          previous_version_id: string | null
          published_at: string | null
          reading_time_minutes: number | null
          requires_form: boolean | null
          sector: string | null
          slug: string
          status: string
          tags: string[] | null
          target_audience: string[] | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string | null
          version: number | null
          view_count: number | null
        }
        Insert: {
          access_level?: string
          author_name?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          cta_text?: string | null
          description?: string | null
          download_count?: number | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_featured?: boolean | null
          landing_page_id?: string | null
          lead_conversion_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          previous_version_id?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          requires_form?: boolean | null
          sector?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          target_audience?: string[] | null
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string | null
          version?: number | null
          view_count?: number | null
        }
        Update: {
          access_level?: string
          author_name?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          cta_text?: string | null
          description?: string | null
          download_count?: number | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_featured?: boolean | null
          landing_page_id?: string | null
          lead_conversion_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          previous_version_id?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          requires_form?: boolean | null
          sector?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          target_audience?: string[] | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          version?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documents_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          attempts: number
          created_at: string
          email_type: string
          error_details: Json | null
          first_attempt_at: string | null
          id: string
          last_attempt_at: string | null
          last_error: string | null
          max_attempts: number
          metadata: Json | null
          next_retry_at: string | null
          provider_message_id: string | null
          provider_name: string | null
          provider_response: Json | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string
          subject: string | null
          template_id: string | null
          valuation_id: string | null
          valuation_type: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          email_type: string
          error_details?: Json | null
          first_attempt_at?: string | null
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          max_attempts?: number
          metadata?: Json | null
          next_retry_at?: string | null
          provider_message_id?: string | null
          provider_name?: string | null
          provider_response?: Json | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          valuation_id?: string | null
          valuation_type: string
        }
        Update: {
          attempts?: number
          created_at?: string
          email_type?: string
          error_details?: Json | null
          first_attempt_at?: string | null
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          max_attempts?: number
          metadata?: Json | null
          next_retry_at?: string | null
          provider_message_id?: string | null
          provider_name?: string | null
          provider_response?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          valuation_id?: string | null
          valuation_type?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          attachments: Json | null
          attempts: number | null
          created_at: string | null
          created_by: string | null
          error_details: Json | null
          failed_at: string | null
          first_attempt_at: string | null
          from_email: string | null
          from_name: string | null
          html_content: string
          id: string
          last_attempt_at: string | null
          last_error: string | null
          max_attempts: number | null
          metadata: Json | null
          next_retry_at: string | null
          priority: number | null
          provider: string | null
          provider_message_id: string | null
          provider_response: Json | null
          provider_status: string | null
          queue_type: string
          queued_at: string | null
          reference_id: string | null
          reference_type: string | null
          reply_to: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          subject: string
          text_content: string | null
          to_email: string
          to_name: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          attempts?: number | null
          created_at?: string | null
          created_by?: string | null
          error_details?: Json | null
          failed_at?: string | null
          first_attempt_at?: string | null
          from_email?: string | null
          from_name?: string | null
          html_content: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          max_attempts?: number | null
          metadata?: Json | null
          next_retry_at?: string | null
          priority?: number | null
          provider?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          provider_status?: string | null
          queue_type: string
          queued_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          reply_to?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          text_content?: string | null
          to_email: string
          to_name?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          attempts?: number | null
          created_at?: string | null
          created_by?: string | null
          error_details?: Json | null
          failed_at?: string | null
          first_attempt_at?: string | null
          from_email?: string | null
          from_name?: string | null
          html_content?: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          max_attempts?: number | null
          metadata?: Json | null
          next_retry_at?: string | null
          priority?: number | null
          provider?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          provider_status?: string | null
          queue_type?: string
          queued_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          reply_to?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          text_content?: string | null
          to_email?: string
          to_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_recipients_config: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          is_default_copy: boolean | null
          name: string
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          is_default_copy?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          is_default_copy?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_sequence_steps: {
        Row: {
          attachment_type: string | null
          content: string
          created_at: string | null
          delay_hours: number
          email_template: string | null
          id: string
          include_attachment: boolean | null
          is_active: boolean | null
          sequence_id: string | null
          step_order: number
          subject: string
        }
        Insert: {
          attachment_type?: string | null
          content: string
          created_at?: string | null
          delay_hours?: number
          email_template?: string | null
          id?: string
          include_attachment?: boolean | null
          is_active?: boolean | null
          sequence_id?: string | null
          step_order: number
          subject: string
        }
        Update: {
          attachment_type?: string | null
          content?: string
          created_at?: string | null
          delay_hours?: number
          email_template?: string | null
          id?: string
          include_attachment?: boolean | null
          is_active?: boolean | null
          sequence_id?: string | null
          step_order?: number
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_conditions: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_conditions?: Json | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_conditions?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          html_content: string
          id: string
          idioma: string
          is_active: boolean | null
          is_default: boolean | null
          nombre: string
          subject_template: string
          text_content: string | null
          tipo: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          html_content: string
          id?: string
          idioma: string
          is_active?: boolean | null
          is_default?: boolean | null
          nombre: string
          subject_template: string
          text_content?: string | null
          tipo?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          html_content?: string
          id?: string
          idioma?: string
          is_active?: boolean | null
          is_default?: boolean | null
          nombre?: string
          subject_template?: string
          text_content?: string | null
          tipo?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      empresa_documentos: {
        Row: {
          compartido_por: string | null
          created_at: string | null
          documento_id: string
          empresa_id: string
          fecha_compartido: string | null
          id: string
          notas: string | null
        }
        Insert: {
          compartido_por?: string | null
          created_at?: string | null
          documento_id: string
          empresa_id: string
          fecha_compartido?: string | null
          id?: string
          notas?: string | null
        }
        Update: {
          compartido_por?: string | null
          created_at?: string | null
          documento_id?: string
          empresa_id?: string
          fecha_compartido?: string | null
          id?: string
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresa_documentos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_documentos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "v_documentos_con_versiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "empresa_documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_favorites: {
        Row: {
          added_by: string | null
          created_at: string | null
          empresa_id: string
          id: string
          notes: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          empresa_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresa_favorites_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_favorites_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "empresa_favorites_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_financial_statements: {
        Row: {
          cash_equivalents: number | null
          cost_of_sales: number | null
          created_at: string | null
          currency: string | null
          current_year_result: number | null
          debt_ebitda_ratio: number | null
          depreciation_amortization: number | null
          ebit: number | null
          ebitda: number | null
          ebt: number | null
          empresa_id: string
          financial_assets: number | null
          financial_result: number | null
          gross_margin: number | null
          id: string
          intangible_assets: number | null
          inventories: number | null
          is_audited: boolean | null
          long_term_debt: number | null
          net_debt: number | null
          net_income: number | null
          notes: string | null
          other_current_assets: number | null
          other_current_liabilities: number | null
          other_income: number | null
          other_non_current_liabilities: number | null
          other_operating_expenses: number | null
          period_type: string | null
          personnel_expenses: number | null
          reserves: number | null
          retained_earnings: number | null
          revenue: number | null
          share_capital: number | null
          short_term_debt: number | null
          source: string | null
          source_document_id: string | null
          tangible_assets: number | null
          taxes: number | null
          total_assets: number | null
          total_current_assets: number | null
          total_current_liabilities: number | null
          total_equity: number | null
          total_equity_liabilities: number | null
          total_income: number | null
          total_liabilities: number | null
          total_non_current_assets: number | null
          total_non_current_liabilities: number | null
          total_opex: number | null
          trade_payables: number | null
          trade_receivables: number | null
          updated_at: string | null
          working_capital: number | null
          year: number
        }
        Insert: {
          cash_equivalents?: number | null
          cost_of_sales?: number | null
          created_at?: string | null
          currency?: string | null
          current_year_result?: number | null
          debt_ebitda_ratio?: number | null
          depreciation_amortization?: number | null
          ebit?: number | null
          ebitda?: number | null
          ebt?: number | null
          empresa_id: string
          financial_assets?: number | null
          financial_result?: number | null
          gross_margin?: number | null
          id?: string
          intangible_assets?: number | null
          inventories?: number | null
          is_audited?: boolean | null
          long_term_debt?: number | null
          net_debt?: number | null
          net_income?: number | null
          notes?: string | null
          other_current_assets?: number | null
          other_current_liabilities?: number | null
          other_income?: number | null
          other_non_current_liabilities?: number | null
          other_operating_expenses?: number | null
          period_type?: string | null
          personnel_expenses?: number | null
          reserves?: number | null
          retained_earnings?: number | null
          revenue?: number | null
          share_capital?: number | null
          short_term_debt?: number | null
          source?: string | null
          source_document_id?: string | null
          tangible_assets?: number | null
          taxes?: number | null
          total_assets?: number | null
          total_current_assets?: number | null
          total_current_liabilities?: number | null
          total_equity?: number | null
          total_equity_liabilities?: number | null
          total_income?: number | null
          total_liabilities?: number | null
          total_non_current_assets?: number | null
          total_non_current_liabilities?: number | null
          total_opex?: number | null
          trade_payables?: number | null
          trade_receivables?: number | null
          updated_at?: string | null
          working_capital?: number | null
          year: number
        }
        Update: {
          cash_equivalents?: number | null
          cost_of_sales?: number | null
          created_at?: string | null
          currency?: string | null
          current_year_result?: number | null
          debt_ebitda_ratio?: number | null
          depreciation_amortization?: number | null
          ebit?: number | null
          ebitda?: number | null
          ebt?: number | null
          empresa_id?: string
          financial_assets?: number | null
          financial_result?: number | null
          gross_margin?: number | null
          id?: string
          intangible_assets?: number | null
          inventories?: number | null
          is_audited?: boolean | null
          long_term_debt?: number | null
          net_debt?: number | null
          net_income?: number | null
          notes?: string | null
          other_current_assets?: number | null
          other_current_liabilities?: number | null
          other_income?: number | null
          other_non_current_liabilities?: number | null
          other_operating_expenses?: number | null
          period_type?: string | null
          personnel_expenses?: number | null
          reserves?: number | null
          retained_earnings?: number | null
          revenue?: number | null
          share_capital?: number | null
          short_term_debt?: number | null
          source?: string | null
          source_document_id?: string | null
          tangible_assets?: number | null
          taxes?: number | null
          total_assets?: number | null
          total_current_assets?: number | null
          total_current_liabilities?: number | null
          total_equity?: number | null
          total_equity_liabilities?: number | null
          total_income?: number | null
          total_liabilities?: number | null
          total_non_current_assets?: number | null
          total_non_current_liabilities?: number | null
          total_opex?: number | null
          trade_payables?: number | null
          trade_receivables?: number | null
          updated_at?: string | null
          working_capital?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "empresa_financial_statements_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_financial_statements_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "empresa_financial_statements_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          actividades_destacadas: string[] | null
          alexa_ranking: number | null
          año_datos_financieros: number | null
          apollo_enriched_at: string | null
          apollo_intent_level: string | null
          apollo_last_synced_at: string | null
          apollo_org_id: string | null
          apollo_raw_data: Json | null
          apollo_score: number | null
          apollo_visitor_date: string | null
          apollo_visitor_source: string | null
          brevo_id: string | null
          brevo_last_modified_at: string | null
          brevo_synced_at: string | null
          capital_circulante: number | null
          cif: string | null
          cnae_codigo: string | null
          cnae_descripcion: string | null
          created_at: string | null
          departmental_headcount: Json | null
          descripcion: string | null
          deuda: number | null
          ebitda: number | null
          ebitda_margin: number | null
          empleados: number | null
          es_target: boolean | null
          estado_target: string | null
          facebook_url: string | null
          facturacion: number | null
          fecha_enriquecimiento: string | null
          founded_year: number | null
          fuente_enriquecimiento: string | null
          id: string
          import_log_id: string | null
          keywords: string[] | null
          linkedin_url: string | null
          margen_ebitda: number | null
          nivel_interes: string | null
          nombre: string
          origen: string | null
          potencial_search_fund: boolean | null
          revenue: number | null
          sector: string | null
          sector_id: string | null
          sitio_web: string | null
          source: string | null
          source_id: string | null
          source_pro_valuation_id: string | null
          source_valuation_id: string | null
          subsector: string | null
          technologies: Json | null
          ubicacion: string | null
          updated_at: string | null
        }
        Insert: {
          actividades_destacadas?: string[] | null
          alexa_ranking?: number | null
          año_datos_financieros?: number | null
          apollo_enriched_at?: string | null
          apollo_intent_level?: string | null
          apollo_last_synced_at?: string | null
          apollo_org_id?: string | null
          apollo_raw_data?: Json | null
          apollo_score?: number | null
          apollo_visitor_date?: string | null
          apollo_visitor_source?: string | null
          brevo_id?: string | null
          brevo_last_modified_at?: string | null
          brevo_synced_at?: string | null
          capital_circulante?: number | null
          cif?: string | null
          cnae_codigo?: string | null
          cnae_descripcion?: string | null
          created_at?: string | null
          departmental_headcount?: Json | null
          descripcion?: string | null
          deuda?: number | null
          ebitda?: number | null
          ebitda_margin?: number | null
          empleados?: number | null
          es_target?: boolean | null
          estado_target?: string | null
          facebook_url?: string | null
          facturacion?: number | null
          fecha_enriquecimiento?: string | null
          founded_year?: number | null
          fuente_enriquecimiento?: string | null
          id?: string
          import_log_id?: string | null
          keywords?: string[] | null
          linkedin_url?: string | null
          margen_ebitda?: number | null
          nivel_interes?: string | null
          nombre: string
          origen?: string | null
          potencial_search_fund?: boolean | null
          revenue?: number | null
          sector?: string | null
          sector_id?: string | null
          sitio_web?: string | null
          source?: string | null
          source_id?: string | null
          source_pro_valuation_id?: string | null
          source_valuation_id?: string | null
          subsector?: string | null
          technologies?: Json | null
          ubicacion?: string | null
          updated_at?: string | null
        }
        Update: {
          actividades_destacadas?: string[] | null
          alexa_ranking?: number | null
          año_datos_financieros?: number | null
          apollo_enriched_at?: string | null
          apollo_intent_level?: string | null
          apollo_last_synced_at?: string | null
          apollo_org_id?: string | null
          apollo_raw_data?: Json | null
          apollo_score?: number | null
          apollo_visitor_date?: string | null
          apollo_visitor_source?: string | null
          brevo_id?: string | null
          brevo_last_modified_at?: string | null
          brevo_synced_at?: string | null
          capital_circulante?: number | null
          cif?: string | null
          cnae_codigo?: string | null
          cnae_descripcion?: string | null
          created_at?: string | null
          departmental_headcount?: Json | null
          descripcion?: string | null
          deuda?: number | null
          ebitda?: number | null
          ebitda_margin?: number | null
          empleados?: number | null
          es_target?: boolean | null
          estado_target?: string | null
          facebook_url?: string | null
          facturacion?: number | null
          fecha_enriquecimiento?: string | null
          founded_year?: number | null
          fuente_enriquecimiento?: string | null
          id?: string
          import_log_id?: string | null
          keywords?: string[] | null
          linkedin_url?: string | null
          margen_ebitda?: number | null
          nivel_interes?: string | null
          nombre?: string
          origen?: string | null
          potencial_search_fund?: boolean | null
          revenue?: number | null
          sector?: string | null
          sector_id?: string | null
          sitio_web?: string | null
          source?: string | null
          source_id?: string | null
          source_pro_valuation_id?: string | null
          source_valuation_id?: string | null
          subsector?: string | null
          technologies?: Json | null
          ubicacion?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_import_log_id_fkey"
            columns: ["import_log_id"]
            isOneToOne: false
            referencedRelation: "import_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_source_pro_valuation_id_fkey"
            columns: ["source_pro_valuation_id"]
            isOneToOne: false
            referencedRelation: "professional_valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_source_valuation_id_fkey"
            columns: ["source_valuation_id"]
            isOneToOne: false
            referencedRelation: "company_valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_source_valuation_id_fkey"
            columns: ["source_valuation_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas_table_columns: {
        Row: {
          column_key: string
          created_at: string
          icon: string | null
          id: string
          is_sortable: boolean | null
          is_visible: boolean | null
          label: string
          position: number
          updated_at: string
          width: string | null
        }
        Insert: {
          column_key: string
          created_at?: string
          icon?: string | null
          id?: string
          is_sortable?: boolean | null
          is_visible?: boolean | null
          label: string
          position: number
          updated_at?: string
          width?: string | null
        }
        Update: {
          column_key?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_sortable?: boolean | null
          is_visible?: boolean | null
          label?: string
          position?: number
          updated_at?: string
          width?: string | null
        }
        Relationships: []
      }
      enrichment_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          max_attempts: number | null
          priority: number | null
          result_data: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          priority?: number | null
          result_data?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          priority?: number | null
          result_data?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      exit_readiness_questions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          max_points: number | null
          options: Json
          question_key: string
          question_order: number
          question_text: string
          recommendation_if_low: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_points?: number | null
          options: Json
          question_key: string
          question_order: number
          question_text: string
          recommendation_if_low?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_points?: number | null
          options?: Json
          question_key?: string
          question_order?: number
          question_text?: string
          recommendation_if_low?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      exit_readiness_tests: {
        Row: {
          admin_notes: string | null
          ai_report_content: string | null
          ai_report_error: string | null
          ai_report_generated_at: string | null
          ai_report_status: string | null
          company_name: string | null
          contacted_at: string | null
          created_at: string
          email: string
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          ip_address: unknown
          name: string | null
          page_origin: string | null
          phone: string | null
          questions_version: number | null
          readiness_level: string | null
          recommendations: Json | null
          referrer: string | null
          responses: Json
          total_score: number
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          admin_notes?: string | null
          ai_report_content?: string | null
          ai_report_error?: string | null
          ai_report_generated_at?: string | null
          ai_report_status?: string | null
          company_name?: string | null
          contacted_at?: string | null
          created_at?: string
          email: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          ip_address?: unknown
          name?: string | null
          page_origin?: string | null
          phone?: string | null
          questions_version?: number | null
          readiness_level?: string | null
          recommendations?: Json | null
          referrer?: string | null
          responses?: Json
          total_score?: number
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          admin_notes?: string | null
          ai_report_content?: string | null
          ai_report_error?: string | null
          ai_report_generated_at?: string | null
          ai_report_status?: string | null
          company_name?: string | null
          contacted_at?: string | null
          created_at?: string
          email?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          ip_address?: unknown
          name?: string | null
          page_origin?: string | null
          phone?: string | null
          questions_version?: number | null
          readiness_level?: string | null
          recommendations?: Json | null
          referrer?: string | null
          responses?: Json
          total_score?: number
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      fase0_document_templates: {
        Row: {
          available_variables: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          document_type: string
          fee_structure: Json | null
          id: string
          is_active: boolean | null
          name: string
          sections: Json
          updated_at: string | null
          version: string | null
        }
        Insert: {
          available_variables?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type: string
          fee_structure?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          sections?: Json
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          available_variables?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type?: string
          fee_structure?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          sections?: Json
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      fase0_documents: {
        Row: {
          created_at: string | null
          created_by: string | null
          document_type: string
          filled_data: Json
          id: string
          lead_id: string
          lead_type: string
          notes: string | null
          pdf_storage_path: string | null
          pdf_url: string | null
          previous_version_id: string | null
          reference_number: string
          sent_at: string | null
          sent_by: string | null
          sent_to_email: string | null
          signature_data: Json | null
          signed_at: string | null
          signed_by: string | null
          signed_by_ip: unknown
          signed_by_name: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
          valid_until: string | null
          version_number: number | null
          view_count: number | null
          viewed_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          document_type: string
          filled_data?: Json
          id?: string
          lead_id: string
          lead_type: string
          notes?: string | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          previous_version_id?: string | null
          reference_number: string
          sent_at?: string | null
          sent_by?: string | null
          sent_to_email?: string | null
          signature_data?: Json | null
          signed_at?: string | null
          signed_by?: string | null
          signed_by_ip?: unknown
          signed_by_name?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          valid_until?: string | null
          version_number?: number | null
          view_count?: number | null
          viewed_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          document_type?: string
          filled_data?: Json
          id?: string
          lead_id?: string
          lead_type?: string
          notes?: string | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          previous_version_id?: string | null
          reference_number?: string
          sent_at?: string | null
          sent_by?: string | null
          sent_to_email?: string | null
          signature_data?: Json | null
          signed_at?: string | null
          signed_by?: string | null
          signed_by_ip?: unknown
          signed_by_name?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          valid_until?: string | null
          version_number?: number | null
          view_count?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fase0_documents_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "fase0_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fase0_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "fase0_document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      fase0_workflow_rules: {
        Row: {
          action: Json
          condition: Json
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          rule_name: string
          rule_type: string
          updated_at: string
        }
        Insert: {
          action?: Json
          condition?: Json
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          rule_name: string
          rule_type: string
          updated_at?: string
        }
        Update: {
          action?: Json
          condition?: Json
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          rule_name?: string
          rule_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      fee_templates: {
        Row: {
          base_fee_percentage: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          minimum_fee: number | null
          name: string
          service_type: Database["public"]["Enums"]["service_type"]
          success_fee_percentage: number | null
          template_sections: Json | null
          updated_at: string
        }
        Insert: {
          base_fee_percentage?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          minimum_fee?: number | null
          name: string
          service_type: Database["public"]["Enums"]["service_type"]
          success_fee_percentage?: number | null
          template_sections?: Json | null
          updated_at?: string
        }
        Update: {
          base_fee_percentage?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          minimum_fee?: number | null
          name?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          success_fee_percentage?: number | null
          template_sections?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      form_sessions: {
        Row: {
          browser: string | null
          created_at: string | null
          device_type: string | null
          entered_at: string
          exit_intent_triggered: boolean | null
          exit_type: string | null
          exited_at: string | null
          fields_touched: string[] | null
          form_type: string
          id: string
          interacted: boolean | null
          ip_address: unknown
          page_url: string | null
          referrer: string | null
          scroll_depth_percentage: number | null
          session_id: string
          time_on_page_seconds: number | null
          updated_at: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valuation_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          entered_at?: string
          exit_intent_triggered?: boolean | null
          exit_type?: string | null
          exited_at?: string | null
          fields_touched?: string[] | null
          form_type?: string
          id?: string
          interacted?: boolean | null
          ip_address?: unknown
          page_url?: string | null
          referrer?: string | null
          scroll_depth_percentage?: number | null
          session_id: string
          time_on_page_seconds?: number | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valuation_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          entered_at?: string
          exit_intent_triggered?: boolean | null
          exit_type?: string | null
          exited_at?: string | null
          fields_touched?: string[] | null
          form_type?: string
          id?: string
          interacted?: boolean | null
          ip_address?: unknown
          page_url?: string | null
          referrer?: string | null
          scroll_depth_percentage?: number | null
          session_id?: string
          time_on_page_seconds?: number | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valuation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_sessions_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "company_valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_sessions_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      fund_news: {
        Row: {
          ai_summary: string | null
          content_preview: string | null
          created_at: string | null
          fund_id: string
          fund_type: string
          id: string
          is_material_change: boolean | null
          is_processed: boolean | null
          metadata: Json | null
          news_date: string | null
          news_type: string | null
          relevance_score: number | null
          source_name: string | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          ai_summary?: string | null
          content_preview?: string | null
          created_at?: string | null
          fund_id: string
          fund_type: string
          id?: string
          is_material_change?: boolean | null
          is_processed?: boolean | null
          metadata?: Json | null
          news_date?: string | null
          news_type?: string | null
          relevance_score?: number | null
          source_name?: string | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          ai_summary?: string | null
          content_preview?: string | null
          created_at?: string | null
          fund_id?: string
          fund_type?: string
          id?: string
          is_material_change?: boolean | null
          is_processed?: boolean | null
          metadata?: Json | null
          news_date?: string | null
          news_type?: string | null
          relevance_score?: number | null
          source_name?: string | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      general_contact_leads: {
        Row: {
          acquisition_channel_id: string | null
          ai_company_summary: string | null
          ai_company_summary_at: string | null
          annual_revenue: string | null
          apollo_candidates: Json | null
          apollo_error: string | null
          apollo_last_enriched_at: string | null
          apollo_org_data: Json | null
          apollo_org_id: string | null
          apollo_people_data: Json | null
          apollo_status: string | null
          cif: string | null
          company: string
          country: string | null
          created_at: string
          crm_contacto_id: string | null
          crm_empresa_id: string | null
          crm_synced_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          ebitda: string | null
          email: string
          email_domain: string | null
          email_message_id: string | null
          email_opened: boolean | null
          email_opened_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          full_name: string
          how_did_you_hear: string | null
          id: string
          ip_address: unknown
          is_deleted: boolean | null
          lead_form: string | null
          message: string
          notes: string | null
          page_origin: string
          phone: string | null
          referrer: string | null
          status: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          acquisition_channel_id?: string | null
          ai_company_summary?: string | null
          ai_company_summary_at?: string | null
          annual_revenue?: string | null
          apollo_candidates?: Json | null
          apollo_error?: string | null
          apollo_last_enriched_at?: string | null
          apollo_org_data?: Json | null
          apollo_org_id?: string | null
          apollo_people_data?: Json | null
          apollo_status?: string | null
          cif?: string | null
          company: string
          country?: string | null
          created_at?: string
          crm_contacto_id?: string | null
          crm_empresa_id?: string | null
          crm_synced_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          ebitda?: string | null
          email: string
          email_domain?: string | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name: string
          how_did_you_hear?: string | null
          id?: string
          ip_address?: unknown
          is_deleted?: boolean | null
          lead_form?: string | null
          message: string
          notes?: string | null
          page_origin: string
          phone?: string | null
          referrer?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          acquisition_channel_id?: string | null
          ai_company_summary?: string | null
          ai_company_summary_at?: string | null
          annual_revenue?: string | null
          apollo_candidates?: Json | null
          apollo_error?: string | null
          apollo_last_enriched_at?: string | null
          apollo_org_data?: Json | null
          apollo_org_id?: string | null
          apollo_people_data?: Json | null
          apollo_status?: string | null
          cif?: string | null
          company?: string
          country?: string | null
          created_at?: string
          crm_contacto_id?: string | null
          crm_empresa_id?: string | null
          crm_synced_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          ebitda?: string | null
          email?: string
          email_domain?: string | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name?: string
          how_did_you_hear?: string | null
          id?: string
          ip_address?: unknown
          is_deleted?: boolean | null
          lead_form?: string | null
          message?: string
          notes?: string | null
          page_origin?: string
          phone?: string | null
          referrer?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "general_contact_leads_acquisition_channel_id_fkey"
            columns: ["acquisition_channel_id"]
            isOneToOne: false
            referencedRelation: "acquisition_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_contact_leads_crm_contacto_id_fkey"
            columns: ["crm_contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_contact_leads_crm_empresa_id_fkey"
            columns: ["crm_empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_contact_leads_crm_empresa_id_fkey"
            columns: ["crm_empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "general_contact_leads_crm_empresa_id_fkey"
            columns: ["crm_empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_contact_leads_lead_form_fkey"
            columns: ["lead_form"]
            isOneToOne: false
            referencedRelation: "lead_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      help_section_versions: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          content_md: string
          created_at: string | null
          description: string | null
          id: string
          section_id: string
          title: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          content_md: string
          created_at?: string | null
          description?: string | null
          id?: string
          section_id: string
          title: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          content_md?: string
          created_at?: string | null
          description?: string | null
          id?: string
          section_id?: string
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "help_section_versions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "help_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      help_sections: {
        Row: {
          content_md: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_published: boolean | null
          order_index: number
          parent_id: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content_md: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          parent_id?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content_md?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          parent_id?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_sections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "help_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_slides: {
        Row: {
          autoplay_duration: number | null
          background_color: string | null
          created_at: string
          cta_primary_text: string | null
          cta_primary_url: string | null
          cta_secondary_text: string | null
          cta_secondary_url: string | null
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          subtitle: string | null
          text_color: string | null
          title: string
          updated_at: string
        }
        Insert: {
          autoplay_duration?: number | null
          background_color?: string | null
          created_at?: string
          cta_primary_text?: string | null
          cta_primary_url?: string | null
          cta_secondary_text?: string | null
          cta_secondary_url?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          subtitle?: string | null
          text_color?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          autoplay_duration?: number | null
          background_color?: string | null
          created_at?: string
          cta_primary_text?: string | null
          cta_primary_url?: string | null
          cta_secondary_text?: string | null
          cta_secondary_url?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          subtitle?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_content: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          label: string | null
          poster_image_url: string | null
          section: string
          subtitle: string | null
          title: string | null
          updated_at: string | null
          value: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          label?: string | null
          poster_image_url?: string | null
          section: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          value?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          label?: string | null
          poster_image_url?: string | null
          section?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          value?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          completed_at: string | null
          config: Json | null
          created_at: string
          errors: Json | null
          failed: number
          file_name: string | null
          id: string
          import_type: string
          imported_by: string | null
          skipped: number
          status: string
          successful: number
          total_records: number
        }
        Insert: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          errors?: Json | null
          failed?: number
          file_name?: string | null
          id?: string
          import_type: string
          imported_by?: string | null
          skipped?: number
          status?: string
          successful?: number
          total_records?: number
        }
        Update: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          errors?: Json | null
          failed?: number
          file_name?: string | null
          id?: string
          import_type?: string
          imported_by?: string | null
          skipped?: number
          status?: string
          successful?: number
          total_records?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "import_logs_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
        ]
      }
      interacciones: {
        Row: {
          contacto_id: string | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          documentos_adjuntos: Json | null
          duracion_minutos: number | null
          empresa_id: string | null
          fecha: string
          fecha_siguiente_accion: string | null
          id: string
          mandato_id: string | null
          resultado: string | null
          siguiente_accion: string | null
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          contacto_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          documentos_adjuntos?: Json | null
          duracion_minutos?: number | null
          empresa_id?: string | null
          fecha?: string
          fecha_siguiente_accion?: string | null
          id?: string
          mandato_id?: string | null
          resultado?: string | null
          siguiente_accion?: string | null
          tipo: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          contacto_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          documentos_adjuntos?: Json | null
          duracion_minutos?: number | null
          empresa_id?: string | null
          fecha?: string
          fecha_siguiente_accion?: string | null
          id?: string
          mandato_id?: string | null
          resultado?: string | null
          siguiente_accion?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interacciones_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "interacciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacciones_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "interacciones_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacciones_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "interacciones_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacciones_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacciones_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
        ]
      }
      investor_document_access: {
        Row: {
          accessed_at: string
          action: string
          document_id: string
          id: string
          investor_user_id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          action: string
          document_id: string
          id?: string
          investor_user_id: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          action?: string
          document_id?: string
          id?: string
          investor_user_id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_document_access_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "investor_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_document_access_investor_user_id_fkey"
            columns: ["investor_user_id"]
            isOneToOne: false
            referencedRelation: "investor_users"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_documents: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          file_name: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          fund_id: string | null
          id: string
          is_confidential: boolean | null
          lp_id: string | null
          published_at: string | null
          quarter: string | null
          requires_signature: boolean | null
          signature_status: string | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          fund_id?: string | null
          id?: string
          is_confidential?: boolean | null
          lp_id?: string | null
          published_at?: string | null
          quarter?: string | null
          requires_signature?: boolean | null
          signature_status?: string | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          fund_id?: string | null
          id?: string
          is_confidential?: boolean | null
          lp_id?: string | null
          published_at?: string | null
          quarter?: string | null
          requires_signature?: boolean | null
          signature_status?: string | null
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_documents_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "cr_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_documents_lp_id_fkey"
            columns: ["lp_id"]
            isOneToOne: false
            referencedRelation: "cr_lps"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_fund_metrics: {
        Row: {
          created_at: string
          created_by: string | null
          dpi: number | null
          fund_id: string
          id: string
          irr_gross: number | null
          irr_net: number | null
          moic: number | null
          nav: number | null
          notes: string | null
          period_date: string
          rvpi: number | null
          total_called: number | null
          total_committed: number | null
          total_distributed: number | null
          tvpi: number | null
          unfunded_commitment: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dpi?: number | null
          fund_id: string
          id?: string
          irr_gross?: number | null
          irr_net?: number | null
          moic?: number | null
          nav?: number | null
          notes?: string | null
          period_date: string
          rvpi?: number | null
          total_called?: number | null
          total_committed?: number | null
          total_distributed?: number | null
          tvpi?: number | null
          unfunded_commitment?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dpi?: number | null
          fund_id?: string
          id?: string
          irr_gross?: number | null
          irr_net?: number | null
          moic?: number | null
          nav?: number | null
          notes?: string | null
          period_date?: string
          rvpi?: number | null
          total_called?: number | null
          total_committed?: number | null
          total_distributed?: number | null
          tvpi?: number | null
          unfunded_commitment?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_fund_metrics_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "cr_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_leads: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          brevo_sent: boolean | null
          brevo_sent_at: string | null
          company: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          document_format: string
          document_id: string | null
          email: string
          email_message_id: string | null
          email_opened: boolean | null
          email_opened_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          full_name: string
          gdpr_consent: boolean
          id: string
          investment_range: string | null
          investor_type: string | null
          ip_address: unknown
          is_deleted: boolean | null
          lead_score: number | null
          marketing_consent: boolean | null
          notes: string | null
          phone: string | null
          preferred_location: string | null
          referrer: string | null
          rod_document_id: string | null
          sectors_of_interest: string | null
          status: string
          status_updated_at: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          brevo_sent?: boolean | null
          brevo_sent_at?: string | null
          company?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          document_format: string
          document_id?: string | null
          email: string
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name: string
          gdpr_consent?: boolean
          id?: string
          investment_range?: string | null
          investor_type?: string | null
          ip_address?: unknown
          is_deleted?: boolean | null
          lead_score?: number | null
          marketing_consent?: boolean | null
          notes?: string | null
          phone?: string | null
          preferred_location?: string | null
          referrer?: string | null
          rod_document_id?: string | null
          sectors_of_interest?: string | null
          status?: string
          status_updated_at?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          brevo_sent?: boolean | null
          brevo_sent_at?: string | null
          company?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          document_format?: string
          document_id?: string | null
          email?: string
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name?: string
          gdpr_consent?: boolean
          id?: string
          investment_range?: string | null
          investor_type?: string | null
          ip_address?: unknown
          is_deleted?: boolean | null
          lead_score?: number | null
          marketing_consent?: boolean | null
          notes?: string | null
          phone?: string | null
          preferred_location?: string | null
          referrer?: string | null
          rod_document_id?: string | null
          sectors_of_interest?: string | null
          status?: string
          status_updated_at?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investor_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investor_leads_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investor_leads_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investor_leads_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_leads_rod_document_id_fkey"
            columns: ["rod_document_id"]
            isOneToOne: false
            referencedRelation: "rod_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_notifications: {
        Row: {
          created_at: string
          id: string
          investor_user_id: string
          is_read: boolean
          message: string | null
          read_at: string | null
          related_document_id: string | null
          related_fund_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          investor_user_id: string
          is_read?: boolean
          message?: string | null
          read_at?: string | null
          related_document_id?: string | null
          related_fund_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          investor_user_id?: string
          is_read?: boolean
          message?: string | null
          read_at?: string | null
          related_document_id?: string | null
          related_fund_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_notifications_investor_user_id_fkey"
            columns: ["investor_user_id"]
            isOneToOne: false
            referencedRelation: "investor_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_notifications_related_document_id_fkey"
            columns: ["related_document_id"]
            isOneToOne: false
            referencedRelation: "investor_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_notifications_related_fund_id_fkey"
            columns: ["related_fund_id"]
            isOneToOne: false
            referencedRelation: "cr_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_positions: {
        Row: {
          called_capital: number
          committed_capital: number
          created_at: string
          current_nav: number
          distributed_capital: number
          fund_id: string
          id: string
          investment_date: string | null
          investor_user_id: string
          notes: string | null
          ownership_percentage: number | null
          updated_at: string
        }
        Insert: {
          called_capital?: number
          committed_capital?: number
          created_at?: string
          current_nav?: number
          distributed_capital?: number
          fund_id: string
          id?: string
          investment_date?: string | null
          investor_user_id: string
          notes?: string | null
          ownership_percentage?: number | null
          updated_at?: string
        }
        Update: {
          called_capital?: number
          committed_capital?: number
          created_at?: string
          current_nav?: number
          distributed_capital?: number
          fund_id?: string
          id?: string
          investment_date?: string | null
          investor_user_id?: string
          notes?: string | null
          ownership_percentage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_positions_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "cr_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_positions_investor_user_id_fkey"
            columns: ["investor_user_id"]
            isOneToOne: false
            referencedRelation: "investor_users"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          invitation_expires_at: string | null
          invitation_token: string | null
          invited_at: string | null
          invited_by: string | null
          last_login_at: string | null
          lp_id: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          last_login_at?: string | null
          lp_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          last_login_at?: string | null
          lp_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_users_lp_id_fkey"
            columns: ["lp_id"]
            isOneToOne: false
            referencedRelation: "cr_lps"
            referencedColumns: ["id"]
          },
        ]
      }
      job_application_activities: {
        Row: {
          activity_type: string
          application_id: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          performed_by: string | null
        }
        Insert: {
          activity_type: string
          application_id: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Update: {
          activity_type?: string
          application_id?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_application_activities_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_application_activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_application_activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_applications: {
        Row: {
          additional_documents_urls: string[] | null
          availability: string | null
          cover_letter: string | null
          created_at: string
          current_company: string | null
          current_location: string | null
          current_position: string | null
          cv_url: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          education_level: string | null
          email: string
          expected_salary_max: number | null
          expected_salary_min: number | null
          full_name: string
          id: string
          interview_scheduled_at: string | null
          ip_address: unknown
          is_deleted: boolean | null
          job_post_id: string
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          portfolio_url: string | null
          rating: number | null
          referrer: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          willing_to_relocate: boolean | null
          years_of_experience: number | null
        }
        Insert: {
          additional_documents_urls?: string[] | null
          availability?: string | null
          cover_letter?: string | null
          created_at?: string
          current_company?: string | null
          current_location?: string | null
          current_position?: string | null
          cv_url?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          education_level?: string | null
          email: string
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          full_name: string
          id?: string
          interview_scheduled_at?: string | null
          ip_address?: unknown
          is_deleted?: boolean | null
          job_post_id: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          portfolio_url?: string | null
          rating?: number | null
          referrer?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          willing_to_relocate?: boolean | null
          years_of_experience?: number | null
        }
        Update: {
          additional_documents_urls?: string[] | null
          availability?: string | null
          cover_letter?: string | null
          created_at?: string
          current_company?: string | null
          current_location?: string | null
          current_position?: string | null
          cv_url?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          education_level?: string | null
          email?: string
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          full_name?: string
          id?: string
          interview_scheduled_at?: string | null
          ip_address?: unknown
          is_deleted?: boolean | null
          job_post_id?: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          portfolio_url?: string | null
          rating?: number | null
          referrer?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          willing_to_relocate?: boolean | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_applications_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_applications_job_post_id_fkey"
            columns: ["job_post_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_post_templates: {
        Row: {
          benefits_template: string[] | null
          category: string | null
          created_at: string | null
          created_by: string | null
          default_contract_type: string | null
          default_employment_type: string | null
          default_experience_level: string | null
          default_is_hybrid: boolean | null
          default_is_remote: boolean | null
          default_location: string | null
          default_sector: string | null
          description: string | null
          description_template: string | null
          id: string
          is_active: boolean | null
          name: string
          requirements_template: string[] | null
          responsibilities_template: string[] | null
          short_description_template: string | null
          times_used: number | null
          title_template: string | null
          updated_at: string | null
        }
        Insert: {
          benefits_template?: string[] | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_contract_type?: string | null
          default_employment_type?: string | null
          default_experience_level?: string | null
          default_is_hybrid?: boolean | null
          default_is_remote?: boolean | null
          default_location?: string | null
          default_sector?: string | null
          description?: string | null
          description_template?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requirements_template?: string[] | null
          responsibilities_template?: string[] | null
          short_description_template?: string | null
          times_used?: number | null
          title_template?: string | null
          updated_at?: string | null
        }
        Update: {
          benefits_template?: string[] | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_contract_type?: string | null
          default_employment_type?: string | null
          default_experience_level?: string | null
          default_is_hybrid?: boolean | null
          default_is_remote?: boolean | null
          default_location?: string | null
          default_sector?: string | null
          description?: string | null
          description_template?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requirements_template?: string[] | null
          responsibilities_template?: string[] | null
          short_description_template?: string | null
          times_used?: number | null
          title_template?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_post_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_post_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_posts: {
        Row: {
          application_count: number | null
          application_email: string | null
          application_method: string
          application_url: string | null
          benefits: string[] | null
          category_id: string | null
          closes_at: string | null
          company_name: string
          contract_type: string
          created_at: string
          created_by: string | null
          description: string
          display_locations: string[] | null
          employment_type: string
          experience_level: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean | null
          is_hybrid: boolean | null
          is_remote: boolean | null
          is_salary_visible: boolean | null
          is_urgent: boolean | null
          location: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          required_languages: string[] | null
          requirements: string[] | null
          responsibilities: string[] | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          salary_period: string | null
          sector: string | null
          short_description: string
          slug: string
          status: string
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          application_count?: number | null
          application_email?: string | null
          application_method?: string
          application_url?: string | null
          benefits?: string[] | null
          category_id?: string | null
          closes_at?: string | null
          company_name?: string
          contract_type: string
          created_at?: string
          created_by?: string | null
          description: string
          display_locations?: string[] | null
          employment_type: string
          experience_level?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_hybrid?: boolean | null
          is_remote?: boolean | null
          is_salary_visible?: boolean | null
          is_urgent?: boolean | null
          location: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          required_languages?: string[] | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          sector?: string | null
          short_description: string
          slug: string
          status?: string
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          application_count?: number | null
          application_email?: string | null
          application_method?: string
          application_url?: string | null
          benefits?: string[] | null
          category_id?: string | null
          closes_at?: string | null
          company_name?: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          description?: string
          display_locations?: string[] | null
          employment_type?: string
          experience_level?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_hybrid?: boolean | null
          is_remote?: boolean | null
          is_salary_visible?: boolean | null
          is_urgent?: boolean | null
          location?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          required_languages?: string[] | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          sector?: string | null
          short_description?: string
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
        ]
      }
      key_statistics: {
        Row: {
          display_locations: string[] | null
          display_order: number | null
          id: string
          is_active: boolean | null
          metric_key: string
          metric_label: string
          metric_value: string
          updated_at: string
        }
        Insert: {
          display_locations?: string[] | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          metric_key: string
          metric_label: string
          metric_value: string
          updated_at?: string
        }
        Update: {
          display_locations?: string[] | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          metric_key?: string
          metric_label?: string
          metric_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      landing_page_conversions: {
        Row: {
          attribution_data: Json | null
          conversion_type: string
          conversion_value: number | null
          created_at: string
          form_data: Json | null
          id: string
          ip_address: unknown
          landing_page_id: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          visitor_data: Json | null
          visitor_id: string | null
        }
        Insert: {
          attribution_data?: Json | null
          conversion_type: string
          conversion_value?: number | null
          created_at?: string
          form_data?: Json | null
          id?: string
          ip_address?: unknown
          landing_page_id: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visitor_data?: Json | null
          visitor_id?: string | null
        }
        Update: {
          attribution_data?: Json | null
          conversion_type?: string
          conversion_value?: number | null
          created_at?: string
          form_data?: Json | null
          id?: string
          ip_address?: unknown
          landing_page_id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visitor_data?: Json | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_conversions_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_templates: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          preview_image_url: string | null
          template_config: Json
          template_html: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          preview_image_url?: string | null
          template_config?: Json
          template_html: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          preview_image_url?: string | null
          template_config?: Json
          template_html?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      landing_pages: {
        Row: {
          analytics_config: Json
          content_config: Json
          conversion_goals: Json
          created_at: string
          created_by: string | null
          custom_css: string | null
          custom_js: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          published_at: string | null
          slug: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          analytics_config?: Json
          content_config?: Json
          conversion_goals?: Json
          created_at?: string
          created_by?: string | null
          custom_css?: string | null
          custom_js?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          analytics_config?: Json
          content_config?: Json
          conversion_goals?: Json
          created_at?: string
          created_by?: string | null
          custom_css?: string | null
          custom_js?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "landing_page_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lead_id: string
          lead_type: string
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id: string
          lead_type?: string
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string
          lead_type?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      lead_ai_report_feedback: {
        Row: {
          created_at: string | null
          feedback_text: string | null
          id: string
          is_useful: boolean | null
          rating: number | null
          report_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          is_useful?: boolean | null
          rating?: number | null
          report_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          is_useful?: boolean | null
          rating?: number | null
          report_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_ai_report_feedback_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "lead_ai_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_ai_reports: {
        Row: {
          completed_at: string | null
          cost_usd: number | null
          created_at: string | null
          error_message: string | null
          generation_status: string | null
          id: string
          lead_id: string
          lead_type: string | null
          pdf_url: string | null
          processing_time_seconds: number | null
          report_chief_of_staff: string | null
          report_commercial_prep: string | null
          report_sector_dossier: string | null
          tokens_used: number | null
        }
        Insert: {
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          generation_status?: string | null
          id?: string
          lead_id: string
          lead_type?: string | null
          pdf_url?: string | null
          processing_time_seconds?: number | null
          report_chief_of_staff?: string | null
          report_commercial_prep?: string | null
          report_sector_dossier?: string | null
          tokens_used?: number | null
        }
        Update: {
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          generation_status?: string | null
          id?: string
          lead_id?: string
          lead_type?: string | null
          pdf_url?: string | null
          processing_time_seconds?: number | null
          report_chief_of_staff?: string | null
          report_commercial_prep?: string | null
          report_sector_dossier?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_ai_reports_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "company_valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_ai_reports_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_enrichment_snapshots: {
        Row: {
          confidence_score: number | null
          created_at: string
          enriched_by: string | null
          enriched_data: Json
          enrichment_source: string
          id: string
          lead_security_id: string
          notes: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          enriched_by?: string | null
          enriched_data?: Json
          enrichment_source: string
          id?: string
          lead_security_id: string
          notes?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          enriched_by?: string | null
          enriched_data?: Json
          enrichment_source?: string
          id?: string
          lead_security_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_enrichment_snapshots_lead_security_id_fkey"
            columns: ["lead_security_id"]
            isOneToOne: false
            referencedRelation: "lead_security"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_forms: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_pipeline_columns: {
        Row: {
          color: string
          created_at: string | null
          icon: string
          id: string
          is_system: boolean | null
          is_visible: boolean | null
          label: string
          position: number
          stage_key: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          is_system?: boolean | null
          is_visible?: boolean | null
          label: string
          position: number
          stage_key: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          is_system?: boolean | null
          is_visible?: boolean | null
          label?: string
          position?: number
          stage_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_potential_buyers: {
        Row: {
          added_by: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          ebitda: number | null
          employees: number | null
          id: string
          lead_id: string
          lead_origin: string
          logo_url: string | null
          name: string
          notes: string | null
          priority: number | null
          revenue: number | null
          revenue_range: string | null
          sector_focus: string[] | null
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          added_by?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          ebitda?: number | null
          employees?: number | null
          id?: string
          lead_id: string
          lead_origin: string
          logo_url?: string | null
          name: string
          notes?: string | null
          priority?: number | null
          revenue?: number | null
          revenue_range?: string | null
          sector_focus?: string[] | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          added_by?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          ebitda?: number | null
          employees?: number | null
          id?: string
          lead_id?: string
          lead_origin?: string
          logo_url?: string | null
          name?: string
          notes?: string | null
          priority?: number | null
          revenue?: number | null
          revenue_range?: string | null
          sector_focus?: string[] | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      lead_security: {
        Row: {
          cif: string | null
          company_name: string
          contact_name: string
          created_at: string
          ebitda_band: string | null
          email: string
          id: string
          ip_address: unknown
          phone: string | null
          referrer: string | null
          revenue_band: string | null
          security_subtype: string
          status: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          website: string | null
        }
        Insert: {
          cif?: string | null
          company_name: string
          contact_name: string
          created_at?: string
          ebitda_band?: string | null
          email: string
          id?: string
          ip_address?: unknown
          phone?: string | null
          referrer?: string | null
          revenue_band?: string | null
          security_subtype: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          website?: string | null
        }
        Update: {
          cif?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          ebitda_band?: string | null
          email?: string
          id?: string
          ip_address?: unknown
          phone?: string | null
          referrer?: string | null
          revenue_band?: string | null
          security_subtype?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          website?: string | null
        }
        Relationships: []
      }
      lead_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          deliverable_url: string | null
          due_date: string | null
          id: string
          is_automated: boolean | null
          is_system_task: boolean | null
          lead_id: string
          lead_type: string
          notes: string | null
          responsible_system: string | null
          status: string
          task_category: string | null
          task_name: string
          task_order: number
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          deliverable_url?: string | null
          due_date?: string | null
          id?: string
          is_automated?: boolean | null
          is_system_task?: boolean | null
          lead_id: string
          lead_type: string
          notes?: string | null
          responsible_system?: string | null
          status?: string
          task_category?: string | null
          task_name: string
          task_order: number
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          deliverable_url?: string | null
          due_date?: string | null
          id?: string
          is_automated?: boolean | null
          is_system_task?: boolean | null
          lead_id?: string
          lead_type?: string
          notes?: string | null
          responsible_system?: string | null
          status?: string
          task_category?: string | null
          task_name?: string
          task_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lead_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lead_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lead_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lead_to_operation_conversions: {
        Row: {
          conversion_notes: string | null
          converted_at: string | null
          converted_by: string | null
          id: string
          lead_id: string
          lead_type: string
          metadata: Json | null
          operation_id: string | null
        }
        Insert: {
          conversion_notes?: string | null
          converted_at?: string | null
          converted_by?: string | null
          id?: string
          lead_id: string
          lead_type: string
          metadata?: Json | null
          operation_id?: string | null
        }
        Update: {
          conversion_notes?: string | null
          converted_at?: string | null
          converted_by?: string | null
          id?: string
          lead_id?: string
          lead_type?: string
          metadata?: Json | null
          operation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_to_operation_conversions_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "company_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_valuation_initial: {
        Row: {
          assumptions: Json
          calculation_method: string
          created_at: string
          ebitda_multiple_base: number
          ebitda_multiple_high: number
          ebitda_multiple_low: number
          ev_base: number
          ev_high: number
          ev_low: number
          id: string
          lead_security_id: string
          scorecard_data: Json
        }
        Insert: {
          assumptions?: Json
          calculation_method?: string
          created_at?: string
          ebitda_multiple_base: number
          ebitda_multiple_high: number
          ebitda_multiple_low: number
          ev_base: number
          ev_high: number
          ev_low: number
          id?: string
          lead_security_id: string
          scorecard_data?: Json
        }
        Update: {
          assumptions?: Json
          calculation_method?: string
          created_at?: string
          ebitda_multiple_base?: number
          ebitda_multiple_high?: number
          ebitda_multiple_low?: number
          ev_base?: number
          ev_high?: number
          ev_low?: number
          id?: string
          lead_security_id?: string
          scorecard_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lead_valuation_initial_lead_security_id_fkey"
            columns: ["lead_security_id"]
            isOneToOne: false
            referencedRelation: "lead_security"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_valuation_refined: {
        Row: {
          adjustment_factors: Json
          approved_at: string | null
          approved_by: string | null
          created_at: string
          ebitda_multiple_adjusted: number
          ev_final: number
          ev_range_max: number
          ev_range_min: number
          id: string
          initial_vs_refined_diff: number | null
          lead_security_id: string
          pdf_url: string | null
          presentation_token: string | null
          refinement_notes: string | null
          sensitivity_analysis: Json | null
          updated_at: string
        }
        Insert: {
          adjustment_factors?: Json
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          ebitda_multiple_adjusted: number
          ev_final: number
          ev_range_max: number
          ev_range_min: number
          id?: string
          initial_vs_refined_diff?: number | null
          lead_security_id: string
          pdf_url?: string | null
          presentation_token?: string | null
          refinement_notes?: string | null
          sensitivity_analysis?: Json | null
          updated_at?: string
        }
        Update: {
          adjustment_factors?: Json
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          ebitda_multiple_adjusted?: number
          ev_final?: number
          ev_range_max?: number
          ev_range_min?: number
          id?: string
          initial_vs_refined_diff?: number | null
          lead_security_id?: string
          pdf_url?: string | null
          presentation_token?: string | null
          refinement_notes?: string | null
          sensitivity_analysis?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_valuation_refined_lead_security_id_fkey"
            columns: ["lead_security_id"]
            isOneToOne: false
            referencedRelation: "lead_security"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_leads: {
        Row: {
          company: string
          company_size: string | null
          consultation_type: string | null
          created_at: string
          email: string
          email_sent: boolean | null
          email_sent_at: string | null
          full_name: string
          hubspot_sent: boolean | null
          hubspot_sent_at: string | null
          id: string
          ip_address: unknown
          message: string | null
          phone: string | null
          referrer: string | null
          sector: string | null
          status: string
          transaction_stage: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          company: string
          company_size?: string | null
          consultation_type?: string | null
          created_at?: string
          email: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name: string
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          ip_address?: unknown
          message?: string | null
          phone?: string | null
          referrer?: string | null
          sector?: string | null
          status?: string
          transaction_stage?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          company?: string
          company_size?: string | null
          consultation_type?: string | null
          created_at?: string
          email?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name?: string
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          ip_address?: unknown
          message?: string | null
          phone?: string | null
          referrer?: string | null
          sector?: string | null
          status?: string
          transaction_stage?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: unknown
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      ma_resources_requests: {
        Row: {
          company: string
          created_at: string
          email: string
          full_name: string
          id: string
          ip_address: unknown
          operation_type: string | null
          phone: string | null
          referrer: string | null
          sectors_of_interest: string[] | null
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          ip_address?: unknown
          operation_type?: string | null
          phone?: string | null
          referrer?: string | null
          sectors_of_interest?: string[] | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          ip_address?: unknown
          operation_type?: string | null
          phone?: string | null
          referrer?: string | null
          sectors_of_interest?: string[] | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      mandate_leads: {
        Row: {
          admin_lead_id: string | null
          assigned_at: string | null
          assigned_to: string | null
          company_cif: string | null
          company_email_domain: string | null
          company_name: string
          company_website: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          empresa_id: string | null
          id: string
          last_activity_at: string | null
          location: string | null
          mandato_id: string
          match_reason: string | null
          match_score: number | null
          match_type: string | null
          notes: string | null
          priority: string | null
          sector: string | null
          source: string | null
          source_id: string | null
          stage: string | null
          updated_at: string | null
          valuation_id: string | null
        }
        Insert: {
          admin_lead_id?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          company_cif?: string | null
          company_email_domain?: string | null
          company_name: string
          company_website?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          last_activity_at?: string | null
          location?: string | null
          mandato_id: string
          match_reason?: string | null
          match_score?: number | null
          match_type?: string | null
          notes?: string | null
          priority?: string | null
          sector?: string | null
          source?: string | null
          source_id?: string | null
          stage?: string | null
          updated_at?: string | null
          valuation_id?: string | null
        }
        Update: {
          admin_lead_id?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          company_cif?: string | null
          company_email_domain?: string | null
          company_name?: string
          company_website?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          last_activity_at?: string | null
          location?: string | null
          mandato_id?: string
          match_reason?: string | null
          match_score?: number | null
          match_type?: string | null
          notes?: string | null
          priority?: string | null
          sector?: string | null
          source?: string | null
          source_id?: string | null
          stage?: string | null
          updated_at?: string | null
          valuation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mandate_leads_admin_lead_id_fkey"
            columns: ["admin_lead_id"]
            isOneToOne: false
            referencedRelation: "admin_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mandate_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mandate_leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "mandate_leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_leads_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandate_leads_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_leads_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandate_leads_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_leads_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_leads_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandate_leads_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "company_valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_leads_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      mandato_activity: {
        Row: {
          activity_description: string | null
          activity_type: string
          created_at: string
          created_by: string | null
          entity_id: string | null
          id: string
          mandato_id: string
        }
        Insert: {
          activity_description?: string | null
          activity_type: string
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          id?: string
          mandato_id: string
        }
        Update: {
          activity_description?: string | null
          activity_type?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          id?: string
          mandato_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandato_activity_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_activity_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_activity_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_activity_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_activity_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_activity_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
        ]
      }
      mandato_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          mandato_id: string | null
          metadata: Json | null
          severity: string
          title: string
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          mandato_id?: string | null
          metadata?: Json | null
          severity?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          mandato_id?: string | null
          metadata?: Json | null
          severity?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mandato_alerts_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_alerts_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_alerts_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_alerts_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_alerts_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_alerts_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
        ]
      }
      mandato_checklist_task_files: {
        Row: {
          created_at: string | null
          description: string | null
          file_category: string | null
          file_name: string
          file_path: string
          file_size_bytes: number
          id: string
          mime_type: string
          task_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_category?: string | null
          file_name: string
          file_path: string
          file_size_bytes: number
          id?: string
          mime_type: string
          task_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_category?: string | null
          file_name?: string
          file_path?: string
          file_size_bytes?: number
          id?: string
          mime_type?: string
          task_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mandato_checklist_task_files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "mandato_checklist_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_checklist_task_files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_time_summary"
            referencedColumns: ["task_id"]
          },
        ]
      }
      mandato_checklist_tasks: {
        Row: {
          ai_generated: boolean | null
          created_at: string | null
          dependencias: string[] | null
          descripcion: string | null
          duracion_estimada_dias: number | null
          es_critica: boolean | null
          estado: string
          fase: string
          fecha_completada: string | null
          fecha_inicio: string | null
          fecha_limite: string | null
          id: string
          mandato_id: string
          notas: string | null
          orden: number
          responsable: string | null
          sistema: string | null
          source_text: string | null
          tarea: string
          tipo_operacion: string | null
          updated_at: string | null
          url_relacionada: string | null
          workstream: Database["public"]["Enums"]["dd_workstream"] | null
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string | null
          dependencias?: string[] | null
          descripcion?: string | null
          duracion_estimada_dias?: number | null
          es_critica?: boolean | null
          estado?: string
          fase: string
          fecha_completada?: string | null
          fecha_inicio?: string | null
          fecha_limite?: string | null
          id?: string
          mandato_id: string
          notas?: string | null
          orden?: number
          responsable?: string | null
          sistema?: string | null
          source_text?: string | null
          tarea: string
          tipo_operacion?: string | null
          updated_at?: string | null
          url_relacionada?: string | null
          workstream?: Database["public"]["Enums"]["dd_workstream"] | null
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string | null
          dependencias?: string[] | null
          descripcion?: string | null
          duracion_estimada_dias?: number | null
          es_critica?: boolean | null
          estado?: string
          fase?: string
          fecha_completada?: string | null
          fecha_inicio?: string | null
          fecha_limite?: string | null
          id?: string
          mandato_id?: string
          notas?: string | null
          orden?: number
          responsable?: string | null
          sistema?: string | null
          source_text?: string | null
          tarea?: string
          tipo_operacion?: string | null
          updated_at?: string | null
          url_relacionada?: string | null
          workstream?: Database["public"]["Enums"]["dd_workstream"] | null
        }
        Relationships: [
          {
            foreignKeyName: "mandato_checklist_tasks_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_checklist_tasks_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_checklist_tasks_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_checklist_tasks_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_checklist_tasks_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_checklist_tasks_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
        ]
      }
      mandato_checklist_templates: {
        Row: {
          activo: boolean | null
          created_at: string | null
          dependencias: string[] | null
          descripcion: string | null
          duracion_estimada_dias: number | null
          es_critica: boolean | null
          fase: string
          id: string
          orden: number
          responsable: string | null
          sistema: string | null
          tarea: string
          tipo_operacion: string | null
          workstream: Database["public"]["Enums"]["dd_workstream"] | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          dependencias?: string[] | null
          descripcion?: string | null
          duracion_estimada_dias?: number | null
          es_critica?: boolean | null
          fase: string
          id?: string
          orden: number
          responsable?: string | null
          sistema?: string | null
          tarea: string
          tipo_operacion?: string | null
          workstream?: Database["public"]["Enums"]["dd_workstream"] | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          dependencias?: string[] | null
          descripcion?: string | null
          duracion_estimada_dias?: number | null
          es_critica?: boolean | null
          fase?: string
          id?: string
          orden?: number
          responsable?: string | null
          sistema?: string | null
          tarea?: string
          tipo_operacion?: string | null
          workstream?: Database["public"]["Enums"]["dd_workstream"] | null
        }
        Relationships: []
      }
      mandato_contactos: {
        Row: {
          contacto_id: string
          created_at: string | null
          id: string
          mandato_id: string
          notas: string | null
          rol: string
        }
        Insert: {
          contacto_id: string
          created_at?: string | null
          id?: string
          mandato_id: string
          notas?: string | null
          rol: string
        }
        Update: {
          contacto_id?: string
          created_at?: string | null
          id?: string
          mandato_id?: string
          notas?: string | null
          rol?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandato_contactos_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_contactos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_contactos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_contactos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_contactos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_contactos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_contactos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
        ]
      }
      mandato_documentos: {
        Row: {
          created_at: string | null
          descripcion: string | null
          file_name: string
          file_size_bytes: number
          id: string
          mandato_id: string
          mime_type: string
          storage_path: string
          tipo: Database["public"]["Enums"]["documento_tipo"]
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          file_name: string
          file_size_bytes: number
          id?: string
          mandato_id: string
          mime_type: string
          storage_path: string
          tipo?: Database["public"]["Enums"]["documento_tipo"]
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          file_name?: string
          file_size_bytes?: number
          id?: string
          mandato_id?: string
          mime_type?: string
          storage_path?: string
          tipo?: Database["public"]["Enums"]["documento_tipo"]
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      mandato_empresa_scoring: {
        Row: {
          created_at: string
          fit_cultural: number
          fit_estrategico: number
          fit_financiero: number
          id: string
          mandato_empresa_id: string
          notas: string | null
          score_total: number | null
          scored_at: string | null
          scored_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fit_cultural?: number
          fit_estrategico?: number
          fit_financiero?: number
          id?: string
          mandato_empresa_id: string
          notas?: string | null
          score_total?: number | null
          scored_at?: string | null
          scored_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fit_cultural?: number
          fit_estrategico?: number
          fit_financiero?: number
          id?: string
          mandato_empresa_id?: string
          notas?: string | null
          score_total?: number | null
          scored_at?: string | null
          scored_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandato_empresa_scoring_mandato_empresa_id_fkey"
            columns: ["mandato_empresa_id"]
            isOneToOne: true
            referencedRelation: "mandato_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      mandato_empresas: {
        Row: {
          buyer_type: string | null
          conflicto_descripcion: string | null
          created_at: string | null
          empresa_id: string
          funnel_stage: string | null
          geografia: string | null
          id: string
          mandato_id: string
          match_score: number | null
          no_contactar: boolean | null
          no_contactar_motivo: string | null
          notas: string | null
          notas_internas: string | null
          pipeline_stage_changed_at: string | null
          pipeline_stage_target: string | null
          rol: string
          tags: string[] | null
          tiene_conflicto: boolean | null
        }
        Insert: {
          buyer_type?: string | null
          conflicto_descripcion?: string | null
          created_at?: string | null
          empresa_id: string
          funnel_stage?: string | null
          geografia?: string | null
          id?: string
          mandato_id: string
          match_score?: number | null
          no_contactar?: boolean | null
          no_contactar_motivo?: string | null
          notas?: string | null
          notas_internas?: string | null
          pipeline_stage_changed_at?: string | null
          pipeline_stage_target?: string | null
          rol: string
          tags?: string[] | null
          tiene_conflicto?: boolean | null
        }
        Update: {
          buyer_type?: string | null
          conflicto_descripcion?: string | null
          created_at?: string | null
          empresa_id?: string
          funnel_stage?: string | null
          geografia?: string | null
          id?: string
          mandato_id?: string
          match_score?: number | null
          no_contactar?: boolean | null
          no_contactar_motivo?: string | null
          notas?: string | null
          notas_internas?: string | null
          pipeline_stage_changed_at?: string | null
          pipeline_stage_target?: string | null
          rol?: string
          tags?: string[] | null
          tiene_conflicto?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "mandato_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "mandato_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_empresas_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_empresas_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_empresas_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_empresas_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_empresas_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_empresas_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
        ]
      }
      mandato_kanban_config: {
        Row: {
          activo: boolean | null
          color: string
          created_at: string | null
          fase_id: string
          id: string
          label: string
          orden: number
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          color: string
          created_at?: string | null
          fase_id: string
          id?: string
          label: string
          orden: number
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          color?: string
          created_at?: string | null
          fase_id?: string
          id?: string
          label?: string
          orden?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      mandato_time_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contacto_id: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string
          duration_minutes: number | null
          edit_count: number | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          end_time: string | null
          id: string
          is_billable: boolean | null
          is_deleted: boolean | null
          mandate_lead_id: string | null
          mandato_id: string | null
          notes: string | null
          rejection_reason: string | null
          start_time: string
          status: string | null
          task_id: string | null
          updated_at: string | null
          user_id: string
          value_type:
            | Database["public"]["Enums"]["time_entry_value_type"]
            | null
          work_task_type_id: string | null
          work_type: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contacto_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description: string
          duration_minutes?: number | null
          edit_count?: number | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          end_time?: string | null
          id?: string
          is_billable?: boolean | null
          is_deleted?: boolean | null
          mandate_lead_id?: string | null
          mandato_id?: string | null
          notes?: string | null
          rejection_reason?: string | null
          start_time: string
          status?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_id: string
          value_type?:
            | Database["public"]["Enums"]["time_entry_value_type"]
            | null
          work_task_type_id?: string | null
          work_type: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contacto_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string
          duration_minutes?: number | null
          edit_count?: number | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          end_time?: string | null
          id?: string
          is_billable?: boolean | null
          is_deleted?: boolean | null
          mandate_lead_id?: string | null
          mandato_id?: string | null
          notes?: string | null
          rejection_reason?: string | null
          start_time?: string
          status?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_id?: string
          value_type?:
            | Database["public"]["Enums"]["time_entry_value_type"]
            | null
          work_task_type_id?: string | null
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandato_time_entries_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_time_entries_mandate_lead_id_fkey"
            columns: ["mandate_lead_id"]
            isOneToOne: false
            referencedRelation: "mandate_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_time_entries_mandate_lead_id_fkey"
            columns: ["mandate_lead_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandate_lead_id"]
          },
          {
            foreignKeyName: "mandato_time_entries_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_time_entries_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_time_entries_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_time_entries_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_time_entries_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_time_entries_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "mandato_checklist_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_time_summary"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "mandato_time_entries_work_task_type_id_fkey"
            columns: ["work_task_type_id"]
            isOneToOne: false
            referencedRelation: "work_task_types"
            referencedColumns: ["id"]
          },
        ]
      }
      mandato_transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string
          id: string
          mandato_id: string
          notes: string | null
          payment_method: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description: string
          id?: string
          mandato_id: string
          notes?: string | null
          payment_method?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          id?: string
          mandato_id?: string
          notes?: string | null
          payment_method?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandato_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mandato_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mandatos: {
        Row: {
          brevo_deal_id: string | null
          brevo_synced_at: string | null
          categoria: string
          ccaa_disponible: boolean | null
          ccaa_fecha: string | null
          cliente_externo: string | null
          closed_at: string | null
          closed_by: string | null
          codigo: string | null
          created_at: string | null
          days_in_stage: number | null
          descripcion: string | null
          doc_datapack: string | null
          doc_im: string | null
          doc_rod: string | null
          doc_teaser: string | null
          doc_valoracion: string | null
          empresa_principal_id: string | null
          es_interno: boolean | null
          estado: string
          estado_negociacion: string | null
          estructura_honorarios: string | null
          expected_close_date: string | null
          external_operation_id: string | null
          external_source: string | null
          external_synced_at: string | null
          fecha_cierre: string | null
          fecha_inicio: string | null
          honorarios_aceptados: number | null
          honorarios_propuestos: number | null
          id: string
          import_log_id: string | null
          is_favorite: boolean | null
          last_activity_at: string | null
          loss_notes: string | null
          loss_reason: Database["public"]["Enums"]["loss_reason_type"] | null
          nombre_proyecto: string | null
          numero_ofertas_recibidas: number | null
          outcome: Database["public"]["Enums"]["mandato_outcome"] | null
          parent_mandato_id: string | null
          perfil_empresa_buscada: string | null
          pipeline_stage: string | null
          platform_arx: string | null
          platform_deale: string | null
          platform_dealsuite: string | null
          potencial_searchfund: boolean | null
          prioridad: string | null
          probability: number | null
          rango_inversion_max: number | null
          rango_inversion_min: number | null
          sectores_interes: string[] | null
          servicio_tipo: string | null
          stage_entered_at: string | null
          timeline_objetivo: string | null
          tipo: string
          tipo_comprador_buscado: string | null
          updated_at: string | null
          url_publica: string | null
          valor: number | null
          valoracion_esperada: number | null
          weighted_value: number | null
          won_value: number | null
        }
        Insert: {
          brevo_deal_id?: string | null
          brevo_synced_at?: string | null
          categoria?: string
          ccaa_disponible?: boolean | null
          ccaa_fecha?: string | null
          cliente_externo?: string | null
          closed_at?: string | null
          closed_by?: string | null
          codigo?: string | null
          created_at?: string | null
          days_in_stage?: number | null
          descripcion?: string | null
          doc_datapack?: string | null
          doc_im?: string | null
          doc_rod?: string | null
          doc_teaser?: string | null
          doc_valoracion?: string | null
          empresa_principal_id?: string | null
          es_interno?: boolean | null
          estado?: string
          estado_negociacion?: string | null
          estructura_honorarios?: string | null
          expected_close_date?: string | null
          external_operation_id?: string | null
          external_source?: string | null
          external_synced_at?: string | null
          fecha_cierre?: string | null
          fecha_inicio?: string | null
          honorarios_aceptados?: number | null
          honorarios_propuestos?: number | null
          id?: string
          import_log_id?: string | null
          is_favorite?: boolean | null
          last_activity_at?: string | null
          loss_notes?: string | null
          loss_reason?: Database["public"]["Enums"]["loss_reason_type"] | null
          nombre_proyecto?: string | null
          numero_ofertas_recibidas?: number | null
          outcome?: Database["public"]["Enums"]["mandato_outcome"] | null
          parent_mandato_id?: string | null
          perfil_empresa_buscada?: string | null
          pipeline_stage?: string | null
          platform_arx?: string | null
          platform_deale?: string | null
          platform_dealsuite?: string | null
          potencial_searchfund?: boolean | null
          prioridad?: string | null
          probability?: number | null
          rango_inversion_max?: number | null
          rango_inversion_min?: number | null
          sectores_interes?: string[] | null
          servicio_tipo?: string | null
          stage_entered_at?: string | null
          timeline_objetivo?: string | null
          tipo?: string
          tipo_comprador_buscado?: string | null
          updated_at?: string | null
          url_publica?: string | null
          valor?: number | null
          valoracion_esperada?: number | null
          weighted_value?: number | null
          won_value?: number | null
        }
        Update: {
          brevo_deal_id?: string | null
          brevo_synced_at?: string | null
          categoria?: string
          ccaa_disponible?: boolean | null
          ccaa_fecha?: string | null
          cliente_externo?: string | null
          closed_at?: string | null
          closed_by?: string | null
          codigo?: string | null
          created_at?: string | null
          days_in_stage?: number | null
          descripcion?: string | null
          doc_datapack?: string | null
          doc_im?: string | null
          doc_rod?: string | null
          doc_teaser?: string | null
          doc_valoracion?: string | null
          empresa_principal_id?: string | null
          es_interno?: boolean | null
          estado?: string
          estado_negociacion?: string | null
          estructura_honorarios?: string | null
          expected_close_date?: string | null
          external_operation_id?: string | null
          external_source?: string | null
          external_synced_at?: string | null
          fecha_cierre?: string | null
          fecha_inicio?: string | null
          honorarios_aceptados?: number | null
          honorarios_propuestos?: number | null
          id?: string
          import_log_id?: string | null
          is_favorite?: boolean | null
          last_activity_at?: string | null
          loss_notes?: string | null
          loss_reason?: Database["public"]["Enums"]["loss_reason_type"] | null
          nombre_proyecto?: string | null
          numero_ofertas_recibidas?: number | null
          outcome?: Database["public"]["Enums"]["mandato_outcome"] | null
          parent_mandato_id?: string | null
          perfil_empresa_buscada?: string | null
          pipeline_stage?: string | null
          platform_arx?: string | null
          platform_deale?: string | null
          platform_dealsuite?: string | null
          potencial_searchfund?: boolean | null
          prioridad?: string | null
          probability?: number | null
          rango_inversion_max?: number | null
          rango_inversion_min?: number | null
          sectores_interes?: string[] | null
          servicio_tipo?: string | null
          stage_entered_at?: string | null
          timeline_objetivo?: string | null
          tipo?: string
          tipo_comprador_buscado?: string | null
          updated_at?: string | null
          url_publica?: string | null
          valor?: number | null
          valoracion_esperada?: number | null
          weighted_value?: number | null
          won_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mandatos_empresa_principal_id_fkey"
            columns: ["empresa_principal_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandatos_empresa_principal_id_fkey"
            columns: ["empresa_principal_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "mandatos_empresa_principal_id_fkey"
            columns: ["empresa_principal_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandatos_import_log_id_fkey"
            columns: ["import_log_id"]
            isOneToOne: false
            referencedRelation: "import_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandatos_parent_mandato_id_fkey"
            columns: ["parent_mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandatos_parent_mandato_id_fkey"
            columns: ["parent_mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandatos_parent_mandato_id_fkey"
            columns: ["parent_mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandatos_parent_mandato_id_fkey"
            columns: ["parent_mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandatos_parent_mandato_id_fkey"
            columns: ["parent_mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandatos_parent_mandato_id_fkey"
            columns: ["parent_mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
        ]
      }
      market_reports: {
        Row: {
          category: string
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          download_count: number | null
          file_url: string | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          pages: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          pages?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          pages?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      message_logs: {
        Row: {
          created_at: string
          error_details: string | null
          id: string
          payload_summary: Json | null
          provider_id: string | null
          provider_name: string | null
          recipient: string | null
          retry_count: number | null
          status: string
          type: string
          valuation_id: string | null
        }
        Insert: {
          created_at?: string
          error_details?: string | null
          id?: string
          payload_summary?: Json | null
          provider_id?: string | null
          provider_name?: string | null
          recipient?: string | null
          retry_count?: number | null
          status: string
          type: string
          valuation_id?: string | null
        }
        Update: {
          created_at?: string
          error_details?: string | null
          id?: string
          payload_summary?: Json | null
          provider_id?: string | null
          provider_name?: string | null
          recipient?: string | null
          retry_count?: number | null
          status?: string
          type?: string
          valuation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "company_valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      mna_apollo_imports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          credits_used: number | null
          error_count: number | null
          error_message: string | null
          id: string
          import_results: Json | null
          import_type: string | null
          imported_count: number | null
          preview_data: Json | null
          search_criteria: Json | null
          skipped_count: number | null
          started_at: string | null
          status: string | null
          total_results: number | null
          updated_count: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          credits_used?: number | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          import_results?: Json | null
          import_type?: string | null
          imported_count?: number | null
          preview_data?: Json | null
          search_criteria?: Json | null
          skipped_count?: number | null
          started_at?: string | null
          status?: string | null
          total_results?: number | null
          updated_count?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          credits_used?: number | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          import_results?: Json | null
          import_type?: string | null
          imported_count?: number | null
          preview_data?: Json | null
          search_criteria?: Json | null
          skipped_count?: number | null
          started_at?: string | null
          status?: string | null
          total_results?: number | null
          updated_count?: number | null
        }
        Relationships: []
      }
      mna_boutique_deals: {
        Row: {
          acquirer_name: string | null
          boutique_id: string
          company_name: string
          country: string | null
          created_at: string
          deal_type: string | null
          deal_value: number | null
          deal_value_currency: string | null
          deal_year: number | null
          deleted_at: string | null
          description: string | null
          id: string
          is_deleted: boolean | null
          notes: string | null
          role_in_deal: string | null
          sector: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          acquirer_name?: string | null
          boutique_id: string
          company_name: string
          country?: string | null
          created_at?: string
          deal_type?: string | null
          deal_value?: number | null
          deal_value_currency?: string | null
          deal_year?: number | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          role_in_deal?: string | null
          sector?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          acquirer_name?: string | null
          boutique_id?: string
          company_name?: string
          country?: string | null
          created_at?: string
          deal_type?: string | null
          deal_value?: number | null
          deal_value_currency?: string | null
          deal_year?: number | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          role_in_deal?: string | null
          sector?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mna_boutique_deals_boutique_id_fkey"
            columns: ["boutique_id"]
            isOneToOne: false
            referencedRelation: "mna_boutiques"
            referencedColumns: ["id"]
          },
        ]
      }
      mna_boutique_favorites: {
        Row: {
          added_by: string | null
          boutique_id: string
          created_at: string | null
          id: string
          notes: string | null
        }
        Insert: {
          added_by?: string | null
          boutique_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          added_by?: string | null
          boutique_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mna_boutique_favorites_boutique_id_fkey"
            columns: ["boutique_id"]
            isOneToOne: true
            referencedRelation: "mna_boutiques"
            referencedColumns: ["id"]
          },
        ]
      }
      mna_boutique_people: {
        Row: {
          boutique_id: string
          created_at: string
          deleted_at: string | null
          email: string | null
          full_name: string
          id: string
          is_deleted: boolean | null
          is_primary_contact: boolean | null
          linkedin_url: string | null
          location: string | null
          notes: string | null
          phone: string | null
          role: string | null
          sector_expertise: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          boutique_id: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_deleted?: boolean | null
          is_primary_contact?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          sector_expertise?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          boutique_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_deleted?: boolean | null
          is_primary_contact?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          sector_expertise?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mna_boutique_people_boutique_id_fkey"
            columns: ["boutique_id"]
            isOneToOne: false
            referencedRelation: "mna_boutiques"
            referencedColumns: ["id"]
          },
        ]
      }
      mna_boutiques: {
        Row: {
          apollo_last_synced_at: string | null
          apollo_org_id: string | null
          apollo_raw_data: Json | null
          cities: string[] | null
          country_base: string | null
          created_at: string
          deal_size_max: number | null
          deal_size_min: number | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          employee_count: number | null
          employee_count_source: string | null
          founded_year: number | null
          geography_focus: string[] | null
          id: string
          import_source: string | null
          is_deleted: boolean | null
          linkedin_url: string | null
          name: string
          notes_internal: string | null
          sector_focus: string[] | null
          source_url: string | null
          specialization: string[] | null
          status: string | null
          tier: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          apollo_last_synced_at?: string | null
          apollo_org_id?: string | null
          apollo_raw_data?: Json | null
          cities?: string[] | null
          country_base?: string | null
          created_at?: string
          deal_size_max?: number | null
          deal_size_min?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          employee_count?: number | null
          employee_count_source?: string | null
          founded_year?: number | null
          geography_focus?: string[] | null
          id?: string
          import_source?: string | null
          is_deleted?: boolean | null
          linkedin_url?: string | null
          name: string
          notes_internal?: string | null
          sector_focus?: string[] | null
          source_url?: string | null
          specialization?: string[] | null
          status?: string | null
          tier?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          apollo_last_synced_at?: string | null
          apollo_org_id?: string | null
          apollo_raw_data?: Json | null
          cities?: string[] | null
          country_base?: string | null
          created_at?: string
          deal_size_max?: number | null
          deal_size_min?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          employee_count?: number | null
          employee_count_source?: string | null
          founded_year?: number | null
          geography_focus?: string[] | null
          id?: string
          import_source?: string | null
          is_deleted?: boolean | null
          linkedin_url?: string | null
          name?: string
          notes_internal?: string | null
          sector_focus?: string[] | null
          source_url?: string | null
          specialization?: string[] | null
          status?: string | null
          tier?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      nda_tracking_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          performed_by: string | null
          recipient_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          recipient_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nda_tracking_events_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "teaser_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          ai_metadata: Json | null
          author_avatar_url: string | null
          author_name: string
          auto_published: boolean | null
          buyer: string | null
          category: string
          content: string
          created_at: string
          deal_type: string | null
          deal_value: string | null
          deleted_at: string | null
          deleted_by: string | null
          excerpt: string | null
          featured_image_url: string | null
          fetched_at: string | null
          id: string
          is_deleted: boolean | null
          is_featured: boolean | null
          is_processed: boolean | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          processed_at: string | null
          published_at: string | null
          read_time: number | null
          rejection_reason: string | null
          relevance_score: number | null
          search_vector: unknown
          seller: string | null
          slug: string
          source_name: string | null
          source_url: string | null
          tags: string[] | null
          target_company: string | null
          title: string
          title_hash: string | null
          updated_at: string
        }
        Insert: {
          ai_metadata?: Json | null
          author_avatar_url?: string | null
          author_name?: string
          auto_published?: boolean | null
          buyer?: string | null
          category: string
          content: string
          created_at?: string
          deal_type?: string | null
          deal_value?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          fetched_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_featured?: boolean | null
          is_processed?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          processed_at?: string | null
          published_at?: string | null
          read_time?: number | null
          rejection_reason?: string | null
          relevance_score?: number | null
          search_vector?: unknown
          seller?: string | null
          slug: string
          source_name?: string | null
          source_url?: string | null
          tags?: string[] | null
          target_company?: string | null
          title: string
          title_hash?: string | null
          updated_at?: string
        }
        Update: {
          ai_metadata?: Json | null
          author_avatar_url?: string | null
          author_name?: string
          auto_published?: boolean | null
          buyer?: string | null
          category?: string
          content?: string
          created_at?: string
          deal_type?: string | null
          deal_value?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          fetched_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_featured?: boolean | null
          is_processed?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          processed_at?: string | null
          published_at?: string | null
          read_time?: number | null
          rejection_reason?: string | null
          relevance_score?: number | null
          search_vector?: unknown
          seller?: string | null
          slug?: string
          source_name?: string | null
          source_url?: string | null
          tags?: string[] | null
          target_company?: string | null
          title?: string
          title_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_campaigns: {
        Row: {
          articles_included: string[] | null
          buy_side_mandates_included: string[] | null
          click_count: number | null
          content_blocks: Json | null
          created_at: string | null
          error_message: string | null
          header_image_url: string | null
          html_content: string | null
          id: string
          intro_text: string | null
          notes: string | null
          open_count: number | null
          operations_included: string[] | null
          preview_text: string | null
          recipients_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          sent_by: string | null
          sent_via: string | null
          status: string
          subject: string
          type: string | null
          unsubscribe_count: number | null
          updated_at: string | null
        }
        Insert: {
          articles_included?: string[] | null
          buy_side_mandates_included?: string[] | null
          click_count?: number | null
          content_blocks?: Json | null
          created_at?: string | null
          error_message?: string | null
          header_image_url?: string | null
          html_content?: string | null
          id?: string
          intro_text?: string | null
          notes?: string | null
          open_count?: number | null
          operations_included?: string[] | null
          preview_text?: string | null
          recipients_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by?: string | null
          sent_via?: string | null
          status?: string
          subject: string
          type?: string | null
          unsubscribe_count?: number | null
          updated_at?: string | null
        }
        Update: {
          articles_included?: string[] | null
          buy_side_mandates_included?: string[] | null
          click_count?: number | null
          content_blocks?: Json | null
          created_at?: string | null
          error_message?: string | null
          header_image_url?: string | null
          html_content?: string | null
          id?: string
          intro_text?: string | null
          notes?: string | null
          open_count?: number | null
          operations_included?: string[] | null
          preview_text?: string | null
          recipients_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by?: string | null
          sent_via?: string | null
          status?: string
          subject?: string
          type?: string | null
          unsubscribe_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_snippets: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          html_content: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          preview_image_url: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          html_content: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          preview_image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          preview_image_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          interests: string[] | null
          ip_address: unknown
          is_active: boolean
          name: string | null
          source: string | null
          subscribed_at: string
          unsubscribe_token: string | null
          unsubscribed_at: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          interests?: string[] | null
          ip_address?: unknown
          is_active?: boolean
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribe_token?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          interests?: string[] | null
          ip_address?: unknown
          is_active?: boolean
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribe_token?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      newsletter_template_versions: {
        Row: {
          campaign_id: string | null
          content_blocks: Json | null
          created_at: string
          created_by: string | null
          header_image_url: string | null
          html_content: string
          id: string
          intro_text: string | null
          notes: string | null
          subject: string | null
          version_name: string | null
          version_number: number
        }
        Insert: {
          campaign_id?: string | null
          content_blocks?: Json | null
          created_at?: string
          created_by?: string | null
          header_image_url?: string | null
          html_content: string
          id?: string
          intro_text?: string | null
          notes?: string | null
          subject?: string | null
          version_name?: string | null
          version_number?: number
        }
        Update: {
          campaign_id?: string | null
          content_blocks?: Json | null
          created_at?: string
          created_by?: string | null
          header_image_url?: string | null
          html_content?: string
          id?: string
          intro_text?: string | null
          notes?: string | null
          subject?: string | null
          version_name?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_template_versions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "newsletter_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_theme_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      note_mentions: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          mentioned_user_id: string | null
          note_id: string | null
          read_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          mentioned_user_id?: string | null
          note_id?: string | null
          read_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          mentioned_user_id?: string | null
          note_id?: string | null
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_mentions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "operation_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_document_downloads: {
        Row: {
          document_id: string
          downloaded_at: string
          downloaded_by: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          document_id: string
          downloaded_at?: string
          downloaded_by?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          document_id?: string
          downloaded_at?: string
          downloaded_by?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operation_document_downloads_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "operation_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_documents: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          download_count: number
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_deleted: boolean
          is_latest_version: boolean
          operation_id: string
          parent_document_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["document_status"]
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          download_count?: number
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_deleted?: boolean
          is_latest_version?: boolean
          operation_id: string
          parent_document_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          download_count?: number
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_deleted?: boolean
          is_latest_version?: boolean
          operation_id?: string
          parent_document_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "operation_documents_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "company_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "operation_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_history: {
        Row: {
          change_type: string
          changed_at: string
          changed_by: string | null
          created_at: string
          field_changed: string
          id: string
          ip_address: unknown
          new_value: Json | null
          old_value: Json | null
          operation_id: string
          user_agent: string | null
        }
        Insert: {
          change_type: string
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          field_changed: string
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          operation_id: string
          user_agent?: string | null
        }
        Update: {
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          field_changed?: string
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          operation_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operation_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "operation_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "operation_history_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "company_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_inquiries: {
        Row: {
          company_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          ip_address: unknown
          message: string
          operation_id: string
          phone: string | null
          referrer: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          company_name: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          ip_address?: unknown
          message: string
          operation_id: string
          phone?: string | null
          referrer?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          ip_address?: unknown
          message?: string
          operation_id?: string
          phone?: string | null
          referrer?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      operation_notes: {
        Row: {
          attachments: Json | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          is_internal: boolean | null
          mentions: Json | null
          note_html: string | null
          note_text: string
          operation_id: string | null
          parent_note_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_internal?: boolean | null
          mentions?: Json | null
          note_html?: string | null
          note_text: string
          operation_id?: string | null
          parent_note_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_internal?: boolean | null
          mentions?: Json | null
          note_html?: string | null
          note_text?: string
          operation_id?: string | null
          parent_note_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operation_notes_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "company_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_notes_parent_note_id_fkey"
            columns: ["parent_note_id"]
            isOneToOne: false
            referencedRelation: "operation_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_shares: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          operation_id: string
          referrer: string | null
          session_id: string | null
          share_method: string
          source_page: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown
          operation_id: string
          referrer?: string | null
          session_id?: string | null
          share_method: string
          source_page?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          operation_id?: string
          referrer?: string | null
          session_id?: string | null
          share_method?: string
          source_page?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operation_shares_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "company_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_sync_log: {
        Row: {
          duration_ms: number | null
          empresas_created: number | null
          errors: Json | null
          errors_count: number | null
          executed_at: string | null
          id: string
          mandatos_created: number | null
          mandatos_updated: number | null
          operations_processed: number | null
          status: string | null
          triggered_by: string | null
        }
        Insert: {
          duration_ms?: number | null
          empresas_created?: number | null
          errors?: Json | null
          errors_count?: number | null
          executed_at?: string | null
          id?: string
          mandatos_created?: number | null
          mandatos_updated?: number | null
          operations_processed?: number | null
          status?: string | null
          triggered_by?: string | null
        }
        Update: {
          duration_ms?: number | null
          empresas_created?: number | null
          errors?: Json | null
          errors_count?: number | null
          executed_at?: string | null
          id?: string
          mandatos_created?: number | null
          mandatos_updated?: number | null
          operations_processed?: number | null
          status?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      operation_views: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          operation_id: string
          referrer: string | null
          session_id: string
          source_page: string | null
          user_agent: string | null
          view_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown
          operation_id: string
          referrer?: string | null
          session_id: string
          source_page?: string | null
          user_agent?: string | null
          view_type: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          operation_id?: string
          referrer?: string | null
          session_id?: string
          source_page?: string | null
          user_agent?: string | null
          view_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "operation_views_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "company_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_campaigns: {
        Row: {
          apollo_keywords: string[] | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          credits_used: number | null
          description: string | null
          filters: Json
          id: string
          last_search_at: string | null
          name: string
          sector_id: string | null
          sector_name: string | null
          status: string
          total_enriched: number | null
          total_found: number | null
          total_imported: number | null
          updated_at: string
        }
        Insert: {
          apollo_keywords?: string[] | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          credits_used?: number | null
          description?: string | null
          filters?: Json
          id?: string
          last_search_at?: string | null
          name: string
          sector_id?: string | null
          sector_name?: string | null
          status?: string
          total_enriched?: number | null
          total_found?: number | null
          total_imported?: number | null
          updated_at?: string
        }
        Update: {
          apollo_keywords?: string[] | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          credits_used?: number | null
          description?: string | null
          filters?: Json
          id?: string
          last_search_at?: string | null
          name?: string
          sector_id?: string | null
          sector_name?: string | null
          status?: string
          total_enriched?: number | null
          total_found?: number | null
          total_imported?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_campaigns_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_prospects: {
        Row: {
          apellidos: string | null
          apollo_id: string | null
          apollo_org_id: string | null
          campaign_id: string
          cargo: string | null
          company_industry: string | null
          company_linkedin_url: string | null
          company_location: string | null
          company_revenue_range: string | null
          company_size: string | null
          created_at: string
          email: string | null
          email_status: string | null
          empresa: string | null
          enriched_at: string | null
          enrichment_status: string
          id: string
          import_status: string | null
          imported_at: string | null
          imported_lead_id: string | null
          is_selected: boolean | null
          linkedin_url: string | null
          nombre: string
          notes: string | null
          score: number | null
          telefono: string | null
          telefono_type: string | null
          updated_at: string
          website_domain: string | null
        }
        Insert: {
          apellidos?: string | null
          apollo_id?: string | null
          apollo_org_id?: string | null
          campaign_id: string
          cargo?: string | null
          company_industry?: string | null
          company_linkedin_url?: string | null
          company_location?: string | null
          company_revenue_range?: string | null
          company_size?: string | null
          created_at?: string
          email?: string | null
          email_status?: string | null
          empresa?: string | null
          enriched_at?: string | null
          enrichment_status?: string
          id?: string
          import_status?: string | null
          imported_at?: string | null
          imported_lead_id?: string | null
          is_selected?: boolean | null
          linkedin_url?: string | null
          nombre: string
          notes?: string | null
          score?: number | null
          telefono?: string | null
          telefono_type?: string | null
          updated_at?: string
          website_domain?: string | null
        }
        Update: {
          apellidos?: string | null
          apollo_id?: string | null
          apollo_org_id?: string | null
          campaign_id?: string
          cargo?: string | null
          company_industry?: string | null
          company_linkedin_url?: string | null
          company_location?: string | null
          company_revenue_range?: string | null
          company_size?: string | null
          created_at?: string
          email?: string | null
          email_status?: string | null
          empresa?: string | null
          enriched_at?: string | null
          enrichment_status?: string
          id?: string
          import_status?: string | null
          imported_at?: string | null
          imported_lead_id?: string | null
          is_selected?: boolean | null
          linkedin_url?: string | null
          nombre?: string
          notes?: string | null
          score?: number | null
          telefono?: string | null
          telefono_type?: string | null
          updated_at?: string
          website_domain?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outbound_prospects_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "outbound_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_download_logs: {
        Row: {
          created_at: string | null
          download_status: string
          file_size_bytes: number | null
          generation_time_ms: number | null
          id: string
          ip_address: unknown
          pdf_type: string
          user_agent: string | null
          user_id: string | null
          valuation_id: string | null
        }
        Insert: {
          created_at?: string | null
          download_status?: string
          file_size_bytes?: number | null
          generation_time_ms?: number | null
          id?: string
          ip_address?: unknown
          pdf_type: string
          user_agent?: string | null
          user_id?: string | null
          valuation_id?: string | null
        }
        Update: {
          created_at?: string | null
          download_status?: string
          file_size_bytes?: number | null
          generation_time_ms?: number | null
          id?: string
          ip_address?: unknown
          pdf_type?: string
          user_agent?: string | null
          user_id?: string | null
          valuation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_download_logs_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "company_valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_download_logs_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_signature_config: {
        Row: {
          config_key: string
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          name: string
          phone: string
          role: string
          updated_at: string
          website: string
        }
        Insert: {
          config_key?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string
          role?: string
          updated_at?: string
          website?: string
        }
        Update: {
          config_key?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string
          role?: string
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      pe_sector_taxonomy: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          name_en: string
          name_es: string
          parent_sector: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id: string
          is_active?: boolean | null
          keywords?: string[] | null
          name_en: string
          name_es: string
          parent_sector?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          name_en?: string
          name_es?: string
          parent_sector?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string | null
          default_probability: number
          description: string | null
          id: string
          is_active: boolean | null
          stage_key: string
          stage_name: string
          stage_order: number
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          default_probability?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          stage_key: string
          stage_name: string
          stage_order: number
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          default_probability?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          stage_key?: string
          stage_name?: string
          stage_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      portfolio_changes: {
        Row: {
          change_type: string
          company_name: string
          company_name_normalized: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          detected_at: string | null
          detected_data: Json | null
          dismiss_reason: string | null
          dismissed_at: string | null
          dismissed_by: string | null
          existing_portfolio_id: string | null
          fund_id: string
          id: string
          is_confirmed: boolean | null
          is_dismissed: boolean | null
          metadata: Json | null
        }
        Insert: {
          change_type: string
          company_name: string
          company_name_normalized?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          detected_at?: string | null
          detected_data?: Json | null
          dismiss_reason?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          existing_portfolio_id?: string | null
          fund_id: string
          id?: string
          is_confirmed?: boolean | null
          is_dismissed?: boolean | null
          metadata?: Json | null
        }
        Update: {
          change_type?: string
          company_name?: string
          company_name_normalized?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          detected_at?: string | null
          detected_data?: Json | null
          dismiss_reason?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          existing_portfolio_id?: string | null
          fund_id?: string
          id?: string
          is_confirmed?: boolean | null
          is_dismissed?: boolean | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_changes_existing_portfolio_id_fkey"
            columns: ["existing_portfolio_id"]
            isOneToOne: false
            referencedRelation: "cr_portfolio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_changes_existing_portfolio_id_fkey"
            columns: ["existing_portfolio_id"]
            isOneToOne: false
            referencedRelation: "v_cr_portfolio_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_changes_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "cr_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_companies: {
        Row: {
          country: string
          created_at: string
          description: string | null
          display_order: number | null
          founded_year: number | null
          id: string
          investment_date: string | null
          investment_thesis: string | null
          is_active: boolean | null
          is_featured: boolean | null
          logo_url: string | null
          metrics: Json | null
          name: string
          search_vector: unknown
          sector: string
          slug: string
          stage: string
          timeline: Json | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          country: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          founded_year?: number | null
          id?: string
          investment_date?: string | null
          investment_thesis?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          metrics?: Json | null
          name: string
          search_vector?: unknown
          sector: string
          slug: string
          stage: string
          timeline?: Json | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          country?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          founded_year?: number | null
          id?: string
          investment_date?: string | null
          investment_thesis?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          metrics?: Json | null
          name?: string
          search_vector?: unknown
          sector?: string
          slug?: string
          stage?: string
          timeline?: Json | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      portfolio_news: {
        Row: {
          ai_summary: string | null
          company_name: string
          content_preview: string | null
          created_at: string | null
          fund_id: string
          id: string
          is_acquisition_signal: boolean | null
          is_exit_signal: boolean | null
          is_processed: boolean | null
          metadata: Json | null
          news_date: string | null
          news_type: string | null
          portfolio_id: string | null
          relevance_score: number | null
          source_name: string | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          ai_summary?: string | null
          company_name: string
          content_preview?: string | null
          created_at?: string | null
          fund_id: string
          id?: string
          is_acquisition_signal?: boolean | null
          is_exit_signal?: boolean | null
          is_processed?: boolean | null
          metadata?: Json | null
          news_date?: string | null
          news_type?: string | null
          portfolio_id?: string | null
          relevance_score?: number | null
          source_name?: string | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          ai_summary?: string | null
          company_name?: string
          content_preview?: string | null
          created_at?: string | null
          fund_id?: string
          id?: string
          is_acquisition_signal?: boolean | null
          is_exit_signal?: boolean | null
          is_processed?: boolean | null
          metadata?: Json | null
          news_date?: string | null
          news_type?: string | null
          portfolio_id?: string | null
          relevance_score?: number | null
          source_name?: string | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_news_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "cr_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_news_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "cr_portfolio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_news_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "v_cr_portfolio_con_actividad"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_assets: {
        Row: {
          created_at: string | null
          created_by: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          metadata: Json | null
          name: string
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          metadata?: Json | null
          name: string
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "presentation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_audit_log: {
        Row: {
          action: string
          created_at: string | null
          created_by: string | null
          details: Json | null
          id: string
          ip_address: unknown
          project_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          created_by?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          project_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          created_by?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          project_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_audit_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "presentation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_comments: {
        Row: {
          author_email: string | null
          author_name: string
          content: string
          created_at: string | null
          id: string
          is_resolved: boolean | null
          parent_id: string | null
          project_id: string
          resolved_at: string | null
          resolved_by: string | null
          slide_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_email?: string | null
          author_name: string
          content: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          parent_id?: string | null
          project_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          slide_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_email?: string | null
          author_name?: string
          content?: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          parent_id?: string | null
          project_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          slide_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "presentation_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "presentation_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_comments_slide_id_fkey"
            columns: ["slide_id"]
            isOneToOne: false
            referencedRelation: "presentation_slides"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_projects: {
        Row: {
          brand_kit_id: string | null
          client_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          empresa_id: string | null
          id: string
          is_confidential: boolean | null
          metadata: Json | null
          project_code: string | null
          status: string | null
          theme: string | null
          title: string
          type: Database["public"]["Enums"]["presentation_type"]
          updated_at: string | null
        }
        Insert: {
          brand_kit_id?: string | null
          client_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          empresa_id?: string | null
          id?: string
          is_confidential?: boolean | null
          metadata?: Json | null
          project_code?: string | null
          status?: string | null
          theme?: string | null
          title: string
          type?: Database["public"]["Enums"]["presentation_type"]
          updated_at?: string | null
        }
        Update: {
          brand_kit_id?: string | null
          client_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          empresa_id?: string | null
          id?: string
          is_confidential?: boolean | null
          metadata?: Json | null
          project_code?: string | null
          status?: string | null
          theme?: string | null
          title?: string
          type?: Database["public"]["Enums"]["presentation_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_projects_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_projects_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentation_projects_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "presentation_projects_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_sharing_links: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          max_views: number | null
          password_hash: string | null
          permission: Database["public"]["Enums"]["share_permission"]
          project_id: string
          recipient_email: string | null
          recipient_name: string | null
          token: string
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          max_views?: number | null
          password_hash?: string | null
          permission?: Database["public"]["Enums"]["share_permission"]
          project_id: string
          recipient_email?: string | null
          recipient_name?: string | null
          token?: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          max_views?: number | null
          password_hash?: string | null
          permission?: Database["public"]["Enums"]["share_permission"]
          project_id?: string
          recipient_email?: string | null
          recipient_name?: string | null
          token?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_sharing_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "presentation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_slides: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          background_color: string | null
          background_image_url: string | null
          content: Json | null
          created_at: string | null
          headline: string | null
          id: string
          is_hidden: boolean | null
          is_locked: boolean | null
          layout: Database["public"]["Enums"]["slide_layout"]
          layout_variant: string | null
          notes: string | null
          order_index: number
          project_id: string
          subline: string | null
          text_color: string | null
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          background_color?: string | null
          background_image_url?: string | null
          content?: Json | null
          created_at?: string | null
          headline?: string | null
          id?: string
          is_hidden?: boolean | null
          is_locked?: boolean | null
          layout?: Database["public"]["Enums"]["slide_layout"]
          layout_variant?: string | null
          notes?: string | null
          order_index?: number
          project_id: string
          subline?: string | null
          text_color?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          background_color?: string | null
          background_image_url?: string | null
          content?: Json | null
          created_at?: string | null
          headline?: string | null
          id?: string
          is_hidden?: boolean | null
          is_locked?: boolean | null
          layout?: Database["public"]["Enums"]["slide_layout"]
          layout_variant?: string | null
          notes?: string | null
          order_index?: number
          project_id?: string
          subline?: string | null
          text_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_slides_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "presentation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_templates: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          slides_config: Json
          thumbnail_url: string | null
          type: Database["public"]["Enums"]["presentation_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          slides_config?: Json
          thumbnail_url?: string | null
          type: Database["public"]["Enums"]["presentation_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          slides_config?: Json
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["presentation_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      presentation_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          project_id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          project_id: string
          snapshot: Json
          version_number?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "presentation_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "presentation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_urls: {
        Row: {
          created_at: string | null
          fund_id: string | null
          id: string
          portfolio_company_id: string | null
          processed_at: string | null
          result_type: string | null
          source: string
          url: string
          url_hash: string
        }
        Insert: {
          created_at?: string | null
          fund_id?: string | null
          id?: string
          portfolio_company_id?: string | null
          processed_at?: string | null
          result_type?: string | null
          source: string
          url: string
          url_hash: string
        }
        Update: {
          created_at?: string | null
          fund_id?: string | null
          id?: string
          portfolio_company_id?: string | null
          processed_at?: string | null
          result_type?: string | null
          source?: string
          url?: string
          url_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "processed_urls_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "cr_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processed_urls_portfolio_company_id_fkey"
            columns: ["portfolio_company_id"]
            isOneToOne: false
            referencedRelation: "cr_portfolio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processed_urls_portfolio_company_id_fkey"
            columns: ["portfolio_company_id"]
            isOneToOne: false
            referencedRelation: "v_cr_portfolio_con_actividad"
            referencedColumns: ["id"]
          },
        ]
      }
      product_evaluations: {
        Row: {
          business_model: string
          churn_rate: string | null
          created_at: string | null
          data_ai_usage: string | null
          evaluation_result: Json | null
          goals_12_24_months: string
          id: string
          integrations: string | null
          ip_address: unknown
          main_problem: string
          mrr_amount: string | null
          overall_score: number | null
          pricing_model: string | null
          product_description: string
          product_name: string
          stage: string
          target_customer: string
          team_composition: string | null
          team_size: string | null
          tech_stack: string | null
          traction_notes: string | null
          updated_at: string | null
          user_agent: string | null
          user_email: string | null
          users_count: string | null
        }
        Insert: {
          business_model: string
          churn_rate?: string | null
          created_at?: string | null
          data_ai_usage?: string | null
          evaluation_result?: Json | null
          goals_12_24_months: string
          id?: string
          integrations?: string | null
          ip_address?: unknown
          main_problem: string
          mrr_amount?: string | null
          overall_score?: number | null
          pricing_model?: string | null
          product_description: string
          product_name: string
          stage: string
          target_customer: string
          team_composition?: string | null
          team_size?: string | null
          tech_stack?: string | null
          traction_notes?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_email?: string | null
          users_count?: string | null
        }
        Update: {
          business_model?: string
          churn_rate?: string | null
          created_at?: string | null
          data_ai_usage?: string | null
          evaluation_result?: Json | null
          goals_12_24_months?: string
          id?: string
          integrations?: string | null
          ip_address?: unknown
          main_problem?: string
          mrr_amount?: string | null
          overall_score?: number | null
          pricing_model?: string | null
          product_description?: string
          product_name?: string
          stage?: string
          target_customer?: string
          team_composition?: string | null
          team_size?: string | null
          tech_stack?: string | null
          traction_notes?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_email?: string | null
          users_count?: string | null
        }
        Relationships: []
      }
      professional_valuations: {
        Row: {
          advisor_email: string | null
          advisor_name: string | null
          advisor_phone: string | null
          advisor_role: string | null
          client_cif: string | null
          client_company: string
          client_email: string | null
          client_logo_url: string | null
          client_name: string
          client_phone: string | null
          comparable_operations: Json | null
          comparables_formatted_text: string | null
          comparables_raw_text: string | null
          created_at: string
          created_by: string | null
          ebitda_multiple_high: number | null
          ebitda_multiple_low: number | null
          ebitda_multiple_used: number | null
          email_message_id: string | null
          email_opened: boolean | null
          email_opened_at: string | null
          email_outbox_id: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          email_subject: string | null
          financial_years: Json
          id: string
          include_comparables: boolean | null
          internal_notes: string | null
          lead_source: string | null
          linked_lead_id: string | null
          linked_lead_type: string | null
          linked_operation_id: string | null
          multiple_justification: string | null
          normalization_adjustments: Json | null
          normalized_ebitda: number | null
          parent_id: string | null
          pdf_url: string | null
          reported_ebitda: number | null
          sector: string
          sector_description: string | null
          sensitivity_matrix: Json | null
          sent_at: string | null
          sent_to: string | null
          service_type: string | null
          status: string
          strengths: string | null
          sync_to_contacts: boolean | null
          updated_at: string
          use_custom_advisor: boolean | null
          valuation_central: number | null
          valuation_context: string | null
          valuation_high: number | null
          valuation_low: number | null
          version: number | null
          weaknesses: string | null
        }
        Insert: {
          advisor_email?: string | null
          advisor_name?: string | null
          advisor_phone?: string | null
          advisor_role?: string | null
          client_cif?: string | null
          client_company: string
          client_email?: string | null
          client_logo_url?: string | null
          client_name: string
          client_phone?: string | null
          comparable_operations?: Json | null
          comparables_formatted_text?: string | null
          comparables_raw_text?: string | null
          created_at?: string
          created_by?: string | null
          ebitda_multiple_high?: number | null
          ebitda_multiple_low?: number | null
          ebitda_multiple_used?: number | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_outbox_id?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          email_subject?: string | null
          financial_years?: Json
          id?: string
          include_comparables?: boolean | null
          internal_notes?: string | null
          lead_source?: string | null
          linked_lead_id?: string | null
          linked_lead_type?: string | null
          linked_operation_id?: string | null
          multiple_justification?: string | null
          normalization_adjustments?: Json | null
          normalized_ebitda?: number | null
          parent_id?: string | null
          pdf_url?: string | null
          reported_ebitda?: number | null
          sector: string
          sector_description?: string | null
          sensitivity_matrix?: Json | null
          sent_at?: string | null
          sent_to?: string | null
          service_type?: string | null
          status?: string
          strengths?: string | null
          sync_to_contacts?: boolean | null
          updated_at?: string
          use_custom_advisor?: boolean | null
          valuation_central?: number | null
          valuation_context?: string | null
          valuation_high?: number | null
          valuation_low?: number | null
          version?: number | null
          weaknesses?: string | null
        }
        Update: {
          advisor_email?: string | null
          advisor_name?: string | null
          advisor_phone?: string | null
          advisor_role?: string | null
          client_cif?: string | null
          client_company?: string
          client_email?: string | null
          client_logo_url?: string | null
          client_name?: string
          client_phone?: string | null
          comparable_operations?: Json | null
          comparables_formatted_text?: string | null
          comparables_raw_text?: string | null
          created_at?: string
          created_by?: string | null
          ebitda_multiple_high?: number | null
          ebitda_multiple_low?: number | null
          ebitda_multiple_used?: number | null
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_outbox_id?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          email_subject?: string | null
          financial_years?: Json
          id?: string
          include_comparables?: boolean | null
          internal_notes?: string | null
          lead_source?: string | null
          linked_lead_id?: string | null
          linked_lead_type?: string | null
          linked_operation_id?: string | null
          multiple_justification?: string | null
          normalization_adjustments?: Json | null
          normalized_ebitda?: number | null
          parent_id?: string | null
          pdf_url?: string | null
          reported_ebitda?: number | null
          sector?: string
          sector_description?: string | null
          sensitivity_matrix?: Json | null
          sent_at?: string | null
          sent_to?: string | null
          service_type?: string | null
          status?: string
          strengths?: string | null
          sync_to_contacts?: boolean | null
          updated_at?: string
          use_custom_advisor?: boolean | null
          valuation_central?: number | null
          valuation_context?: string | null
          valuation_high?: number | null
          valuation_low?: number | null
          version?: number | null
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_valuations_email_outbox_id_fkey"
            columns: ["email_outbox_id"]
            isOneToOne: false
            referencedRelation: "email_outbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_valuations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "professional_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      propuestas_honorarios: {
        Row: {
          alcance_dd: Json | null
          archivo_pdf_path: string | null
          clausulas_adicionales: Json | null
          cliente_cif: string | null
          cliente_domicilio: string | null
          condiciones_pago: string | null
          created_at: string
          created_by: string | null
          descripcion: string | null
          descripcion_transaccion: string | null
          desglose: Json | null
          empresa_cliente_id: string | null
          empresa_target_id: string | null
          estado: string
          estructura: string | null
          fecha_emision: string | null
          fecha_respuesta: string | null
          fecha_vencimiento: string | null
          firma_cliente: string | null
          firma_firma: string | null
          honorarios_negociacion: number | null
          id: string
          importe_total: number
          mandato_id: string
          motivo_rechazo: string | null
          notas_internas: string | null
          plantilla_tipo: string | null
          target_cif: string | null
          target_domicilio: string | null
          target_nombre: string | null
          titulo: string
          updated_at: string
          version: number
        }
        Insert: {
          alcance_dd?: Json | null
          archivo_pdf_path?: string | null
          clausulas_adicionales?: Json | null
          cliente_cif?: string | null
          cliente_domicilio?: string | null
          condiciones_pago?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          descripcion_transaccion?: string | null
          desglose?: Json | null
          empresa_cliente_id?: string | null
          empresa_target_id?: string | null
          estado?: string
          estructura?: string | null
          fecha_emision?: string | null
          fecha_respuesta?: string | null
          fecha_vencimiento?: string | null
          firma_cliente?: string | null
          firma_firma?: string | null
          honorarios_negociacion?: number | null
          id?: string
          importe_total?: number
          mandato_id: string
          motivo_rechazo?: string | null
          notas_internas?: string | null
          plantilla_tipo?: string | null
          target_cif?: string | null
          target_domicilio?: string | null
          target_nombre?: string | null
          titulo: string
          updated_at?: string
          version?: number
        }
        Update: {
          alcance_dd?: Json | null
          archivo_pdf_path?: string | null
          clausulas_adicionales?: Json | null
          cliente_cif?: string | null
          cliente_domicilio?: string | null
          condiciones_pago?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          descripcion_transaccion?: string | null
          desglose?: Json | null
          empresa_cliente_id?: string | null
          empresa_target_id?: string | null
          estado?: string
          estructura?: string | null
          fecha_emision?: string | null
          fecha_respuesta?: string | null
          fecha_vencimiento?: string | null
          firma_cliente?: string | null
          firma_firma?: string | null
          honorarios_negociacion?: number | null
          id?: string
          importe_total?: number
          mandato_id?: string
          motivo_rechazo?: string | null
          notas_internas?: string | null
          plantilla_tipo?: string | null
          target_cif?: string | null
          target_domicilio?: string | null
          target_nombre?: string | null
          titulo?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "propuestas_honorarios_empresa_cliente_id_fkey"
            columns: ["empresa_cliente_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_honorarios_empresa_cliente_id_fkey"
            columns: ["empresa_cliente_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "propuestas_honorarios_empresa_cliente_id_fkey"
            columns: ["empresa_cliente_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_honorarios_empresa_target_id_fkey"
            columns: ["empresa_target_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_honorarios_empresa_target_id_fkey"
            columns: ["empresa_target_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "propuestas_honorarios_empresa_target_id_fkey"
            columns: ["empresa_target_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_honorarios_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "propuestas_honorarios_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_honorarios_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "propuestas_honorarios_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_honorarios_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_honorarios_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
        ]
      }
      psh_plantillas: {
        Row: {
          alcance_default: Json | null
          clausulas_default: Json | null
          condiciones_pago_default: string | null
          created_at: string
          descripcion: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          nombre: string
          tipo_servicio: string
          updated_at: string
        }
        Insert: {
          alcance_default?: Json | null
          clausulas_default?: Json | null
          condiciones_pago_default?: string | null
          created_at?: string
          descripcion?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          nombre: string
          tipo_servicio: string
          updated_at?: string
        }
        Update: {
          alcance_default?: Json | null
          clausulas_default?: Json | null
          condiciones_pago_default?: string | null
          created_at?: string
          descripcion?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          nombre?: string
          tipo_servicio?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string | null
          category: string | null
          count: number
          created_at: string
          id: string
          identifier: string
          request_count: number | null
          updated_at: string | null
          window_start: string
        }
        Insert: {
          action?: string | null
          category?: string | null
          count?: number
          created_at?: string
          id?: string
          identifier: string
          request_count?: number | null
          updated_at?: string | null
          window_start?: string
        }
        Update: {
          action?: string | null
          category?: string | null
          count?: number
          created_at?: string
          id?: string
          identifier?: string
          request_count?: number | null
          updated_at?: string | null
          window_start?: string
        }
        Relationships: []
      }
      reengagement_templates: {
        Row: {
          brevo_segment: string
          created_at: string | null
          created_by: string | null
          default_subject: string
          description: string
          html_template: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          label: string
          slug: string
          trigger_condition: string
          updated_at: string | null
          variables_used: string[] | null
        }
        Insert: {
          brevo_segment: string
          created_at?: string | null
          created_by?: string | null
          default_subject: string
          description: string
          html_template: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          label: string
          slug: string
          trigger_condition: string
          updated_at?: string | null
          variables_used?: string[] | null
        }
        Update: {
          brevo_segment?: string
          created_at?: string | null
          created_by?: string | null
          default_subject?: string
          description?: string
          html_template?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          label?: string
          slug?: string
          trigger_condition?: string
          updated_at?: string | null
          variables_used?: string[] | null
        }
        Relationships: []
      }
      rh_departamentos: {
        Row: {
          codigo: string
          created_at: string | null
          empresa_id: string | null
          id: string
          nombre: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          nombre: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_departamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "rh_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_empleados: {
        Row: {
          activo_2025: boolean | null
          codigo_empleado: string
          coste_total_mensual: number | null
          created_at: string | null
          departamento_id: string | null
          empresa_id: string | null
          fecha_alta: string | null
          fecha_antiguedad: string | null
          fecha_baja: string | null
          id: string
          is_active: boolean | null
          nombre: string
          puesto: string | null
          salario_base: number | null
          tipo_contrato: string | null
        }
        Insert: {
          activo_2025?: boolean | null
          codigo_empleado: string
          coste_total_mensual?: number | null
          created_at?: string | null
          departamento_id?: string | null
          empresa_id?: string | null
          fecha_alta?: string | null
          fecha_antiguedad?: string | null
          fecha_baja?: string | null
          id?: string
          is_active?: boolean | null
          nombre: string
          puesto?: string | null
          salario_base?: number | null
          tipo_contrato?: string | null
        }
        Update: {
          activo_2025?: boolean | null
          codigo_empleado?: string
          coste_total_mensual?: number | null
          created_at?: string | null
          departamento_id?: string | null
          empresa_id?: string | null
          fecha_alta?: string | null
          fecha_antiguedad?: string | null
          fecha_baja?: string | null
          id?: string
          is_active?: boolean | null
          nombre?: string
          puesto?: string | null
          salario_base?: number | null
          tipo_contrato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rh_empleados_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "rh_departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_empleados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "rh_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_empresas: {
        Row: {
          codigo: string
          created_at: string | null
          id: string
          nif: string
          nombre: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          id?: string
          nif: string
          nombre: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          id?: string
          nif?: string
          nombre?: string
        }
        Relationships: []
      }
      rh_movimientos_laborales: {
        Row: {
          created_at: string | null
          descripcion: string | null
          empleado_id: string | null
          fecha_movimiento: string
          id: string
          observaciones: string | null
          tipo_movimiento: string
          valor_numerico: number | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          empleado_id?: string | null
          fecha_movimiento: string
          id?: string
          observaciones?: string | null
          tipo_movimiento: string
          valor_numerico?: number | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          empleado_id?: string | null
          fecha_movimiento?: string
          id?: string
          observaciones?: string | null
          tipo_movimiento?: string
          valor_numerico?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rh_movimientos_laborales_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "rh_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_movimientos_laborales_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "v_empleados_completo"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_nominas: {
        Row: {
          anio: number
          anticipos: number | null
          bruto: number | null
          coste_empresa: number | null
          created_at: string | null
          embargos: number | null
          empleado_id: string | null
          id: string
          irpf: number | null
          mes: number
          neto: number | null
          otros_descuentos: number | null
          pdf_url: string | null
          ss_empresa: number | null
          ss_trabajador: number | null
          total_tc1: number | null
        }
        Insert: {
          anio: number
          anticipos?: number | null
          bruto?: number | null
          coste_empresa?: number | null
          created_at?: string | null
          embargos?: number | null
          empleado_id?: string | null
          id?: string
          irpf?: number | null
          mes: number
          neto?: number | null
          otros_descuentos?: number | null
          pdf_url?: string | null
          ss_empresa?: number | null
          ss_trabajador?: number | null
          total_tc1?: number | null
        }
        Update: {
          anio?: number
          anticipos?: number | null
          bruto?: number | null
          coste_empresa?: number | null
          created_at?: string | null
          embargos?: number | null
          empleado_id?: string | null
          id?: string
          irpf?: number | null
          mes?: number
          neto?: number | null
          otros_descuentos?: number | null
          pdf_url?: string | null
          ss_empresa?: number | null
          ss_trabajador?: number | null
          total_tc1?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rh_nominas_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "rh_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_nominas_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "v_empleados_completo"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          notes: string | null
          role: Database["public"]["Enums"]["rh_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          role: Database["public"]["Enums"]["rh_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          role?: Database["public"]["Enums"]["rh_role"]
          user_id?: string
        }
        Relationships: []
      }
      rod_documents: {
        Row: {
          activated_at: string | null
          created_at: string | null
          created_by: string | null
          deactivated_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          file_size_bytes: number | null
          file_type: string
          file_url: string
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          is_latest: boolean | null
          language: string
          title: string
          total_downloads: number | null
          updated_at: string | null
          version: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deactivated_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          file_size_bytes?: number | null
          file_type: string
          file_url: string
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_latest?: boolean | null
          language?: string
          title: string
          total_downloads?: number | null
          updated_at?: string | null
          version: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deactivated_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          file_size_bytes?: number | null
          file_type?: string
          file_url?: string
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_latest?: boolean | null
          language?: string
          title?: string
          total_downloads?: number | null
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      saved_operations: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          operation_id: string
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          operation_id: string
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          operation_id?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_operations_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "company_operations"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          is_shared: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters: Json
          id?: string
          is_shared?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          is_shared?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
        ]
      }
      search_analytics: {
        Row: {
          created_at: string | null
          filters_applied: Json | null
          id: string
          result_clicked_id: string | null
          result_clicked_type: string | null
          results_count: number | null
          search_query: string
          search_source: string | null
          search_type: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters_applied?: Json | null
          id?: string
          result_clicked_id?: string | null
          result_clicked_type?: string | null
          results_count?: number | null
          search_query: string
          search_source?: string | null
          search_type?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters_applied?: Json | null
          id?: string
          result_clicked_id?: string | null
          result_clicked_type?: string | null
          results_count?: number | null
          search_query?: string
          search_source?: string | null
          search_type?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      searcher_leads: {
        Row: {
          additional_criteria: string | null
          background: string | null
          brevo_lists: number[] | null
          created_at: string
          deal_type_preferences: string[] | null
          email: string
          email_sent: boolean | null
          email_sent_at: string | null
          full_name: string
          fund_raised: string | null
          gdpr_consent: boolean
          how_found_us: string | null
          id: string
          investor_backing: string | null
          investor_names: string | null
          ip_address: unknown
          is_verified: boolean | null
          job_title: string | null
          linkedin_url: string | null
          marketing_consent: boolean | null
          max_ebitda: number | null
          max_revenue: number | null
          min_ebitda: number | null
          min_revenue: number | null
          notes: string | null
          phone: string | null
          preferred_locations: string[] | null
          preferred_sectors: string[] | null
          preferred_sectors_pe: string[] | null
          referrer: string | null
          search_phase: string | null
          status: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          additional_criteria?: string | null
          background?: string | null
          brevo_lists?: number[] | null
          created_at?: string
          deal_type_preferences?: string[] | null
          email: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name: string
          fund_raised?: string | null
          gdpr_consent?: boolean
          how_found_us?: string | null
          id?: string
          investor_backing?: string | null
          investor_names?: string | null
          ip_address?: unknown
          is_verified?: boolean | null
          job_title?: string | null
          linkedin_url?: string | null
          marketing_consent?: boolean | null
          max_ebitda?: number | null
          max_revenue?: number | null
          min_ebitda?: number | null
          min_revenue?: number | null
          notes?: string | null
          phone?: string | null
          preferred_locations?: string[] | null
          preferred_sectors?: string[] | null
          preferred_sectors_pe?: string[] | null
          referrer?: string | null
          search_phase?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          additional_criteria?: string | null
          background?: string | null
          brevo_lists?: number[] | null
          created_at?: string
          deal_type_preferences?: string[] | null
          email?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name?: string
          fund_raised?: string | null
          gdpr_consent?: boolean
          how_found_us?: string | null
          id?: string
          investor_backing?: string | null
          investor_names?: string | null
          ip_address?: unknown
          is_verified?: boolean | null
          job_title?: string | null
          linkedin_url?: string | null
          marketing_consent?: boolean | null
          max_ebitda?: number | null
          max_revenue?: number | null
          min_ebitda?: number | null
          min_revenue?: number | null
          notes?: string | null
          phone?: string | null
          preferred_locations?: string[] | null
          preferred_sectors?: string[] | null
          preferred_sectors_pe?: string[] | null
          referrer?: string | null
          search_phase?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "searcher_leads_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "searcher_leads_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sector_multiples: {
        Row: {
          description: string | null
          ebitda_multiple: number
          employee_range: string | null
          id: string
          is_active: boolean
          last_updated: string
          revenue_multiple: number
          sector_name: string
        }
        Insert: {
          description?: string | null
          ebitda_multiple: number
          employee_range?: string | null
          id?: string
          is_active?: boolean
          last_updated?: string
          revenue_multiple: number
          sector_name: string
        }
        Update: {
          description?: string | null
          ebitda_multiple?: number
          employee_range?: string | null
          id?: string
          is_active?: boolean
          last_updated?: string
          revenue_multiple?: number
          sector_name?: string
        }
        Relationships: []
      }
      sector_multiples_asesorias: {
        Row: {
          created_at: string
          description: string | null
          ebitda_multiple: number
          employee_range: string
          id: string
          revenue_multiple: number
          sector_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ebitda_multiple: number
          employee_range: string
          id?: string
          revenue_multiple: number
          sector_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ebitda_multiple?: number
          employee_range?: string
          id?: string
          revenue_multiple?: number
          sector_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sector_report_templates: {
        Row: {
          ai_prompt_template: string | null
          content_structure: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          sector: string
          template_name: string
          template_type: string | null
          updated_at: string | null
        }
        Insert: {
          ai_prompt_template?: string | null
          content_structure?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          sector: string
          template_name: string
          template_type?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_prompt_template?: string | null
          content_structure?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          sector?: string
          template_name?: string
          template_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sector_valuation_multiples: {
        Row: {
          description: string | null
          display_locations: string[] | null
          display_order: number | null
          id: string
          is_active: boolean | null
          median_multiple: string
          multiple_range: string
          sector_name: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          display_locations?: string[] | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          median_multiple: string
          multiple_range: string
          sector_name: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          display_locations?: string[] | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          median_multiple?: string
          multiple_range?: string
          sector_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name_en: string | null
          name_es: string
          parent_id: string | null
          slug: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name_en?: string | null
          name_es: string
          parent_id?: string | null
          slug: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name_en?: string | null
          name_es?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "sectors_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_review_log: {
        Row: {
          created_at: string
          findings: string | null
          id: string
          object_name: string
          object_type: string
          recommendations: string | null
          review_status: string | null
          review_type: string
          reviewed_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          findings?: string | null
          id?: string
          object_name: string
          object_type: string
          recommendations?: string | null
          review_status?: string | null
          review_type: string
          reviewed_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          findings?: string | null
          id?: string
          object_name?: string
          object_type?: string
          recommendations?: string | null
          review_status?: string | null
          review_type?: string
          reviewed_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sell_leads: {
        Row: {
          company: string
          created_at: string
          email: string
          email_sent: boolean | null
          email_sent_at: string | null
          full_name: string
          hubspot_sent: boolean | null
          hubspot_sent_at: string | null
          id: string
          ip_address: unknown
          message: string | null
          page_origin: string | null
          phone: string | null
          referrer: string | null
          revenue_range: string | null
          sector: string | null
          status: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name: string
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          ip_address?: unknown
          message?: string | null
          page_origin?: string | null
          phone?: string | null
          referrer?: string | null
          revenue_range?: string | null
          sector?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name?: string
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          ip_address?: unknown
          message?: string | null
          page_origin?: string | null
          phone?: string | null
          referrer?: string | null
          revenue_range?: string | null
          sector?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      sf_acquisitions: {
        Row: {
          cnae: string | null
          company_name: string
          country: string | null
          created_at: string
          deal_type: string | null
          deal_year: number | null
          description: string | null
          exit_year: number | null
          fund_id: string
          fund_name: string | null
          id: string
          notes: string | null
          region: string | null
          sector: string | null
          source_url: string | null
          status: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          cnae?: string | null
          company_name: string
          country?: string | null
          created_at?: string
          deal_type?: string | null
          deal_year?: number | null
          description?: string | null
          exit_year?: number | null
          fund_id: string
          fund_name?: string | null
          id?: string
          notes?: string | null
          region?: string | null
          sector?: string | null
          source_url?: string | null
          status?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          cnae?: string | null
          company_name?: string
          country?: string | null
          created_at?: string
          deal_type?: string | null
          deal_year?: number | null
          description?: string | null
          exit_year?: number | null
          fund_id?: string
          fund_name?: string | null
          id?: string
          notes?: string | null
          region?: string | null
          sector?: string | null
          source_url?: string | null
          status?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sf_acquisitions_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "sf_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      sf_ai_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          prompt_key: string
          success: boolean | null
          tokens_used: number | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          prompt_key: string
          success?: boolean | null
          tokens_used?: number | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          prompt_key?: string
          success?: boolean | null
          tokens_used?: number | null
        }
        Relationships: []
      }
      sf_ai_prompts: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          key: string
          max_tokens: number | null
          model: string | null
          name: string
          output_schema: Json | null
          system_prompt: string
          temperature: number | null
          updated_at: string | null
          user_prompt_template: string
          variables: string[] | null
          version: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          max_tokens?: number | null
          model?: string | null
          name: string
          output_schema?: Json | null
          system_prompt: string
          temperature?: number | null
          updated_at?: string | null
          user_prompt_template: string
          variables?: string[] | null
          version?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          max_tokens?: number | null
          model?: string | null
          name?: string
          output_schema?: Json | null
          system_prompt?: string
          temperature?: number | null
          updated_at?: string | null
          user_prompt_template?: string
          variables?: string[] | null
          version?: number | null
        }
        Relationships: []
      }
      sf_apollo_imports: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          credits_used: number | null
          error_count: number | null
          error_message: string | null
          id: string
          import_results: Json | null
          import_type: string | null
          imported_count: number | null
          preview_data: Json | null
          search_criteria: Json
          skipped_count: number | null
          started_at: string | null
          status: string
          total_results: number | null
          updated_count: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          credits_used?: number | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          import_results?: Json | null
          import_type?: string | null
          imported_count?: number | null
          preview_data?: Json | null
          search_criteria?: Json
          skipped_count?: number | null
          started_at?: string | null
          status?: string
          total_results?: number | null
          updated_count?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          credits_used?: number | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          import_results?: Json | null
          import_type?: string | null
          imported_count?: number | null
          preview_data?: Json | null
          search_criteria?: Json
          skipped_count?: number | null
          started_at?: string | null
          status?: string
          total_results?: number | null
          updated_count?: number | null
        }
        Relationships: []
      }
      sf_backers: {
        Row: {
          country: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          notes: string | null
          type: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          notes?: string | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          notes?: string | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      sf_favorites: {
        Row: {
          added_by: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      sf_fund_audit_log: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          fund_id: string
          id: string
          new_values: Json | null
          old_values: Json | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          fund_id: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          fund_id?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sf_fund_audit_log_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "sf_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      sf_fund_backers: {
        Row: {
          backer_id: string
          confidence_level: string | null
          created_at: string
          fund_id: string
          id: string
          notes: string | null
          since_year: number | null
          source_url: string | null
          support_type: string | null
        }
        Insert: {
          backer_id: string
          confidence_level?: string | null
          created_at?: string
          fund_id: string
          id?: string
          notes?: string | null
          since_year?: number | null
          source_url?: string | null
          support_type?: string | null
        }
        Update: {
          backer_id?: string
          confidence_level?: string | null
          created_at?: string
          fund_id?: string
          id?: string
          notes?: string | null
          since_year?: number | null
          source_url?: string | null
          support_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sf_fund_backers_backer_id_fkey"
            columns: ["backer_id"]
            isOneToOne: false
            referencedRelation: "sf_backers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sf_fund_backers_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "sf_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      sf_funds: {
        Row: {
          cities: string[] | null
          country_base: string | null
          created_at: string
          data_quality: Json | null
          deal_size_max: number | null
          deal_size_min: number | null
          description: string | null
          ebitda_max: number | null
          ebitda_min: number | null
          entity_type: string | null
          founded_year: number | null
          geography_focus: string[] | null
          id: string
          investment_style: string | null
          investment_thesis: string | null
          last_news_scan_at: string | null
          last_portfolio_scraped_at: string | null
          last_scraped_at: string | null
          name: string
          notes_internal: string | null
          portfolio_url: string | null
          revenue_max: number | null
          revenue_min: number | null
          scrape_source_urls: string[] | null
          search_keywords: string[] | null
          searcher_lead_id: string | null
          sector_exclusions: string[] | null
          sector_exclusions_pe: string[] | null
          sector_focus: string[] | null
          sector_focus_pe: string[] | null
          size_criteria: Json | null
          source_last_verified_at: string | null
          source_url: string | null
          status: string | null
          transaction_preferences: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          cities?: string[] | null
          country_base?: string | null
          created_at?: string
          data_quality?: Json | null
          deal_size_max?: number | null
          deal_size_min?: number | null
          description?: string | null
          ebitda_max?: number | null
          ebitda_min?: number | null
          entity_type?: string | null
          founded_year?: number | null
          geography_focus?: string[] | null
          id?: string
          investment_style?: string | null
          investment_thesis?: string | null
          last_news_scan_at?: string | null
          last_portfolio_scraped_at?: string | null
          last_scraped_at?: string | null
          name: string
          notes_internal?: string | null
          portfolio_url?: string | null
          revenue_max?: number | null
          revenue_min?: number | null
          scrape_source_urls?: string[] | null
          search_keywords?: string[] | null
          searcher_lead_id?: string | null
          sector_exclusions?: string[] | null
          sector_exclusions_pe?: string[] | null
          sector_focus?: string[] | null
          sector_focus_pe?: string[] | null
          size_criteria?: Json | null
          source_last_verified_at?: string | null
          source_url?: string | null
          status?: string | null
          transaction_preferences?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          cities?: string[] | null
          country_base?: string | null
          created_at?: string
          data_quality?: Json | null
          deal_size_max?: number | null
          deal_size_min?: number | null
          description?: string | null
          ebitda_max?: number | null
          ebitda_min?: number | null
          entity_type?: string | null
          founded_year?: number | null
          geography_focus?: string[] | null
          id?: string
          investment_style?: string | null
          investment_thesis?: string | null
          last_news_scan_at?: string | null
          last_portfolio_scraped_at?: string | null
          last_scraped_at?: string | null
          name?: string
          notes_internal?: string | null
          portfolio_url?: string | null
          revenue_max?: number | null
          revenue_min?: number | null
          scrape_source_urls?: string[] | null
          search_keywords?: string[] | null
          searcher_lead_id?: string | null
          sector_exclusions?: string[] | null
          sector_exclusions_pe?: string[] | null
          sector_focus?: string[] | null
          sector_focus_pe?: string[] | null
          size_criteria?: Json | null
          source_last_verified_at?: string | null
          source_url?: string | null
          status?: string | null
          transaction_preferences?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sf_funds_searcher_lead_id_fkey"
            columns: ["searcher_lead_id"]
            isOneToOne: false
            referencedRelation: "searcher_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sf_matches: {
        Row: {
          contacted_at: string | null
          created_at: string
          crm_entity_id: string
          crm_entity_type: string
          fund_id: string
          id: string
          last_interaction_at: string | null
          last_scored_at: string | null
          match_reasons: Json | null
          match_score: number | null
          nda_sent_at: string | null
          notes: string | null
          owner_user_id: string | null
          status: string | null
          teaser_sent_at: string | null
          updated_at: string
        }
        Insert: {
          contacted_at?: string | null
          created_at?: string
          crm_entity_id: string
          crm_entity_type: string
          fund_id: string
          id?: string
          last_interaction_at?: string | null
          last_scored_at?: string | null
          match_reasons?: Json | null
          match_score?: number | null
          nda_sent_at?: string | null
          notes?: string | null
          owner_user_id?: string | null
          status?: string | null
          teaser_sent_at?: string | null
          updated_at?: string
        }
        Update: {
          contacted_at?: string | null
          created_at?: string
          crm_entity_id?: string
          crm_entity_type?: string
          fund_id?: string
          id?: string
          last_interaction_at?: string | null
          last_scored_at?: string | null
          match_reasons?: Json | null
          match_score?: number | null
          nda_sent_at?: string | null
          notes?: string | null
          owner_user_id?: string | null
          status?: string | null
          teaser_sent_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sf_matches_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "sf_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      sf_outreach: {
        Row: {
          channel: string
          created_at: string
          created_by: string | null
          crm_entity_id: string | null
          crm_entity_type: string | null
          external_thread_url: string | null
          fund_id: string
          id: string
          message_preview: string | null
          notes: string | null
          person_id: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          template_key: string | null
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          created_by?: string | null
          crm_entity_id?: string | null
          crm_entity_type?: string | null
          external_thread_url?: string | null
          fund_id: string
          id?: string
          message_preview?: string | null
          notes?: string | null
          person_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_key?: string | null
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          created_by?: string | null
          crm_entity_id?: string | null
          crm_entity_type?: string | null
          external_thread_url?: string | null
          fund_id?: string
          id?: string
          message_preview?: string | null
          notes?: string | null
          person_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sf_outreach_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "sf_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sf_outreach_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "sf_people"
            referencedColumns: ["id"]
          },
        ]
      }
      sf_people: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          fund_id: string
          id: string
          is_primary_contact: boolean | null
          languages: string[] | null
          linkedin_url: string | null
          location: string | null
          notes: string | null
          phone: string | null
          role: string | null
          school: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          fund_id: string
          id?: string
          is_primary_contact?: boolean | null
          languages?: string[] | null
          linkedin_url?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          school?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          fund_id?: string
          id?: string
          is_primary_contact?: boolean | null
          languages?: string[] | null
          linkedin_url?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          school?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sf_people_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "sf_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      sf_scraped_urls: {
        Row: {
          confidence: number | null
          created_at: string | null
          domain: string | null
          entity_type: string | null
          extracted_at: string | null
          extraction_error: string | null
          extraction_status: string | null
          fund_id: string | null
          id: string
          is_relevant: boolean | null
          query_id: string | null
          raw_content: string | null
          raw_snippet: string | null
          raw_title: string | null
          scraped_at: string | null
          stage: string | null
          url: string
          url_hash: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          domain?: string | null
          entity_type?: string | null
          extracted_at?: string | null
          extraction_error?: string | null
          extraction_status?: string | null
          fund_id?: string | null
          id?: string
          is_relevant?: boolean | null
          query_id?: string | null
          raw_content?: string | null
          raw_snippet?: string | null
          raw_title?: string | null
          scraped_at?: string | null
          stage?: string | null
          url: string
          url_hash: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          domain?: string | null
          entity_type?: string | null
          extracted_at?: string | null
          extraction_error?: string | null
          extraction_status?: string | null
          fund_id?: string | null
          id?: string
          is_relevant?: boolean | null
          query_id?: string | null
          raw_content?: string | null
          raw_snippet?: string | null
          raw_title?: string | null
          scraped_at?: string | null
          stage?: string | null
          url?: string
          url_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "sf_scraped_urls_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "sf_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sf_scraped_urls_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "sf_search_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      sf_search_queries: {
        Row: {
          country: string
          country_code: string
          created_at: string | null
          id: string
          intent: string | null
          is_active: boolean | null
          last_executed_at: string | null
          priority: number | null
          query: string
          results_count: number | null
          updated_at: string | null
        }
        Insert: {
          country: string
          country_code: string
          created_at?: string | null
          id?: string
          intent?: string | null
          is_active?: boolean | null
          last_executed_at?: string | null
          priority?: number | null
          query: string
          results_count?: number | null
          updated_at?: string | null
        }
        Update: {
          country?: string
          country_code?: string
          created_at?: string | null
          id?: string
          intent?: string | null
          is_active?: boolean | null
          last_executed_at?: string | null
          priority?: number | null
          query?: string
          results_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sidebar_config: {
        Row: {
          collapsed_by_default: boolean | null
          id: string
          show_search: boolean | null
          show_version_switcher: boolean | null
          updated_at: string | null
        }
        Insert: {
          collapsed_by_default?: boolean | null
          id?: string
          show_search?: boolean | null
          show_version_switcher?: boolean | null
          updated_at?: string | null
        }
        Update: {
          collapsed_by_default?: boolean | null
          id?: string
          show_search?: boolean | null
          show_version_switcher?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sidebar_items: {
        Row: {
          badge: string | null
          created_at: string | null
          description: string | null
          icon: string
          id: string
          is_active: boolean | null
          position: number
          section_id: string | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          badge?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          position?: number
          section_id?: string | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          badge?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          position?: number
          section_id?: string | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "sidebar_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sidebar_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      sidebar_sections: {
        Row: {
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          is_collapsed_default: boolean | null
          position: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_collapsed_default?: boolean | null
          position?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_collapsed_default?: boolean | null
          position?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sync_control: {
        Row: {
          created_at: string | null
          created_empresas_last_run: number | null
          description: string | null
          errors_last_run: number | null
          id: string
          is_enabled: boolean | null
          last_run: string | null
          name: string
          next_run: string | null
          total_empresas_created: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_empresas_last_run?: number | null
          description?: string | null
          errors_last_run?: number | null
          id: string
          is_enabled?: boolean | null
          last_run?: string | null
          name: string
          next_run?: string | null
          total_empresas_created?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_empresas_last_run?: number | null
          description?: string | null
          errors_last_run?: number | null
          id?: string
          is_enabled?: boolean | null
          last_run?: string | null
          name?: string
          next_run?: string | null
          total_empresas_created?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tareas: {
        Row: {
          ai_confidence: number | null
          ai_generated: boolean | null
          asignado_a: string | null
          compartido_con: string[] | null
          creado_por: string | null
          created_at: string | null
          descripcion: string | null
          es_visible_equipo: boolean | null
          estado: string | null
          fecha_vencimiento: string | null
          health_status: string | null
          id: string
          last_activity_at: string | null
          mandato_id: string | null
          order_index: number | null
          prioridad: string | null
          source_text: string | null
          tipo: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_generated?: boolean | null
          asignado_a?: string | null
          compartido_con?: string[] | null
          creado_por?: string | null
          created_at?: string | null
          descripcion?: string | null
          es_visible_equipo?: boolean | null
          estado?: string | null
          fecha_vencimiento?: string | null
          health_status?: string | null
          id?: string
          last_activity_at?: string | null
          mandato_id?: string | null
          order_index?: number | null
          prioridad?: string | null
          source_text?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_generated?: boolean | null
          asignado_a?: string | null
          compartido_con?: string[] | null
          creado_por?: string | null
          created_at?: string | null
          descripcion?: string | null
          es_visible_equipo?: boolean | null
          estado?: string | null
          fecha_vencimiento?: string | null
          health_status?: string | null
          id?: string
          last_activity_at?: string | null
          mandato_id?: string | null
          order_index?: number | null
          prioridad?: string | null
          source_text?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "tareas_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "tareas_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
        ]
      }
      target_ofertas: {
        Row: {
          condiciones: string | null
          contraoferta_monto: number | null
          created_at: string
          created_by: string | null
          estado: string
          fecha: string
          fecha_expiracion: string | null
          id: string
          mandato_empresa_id: string
          monto: number
          notas: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          condiciones?: string | null
          contraoferta_monto?: number | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha?: string
          fecha_expiracion?: string | null
          id?: string
          mandato_empresa_id: string
          monto: number
          notas?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          condiciones?: string | null
          contraoferta_monto?: number | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha?: string
          fecha_expiracion?: string | null
          id?: string
          mandato_empresa_id?: string
          monto?: number
          notas?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_ofertas_mandato_empresa_id_fkey"
            columns: ["mandato_empresa_id"]
            isOneToOne: false
            referencedRelation: "mandato_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      task_ai_feedback: {
        Row: {
          created_at: string | null
          event_id: string
          feedback_text: string | null
          id: string
          is_useful: boolean | null
          rating: number | null
          task_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          feedback_text?: string | null
          id?: string
          is_useful?: boolean | null
          rating?: number | null
          task_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          feedback_text?: string | null
          id?: string
          is_useful?: boolean | null
          rating?: number | null
          task_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_ai_feedback_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "task_events"
            referencedColumns: ["id"]
          },
        ]
      }
      task_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_type: string
          id: string
          payload: Json | null
          task_id: string
          task_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          task_id: string
          task_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          task_id?: string
          task_type?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          display_order: number | null
          email: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          linkedin_url: string | null
          name: string
          phone: string | null
          position: string | null
          section: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_order?: number | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          name: string
          phone?: string | null
          position?: string | null
          section?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_order?: number | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          name?: string
          phone?: string | null
          position?: string | null
          section?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      teaser_campaigns: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          custom_message: string | null
          enable_watermark: boolean | null
          from_email: string | null
          from_name: string | null
          id: string
          idioma: string
          mandato_id: string
          nombre: string
          started_at: string | null
          status: string | null
          subject: string
          teaser_document_id: string | null
          template_id: string | null
          total_bounced: number | null
          total_clicked: number | null
          total_delivered: number | null
          total_opened: number | null
          total_recipients: number | null
          total_sent: number | null
          updated_at: string | null
          watermark_template: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_message?: string | null
          enable_watermark?: boolean | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          idioma: string
          mandato_id: string
          nombre: string
          started_at?: string | null
          status?: string | null
          subject: string
          teaser_document_id?: string | null
          template_id?: string | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          updated_at?: string | null
          watermark_template?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_message?: string | null
          enable_watermark?: boolean | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          idioma?: string
          mandato_id?: string
          nombre?: string
          started_at?: string | null
          status?: string | null
          subject?: string
          teaser_document_id?: string | null
          template_id?: string | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          updated_at?: string | null
          watermark_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teaser_campaigns_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "teaser_campaigns_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaser_campaigns_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "teaser_campaigns_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaser_campaigns_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaser_campaigns_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "teaser_campaigns_teaser_document_id_fkey"
            columns: ["teaser_document_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaser_campaigns_teaser_document_id_fkey"
            columns: ["teaser_document_id"]
            isOneToOne: false
            referencedRelation: "v_documentos_con_versiones"
            referencedColumns: ["id"]
          },
        ]
      }
      teaser_recipients: {
        Row: {
          bounce_type: string | null
          bounced_at: string | null
          campaign_id: string
          cim_access_granted: boolean | null
          cim_access_granted_at: string | null
          cim_access_granted_by: string | null
          cim_access_revoke_reason: string | null
          cim_access_revoked_at: string | null
          cim_access_revoked_by: string | null
          cim_first_accessed_at: string | null
          click_count: number | null
          clicked_at: string | null
          contacto_id: string | null
          created_at: string | null
          delivered_at: string | null
          email: string
          empresa_id: string | null
          empresa_nombre: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          ioi_amount: number | null
          ioi_notes: string | null
          ioi_received_at: string | null
          mandato_empresa_id: string | null
          nda_document_id: string | null
          nda_language: string | null
          nda_sent_at: string | null
          nda_sent_by: string | null
          nda_signed_at: string | null
          nda_signed_by: string | null
          nda_status: string | null
          nombre: string | null
          open_count: number | null
          opened_at: string | null
          provider_message_id: string | null
          provider_status: string | null
          queued_at: string | null
          sent_at: string | null
          skip_reason: string | null
          status: string | null
          tracking_id: string | null
          updated_at: string | null
          watermark_text: string | null
          watermarked_at: string | null
          watermarked_path: string | null
          wave_id: string | null
        }
        Insert: {
          bounce_type?: string | null
          bounced_at?: string | null
          campaign_id: string
          cim_access_granted?: boolean | null
          cim_access_granted_at?: string | null
          cim_access_granted_by?: string | null
          cim_access_revoke_reason?: string | null
          cim_access_revoked_at?: string | null
          cim_access_revoked_by?: string | null
          cim_first_accessed_at?: string | null
          click_count?: number | null
          clicked_at?: string | null
          contacto_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email: string
          empresa_id?: string | null
          empresa_nombre?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          ioi_amount?: number | null
          ioi_notes?: string | null
          ioi_received_at?: string | null
          mandato_empresa_id?: string | null
          nda_document_id?: string | null
          nda_language?: string | null
          nda_sent_at?: string | null
          nda_sent_by?: string | null
          nda_signed_at?: string | null
          nda_signed_by?: string | null
          nda_status?: string | null
          nombre?: string | null
          open_count?: number | null
          opened_at?: string | null
          provider_message_id?: string | null
          provider_status?: string | null
          queued_at?: string | null
          sent_at?: string | null
          skip_reason?: string | null
          status?: string | null
          tracking_id?: string | null
          updated_at?: string | null
          watermark_text?: string | null
          watermarked_at?: string | null
          watermarked_path?: string | null
          wave_id?: string | null
        }
        Update: {
          bounce_type?: string | null
          bounced_at?: string | null
          campaign_id?: string
          cim_access_granted?: boolean | null
          cim_access_granted_at?: string | null
          cim_access_granted_by?: string | null
          cim_access_revoke_reason?: string | null
          cim_access_revoked_at?: string | null
          cim_access_revoked_by?: string | null
          cim_first_accessed_at?: string | null
          click_count?: number | null
          clicked_at?: string | null
          contacto_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email?: string
          empresa_id?: string | null
          empresa_nombre?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          ioi_amount?: number | null
          ioi_notes?: string | null
          ioi_received_at?: string | null
          mandato_empresa_id?: string | null
          nda_document_id?: string | null
          nda_language?: string | null
          nda_sent_at?: string | null
          nda_sent_by?: string | null
          nda_signed_at?: string | null
          nda_signed_by?: string | null
          nda_status?: string | null
          nombre?: string | null
          open_count?: number | null
          opened_at?: string | null
          provider_message_id?: string | null
          provider_status?: string | null
          queued_at?: string | null
          sent_at?: string | null
          skip_reason?: string | null
          status?: string | null
          tracking_id?: string | null
          updated_at?: string | null
          watermark_text?: string | null
          watermarked_at?: string | null
          watermarked_path?: string | null
          wave_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teaser_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "teaser_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaser_recipients_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaser_recipients_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaser_recipients_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "teaser_recipients_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaser_recipients_mandato_empresa_id_fkey"
            columns: ["mandato_empresa_id"]
            isOneToOne: false
            referencedRelation: "mandato_empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaser_recipients_nda_document_id_fkey"
            columns: ["nda_document_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaser_recipients_nda_document_id_fkey"
            columns: ["nda_document_id"]
            isOneToOne: false
            referencedRelation: "v_documentos_con_versiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaser_recipients_wave_id_fkey"
            columns: ["wave_id"]
            isOneToOne: false
            referencedRelation: "teaser_waves"
            referencedColumns: ["id"]
          },
        ]
      }
      teaser_tracking_events: {
        Row: {
          bounce_type: string | null
          campaign_id: string
          clicked_url: string | null
          event_type: string
          id: string
          ip_address: unknown
          occurred_at: string | null
          provider_data: Json | null
          provider_event_id: string | null
          recipient_id: string
          user_agent: string | null
        }
        Insert: {
          bounce_type?: string | null
          campaign_id: string
          clicked_url?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          occurred_at?: string | null
          provider_data?: Json | null
          provider_event_id?: string | null
          recipient_id: string
          user_agent?: string | null
        }
        Update: {
          bounce_type?: string | null
          campaign_id?: string
          clicked_url?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          occurred_at?: string | null
          provider_data?: Json | null
          provider_event_id?: string | null
          recipient_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teaser_tracking_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "teaser_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaser_tracking_events_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "teaser_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      teaser_waves: {
        Row: {
          batch_size: number | null
          campaign_id: string
          clicked_count: number | null
          completed_at: string | null
          created_at: string | null
          delay_between_batches_ms: number | null
          delivered_count: number | null
          failed_count: number | null
          id: string
          nombre: string | null
          opened_count: number | null
          scheduled_at: string | null
          sent_count: number | null
          started_at: string | null
          status: string | null
          total_recipients: number | null
          updated_at: string | null
          wave_number: number
        }
        Insert: {
          batch_size?: number | null
          campaign_id: string
          clicked_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          delay_between_batches_ms?: number | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          nombre?: string | null
          opened_count?: number | null
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          total_recipients?: number | null
          updated_at?: string | null
          wave_number: number
        }
        Update: {
          batch_size?: number | null
          campaign_id?: string
          clicked_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          delay_between_batches_ms?: number | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          nombre?: string | null
          opened_count?: number | null
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          total_recipients?: number | null
          updated_at?: string | null
          wave_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "teaser_waves_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "teaser_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          client_company: string
          client_name: string
          client_photo_url: string | null
          client_position: string | null
          created_at: string
          display_locations: string[] | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          project_type: string | null
          rating: number | null
          sector: string | null
          testimonial_text: string
          updated_at: string
        }
        Insert: {
          client_company: string
          client_name: string
          client_photo_url?: string | null
          client_position?: string | null
          created_at?: string
          display_locations?: string[] | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          project_type?: string | null
          rating?: number | null
          sector?: string | null
          testimonial_text: string
          updated_at?: string
        }
        Update: {
          client_company?: string
          client_name?: string
          client_photo_url?: string | null
          client_position?: string | null
          created_at?: string
          display_locations?: string[] | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          project_type?: string | null
          rating?: number | null
          sector?: string | null
          testimonial_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      token_access_log: {
        Row: {
          access_ip: unknown
          accessed_at: string | null
          failure_reason: string | null
          id: string
          success: boolean
          token_hash_prefix: string | null
          token_id: string | null
          user_agent: string | null
          valuation_id: string | null
        }
        Insert: {
          access_ip?: unknown
          accessed_at?: string | null
          failure_reason?: string | null
          id?: string
          success: boolean
          token_hash_prefix?: string | null
          token_id?: string | null
          user_agent?: string | null
          valuation_id?: string | null
        }
        Update: {
          access_ip?: unknown
          accessed_at?: string | null
          failure_reason?: string | null
          id?: string
          success?: boolean
          token_hash_prefix?: string | null
          token_id?: string | null
          user_agent?: string | null
          valuation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_access_log_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "valuation_share_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_access_log_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "company_valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_access_log_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_ratings: {
        Row: {
          company_sector: string | null
          company_size: string | null
          created_at: string
          ease_of_use: number
          feedback_comment: string | null
          id: string
          ip_address: unknown
          recommendation: number
          result_accuracy: number
          user_agent: string | null
          user_email: string | null
        }
        Insert: {
          company_sector?: string | null
          company_size?: string | null
          created_at?: string
          ease_of_use: number
          feedback_comment?: string | null
          id?: string
          ip_address?: unknown
          recommendation: number
          result_accuracy: number
          user_agent?: string | null
          user_email?: string | null
        }
        Update: {
          company_sector?: string | null
          company_size?: string | null
          created_at?: string
          ease_of_use?: number
          feedback_comment?: string | null
          id?: string
          ip_address?: unknown
          recommendation?: number
          result_accuracy?: number
          user_agent?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      topbar_config: {
        Row: {
          created_at: string
          id: string
          phone_link: string
          phone_number: string
          show_language_selector: boolean
          show_search: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone_link?: string
          phone_number?: string
          show_language_selector?: boolean
          show_search?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          phone_link?: string
          phone_number?: string
          show_language_selector?: boolean
          show_search?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      topbar_group_companies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_current: boolean
          logo_url: string | null
          name: string
          position: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_current?: boolean
          logo_url?: string | null
          name: string
          position?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_current?: boolean
          logo_url?: string | null
          name?: string
          position?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      topbar_links: {
        Row: {
          created_at: string
          href: string
          id: string
          is_active: boolean
          is_external: boolean
          label: string
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          href: string
          id?: string
          is_active?: boolean
          is_external?: boolean
          label: string
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          is_active?: boolean
          is_external?: boolean
          label?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      tracking_events: {
        Row: {
          company_domain: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown
          page_path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string
        }
        Insert: {
          company_domain?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          page_path?: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id: string
        }
        Update: {
          company_domain?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          page_path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      tv_dashboard_fase_mapping: {
        Row: {
          activo: boolean
          color: string
          columna_tv: string
          created_at: string
          fase_id: string
          fase_tipo: string
          icono: string
          id: string
          orden: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          color: string
          columna_tv: string
          created_at?: string
          fase_id: string
          fase_tipo: string
          icono: string
          id?: string
          orden: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          color?: string
          columna_tv?: string
          created_at?: string
          fase_id?: string
          fase_tipo?: string
          icono?: string
          id?: string
          orden?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_absences: {
        Row: {
          absence_date: string
          absence_type: Database["public"]["Enums"]["absence_type"]
          approved_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          absence_date: string
          absence_type?: Database["public"]["Enums"]["absence_type"]
          approved_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          absence_date?: string
          absence_type?: Database["public"]["Enums"]["absence_type"]
          approved_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_dashboard_layouts: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          is_shared: boolean
          layout_data: Json
          layout_name: string
          shared_with: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_shared?: boolean
          layout_data?: Json
          layout_name: string
          shared_with?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          is_shared?: boolean
          layout_data?: Json
          layout_name?: string
          shared_with?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          skipped: boolean | null
          step_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          skipped?: boolean | null
          step_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          skipped?: boolean | null
          step_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_registration_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          ip_address: unknown
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          requested_at: string
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          ip_address?: unknown
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          ip_address?: unknown
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      valuation_share_tokens: {
        Row: {
          created_at: string | null
          created_by_ip: unknown
          expires_at: string
          id: string
          last_accessed_at: string | null
          max_views: number | null
          revoked_at: string | null
          token_hash: string
          valuation_id: string
          views_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by_ip?: unknown
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          max_views?: number | null
          revoked_at?: string | null
          token_hash: string
          valuation_id: string
          views_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by_ip?: unknown
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          max_views?: number | null
          revoked_at?: string | null
          token_hash?: string
          valuation_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "valuation_share_tokens_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "company_valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuation_share_tokens_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      valuation_sync_log: {
        Row: {
          contactos_created: number | null
          contactos_linked: number | null
          duration_ms: number | null
          empresas_created: number | null
          empresas_linked: number | null
          errors: Json | null
          executed_at: string | null
          executed_by: string | null
          id: string
          status: string | null
          total_valuations: number | null
        }
        Insert: {
          contactos_created?: number | null
          contactos_linked?: number | null
          duration_ms?: number | null
          empresas_created?: number | null
          empresas_linked?: number | null
          errors?: Json | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          status?: string | null
          total_valuations?: number | null
        }
        Update: {
          contactos_created?: number | null
          contactos_linked?: number | null
          duration_ms?: number | null
          empresas_created?: number | null
          empresas_linked?: number | null
          errors?: Json | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          status?: string | null
          total_valuations?: number | null
        }
        Relationships: []
      }
      venta_empresas_comparisons: {
        Row: {
          aspect: string
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          is_critical: boolean | null
          updated_at: string | null
          with_capittal: string
          without_capittal: string
        }
        Insert: {
          aspect: string
          created_at?: string | null
          display_order: number
          id?: string
          is_active?: boolean | null
          is_critical?: boolean | null
          updated_at?: string | null
          with_capittal: string
          without_capittal: string
        }
        Update: {
          aspect?: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          is_critical?: boolean | null
          updated_at?: string | null
          with_capittal?: string
          without_capittal?: string
        }
        Relationships: []
      }
      venta_empresas_process_steps: {
        Row: {
          created_at: string | null
          description: string
          display_order: number
          duration: string
          icon_name: string
          id: string
          is_active: boolean | null
          step_number: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          display_order: number
          duration: string
          icon_name?: string
          id?: string
          is_active?: boolean | null
          step_number: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number
          duration?: string
          icon_name?: string
          id?: string
          is_active?: boolean | null
          step_number?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      venta_empresas_testimonials: {
        Row: {
          avatar_initials: string
          company: string
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          name: string
          position: string
          price_increase: string
          quote: string
          rating: number | null
          sector: string
          time_to_sale: string
          updated_at: string | null
          valuation: string
        }
        Insert: {
          avatar_initials: string
          company: string
          created_at?: string | null
          display_order: number
          id?: string
          is_active?: boolean | null
          name: string
          position: string
          price_increase: string
          quote: string
          rating?: number | null
          sector: string
          time_to_sale: string
          updated_at?: string | null
          valuation: string
        }
        Update: {
          avatar_initials?: string
          company?: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          name?: string
          position?: string
          price_increase?: string
          quote?: string
          rating?: number | null
          sector?: string
          time_to_sale?: string
          updated_at?: string | null
          valuation?: string
        }
        Relationships: []
      }
      video_slides: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      webinar_registrations: {
        Row: {
          attended: boolean | null
          attended_at: string | null
          company: string | null
          created_at: string
          email: string
          email_sent: boolean | null
          email_sent_at: string | null
          full_name: string
          id: string
          ip_address: unknown
          job_title: string | null
          phone: string | null
          referrer: string | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          sector: string | null
          specific_interests: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          webinar_id: string
          years_experience: string | null
        }
        Insert: {
          attended?: boolean | null
          attended_at?: string | null
          company?: string | null
          created_at?: string
          email: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name: string
          id?: string
          ip_address?: unknown
          job_title?: string | null
          phone?: string | null
          referrer?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          sector?: string | null
          specific_interests?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          webinar_id: string
          years_experience?: string | null
        }
        Update: {
          attended?: boolean | null
          attended_at?: string | null
          company?: string | null
          created_at?: string
          email?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name?: string
          id?: string
          ip_address?: unknown
          job_title?: string | null
          phone?: string | null
          referrer?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          sector?: string | null
          specific_interests?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          webinar_id?: string
          years_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webinar_registrations_webinar_id_fkey"
            columns: ["webinar_id"]
            isOneToOne: false
            referencedRelation: "webinars"
            referencedColumns: ["id"]
          },
        ]
      }
      webinars: {
        Row: {
          attendee_count: number | null
          category: string
          created_at: string
          description: string
          duration_minutes: number
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          key_takeaways: string[] | null
          materials_url: string | null
          max_capacity: number | null
          recording_url: string | null
          registration_url: string | null
          sector: string | null
          short_description: string | null
          speaker_avatar_url: string | null
          speaker_company: string | null
          speaker_name: string
          speaker_title: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          webinar_date: string
        }
        Insert: {
          attendee_count?: number | null
          category: string
          created_at?: string
          description: string
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          key_takeaways?: string[] | null
          materials_url?: string | null
          max_capacity?: number | null
          recording_url?: string | null
          registration_url?: string | null
          sector?: string | null
          short_description?: string | null
          speaker_avatar_url?: string | null
          speaker_company?: string | null
          speaker_name: string
          speaker_title: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          webinar_date: string
        }
        Update: {
          attendee_count?: number | null
          category?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          key_takeaways?: string[] | null
          materials_url?: string | null
          max_capacity?: number | null
          recording_url?: string | null
          registration_url?: string | null
          sector?: string | null
          short_description?: string | null
          speaker_avatar_url?: string | null
          speaker_company?: string | null
          speaker_name?: string
          speaker_title?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          webinar_date?: string
        }
        Relationships: []
      }
      work_task_types: {
        Row: {
          context: string | null
          created_at: string | null
          default_value_type:
            | Database["public"]["Enums"]["time_entry_value_type"]
            | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          require_description: boolean
          require_lead: boolean
          require_mandato: boolean
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          default_value_type?:
            | Database["public"]["Enums"]["time_entry_value_type"]
            | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          require_description?: boolean
          require_lead?: boolean
          require_mandato?: boolean
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string | null
          default_value_type?:
            | Database["public"]["Enums"]["time_entry_value_type"]
            | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          require_description?: boolean
          require_lead?: boolean
          require_mandato?: boolean
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_task_templates: {
        Row: {
          created_at: string | null
          description: string | null
          due_days_offset: number | null
          id: string
          is_active: boolean | null
          is_automatable: boolean | null
          lead_type: string | null
          responsible_system: string
          task_category: string
          task_name: string
          task_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_days_offset?: number | null
          id?: string
          is_active?: boolean | null
          is_automatable?: boolean | null
          lead_type?: string | null
          responsible_system: string
          task_category: string
          task_name: string
          task_order: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_days_offset?: number | null
          id?: string
          is_active?: boolean | null
          is_automatable?: boolean | null
          lead_type?: string | null
          responsible_system?: string
          task_category?: string
          task_name?: string
          task_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      banner_daily_analytics: {
        Row: {
          banner_id: string | null
          banner_name: string | null
          banner_slug: string | null
          clicks: number | null
          ctr_percentage: number | null
          event_date: string | null
          impressions: number | null
          unique_pages: number | null
          unique_users: number | null
        }
        Relationships: [
          {
            foreignKeyName: "banner_events_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
        ]
      }
      mandato_time_summary: {
        Row: {
          descripcion: string | null
          horas_facturables: number | null
          mandato_id: string | null
          promedio_horas_por_entrada: number | null
          tipo: string | null
          total_entradas: number | null
          total_horas: number | null
          trabajadores_asignados: number | null
        }
        Relationships: []
      }
      task_time_summary: {
        Row: {
          fase: string | null
          mandato_id: string | null
          tarea: string | null
          task_id: string | null
          total_entradas: number | null
          total_horas: number | null
          usuarios_trabajando: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mandato_checklist_tasks_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_checklist_tasks_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_checklist_tasks_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_checklist_tasks_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_checklist_tasks_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_checklist_tasks_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
        ]
      }
      v_active_alerts: {
        Row: {
          alert_type: string | null
          created_at: string | null
          description: string | null
          empresa_nombre: string | null
          empresa_sector: string | null
          expires_at: string | null
          id: string | null
          is_dismissed: boolean | null
          is_read: boolean | null
          mandato_estado: string | null
          mandato_id: string | null
          mandato_tipo: string | null
          mandato_valor: number | null
          metadata: Json | null
          pipeline_stage: string | null
          severity: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mandato_alerts_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_alerts_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_alerts_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_alerts_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_alerts_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_alerts_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
        ]
      }
      v_admin_users_safe: {
        Row: {
          created_at: string | null
          email_masked: string | null
          full_name_masked: string | null
          id: string | null
          is_active: boolean | null
          last_login: string | null
          role: Database["public"]["Enums"]["admin_role"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_masked?: never
          full_name_masked?: never
          id?: string | null
          is_active?: boolean | null
          last_login?: string | null
          role?: Database["public"]["Enums"]["admin_role"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_masked?: never
          full_name_masked?: never
          id?: string | null
          is_active?: boolean | null
          last_login?: string | null
          role?: Database["public"]["Enums"]["admin_role"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_api_usage_monthly: {
        Row: {
          call_count: number | null
          month: string | null
          operation: string | null
          service: string | null
          total_cost: number | null
          total_credits: number | null
          total_tokens: number | null
        }
        Relationships: []
      }
      v_brevo_sync_status: {
        Row: {
          entity_type: string | null
          pending_sync: number | null
          synced: number | null
          total: number | null
        }
        Relationships: []
      }
      v_cr_portfolio_con_actividad: {
        Row: {
          company_name: string | null
          country: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          employee_count_estimate: number | null
          enriched_at: string | null
          enriched_data: Json | null
          enrichment_source: string | null
          exit_type: string | null
          exit_year: number | null
          fund_display_name: string | null
          fund_id: string | null
          fund_type: string | null
          id: string | null
          investment_type: string | null
          investment_year: number | null
          is_deleted: boolean | null
          key_people: Json | null
          last_news_scan_at: string | null
          last_web_check_at: string | null
          news_alert_count: number | null
          notes: string | null
          ownership_type: string | null
          revenue_estimate: string | null
          scan_priority: string | null
          sector: string | null
          sector_pe: string | null
          skip_news_scan: boolean | null
          social_links: Json | null
          source_url: string | null
          status: string | null
          technologies: string[] | null
          total_interacciones: number | null
          ultima_interaccion: string | null
          updated_at: string | null
          website: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cr_portfolio_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "cr_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      v_documentos_con_versiones: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_size_bytes: number | null
          folder_id: string | null
          folder_name: string | null
          folder_type: string | null
          id: string | null
          is_data_room: boolean | null
          is_latest_version: boolean | null
          latest_version: number | null
          mandato_id: string | null
          mime_type: string | null
          parent_document_id: string | null
          storage_path: string | null
          tags: string[] | null
          tipo: string | null
          total_versions: number | null
          updated_at: string | null
          uploaded_by: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "documentos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "documentos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "documentos_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "v_documentos_con_versiones"
            referencedColumns: ["id"]
          },
        ]
      }
      v_email_queue_stats: {
        Row: {
          avg_attempts: number | null
          count: number | null
          newest: string | null
          oldest: string | null
          queue_type: string | null
          status: string | null
        }
        Relationships: []
      }
      v_empleados_completo: {
        Row: {
          codigo_empleado: string | null
          coste_total_mensual: number | null
          created_at: string | null
          departamento_id: string | null
          departamento_nombre: string | null
          empresa_id: string | null
          empresa_nombre: string | null
          id: string | null
          is_active: boolean | null
          nombre: string | null
          puesto: string | null
          salario_base: number | null
          tipo_contrato: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rh_empleados_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "rh_departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_empleados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "rh_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      v_empresa_valuations: {
        Row: {
          cif: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string | null
          ebitda: number | null
          email: string | null
          empresa_id: string | null
          final_valuation: number | null
          id: string | null
          industry: string | null
          is_deleted: boolean | null
          match_type: string | null
          matched_empresa_id: string | null
          matched_empresa_nombre: string | null
          phone: string | null
          revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_valuations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_valuations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "company_valuations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
        ]
      }
      v_empresas_con_actividad: {
        Row: {
          actividades_destacadas: string[] | null
          alexa_ranking: number | null
          año_datos_financieros: number | null
          apollo_enriched_at: string | null
          apollo_intent_level: string | null
          apollo_last_synced_at: string | null
          apollo_org_id: string | null
          apollo_raw_data: Json | null
          apollo_score: number | null
          apollo_visitor_date: string | null
          apollo_visitor_source: string | null
          brevo_id: string | null
          brevo_last_modified_at: string | null
          brevo_synced_at: string | null
          capital_circulante: number | null
          cif: string | null
          cnae_codigo: string | null
          cnae_descripcion: string | null
          created_at: string | null
          departmental_headcount: Json | null
          descripcion: string | null
          deuda: number | null
          ebitda: number | null
          ebitda_margin: number | null
          empleados: number | null
          es_target: boolean | null
          estado_target: string | null
          facebook_url: string | null
          facturacion: number | null
          fecha_enriquecimiento: string | null
          founded_year: number | null
          fuente_enriquecimiento: string | null
          id: string | null
          import_log_id: string | null
          keywords: string[] | null
          linkedin_url: string | null
          margen_ebitda: number | null
          nivel_interes: string | null
          nombre: string | null
          origen: string | null
          potencial_search_fund: boolean | null
          revenue: number | null
          sector: string | null
          sector_id: string | null
          sitio_web: string | null
          source: string | null
          source_id: string | null
          source_pro_valuation_id: string | null
          source_valuation_id: string | null
          subsector: string | null
          technologies: Json | null
          ubicacion: string | null
          ultima_actividad: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_import_log_id_fkey"
            columns: ["import_log_id"]
            isOneToOne: false
            referencedRelation: "import_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_source_pro_valuation_id_fkey"
            columns: ["source_pro_valuation_id"]
            isOneToOne: false
            referencedRelation: "professional_valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_source_valuation_id_fkey"
            columns: ["source_valuation_id"]
            isOneToOne: false
            referencedRelation: "company_valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_source_valuation_id_fkey"
            columns: ["source_valuation_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_enrichment_stats: {
        Row: {
          enriched: number | null
          entity_type: string | null
          pending_no_website: number | null
          pending_with_website: number | null
          total: number | null
        }
        Relationships: []
      }
      v_mandato_costs: {
        Row: {
          billable_cost: number | null
          billable_hours: number | null
          billable_percentage: number | null
          descripcion: string | null
          empresa_nombre: string | null
          entries_count: number | null
          estado: string | null
          mandato_id: string | null
          tipo: string | null
          total_cost: number | null
          total_hours: number | null
        }
        Relationships: []
      }
      v_mandatos_stuck: {
        Row: {
          created_at: string | null
          days_in_stage: number | null
          days_inactive: number | null
          descripcion: string | null
          empresa_principal_id: string | null
          es_interno: boolean | null
          estado: string | null
          estado_negociacion: string | null
          expected_close_date: string | null
          fecha_cierre: string | null
          fecha_inicio: string | null
          id: string | null
          import_log_id: string | null
          last_activity_at: string | null
          numero_ofertas_recibidas: number | null
          perfil_empresa_buscada: string | null
          pipeline_stage: string | null
          prioridad: string | null
          probability: number | null
          rango_inversion_max: number | null
          rango_inversion_min: number | null
          sectores_interes: string[] | null
          stage_color: string | null
          stage_entered_at: string | null
          stage_name: string | null
          timeline_objetivo: string | null
          tipo: string | null
          tipo_comprador_buscado: string | null
          updated_at: string | null
          valor: number | null
          valoracion_esperada: number | null
          weighted_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mandatos_empresa_principal_id_fkey"
            columns: ["empresa_principal_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandatos_empresa_principal_id_fkey"
            columns: ["empresa_principal_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "mandatos_empresa_principal_id_fkey"
            columns: ["empresa_principal_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandatos_import_log_id_fkey"
            columns: ["import_log_id"]
            isOneToOne: false
            referencedRelation: "import_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      v_mandatos_winloss: {
        Row: {
          closed_at: string | null
          empresa_nombre: string | null
          estado: string | null
          id: string | null
          loss_notes: string | null
          loss_reason: Database["public"]["Enums"]["loss_reason_type"] | null
          outcome: Database["public"]["Enums"]["mandato_outcome"] | null
          pipeline_stage: string | null
          sector: string | null
          tipo: string | null
          valor: number | null
          won_value: number | null
        }
        Relationships: []
      }
      v_nominas_completo: {
        Row: {
          anio: number | null
          bruto: number | null
          coste_empresa: number | null
          created_at: string | null
          empleado_id: string | null
          empleado_nombre: string | null
          empresa_nombre: string | null
          id: string | null
          mes: number | null
          neto: number | null
          pdf_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rh_nominas_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "rh_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_nominas_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "v_empleados_completo"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pipeline_summary: {
        Row: {
          avg_days_in_stage: number | null
          color: string | null
          deal_count: number | null
          default_probability: number | null
          stage_key: string | null
          stage_name: string | null
          stage_order: number | null
          total_value: number | null
          weighted_value: number | null
        }
        Relationships: []
      }
      v_sector_multiples: {
        Row: {
          ebitda_multiple_max: number | null
          ebitda_multiple_median: number | null
          ebitda_multiple_min: number | null
          net_profit_multiple_max: number | null
          net_profit_multiple_median: number | null
          net_profit_multiple_min: number | null
          revenue_multiple_max: number | null
          revenue_multiple_median: number | null
          revenue_multiple_min: number | null
          sector_name: string | null
        }
        Insert: {
          ebitda_multiple_max?: number | null
          ebitda_multiple_median?: number | null
          ebitda_multiple_min?: number | null
          net_profit_multiple_max?: number | null
          net_profit_multiple_median?: number | null
          net_profit_multiple_min?: number | null
          revenue_multiple_max?: number | null
          revenue_multiple_median?: number | null
          revenue_multiple_min?: number | null
          sector_name?: string | null
        }
        Update: {
          ebitda_multiple_max?: number | null
          ebitda_multiple_median?: number | null
          ebitda_multiple_min?: number | null
          net_profit_multiple_max?: number | null
          net_profit_multiple_median?: number | null
          net_profit_multiple_min?: number | null
          revenue_multiple_max?: number | null
          revenue_multiple_median?: number | null
          revenue_multiple_min?: number | null
          sector_name?: string | null
        }
        Relationships: []
      }
      v_time_entry_value_stats: {
        Row: {
          entries_count: number | null
          mandato_id: string | null
          total_hours: number | null
          total_minutes: number | null
          value_type:
            | Database["public"]["Enums"]["time_entry_value_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "mandato_time_entries_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandato_time_summary"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_time_entries_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_time_entries_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandato_costs"
            referencedColumns: ["mandato_id"]
          },
          {
            foreignKeyName: "mandato_time_entries_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_stuck"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_time_entries_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "v_mandatos_winloss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandato_time_entries_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "vw_mandate_pipeline"
            referencedColumns: ["mandato_id"]
          },
        ]
      }
      vw_campaign_funnel_stats: {
        Row: {
          campaign_id: string | null
          cim_conversion: number | null
          cim_opened: number | null
          ioi_conversion: number | null
          ioi_received: number | null
          nda_conversion: number | null
          nda_sent: number | null
          nda_signed: number | null
          open_rate: number | null
          teaser_opened: number | null
          teaser_sent: number | null
          total_recipients: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teaser_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "teaser_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_mandate_pipeline: {
        Row: {
          admin_lead_id: string | null
          admin_lead_match_status: string | null
          contacto_email: string | null
          contacto_nombre: string | null
          contacto_telefono: string | null
          dias_en_pipeline: number | null
          ebitda: number | null
          empleados: number | null
          empresa_cif: string | null
          empresa_id: string | null
          empresa_nombre: string | null
          facturacion: number | null
          fecha_asignacion: string | null
          fecha_responsable: string | null
          fuente: string | null
          lead_source_id: string | null
          lead_source_type: string | null
          mandate_lead_id: string | null
          mandato_codigo: string | null
          mandato_descripcion: string | null
          mandato_estado: string | null
          mandato_id: string | null
          mandato_tipo: string | null
          match_reason: string | null
          match_score: number | null
          match_type: string | null
          prioridad: string | null
          rango_inversion_max: number | null
          rango_inversion_min: number | null
          responsable_id: string | null
          responsable_nombre: string | null
          sector: string | null
          sectores_interes: string[] | null
          stage: string | null
          ubicacion: string | null
          ultima_actividad: string | null
          valuation_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mandate_leads_admin_lead_id_fkey"
            columns: ["admin_lead_id"]
            isOneToOne: false
            referencedRelation: "admin_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_leads_assigned_to_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mandate_leads_assigned_to_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "v_admin_users_safe"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mandate_leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["matched_empresa_id"]
          },
          {
            foreignKeyName: "mandate_leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "v_empresas_con_actividad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_leads_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "company_valuations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_leads_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "v_empresa_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_user_registration: {
        Args: { request_id: string }
        Returns: boolean
      }
      audit_extensions_location: {
        Args: never
        Returns: {
          extension_name: string
          schema_name: string
          security_recommendation: string
        }[]
      }
      audit_security_definer_objects: {
        Args: never
        Returns: {
          object_name: string
          object_type: string
          recommendation: string
          security_level: string
        }[]
      }
      audit_table_security: {
        Args: { table_name_param: string }
        Returns: {
          allows_anonymous: boolean
          command: string
          is_permissive: boolean
          policy_name: string
          security_risk_level: string
        }[]
      }
      audit_tracking_data_access: {
        Args: never
        Returns: {
          access_count: number
          access_date: string
          top_utm_sources: string[]
          unique_visitors: number
        }[]
      }
      audit_valuation_data_access: {
        Args: never
        Returns: {
          access_count: number
          access_date: string
          anonymous_access_count: number
          high_risk_access_count: number
          unique_ips: number
        }[]
      }
      bootstrap_first_admin: { Args: { user_email: string }; Returns: boolean }
      calculate_email_retry_at: { Args: { attempts: number }; Returns: string }
      can_access_cim: { Args: { p_recipient_id: string }; Returns: boolean }
      check_is_admin: { Args: { check_user_id: string }; Returns: boolean }
      check_is_super_admin: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      check_login_rate_limit: {
        Args: {
          p_email: string
          p_ip_address: unknown
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: Json
      }
      check_rate_limit:
        | {
            Args: {
              _action: string
              _identifier: string
              _max_requests?: number
              _window_minutes?: number
            }
            Returns: boolean
          }
        | {
            Args: {
              identifier: string
              max_requests?: number
              window_minutes?: number
            }
            Returns: boolean
          }
      check_rate_limit_enhanced: {
        Args: {
          p_category?: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_rate_limit_enhanced_safe: {
        Args: {
          p_category?: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_token_rate_limit: {
        Args: {
          p_ip: unknown
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_user_admin_role: {
        Args: { check_user_id: string }
        Returns: string
      }
      cleanup_brevo_sync_queue: { Args: never; Returns: number }
      cleanup_old_audit_logs: { Args: never; Returns: number }
      cleanup_old_tracking_events: { Args: never; Returns: number }
      complete_password_setup: { Args: never; Returns: boolean }
      copy_checklist_template_by_type: {
        Args: { p_mandato_id: string; p_tipo_operacion: string }
        Returns: number
      }
      copy_checklist_template_to_mandato: {
        Args: { p_mandato_id: string }
        Returns: number
      }
      create_admin_user_record: {
        Args: {
          p_email: string
          p_full_name: string
          p_role?: Database["public"]["Enums"]["admin_role"]
          p_user_id: string
        }
        Returns: Json
      }
      create_document_version: {
        Args: {
          p_file_name: string
          p_file_size_bytes: number
          p_mime_type: string
          p_parent_document_id: string
          p_storage_path: string
          p_uploaded_by?: string
        }
        Returns: string
      }
      create_share_token: {
        Args: {
          p_expires_minutes?: number
          p_ip?: unknown
          p_max_views?: number
          p_token_hash: string
          p_valuation_id: string
        }
        Returns: string
      }
      create_temporary_user: {
        Args: {
          p_email: string
          p_full_name: string
          p_role?: Database["public"]["Enums"]["admin_role"]
        }
        Returns: Json
      }
      create_temporary_user_bypass: {
        Args: {
          p_email: string
          p_full_name: string
          p_role?: Database["public"]["Enums"]["admin_role"]
        }
        Returns: Json
      }
      create_temporary_user_enhanced: {
        Args: {
          p_email: string
          p_full_name: string
          p_role?: Database["public"]["Enums"]["admin_role"]
        }
        Returns: Json
      }
      current_user_can_read: { Args: never; Returns: boolean }
      current_user_can_write: { Args: never; Returns: boolean }
      current_user_has_rh_access: { Args: never; Returns: boolean }
      current_user_is_admin: { Args: never; Returns: boolean }
      current_user_is_rh_admin: { Args: never; Returns: boolean }
      deactivate_admin_user: { Args: { p_user_id: string }; Returns: boolean }
      disk_usage_monitor: {
        Args: never
        Returns: {
          largest_tables: string[]
          recommendations: string[]
          storage_buckets_info: Json
          total_database_size: string
        }[]
      }
      enhanced_rate_limit_check: {
        Args: {
          identifier: string
          max_requests?: number
          window_minutes?: number
        }
        Returns: boolean
      }
      enqueue_email: {
        Args: {
          p_attachments?: Json
          p_from_email?: string
          p_from_name?: string
          p_html_content: string
          p_metadata?: Json
          p_priority?: number
          p_queue_type?: string
          p_reference_id?: string
          p_reference_type?: string
          p_scheduled_at?: string
          p_subject: string
          p_text_content?: string
          p_to_email: string
          p_to_name?: string
        }
        Returns: string
      }
      generate_fase0_reference_number: {
        Args: { doc_type: string }
        Returns: string
      }
      generate_mandato_alerts: { Args: never; Returns: undefined }
      generate_proposal_number: { Args: never; Returns: string }
      generate_secure_temp_password: { Args: never; Returns: string }
      generate_signed_valuation_token: { Args: never; Returns: string }
      generate_unique_proposal_url: { Args: never; Returns: string }
      get_admin_basic_info: {
        Args: never
        Returns: {
          full_name: string
          id: string
          is_active: boolean
          last_login: string
          role: Database["public"]["Enums"]["admin_role"]
        }[]
      }
      get_admin_security_alerts: {
        Args: never
        Returns: {
          alert_message: string
          alert_type: string
          company_name: string
          created_at: string
          email: string
          id: string
          token_expires_at: string
          token_used_at: string
          unique_token: string
        }[]
      }
      get_admin_user_info: {
        Args: { check_user_id: string }
        Returns: {
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }[]
      }
      get_brevo_queue_stats: {
        Args: never
        Returns: {
          count: number
          entity_type: string
          status: string
        }[]
      }
      get_checklist_progress: {
        Args: { p_mandato_id: string }
        Returns: {
          completadas: number
          dias_estimados: number
          en_curso: number
          fase: string
          pendientes: number
          porcentaje: number
          tareas_criticas: number
          total: number
          vencidas: number
        }[]
      }
      get_email_metrics: { Args: { p_period?: string }; Returns: Json }
      get_lead_ai_stats: { Args: never; Returns: Json }
      get_marketplace_analytics: { Args: { days_back?: number }; Returns: Json }
      get_news_filter_options: {
        Args: never
        Returns: {
          all_tags: string[]
          categories: string[]
        }[]
      }
      get_overdue_tasks: {
        Args: { p_mandato_id: string }
        Returns: {
          dias_vencida: number
          es_critica: boolean
          fase: string
          fecha_limite: string
          id: string
          tarea: string
        }[]
      }
      get_portfolio_filter_options: {
        Args: never
        Returns: {
          countries: string[]
          sectors: string[]
          stages: string[]
        }[]
      }
      get_sector_dossier_stats: { Args: never; Returns: Json }
      get_sync_history: {
        Args: never
        Returns: {
          contactos_created: number
          contactos_linked: number
          duration_ms: number
          empresas_created: number
          empresas_linked: number
          errors_count: number
          executed_at: string
          id: string
          status: string
          total_valuations: number
        }[]
      }
      get_user_role: { Args: { check_user_id: string }; Returns: string }
      get_valuation_analytics: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_valuation_sync_stats: { Args: never; Returns: Json }
      grant_rh_role: {
        Args: {
          notes_text?: string
          target_role: Database["public"]["Enums"]["rh_role"]
          target_user_id: string
        }
        Returns: Json
      }
      has_rh_role: {
        Args: {
          _role: Database["public"]["Enums"]["rh_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          check_user_id: string
          required_role: Database["public"]["Enums"]["admin_role"]
        }
        Returns: boolean
      }
      increment_email_opens: {
        Args: {
          p_opened_at?: string
          p_record_id: string
          p_table_name: string
        }
        Returns: undefined
      }
      is_admin_user:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
      is_full_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_nda_eligible: { Args: { p_recipient_id: string }; Returns: boolean }
      is_user_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_user_super_admin: { Args: { check_user_id: string }; Returns: boolean }
      link_valuation_to_empresa: {
        Args: { p_empresa_id: string; p_valuation_id: string }
        Returns: boolean
      }
      log_auth_security_event: {
        Args: {
          details?: Json
          event_type: string
          ip_address?: unknown
          user_agent?: string
          user_email?: string
        }
        Returns: undefined
      }
      log_behavior_access_violation: { Args: never; Returns: undefined }
      log_critical_security_event: {
        Args: {
          details?: Json
          event_type: string
          operation: string
          table_name: string
        }
        Returns: undefined
      }
      log_critical_security_violation: {
        Args: { details?: Json; target_table: string; violation_type: string }
        Returns: undefined
      }
      log_document_access: {
        Args: {
          p_access_type?: string
          p_documento_id: string
          p_documento_nombre?: string
        }
        Returns: string
      }
      log_login_attempt: {
        Args: {
          p_email: string
          p_ip_address: unknown
          p_success: boolean
          p_user_agent?: string
        }
        Returns: undefined
      }
      log_security_event:
        | {
            Args: { _details?: Json; _event_type: string; _severity: string }
            Returns: string
          }
        | {
            Args: {
              p_action_attempted?: string
              p_details?: Json
              p_event_type: string
              p_severity?: string
              p_table_name?: string
            }
            Returns: undefined
          }
      log_security_violation: {
        Args: {
          details?: Json
          table_name: string
          user_id?: string
          violation_type: string
        }
        Returns: undefined
      }
      log_tracking_access_violation: { Args: never; Returns: undefined }
      log_valuation_access_attempt: { Args: never; Returns: undefined }
      merge_contactos: {
        Args: { p_source_id: string; p_target_id: string; p_user_id: string }
        Returns: Json
      }
      monitor_security_violations: { Args: never; Returns: undefined }
      normalize_company_name: { Args: { name: string }; Returns: string }
      record_tracking_event: {
        Args: {
          p_clicked_url?: string
          p_event_type: string
          p_ip_address?: unknown
          p_tracking_id: string
          p_user_agent?: string
        }
        Returns: {
          campaign_id: string
          recipient_id: string
          success: boolean
        }[]
      }
      refresh_banner_analytics: { Args: never; Returns: undefined }
      refresh_mandatos_days_in_stage: { Args: never; Returns: undefined }
      reject_user_registration: {
        Args: { reason?: string; request_id: string }
        Returns: boolean
      }
      report_metrics: { Args: { filters: Json }; Returns: Json }
      retry_failed_brevo_sync: {
        Args: { p_entity_type?: string }
        Returns: number
      }
      revoke_rh_role: {
        Args: {
          target_role: Database["public"]["Enums"]["rh_role"]
          target_user_id: string
        }
        Returns: Json
      }
      rollback_import: { Args: { p_import_log_id: string }; Returns: Json }
      search_contactos_full: {
        Args: { search_query: string }
        Returns: {
          apellidos: string
          avatar: string
          cargo: string
          created_at: string
          email: string
          empresa_nombre: string
          empresa_principal_id: string
          id: string
          linkedin: string
          nombre: string
          notas: string
          telefono: string
          updated_at: string
        }[]
      }
      search_news_articles: {
        Args: {
          filter_category?: string
          filter_tags?: string[]
          limit_count?: number
          offset_count?: number
          search_query?: string
        }
        Returns: {
          author_avatar_url: string
          author_name: string
          category: string
          content: string
          excerpt: string
          featured_image_url: string
          id: string
          is_featured: boolean
          published_at: string
          read_time: number
          relevance: number
          slug: string
          tags: string[]
          title: string
        }[]
      }
      search_portfolio_companies: {
        Args: {
          filter_country?: string
          filter_sector?: string
          filter_stage?: string
          limit_count?: number
          offset_count?: number
          search_query?: string
        }
        Returns: {
          country: string
          description: string
          founded_year: number
          id: string
          investment_date: string
          investment_thesis: string
          is_featured: boolean
          logo_url: string
          metrics: Json
          name: string
          relevance: number
          sector: string
          slug: string
          stage: string
          timeline: Json
          website_url: string
        }[]
      }
      sync_valuations_to_contactos: {
        Args: never
        Returns: {
          contactos_created: number
          contactos_skipped: number
          contactos_updated: number
        }[]
      }
      sync_valuations_to_crm: { Args: { p_dry_run?: boolean }; Returns: Json }
      sync_valuations_to_empresas: {
        Args: never
        Returns: {
          empresas_created: number
          empresas_skipped: number
          empresas_updated: number
        }[]
      }
      unlink_valuation_from_empresa: {
        Args: { p_valuation_id: string }
        Returns: boolean
      }
      update_admin_user_role: {
        Args: {
          p_new_role: Database["public"]["Enums"]["admin_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      update_campaign_metrics: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      update_kanban_order: { Args: { updates: Json }; Returns: undefined }
      update_wave_metrics: { Args: { p_wave_id: string }; Returns: undefined }
      validate_data_access_security: {
        Args: never
        Returns: {
          has_rls: boolean
          policy_count: number
          security_status: string
          table_name: string
        }[]
      }
      validate_share_token: {
        Args: { p_ip?: unknown; p_token_hash: string }
        Returns: {
          failure_reason: string
          is_valid: boolean
          valuation_id: string
        }[]
      }
      validate_strong_password: {
        Args: { password_text: string }
        Returns: boolean
      }
      validate_valuation_token: { Args: { _token: string }; Returns: string }
      verify_valuation_token: { Args: { token: string }; Returns: boolean }
    }
    Enums: {
      absence_type: "vacation" | "sick_leave" | "personal" | "other"
      access_level: "internal" | "client" | "public"
      admin_role: "super_admin" | "admin" | "editor" | "viewer"
      dd_workstream:
        | "legal"
        | "financial"
        | "commercial"
        | "ops"
        | "it"
        | "tax"
        | "other"
      document_category:
        | "nda"
        | "financial_statements"
        | "due_diligence"
        | "legal"
        | "contracts"
        | "presentations"
        | "reports"
        | "correspondence"
        | "other"
      document_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
        | "archived"
      documento_tipo:
        | "Contrato"
        | "NDA"
        | "Due Diligence"
        | "Financiero"
        | "Legal"
        | "Otro"
      lead_status:
        | "nuevo"
        | "contactando"
        | "calificado"
        | "propuesta_enviada"
        | "negociacion"
        | "en_espera"
        | "ganado"
        | "perdido"
        | "archivado"
        | "fase0_activo"
        | "fase0_bloqueado"
        | "mandato_propuesto"
        | "mandato_firmado"
      loss_reason_type:
        | "precio"
        | "competidor"
        | "timing"
        | "fit_estrategico"
        | "due_diligence"
        | "financiacion"
        | "cambio_prioridades"
        | "relacion_cliente"
        | "otro"
      mandato_outcome: "open" | "won" | "lost" | "cancelled"
      presentation_type:
        | "teaser_sell"
        | "firm_deck"
        | "client_deck"
        | "one_pager"
        | "mandate_deck"
        | "custom"
      proposal_status:
        | "draft"
        | "sent"
        | "viewed"
        | "approved"
        | "rejected"
        | "expired"
      rh_role: "rh_admin" | "rh_manager" | "rh_viewer"
      service_type:
        | "venta_empresas"
        | "due_diligence"
        | "valoraciones"
        | "asesoramiento_legal"
        | "planificacion_fiscal"
        | "reestructuraciones"
      service_type_enum: "vender" | "comprar" | "otros"
      share_permission: "view" | "download_pdf" | "edit"
      slide_layout:
        | "title"
        | "hero"
        | "stats"
        | "bullets"
        | "comparison"
        | "timeline"
        | "team"
        | "financials"
        | "closing"
        | "custom"
        | "disclaimer"
        | "overview"
        | "market"
      time_entry_value_type: "core_ma" | "soporte" | "bajo_valor"
      transaction_status: "pendiente" | "completada" | "cancelada"
      transaction_type:
        | "ingreso"
        | "gasto"
        | "honorario"
        | "due_diligence"
        | "ajuste_valoracion"
        | "comision"
        | "otro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      absence_type: ["vacation", "sick_leave", "personal", "other"],
      access_level: ["internal", "client", "public"],
      admin_role: ["super_admin", "admin", "editor", "viewer"],
      dd_workstream: [
        "legal",
        "financial",
        "commercial",
        "ops",
        "it",
        "tax",
        "other",
      ],
      document_category: [
        "nda",
        "financial_statements",
        "due_diligence",
        "legal",
        "contracts",
        "presentations",
        "reports",
        "correspondence",
        "other",
      ],
      document_status: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "archived",
      ],
      documento_tipo: [
        "Contrato",
        "NDA",
        "Due Diligence",
        "Financiero",
        "Legal",
        "Otro",
      ],
      lead_status: [
        "nuevo",
        "contactando",
        "calificado",
        "propuesta_enviada",
        "negociacion",
        "en_espera",
        "ganado",
        "perdido",
        "archivado",
        "fase0_activo",
        "fase0_bloqueado",
        "mandato_propuesto",
        "mandato_firmado",
      ],
      loss_reason_type: [
        "precio",
        "competidor",
        "timing",
        "fit_estrategico",
        "due_diligence",
        "financiacion",
        "cambio_prioridades",
        "relacion_cliente",
        "otro",
      ],
      mandato_outcome: ["open", "won", "lost", "cancelled"],
      presentation_type: [
        "teaser_sell",
        "firm_deck",
        "client_deck",
        "one_pager",
        "mandate_deck",
        "custom",
      ],
      proposal_status: [
        "draft",
        "sent",
        "viewed",
        "approved",
        "rejected",
        "expired",
      ],
      rh_role: ["rh_admin", "rh_manager", "rh_viewer"],
      service_type: [
        "venta_empresas",
        "due_diligence",
        "valoraciones",
        "asesoramiento_legal",
        "planificacion_fiscal",
        "reestructuraciones",
      ],
      service_type_enum: ["vender", "comprar", "otros"],
      share_permission: ["view", "download_pdf", "edit"],
      slide_layout: [
        "title",
        "hero",
        "stats",
        "bullets",
        "comparison",
        "timeline",
        "team",
        "financials",
        "closing",
        "custom",
        "disclaimer",
        "overview",
        "market",
      ],
      time_entry_value_type: ["core_ma", "soporte", "bajo_valor"],
      transaction_status: ["pendiente", "completada", "cancelada"],
      transaction_type: [
        "ingreso",
        "gasto",
        "honorario",
        "due_diligence",
        "ajuste_valoracion",
        "comision",
        "otro",
      ],
    },
  },
} as const
