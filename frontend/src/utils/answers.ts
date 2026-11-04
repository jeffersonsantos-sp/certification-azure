import { AnswerValue, Question } from '../services/api'

export function formatAnswer(value: AnswerValue | null | undefined, question: Question): string {
  if (value === null || value === undefined || value === '') return ''

  if (Array.isArray(value)) {
    return question.question_type === 'drag_drop' ? value.join(' → ') : value.join(', ')
  }

  if (question.question_type === 'hotspot') {
    const region = question.question_data.regions?.find((item) => item.id === value)
    return region?.label ?? value
  }

  return value
}
