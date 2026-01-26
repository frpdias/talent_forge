const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001/api/v1'
    : 'https://api-py-ruddy.vercel.app');

const API_URL = RAW_API_URL.replace(/\/$/, '').endsWith('/api/v1')
  ? RAW_API_URL.replace(/\/$/, '')
  : `${RAW_API_URL.replace(/\/$/, '')}/api/v1`;

const DEFAULT_TIMEOUT_MS = 10_000;

interface FetchOptions extends RequestInit {
  token?: string;
  orgId?: string;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, orgId, signal, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  if (orgId) {
    (headers as Record<string, string>)['x-org-id'] = orgId;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: signal ?? controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      const message =
        error?.message || `HTTP error! status: ${response.status} (${response.statusText})`;
      throw new Error(message);
    }

    return response.json();
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export const healthApi = {
  root: () => apiFetch<{ status: string; service: string; version: string }>('/'),
  health: () => apiFetch<{ status: string }>('/health'),
};

// Organizations
export const organizationsApi = {
  create: (data: { name: string; orgType: string }, token: string) =>
    apiFetch('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),
  
  list: (token: string) =>
    apiFetch('/organizations', { token }),
  
  get: (id: string, token: string) =>
    apiFetch(`/organizations/${id}`, { token }),
};

// Jobs
export const jobsApi = {
  create: (data: any, token: string, orgId: string) =>
    apiFetch('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
      orgId,
    }),
  
  list: (token: string, orgId: string, params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch(`/jobs${query ? `?${query}` : ''}`, { token, orgId });
  },
  
  get: (id: string, token: string, orgId: string) =>
    apiFetch(`/jobs/${id}`, { token, orgId }),
  
  update: (id: string, data: any, token: string, orgId: string) =>
    apiFetch(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
      orgId,
    }),
  
  delete: (id: string, token: string, orgId: string) =>
    apiFetch(`/jobs/${id}`, {
      method: 'DELETE',
      token,
      orgId,
    }),
};

// Candidates
export const candidatesApi = {
  create: (data: any, token: string, orgId: string) =>
    apiFetch('/candidates', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
      orgId,
    }),
  
  list: (token: string, orgId: string, params?: { search?: string; tag?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch(`/candidates${query ? `?${query}` : ''}`, { token, orgId });
  },
  
  get: (id: string, token: string, orgId: string) =>
    apiFetch(`/candidates/${id}`, { token, orgId }),
  
  update: (id: string, data: any, token: string, orgId: string) =>
    apiFetch(`/candidates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
      orgId,
    }),
  
  addNote: (id: string, note: string, token: string, orgId: string) =>
    apiFetch(`/candidates/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
      token,
      orgId,
    }),
  
  // Notes with context
  getNotes: (id: string, token: string, orgId: string, context?: string) => {
    const query = context ? `?context=${context}` : '';
    return apiFetch(`/candidates/${id}/notes${query}`, { token, orgId });
  },
  
  createNote: (id: string, data: { note: string; context?: string }, token: string, orgId: string) =>
    apiFetch(`/candidates/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
      orgId,
    }),
  
  updateNote: (candidateId: string, noteId: string, data: { note?: string; context?: string }, token: string, orgId: string) =>
    apiFetch(`/candidates/${candidateId}/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
      orgId,
    }),
  
  deleteNote: (candidateId: string, noteId: string, token: string, orgId: string) =>
    apiFetch(`/candidates/${candidateId}/notes/${noteId}`, {
      method: 'DELETE',
      token,
      orgId,
    }),
};

