export type ChannelCode =
  | 'gupy'
  | 'vagas'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'indeed'
  | 'catho'
  | 'infojobs'
  | 'custom';

export type PublicationStatus =
  | 'pending'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'expired'
  | 'unpublished';

/** Modelo canônico de vaga — agnóstico ao canal */
export interface JobCanonical {
  id: string;
  title: string;
  description: string;
  description_html?: string;
  location: string;
  employment_type: string;
  requirements?: string;
  benefits?: string;
  salary_min?: number;
  salary_max?: number;
  application_deadline?: string;
  org_id: string;
  org_name: string;
  org_slug: string;
  external_apply_url?: string;
}

export interface ChannelCredentials {
  api_key?: string;
  client_id?: string;
  client_secret?: string;
  access_token?: string;
  company_id?: string;
  // Meta (Facebook / Instagram)
  page_id?: string;
  instagram_account_id?: string;
  meta_access_token?: string;
}

export interface PublishResult {
  success: boolean;
  external_id?: string;
  external_url?: string;
  error?: string;
  payload_sent?: Record<string, unknown>;
  response_received?: Record<string, unknown>;
}
