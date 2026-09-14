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
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface Question {
  id: string
  skill_id: string
  question_text: string
  options: Array<{ label: string; text: string; is_correct?: boolean }>
  correct_answer: string
  explanation: string
  difficulty: string
  tags: string[]
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
  correct_answer: string
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
  window.location.href = '/login'
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
  answer: string
): Promise<AnswerResponse> => {
  const { data } = await api.post(`/questions/${questionId}/answer`, {
    answer,
  })
  return data
}

export const getStats = async (): Promise<StatsResponse> => {
  const { data } = await api.get('/questions/stats')
  return data
}

export default api
