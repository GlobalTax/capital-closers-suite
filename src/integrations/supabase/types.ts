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
      acquisition_leads: {
        Row: {
          acquisition_type: string | null
          additional_details: string | null
          company: string
          created_at: string
          email: string
          email_sent: boolean | null
          email_sent_at: string | null
          full_name: string
          hubspot_sent: boolean | null
          hubspot_sent_at: string | null
          id: string
          investment_range: string | null
          ip_address: unknown | null
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
          acquisition_type?: string | null
          additional_details?: string | null
          company: string
          created_at?: string
          email: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name: string
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          investment_range?: string | null
          ip_address?: unknown | null
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
          acquisition_type?: string | null
          additional_details?: string | null
          company?: string
          created_at?: string
          email?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name?: string
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          investment_range?: string | null
          ip_address?: unknown | null
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
        Relationships: []
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          target_user_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
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
      admin_users: {
        Row: {
          created_at: string
          credentials_sent_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          needs_credentials: boolean | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credentials_sent_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          needs_credentials?: boolean | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credentials_sent_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          needs_credentials?: boolean | null
          role?: Database["public"]["Enums"]["admin_role"]
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
        ]
      }
      banner_events: {
        Row: {
          banner_id: string
          created_at: string
          event: string
          id: string
          ip_address: unknown | null
          path: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          banner_id: string
          created_at?: string
          event: string
          id?: string
          ip_address?: unknown | null
          path: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          banner_id?: string
          created_at?: string
          event?: string
          id?: string
          ip_address?: unknown | null
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
      blog_analytics: {
        Row: {
          id: string
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
      calendar_bookings: {
        Row: {
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
          meeting_format: string
          meeting_type: string
          notes: string | null
          status: string
          updated_at: string
          valuation_id: string | null
        }
        Insert: {
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
          meeting_format?: string
          meeting_type?: string
          notes?: string | null
          status?: string
          updated_at?: string
          valuation_id?: string | null
        }
        Update: {
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
          meeting_format?: string
          meeting_type?: string
          notes?: string | null
          status?: string
          updated_at?: string
          valuation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_bookings_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "company_valuations"
            referencedColumns: ["id"]
          },
        ]
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
      collaborator_applications: {
        Row: {
          company: string | null
          created_at: string
          email: string
          email_message_id: string | null
          email_opened: boolean | null
          email_opened_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          experience: string | null
          full_name: string
          hubspot_sent: boolean | null
          hubspot_sent_at: string | null
          id: string
          ip_address: unknown | null
          motivation: string | null
          phone: string
          profession: string
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          experience?: string | null
          full_name: string
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          ip_address?: unknown | null
          motivation?: string | null
          phone: string
          profession: string
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          experience?: string | null
          full_name?: string
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          ip_address?: unknown | null
          motivation?: string | null
          phone?: string
          profession?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      company_acquisition_inquiries: {
        Row: {
          acquisition_type: string | null
          company: string
          created_at: string
          email: string
          email_message_id: string | null
          email_opened: boolean | null
          email_opened_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          full_name: string
          hubspot_sent: boolean | null
          hubspot_sent_at: string | null
          id: string
          investment_budget: string | null
          ip_address: unknown | null
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
          acquisition_type?: string | null
          company: string
          created_at?: string
          email: string
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name: string
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          investment_budget?: string | null
          ip_address?: unknown | null
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
          acquisition_type?: string | null
          company?: string
          created_at?: string
          email?: string
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name?: string
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          investment_budget?: string | null
          ip_address?: unknown | null
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
            foreignKeyName: "fk_acquisition_inquiries_processed_by"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      company_operations: {
        Row: {
          company_name: string
          company_size_employees: string | null
          created_at: string
          deal_type: string | null
          description: string
          display_locations: string[] | null
          ebitda_amount: number | null
          ebitda_multiple: number | null
          featured_image_url: string | null
          growth_percentage: number | null
          highlights: string[] | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          logo_url: string | null
          revenue_amount: number | null
          sector: string
          short_description: string | null
          status: string | null
          subsector: string | null
          updated_at: string
          valuation_amount: number
          valuation_currency: string | null
          year: number
        }
        Insert: {
          company_name: string
          company_size_employees?: string | null
          created_at?: string
          deal_type?: string | null
          description: string
          display_locations?: string[] | null
          ebitda_amount?: number | null
          ebitda_multiple?: number | null
          featured_image_url?: string | null
          growth_percentage?: number | null
          highlights?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          revenue_amount?: number | null
          sector: string
          short_description?: string | null
          status?: string | null
          subsector?: string | null
          updated_at?: string
          valuation_amount: number
          valuation_currency?: string | null
          year: number
        }
        Update: {
          company_name?: string
          company_size_employees?: string | null
          created_at?: string
          deal_type?: string | null
          description?: string
          display_locations?: string[] | null
          ebitda_amount?: number | null
          ebitda_multiple?: number | null
          featured_image_url?: string | null
          growth_percentage?: number | null
          highlights?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          revenue_amount?: number | null
          sector?: string
          short_description?: string | null
          status?: string | null
          subsector?: string | null
          updated_at?: string
          valuation_amount?: number
          valuation_currency?: string | null
          year?: number
        }
        Relationships: []
      }
      company_valuations: {
        Row: {
          activity_description: string | null
          adjustment_amount: number | null
          cif: string | null
          company_name: string
          competitive_advantage: string | null
          completion_percentage: number | null
          contact_name: string
          created_at: string
          current_step: number | null
          deleted_at: string | null
          ebitda: number | null
          ebitda_multiple_used: number | null
          email: string
          email_message_id: string | null
          email_opened: boolean | null
          email_opened_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          employee_range: string
          final_valuation: number | null
          form_submitted_at: string | null
          growth_rate: number | null
          has_adjustments: boolean | null
          hubspot_sent: boolean | null
          hubspot_sent_at: string | null
          id: string
          industry: string
          ip_address: unknown | null
          is_deleted: boolean | null
          last_activity_at: string | null
          last_modified_field: string | null
          location: string | null
          net_profit_margin: number | null
          ownership_participation: string | null
          phone: string | null
          phone_e164: string | null
          referrer: string | null
          revenue: number | null
          source_project: string | null
          time_spent_seconds: number | null
          token_expires_at: string | null
          token_used_at: string | null
          unique_token: string | null
          user_agent: string | null
          user_id: string | null
          valuation_range_max: number | null
          valuation_range_min: number | null
          valuation_status: string | null
          whatsapp_opt_in: boolean | null
          whatsapp_sent: boolean | null
          whatsapp_sent_at: string | null
          years_of_operation: number | null
        }
        Insert: {
          activity_description?: string | null
          adjustment_amount?: number | null
          cif?: string | null
          company_name: string
          competitive_advantage?: string | null
          completion_percentage?: number | null
          contact_name: string
          created_at?: string
          current_step?: number | null
          deleted_at?: string | null
          ebitda?: number | null
          ebitda_multiple_used?: number | null
          email: string
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          employee_range: string
          final_valuation?: number | null
          form_submitted_at?: string | null
          growth_rate?: number | null
          has_adjustments?: boolean | null
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          industry: string
          ip_address?: unknown | null
          is_deleted?: boolean | null
          last_activity_at?: string | null
          last_modified_field?: string | null
          location?: string | null
          net_profit_margin?: number | null
          ownership_participation?: string | null
          phone?: string | null
          phone_e164?: string | null
          referrer?: string | null
          revenue?: number | null
          source_project?: string | null
          time_spent_seconds?: number | null
          token_expires_at?: string | null
          token_used_at?: string | null
          unique_token?: string | null
          user_agent?: string | null
          user_id?: string | null
          valuation_range_max?: number | null
          valuation_range_min?: number | null
          valuation_status?: string | null
          whatsapp_opt_in?: boolean | null
          whatsapp_sent?: boolean | null
          whatsapp_sent_at?: string | null
          years_of_operation?: number | null
        }
        Update: {
          activity_description?: string | null
          adjustment_amount?: number | null
          cif?: string | null
          company_name?: string
          competitive_advantage?: string | null
          completion_percentage?: number | null
          contact_name?: string
          created_at?: string
          current_step?: number | null
          deleted_at?: string | null
          ebitda?: number | null
          ebitda_multiple_used?: number | null
          email?: string
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          employee_range?: string
          final_valuation?: number | null
          form_submitted_at?: string | null
          growth_rate?: number | null
          has_adjustments?: boolean | null
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          industry?: string
          ip_address?: unknown | null
          is_deleted?: boolean | null
          last_activity_at?: string | null
          last_modified_field?: string | null
          location?: string | null
          net_profit_margin?: number | null
          ownership_participation?: string | null
          phone?: string | null
          phone_e164?: string | null
          referrer?: string | null
          revenue?: number | null
          source_project?: string | null
          time_spent_seconds?: number | null
          token_expires_at?: string | null
          token_used_at?: string | null
          unique_token?: string | null
          user_agent?: string | null
          user_id?: string | null
          valuation_range_max?: number | null
          valuation_range_min?: number | null
          valuation_status?: string | null
          whatsapp_opt_in?: boolean | null
          whatsapp_sent?: boolean | null
          whatsapp_sent_at?: string | null
          years_of_operation?: number | null
        }
        Relationships: []
      }
      contact_leads: {
        Row: {
          company: string
          company_size: string | null
          country: string | null
          created_at: string
          email: string
          email_message_id: string | null
          email_opened: boolean | null
          email_opened_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          full_name: string
          hubspot_sent: boolean | null
          hubspot_sent_at: string | null
          id: string
          investment_budget: string | null
          ip_address: unknown | null
          phone: string | null
          referral: string | null
          sectors_of_interest: string | null
          service_type: Database["public"]["Enums"]["service_type_enum"] | null
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          company: string
          company_size?: string | null
          country?: string | null
          created_at?: string
          email: string
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name: string
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          investment_budget?: string | null
          ip_address?: unknown | null
          phone?: string | null
          referral?: string | null
          sectors_of_interest?: string | null
          service_type?: Database["public"]["Enums"]["service_type_enum"] | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          company?: string
          company_size?: string | null
          country?: string | null
          created_at?: string
          email?: string
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name?: string
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          investment_budget?: string | null
          ip_address?: unknown | null
          phone?: string | null
          referral?: string | null
          sectors_of_interest?: string | null
          service_type?: Database["public"]["Enums"]["service_type_enum"] | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
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
      contactos: {
        Row: {
          apellidos: string | null
          avatar: string | null
          cargo: string | null
          created_at: string | null
          email: string
          empresa_principal_id: string | null
          id: string
          linkedin: string | null
          nombre: string
          notas: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          apellidos?: string | null
          avatar?: string | null
          cargo?: string | null
          created_at?: string | null
          email: string
          empresa_principal_id?: string | null
          id?: string
          linkedin?: string | null
          nombre: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          apellidos?: string | null
          avatar?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string
          empresa_principal_id?: string | null
          id?: string
          linkedin?: string | null
          nombre?: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contactos_empresa_principal_id_fkey"
            columns: ["empresa_principal_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
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
      documentos: {
        Row: {
          created_at: string | null
          file_name: string
          file_size_bytes: number
          id: string
          mandato_id: string | null
          mime_type: string
          storage_path: string
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size_bytes: number
          id?: string
          mandato_id?: string | null
          mime_type: string
          storage_path: string
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size_bytes?: number
          id?: string
          mandato_id?: string | null
          mime_type?: string
          storage_path?: string
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
        ]
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
      empresas: {
        Row: {
          capital_circulante: number | null
          cif: string | null
          created_at: string | null
          descripcion: string | null
          deuda: number | null
          ebitda: number | null
          empleados: number | null
          es_target: boolean | null
          estado_target: string | null
          facturacion: number | null
          id: string
          margen_ebitda: number | null
          nivel_interes: string | null
          nombre: string
          revenue: number | null
          sector: string
          sitio_web: string | null
          subsector: string | null
          ubicacion: string | null
          updated_at: string | null
        }
        Insert: {
          capital_circulante?: number | null
          cif?: string | null
          created_at?: string | null
          descripcion?: string | null
          deuda?: number | null
          ebitda?: number | null
          empleados?: number | null
          es_target?: boolean | null
          estado_target?: string | null
          facturacion?: number | null
          id?: string
          margen_ebitda?: number | null
          nivel_interes?: string | null
          nombre: string
          revenue?: number | null
          sector: string
          sitio_web?: string | null
          subsector?: string | null
          ubicacion?: string | null
          updated_at?: string | null
        }
        Update: {
          capital_circulante?: number | null
          cif?: string | null
          created_at?: string | null
          descripcion?: string | null
          deuda?: number | null
          ebitda?: number | null
          empleados?: number | null
          es_target?: boolean | null
          estado_target?: string | null
          facturacion?: number | null
          id?: string
          margen_ebitda?: number | null
          nivel_interes?: string | null
          nombre?: string
          revenue?: number | null
          sector?: string
          sitio_web?: string | null
          subsector?: string | null
          ubicacion?: string | null
          updated_at?: string | null
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
      general_contact_leads: {
        Row: {
          annual_revenue: string | null
          company: string
          country: string | null
          created_at: string
          email: string
          email_message_id: string | null
          email_opened: boolean | null
          email_opened_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          full_name: string
          how_did_you_hear: string | null
          hubspot_sent: boolean | null
          hubspot_sent_at: string | null
          id: string
          ip_address: unknown | null
          message: string
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
          annual_revenue?: string | null
          company: string
          country?: string | null
          created_at?: string
          email: string
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name: string
          how_did_you_hear?: string | null
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          ip_address?: unknown | null
          message: string
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
          annual_revenue?: string | null
          company?: string
          country?: string | null
          created_at?: string
          email?: string
          email_message_id?: string | null
          email_opened?: boolean | null
          email_opened_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name?: string
          how_did_you_hear?: string | null
          hubspot_sent?: boolean | null
          hubspot_sent_at?: string | null
          id?: string
          ip_address?: unknown | null
          message?: string
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
        Relationships: []
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
      lead_security: {
        Row: {
          cif: string | null
          company_name: string
          contact_name: string
          created_at: string
          ebitda_band: string | null
          email: string
          id: string
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
      ma_resources_requests: {
        Row: {
          company: string
          created_at: string
          email: string
          full_name: string
          id: string
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
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
      mandato_empresas: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          mandato_id: string
          notas: string | null
          rol: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          mandato_id: string
          notas?: string | null
          rol: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          mandato_id?: string
          notas?: string | null
          rol?: string
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
            foreignKeyName: "mandato_empresas_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
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
        ]
      }
      mandatos: {
        Row: {
          created_at: string | null
          descripcion: string | null
          empresa_principal_id: string | null
          estado: string
          fecha_cierre: string | null
          fecha_inicio: string | null
          id: string
          prioridad: string | null
          tipo: string
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          empresa_principal_id?: string | null
          estado?: string
          fecha_cierre?: string | null
          fecha_inicio?: string | null
          id?: string
          prioridad?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          empresa_principal_id?: string | null
          estado?: string
          fecha_cierre?: string | null
          fecha_inicio?: string | null
          id?: string
          prioridad?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mandatos_empresa_principal_id_fkey"
            columns: ["empresa_principal_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
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
        ]
      }
      newsletter_subscribers: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          interests: string[] | null
          ip_address: unknown | null
          is_active: boolean
          source: string | null
          subscribed_at: string
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
          ip_address?: unknown | null
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
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
          ip_address?: unknown | null
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      operation_inquiries: {
        Row: {
          company_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
      pdf_download_logs: {
        Row: {
          created_at: string | null
          download_status: string
          file_size_bytes: number | null
          generation_time_ms: number | null
          id: string
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
        ]
      }
      rate_limits: {
        Row: {
          action: string
          count: number
          created_at: string
          id: string
          identifier: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          created_at?: string
          id?: string
          identifier: string
          window_start?: string
        }
        Update: {
          action?: string
          count?: number
          created_at?: string
          id?: string
          identifier?: string
          window_start?: string
        }
        Relationships: []
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
          ip_address: unknown | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
      tareas: {
        Row: {
          asignado_a: string | null
          created_at: string | null
          descripcion: string | null
          estado: string | null
          fecha_vencimiento: string | null
          id: string
          mandato_id: string | null
          prioridad: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          asignado_a?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha_vencimiento?: string | null
          id?: string
          mandato_id?: string | null
          prioridad?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          asignado_a?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha_vencimiento?: string | null
          id?: string
          mandato_id?: string | null
          prioridad?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_mandato_id_fkey"
            columns: ["mandato_id"]
            isOneToOne: false
            referencedRelation: "mandatos"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          position: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          position?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          position?: string | null
          updated_at?: string
        }
        Relationships: []
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
      tool_ratings: {
        Row: {
          company_sector: string | null
          company_size: string | null
          created_at: string
          ease_of_use: number
          feedback_comment: string | null
          id: string
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
          recommendation?: number
          result_accuracy?: number
          user_agent?: string | null
          user_email?: string | null
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
      user_registration_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
    }
    Functions: {
      approve_user_registration: {
        Args: { request_id: string }
        Returns: boolean
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
        Args: Record<PropertyKey, never>
        Returns: {
          access_count: number
          access_date: string
          top_utm_sources: string[]
          unique_visitors: number
        }[]
      }
      audit_valuation_data_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          access_count: number
          access_date: string
          anonymous_access_count: number
          high_risk_access_count: number
          unique_ips: number
        }[]
      }
      bootstrap_first_admin: {
        Args: { user_email: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args:
          | {
              _action: string
              _identifier: string
              _max_requests?: number
              _window_minutes?: number
            }
          | {
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
      check_user_admin_role: {
        Args: { check_user_id: string }
        Returns: string
      }
      cleanup_old_tracking_events: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_temporary_user: {
        Args: {
          p_email: string
          p_full_name: string
          p_role?: Database["public"]["Enums"]["admin_role"]
        }
        Returns: Json
      }
      current_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      disk_usage_monitor: {
        Args: Record<PropertyKey, never>
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
      generate_proposal_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_unique_proposal_url: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_basic_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          full_name: string
          id: string
          is_active: boolean
          last_login: string
          role: Database["public"]["Enums"]["admin_role"]
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin_user: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      is_user_super_admin: {
        Args: { check_user_id: string }
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
      log_behavior_access_violation: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
        Args: { details?: Json; table_name: string; violation_type: string }
        Returns: undefined
      }
      log_security_event: {
        Args:
          | { _details?: Json; _event_type: string; _severity: string }
          | {
              p_action_attempted?: string
              p_details?: Json
              p_event_type: string
              p_severity?: string
              p_table_name?: string
            }
        Returns: string
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
      log_tracking_access_violation: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      log_valuation_access_attempt: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      monitor_security_violations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_banner_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reject_user_registration: {
        Args: { reason?: string; request_id: string }
        Returns: boolean
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      validate_data_access_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_rls: boolean
          policy_count: number
          security_status: string
          table_name: string
        }[]
      }
      validate_strong_password: {
        Args: { password_text: string }
        Returns: boolean
      }
      validate_valuation_token: {
        Args: { _token: string }
        Returns: string
      }
    }
    Enums: {
      admin_role: "super_admin" | "admin" | "editor" | "viewer"
      documento_tipo:
        | "Contrato"
        | "NDA"
        | "Due Diligence"
        | "Financiero"
        | "Legal"
        | "Otro"
      proposal_status:
        | "draft"
        | "sent"
        | "viewed"
        | "approved"
        | "rejected"
        | "expired"
      service_type:
        | "venta_empresas"
        | "due_diligence"
        | "valoraciones"
        | "asesoramiento_legal"
        | "planificacion_fiscal"
        | "reestructuraciones"
      service_type_enum: "vender" | "comprar" | "otros"
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
      admin_role: ["super_admin", "admin", "editor", "viewer"],
      documento_tipo: [
        "Contrato",
        "NDA",
        "Due Diligence",
        "Financiero",
        "Legal",
        "Otro",
      ],
      proposal_status: [
        "draft",
        "sent",
        "viewed",
        "approved",
        "rejected",
        "expired",
      ],
      service_type: [
        "venta_empresas",
        "due_diligence",
        "valoraciones",
        "asesoramiento_legal",
        "planificacion_fiscal",
        "reestructuraciones",
      ],
      service_type_enum: ["vender", "comprar", "otros"],
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
