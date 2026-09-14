import { Language } from '../i18n'

// Azure terms translations
const azureTerms: Record<string, Record<Language, string>> = {
  'Azure RBAC': { en: 'Azure RBAC', 'pt-BR': 'Azure RBAC' },
  'Role-Based Access Control': { en: 'Role-Based Access Control', 'pt-BR': 'Controle de Acesso Baseado em Função' },
  'Microsoft Entra ID': { en: 'Microsoft Entra ID', 'pt-BR': 'Microsoft Entra ID' },
  'Azure Active Directory': { en: 'Azure Active Directory', 'pt-BR': 'Azure Active Directory' },
  'Virtual Network': { en: 'Virtual Network', 'pt-BR': 'Rede Virtual' },
  'Network Security Group': { en: 'Network Security Group', 'pt-BR': 'Grupo de Segurança de Rede' },
  'Storage Account': { en: 'Storage Account', 'pt-BR': 'Conta de Armazenamento' },
  'Resource Group': { en: 'Resource Group', 'pt-BR': 'Grupo de Recursos' },
  'Azure Policy': { en: 'Azure Policy', 'pt-BR': 'Azure Policy' },
  'Management Group': { en: 'Management Group', 'pt-BR': 'Grupo de Gerenciamento' },
  'Azure Monitor': { en: 'Azure Monitor', 'pt-BR': 'Azure Monitor' },
  'Azure Backup': { en: 'Azure Backup', 'pt-BR': 'Azure Backup' },
  'Recovery Services vault': { en: 'Recovery Services vault', 'pt-BR': 'Vault de Serviços de Recuperação' },
  'Load Balancer': { en: 'Load Balancer', 'pt-BR': 'Balanceador de Carga' },
  'Application Gateway': { en: 'Application Gateway', 'pt-BR': 'Application Gateway' },
  'Azure DNS': { en: 'Azure DNS', 'pt-BR': 'Azure DNS' },
  'Private Endpoint': { en: 'Private Endpoint', 'pt-BR': 'Endpoint Privado' },
  'Virtual Machine': { en: 'Virtual Machine', 'pt-BR': 'Máquina Virtual' },
  'Azure Container Instances': { en: 'Azure Container Instances', 'pt-BR': 'Azure Container Instances' },
  'Azure Container Registry': { en: 'Azure Container Registry', 'pt-BR': 'Azure Container Registry' },
  'App Service': { en: 'App Service', 'pt-BR': 'App Service' },
  'ARM template': { en: 'ARM template', 'pt-BR': 'modelo ARM' },
  'Bicep': { en: 'Bicep', 'pt-BR': 'Bicep' },
  'Azure Front Door': { en: 'Azure Front Door', 'pt-BR': 'Azure Front Door' },
  'Azure Firewall': { en: 'Azure Firewall', 'pt-BR': 'Azure Firewall' },
  'Azure Bastion': { en: 'Azure Bastion', 'pt-BR': 'Azure Bastion' },
  'Service Endpoint': { en: 'Service Endpoint', 'pt-BR': 'Endpoint de Serviço' },
  'Blob Storage': { en: 'Blob Storage', 'pt-BR': 'Blob Storage' },
  'Azure Files': { en: 'Azure Files', 'pt-BR': 'Azure Files' },
  'Shared Access Signature': { en: 'Shared Access Signature', 'pt-BR': 'Assinatura de Acesso Compartilhado' },
  'SAS token': { en: 'SAS token', 'pt-BR': 'token SAS' },
  'Azure Kubernetes Service': { en: 'Azure Kubernetes Service', 'pt-BR': 'Azure Kubernetes Service' },
  'AKS': { en: 'AKS', 'pt-BR': 'AKS' },
  'Availability Zone': { en: 'Availability Zone', 'pt-BR': 'Zona de Disponibilidade' },
  'Availability Set': { en: 'Availability Set', 'pt-BR': 'Conjunto de Disponibilidade' },
  'Virtual Machine Scale Sets': { en: 'Virtual Machine Scale Sets', 'pt-BR': 'Conjuntos de Escalabilidade de Máquinas Virtuais' },
  'Azure Site Recovery': { en: 'Azure Site Recovery', 'pt-BR': 'Azure Site Recovery' },
  'Network Watcher': { en: 'Network Watcher', 'pt-BR': 'Network Watcher' },
  'Azure Key Vault': { en: 'Azure Key Vault', 'pt-BR': 'Azure Key Vault' },
  'Log Analytics': { en: 'Log Analytics', 'pt-BR': 'Log Analytics' },
  'Azure Marketplace': { en: 'Azure Marketplace', 'pt-BR': 'Azure Marketplace' },
  'Azure Cost Management': { en: 'Azure Cost Management', 'pt-BR': 'Azure Cost Management' },
  'Azure Advisor': { en: 'Azure Advisor', 'pt-BR': 'Azure Advisor' },
  'Quickstart': { en: 'Quickstart', 'pt-BR': 'Início Rápido' },
  'Tutorial': { en: 'Tutorial', 'pt-BR': 'Tutorial' },
  'How-to guide': { en: 'How-to guide', 'pt-BR': 'Guia de instruções' },
  'Conceptual': { en: 'Conceptual', 'pt-BR': 'Conceitual' },
}

