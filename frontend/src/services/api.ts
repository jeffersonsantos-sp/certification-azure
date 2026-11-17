import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register')
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export type AnswerValue = string | string[]

export type QuestionType = 'single_choice' | 'multiple_choice' | 'case_study' | 'drag_drop' | 'hotspot'

export interface HotspotRegion {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

export interface QuestionData {
  scenario?: string
  image_url?: string
  regions?: HotspotRegion[]
  instructions?: string
}

export interface Question {
  id: string
  skill_id: string
  question_text: string
  question_type: QuestionType
  question_data: QuestionData
  options: Array<{ label: string; text: string }>
  difficulty: string
  tags: string[]
}

export interface ExamResult {
  question_id: string
  question_type: QuestionType
  selected: AnswerValue
  correct: boolean
  correct_answer: AnswerValue
  explanation: string
}

export interface ExamSubmitResponse {
  total: number
  correct: number
  score_percentage: number
  results: ExamResult[]
}

export interface QuestionResponse {
  questions: Question[]
  count: number
}

export interface StatsResponse {
  total_questions: number
  domains: Array<{
    id: string
    name: string
    weight: string
    question_count: number
  }>
  difficulties: Array<{
    difficulty: string
    count: number
  }>
}

export interface AnswerResponse {
  correct: boolean
  question_type: QuestionType
  correct_answer: AnswerValue
  explanation: string
}

export interface User {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

// Auth API
export const register = async (data: {
  email: string
  password: string
  full_name?: string
}): Promise<AuthResponse> => {
  const { data: response } = await api.post('/auth/register', data)
  localStorage.setItem('token', response.access_token)
  localStorage.setItem('user', JSON.stringify(response.user))
  return response
}

export const login = async (data: {
  email: string
  password: string
}): Promise<AuthResponse> => {
  const { data: response } = await api.post('/auth/login', data)
  localStorage.setItem('token', response.access_token)
  localStorage.setItem('user', JSON.stringify(response.user))
  return response
}

export const getMe = async (): Promise<User> => {
  const { data } = await api.get('/auth/me')
  return data
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export type LocalizedString = Record<string, string>
export type LocalizedList = Record<string, string[]>

export type LabDifficulty = 'easy' | 'intermediate' | 'advanced'
export type LabProgressStatus = 'not_started' | 'in_progress' | 'passed' | 'failed'

export interface LabCommand {
  label: LocalizedString
  language: string
  command: string
}

export interface LabProgress {
  status: LabProgressStatus
  started_at: string | null
  completed_at: string | null
  last_validated_at: string | null
  best_score: number
  total_steps: number
  completed_steps: number
  progress_percentage: number
  all_steps_completed: boolean
}

export interface LabSummary {
  id: string
  slug: string
  title: LocalizedString
  description: LocalizedString
  domain_id: string
  skill_id: string
  difficulty: LabDifficulty
  estimated_minutes: number
  resource_group_name: string
  content_version: string
  status: 'draft' | 'published'
  sort_order: number
  progress: LabProgress
}

export interface LabStep {
  id: string
  key: string
  position: number
  title: LocalizedString
  instructions: LocalizedString
  commands: LabCommand[]
  validation_hint: LocalizedString | null
  completed: boolean
}

export interface LabCheck {
  id: string
  key: string
  position: number
  name: LocalizedString
  description: LocalizedString
  check_type: string
  required: boolean
  weight: number
}

export interface LabDetail extends Omit<LabSummary, 'progress'> {
  objectives: LocalizedList
  prerequisites: LocalizedList
  cost_warning: LocalizedString | null
  cleanup_commands: LabCommand[]
  steps: LabStep[]
  checks: LabCheck[]
  progress: LabProgress
}

export interface LabProgressSummary {
  total_labs: number
  labs_started: number
  labs_in_progress: number
  labs_passed: number
  labs_failed: number
  labs_not_started: number
  total_steps: number
  completed_steps: number
  completion_percentage: number
  best_score_average: number
}

// Labs API
export const getLabs = async (): Promise<{ labs: LabSummary[]; count: number }> => {
  const { data } = await api.get('/labs')
  return data
}

export const getLab = async (slug: string): Promise<LabDetail> => {
  const { data } = await api.get(`/labs/${slug}`)
  return data
}

export const startLab = async (slug: string): Promise<LabProgress> => {
  const { data } = await api.post(`/labs/${slug}/start`)
  return data
}

export const updateLabStep = async (
  slug: string,
  stepId: string,
  completed: boolean
): Promise<LabProgress> => {
  const { data } = await api.patch(`/labs/${slug}/steps/${stepId}`, { completed })
  return data
}

export const getLabProgressSummary = async (): Promise<LabProgressSummary> => {
  const { data } = await api.get('/labs/progress/summary')
  return data
}

// Questions API
export const getQuestions = async (params?: {
  skill_id?: string
  domain_id?: string
  difficulty?: string
  limit?: number
  offset?: number
  random_order?: boolean
}): Promise<QuestionResponse> => {
  const { data } = await api.get('/questions/', { params })
  return data
}

export const getRandomQuestions = async (params?: {
  count?: number
  domain_id?: string
  difficulty?: string
}): Promise<QuestionResponse> => {
  const { data } = await api.get('/questions/random', { params })
  return data
}

export const getQuestion = async (id: string): Promise<Question> => {
  const { data } = await api.get(`/questions/${id}`)
  return data
}

export const submitAnswer = async (
  questionId: string,
  answer: AnswerValue
): Promise<AnswerResponse> => {
  const { data } = await api.post(`/questions/${questionId}/answer`, {
    answer,
  })
  return data
}

export const submitExam = async (
  answers: Array<{ question_id: string; answer: AnswerValue }>
): Promise<ExamSubmitResponse> => {
  const { data } = await api.post('/questions/submit-exam', { answers })
  return data
}

export const getStats = async (): Promise<StatsResponse> => {
  const { data } = await api.get('/questions/stats')
  return data
}

export default api
