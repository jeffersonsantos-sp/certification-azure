import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Practice from './pages/Practice'
import MockExam from './pages/MockExam'
import QuestionView from './pages/QuestionView'
import { LanguageProvider, useLanguage } from './context/LanguageContext'
import { languages, Language } from './i18n'

const queryClient = new QueryClient()

function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
      >
        <span>{languages[language].langFlag}</span>
        <span className="hidden sm:inline">{languages[language].langLabel}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[160px] animate-fadeInUp">
            {(Object.keys(languages) as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => { setLanguage(lang); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                  language === lang
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{languages[lang].langFlag}</span>
                <span>{languages[lang].langLabel}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useLanguage()
  return (
    <div className={`fixed inset-0 z-50 md:hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      <div className={`absolute left-0 top-0 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0078D4] to-[#50E6FF] rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">AZ-104</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="space-y-2">
            {[
              { to: '/', icon: '📊', label: t('nav.dashboard') },
              { to: '/practice', icon: '📝', label: t('nav.practice') },
              { to: '/mock-exam', icon: '🎯', label: t('nav.mockExam') },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </div>
  )
}

function AppLayout() {
  const { t } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <header className="sticky top-0 z-40 glass border-b border-gray-200/50">
        <div className="container-app">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <button
                className="md:hidden p-2 hover:bg-gray-100 rounded-xl"
                onClick={() => setMobileMenuOpen(true)}
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <NavLink to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0078D4] to-[#50E6FF] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-900 leading-tight">AZ-104 Trainer</h1>
                  <p className="text-xs text-gray-500">Azure Administrator Associate</p>
                </div>
              </NavLink>

              <nav className="hidden md:flex items-center gap-1">
                {[
                  { to: '/', label: t('nav.dashboard') },
                  { to: '/practice', label: t('nav.practice') },
                  { to: '/mock-exam', label: t('nav.mockExam') },
                ].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-gray-700">78% {t('header.readiness')}</span>
              </div>

              <LanguageSelector />
            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="container-app py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice/:domainId" element={<Practice />} />
          <Route path="/question/:questionId" element={<QuestionView />} />
          <Route path="/mock-exam" element={<MockExam />} />
        </Routes>
      </main>

      <footer className="border-t border-gray-200/50 mt-12">
        <div className="container-app py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#0078D4] to-[#50E6FF] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm text-gray-500">AZ-104 Trainer</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>{t('footer.skills')}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>{t('footer.questions')}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>{t('footer.domains')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Router>
          <AppLayout />
        </Router>
      </LanguageProvider>
    </QueryClientProvider>
  )
}

export default App
