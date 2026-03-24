import { useState, useCallback } from 'react'
import { Mail, CheckCircle, XCircle, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'

interface ValidationResult {
  email: string
  valid: boolean
  errors: string[]
  warnings: string[]
  localPart: string
  domain: string
}

function validateEmail(email: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  const trimmed = email.trim()
  
  if (!trimmed) {
    return {
      email: trimmed,
      valid: false,
      errors: ['邮箱地址为空'],
      warnings: [],
      localPart: '',
      domain: '',
    }
  }

  const atIndex = trimmed.indexOf('@')
  if (atIndex === -1) {
    return {
      email: trimmed,
      valid: false,
      errors: ['缺少@符号'],
      warnings: [],
      localPart: trimmed,
      domain: '',
    }
  }

  if (trimmed.indexOf('@', atIndex + 1) !== -1) {
    return {
      email: trimmed,
      valid: false,
      errors: ['包含多个@符号'],
      warnings: [],
      localPart: '',
      domain: '',
    }
  }

  const localPart = trimmed.substring(0, atIndex)
  const domain = trimmed.substring(atIndex + 1)

  if (!localPart) {
    errors.push('本地部分为空')
  } else {
    if (localPart.length > 64) {
      errors.push('本地部分超过64字符')
    }
    
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      errors.push('本地部分不能以.开头或结尾')
    }
    
    if (localPart.includes('..')) {
      errors.push('本地部分包含连续的点')
    }
    
    const localRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/
    if (!localRegex.test(localPart)) {
      errors.push('本地部分包含非法字符')
    }
  }

  if (!domain) {
    errors.push('域名为空')
  } else {
    if (domain.length > 255) {
      errors.push('域名超过255字符')
    }
    
    if (domain.startsWith('-') || domain.endsWith('-')) {
      errors.push('域名不能以-开头或结尾')
    }
    
    if (domain.startsWith('.') || domain.endsWith('.')) {
      errors.push('域名不能以.开头或结尾')
    }
    
    if (domain.includes('..')) {
      errors.push('域名包含连续的点')
    }
    
    const domainRegex = /^[a-zA-Z0-9.-]+$/
    if (!domainRegex.test(domain)) {
      errors.push('域名包含非法字符')
    }
    
    const tldMatch = domain.match(/\.([a-zA-Z]{2,})$/)
    if (!tldMatch) {
      errors.push('缺少有效的顶级域名')
    } else if (tldMatch[1].length < 2) {
      errors.push('顶级域名长度不足')
    }
    
    const commonTypos = ['gmial.com', 'gmal.com', 'gamil.com', 'gmali.com', 'hotmal.com', 'hotmai.com', 'outloo.com', 'outlok.com']
    if (commonTypos.some(typo => domain.toLowerCase() === typo)) {
      warnings.push(`域名可能是拼写错误，是否为 ${domain.replace(/gmial|gmal|gamil|gmali/, 'gmail').replace(/hotmal|hotmai/, 'hotmail').replace(/outloo|outlok/, 'outlook')}？`)
    }
  }

  const disposableDomains = ['tempmail.com', 'throwaway.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com']
  if (disposableDomains.some(d => domain.toLowerCase().includes(d))) {
    warnings.push('可能是临时邮箱域名')
  }

  return {
    email: trimmed,
    valid: errors.length === 0,
    errors,
    warnings,
    localPart,
    domain,
  }
}

export default function EmailValidator() {
  const [emails, setEmails] = useState<string[]>([''])
  const [results, setResults] = useState<ValidationResult[]>([])
  const [showDetails, setShowDetails] = useState<string | null>(null)

  const addEmail = useCallback(() => {
    setEmails(prev => [...prev, ''])
  }, [])

  const removeEmail = useCallback((index: number) => {
    setEmails(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateEmail = useCallback((index: number, value: string) => {
    setEmails(prev => prev.map((email, i) => i === index ? value : email))
  }, [])

  const validateAll = useCallback(() => {
    const validationResults = emails.map(email => validateEmail(email))
    setResults(validationResults)
  }, [emails])

  const reset = () => {
    setEmails([''])
    setResults([])
    setShowDetails(null)
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={validateAll} className="btn-primary">
          <Mail className="w-4 h-4" />
          验证
        </button>
        <button onClick={addEmail} className="btn-ghost">
          <Plus className="w-4 h-4" />
          添加邮箱
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            邮箱地址 ({emails.length} 个)
          </label>
          <div className="space-y-2 max-h-[400px] overflow-y-auto p-3 rounded-xl bg-bg-surface border border-border-base">
            {emails.map((email, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-6">#{index + 1}</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => updateEmail(index, e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1 px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
                />
                {emails.length > 1 && (
                  <button
                    onClick={() => removeEmail(index)}
                    className="p-2 rounded-lg hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            验证结果
          </label>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {results.length > 0 ? (
              results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl border ${
                    result.valid
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-rose-500/5 border-rose-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.valid ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                      <span className="text-sm font-mono text-text-primary">{result.email || '(空)'}</span>
                    </div>
                    <button
                      onClick={() => setShowDetails(showDetails === result.email ? null : result.email)}
                      className="text-xs text-text-muted hover:text-text-primary"
                    >
                      详情
                    </button>
                  </div>
                  
                  {result.errors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {result.errors.map((error, i) => (
                        <div key={i} className="text-xs text-rose-400 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {result.warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {result.warnings.map((warning, i) => (
                        <div key={i} className="text-xs text-yellow-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showDetails === result.email && result.valid && (
                    <div className="mt-3 pt-3 border-t border-border-base text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-text-muted">本地部分:</span>
                        <span className="font-mono text-text-primary">{result.localPart}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">域名:</span>
                        <span className="font-mono text-text-primary">{result.domain}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-48 rounded-xl bg-bg-raised border border-border-base flex items-center justify-center">
                <p className="text-text-muted text-sm">输入邮箱后点击验证</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