// Applications
export const applicationsApi = {
  create: (data: { jobId: string; candidateId: string }, token: string, orgId: string) =>
    apiFetch('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
      orgId,
    }),
  
  list: (token: string, orgId: string, params?: { jobId?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch(`/applications${query ? `?${query}` : ''}`, { token, orgId });
  },
  
  getKanban: (jobId: string, token: string, orgId: string) =>
    apiFetch(`/applications/kanban/${jobId}`, { token, orgId }),
  
  updateStage: (id: string, data: { toStageId: string; status?: string; note?: string }, token: string, orgId: string) =>
    apiFetch(`/applications/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
      orgId,
    }),

  updateStatus: (id: string, data: { status: string; note?: string }, token: string, orgId: string) =>
    apiFetch(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
      orgId,
    }),
};

// Assessments
export const assessmentsApi = {
  create: (data: { candidateId: string; jobId?: string }, token: string, orgId: string) =>
    apiFetch('/assessments', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
      orgId,
    }),
  
  get: (id: string, token: string, orgId: string) =>
    apiFetch(`/assessments/${id}`, { token, orgId }),
  
  // Public endpoints
  getQuestions: (id: string) =>
    apiFetch(`/assessments/take/${id}`),
  
  submit: (id: string, answers: { questionId: string; value: number }[]) =>
    apiFetch(`/assessments/take/${id}`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
};

// Reports
export const reportsApi = {
  dashboard: (token: string, orgId: string) =>
    apiFetch('/reports/dashboard', { token, orgId }),
  
  pipelines: (token: string, orgId: string, jobId?: string) =>
    apiFetch(`/reports/pipelines${jobId ? `?jobId=${jobId}` : ''}`, { token, orgId }),
  
  assessments: (token: string, orgId: string, jobId?: string) =>
    apiFetch(`/reports/assessments${jobId ? `?jobId=${jobId}` : ''}`, { token, orgId }),
};

// Combined API object for easier access with auth context
export const api = {
  organizations: organizationsApi,
  jobs: jobsApi,
  candidates: candidatesApi,
  applications: applicationsApi,
  assessments: assessmentsApi,
  reports: {
    getDashboard: async () => {
      // This will be called from client components that handle auth
      return { data: null };
    },
    getPipelines: reportsApi.pipelines,
    getAssessments: reportsApi.assessments,
  },
};

// Color (5 Dinâmicas) - Teste das Cores
export const colorApi = {
  createAssessment: (candidateUserId: string, token: string) =>
    apiFetch('/color-assessments', {
      method: 'POST',
      body: JSON.stringify({ candidateUserId }),
      token,
    }),
  listQuestions: (token: string) =>
    apiFetch('/color-assessments/questions', { token }),
  submitResponse: (assessmentId: string, questionId: string, selectedColor: string, token: string) =>
    apiFetch(`/color-assessments/${assessmentId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ questionId, selectedColor }),
      token,
    }),
  finalize: (assessmentId: string, token: string) =>
    apiFetch(`/color-assessments/${assessmentId}/complete`, {
      method: 'POST',
      token,
    }),
  latest: (token: string) =>
    apiFetch('/color-assessments/latest', { token }),
};

// TF-PI (Drives Comportamentais)
export const piApi = {
  createAssessment: (candidateUserId: string, token: string) =>
    apiFetch('/pi-assessments', {
      method: 'POST',
      body: JSON.stringify({ candidateUserId }),
      token,
    }),
  listDescriptors: (token: string) =>
    apiFetch('/pi-assessments/descriptors', { token }),
  listSituational: (token: string) =>
    apiFetch('/pi-assessments/questions', { token }),
  submitDescriptor: (
    assessmentId: string,
    descriptorId: string,
    block: 'natural' | 'adaptado',
    selected: boolean,
    token: string
  ) =>
    apiFetch(`/pi-assessments/${assessmentId}/responses/descriptor`, {
      method: 'POST',
      body: JSON.stringify({ descriptorId, block, selected }),
      token,
    }),
  submitSituational: (
    assessmentId: string,
    questionId: string,
    selectedAxis: 'direcao' | 'energia_social' | 'ritmo' | 'estrutura',
    block: 'natural' | 'adaptado',
    token: string
  ) =>
    apiFetch(`/pi-assessments/${assessmentId}/responses/situational`, {
      method: 'POST',
      body: JSON.stringify({ questionId, selectedAxis, block }),
      token,
    }),
  finalize: (assessmentId: string, token: string) =>
    apiFetch(`/pi-assessments/${assessmentId}/complete`, {
      method: 'POST',
      token,
    }),
  latest: (token: string) =>
    apiFetch('/pi-assessments/latest', { token }),
  latestByCandidate: (candidateUserId: string, token: string) =>
    apiFetch(`/pi-assessments/candidate/${candidateUserId}/latest`, { token }),
};