// Common question word translations
const questionPatterns: Record<string, Record<Language, string>> = {
  'Which': { en: 'Which', 'pt-BR': 'Qual' },
  'What': { en: 'What', 'pt-BR': 'O que' },
  'How': { en: 'How', 'pt-BR': 'Como' },
  'Why': { en: 'Why', 'pt-BR': 'Por que' },
  'You need to': { en: 'You need to', 'pt-BR': 'Você precisa' },
  'You want to': { en: 'You want to', 'pt-BR': 'Você quer' },
  'Your company': { en: 'Your company', 'pt-BR': 'Sua empresa' },
  'Your organization': { en: 'Your organization', 'pt-BR': 'Sua organização' },
  'should you use': { en: 'should you use', 'pt-BR': 'você deve usar' },
  'must you use': { en: 'must you use', 'pt-BR': 'você deve usar' },
  'do you use': { en: 'do you use', 'pt-BR': 'você usa' },
  'What should you do': { en: 'What should you do', 'pt-BR': 'O que você deve fazer' },
  'What is the recommended': { en: 'What is the recommended', 'pt-BR': 'Qual é a recomendada' },
  'Which Azure service': { en: 'Which Azure service', 'pt-BR': 'Qual serviço do Azure' },
  'Which command': { en: 'Which command', 'pt-BR': 'Qual comando' },
  'Which setting': { en: 'Which setting', 'pt-BR': 'Qual configuração' },
  'correct answer': { en: 'correct answer', 'pt-BR': 'resposta correta' },
}

// Difficulty level translations
export const difficultyTranslations: Record<string, Record<Language, string>> = {
  'easy': { en: 'Easy', 'pt-BR': 'Fácil' },
  'intermediate': { en: 'Intermediate', 'pt-BR': 'Intermediário' },
  'advanced': { en: 'Advanced', 'pt-BR': 'Avançado' },
}

// Translate Azure terms in text
function translateAzureTerms(text: string, lang: Language): string {
  let translated = text
  for (const [term, translations] of Object.entries(azureTerms)) {
    if (translated.includes(term)) {
      translated = translated.replace(new RegExp(term, 'g'), translations[lang])
    }
  }
  return translated
}

// Translate question patterns
function translateQuestionPatterns(text: string, lang: Language): string {
  if (lang === 'en') return text
  
  let translated = text
  for (const [pattern, translations] of Object.entries(questionPatterns)) {
    if (translated.includes(pattern)) {
      translated = translated.replace(new RegExp(pattern, 'g'), translations[lang])
    }
  }
  return translated
}

// Main translation function for question text
export function translateQuestionText(text: string, lang: Language): string {
  if (lang === 'en') return text
  
  let translated = text
  translated = translateAzureTerms(translated, lang)
  translated = translateQuestionPatterns(translated, lang)
  return translated
}

// Translate explanation text
export function translateExplanation(text: string, lang: Language): string {
  if (lang === 'en') return text
  
  let translated = text
  translated = translateAzureTerms(translated, lang)
  return translated
}

// Translate difficulty level
export function translateDifficulty(difficulty: string, lang: Language): string {
  return difficultyTranslations[difficulty]?.[lang] || difficulty
}

// Translate question options
export function translateOptionText(text: string, lang: Language): string {
  if (lang === 'en') return text
  return translateAzureTerms(text, lang)
}
