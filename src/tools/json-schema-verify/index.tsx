import { useState, useMemo } from 'react'
import { CheckCircle, XCircle, Copy, Check, AlertCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface ValidationError {
  keyword: string
  instancePath: string
  schemaPath: string
  params: Record<string, unknown>
  message?: string
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

function validateJsonSchema(json: unknown, schema: unknown): ValidationResult {
  const errors: ValidationError[] = []
  
  if (typeof schema !== 'object' || schema === null) {
    return { valid: false, errors: [{ keyword: 'schema', instancePath: '', schemaPath: '', params: {}, message: 'Schema必须是对象' }] }
  }
  
  function validate(value: unknown, schemaNode: unknown, path: string): boolean {
    if (typeof schemaNode !== 'object' || schemaNode === null) {
      return true
    }
    
    const schemaObj = schemaNode as Record<string, unknown>
    let isValid = true
    
    if ('type' in schemaObj) {
      const expectedType = schemaObj.type as string
      const actualType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value
      
      if (expectedType === 'integer') {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          errors.push({
            keyword: 'type',
            instancePath: path,
            schemaPath: `${path}/type`,
            params: { expected: expectedType, actual: actualType },
            message: `应为 ${expectedType}，实际为 ${actualType}`,
          })
          isValid = false
        }
      } else if (actualType !== expectedType) {
        errors.push({
          keyword: 'type',
          instancePath: path,
          schemaPath: `${path}/type`,
          params: { expected: expectedType, actual: actualType },
          message: `应为 ${expectedType}，实际为 ${actualType}`,
        })
        isValid = false
      }
    }
    
    if ('enum' in schemaObj && Array.isArray(schemaObj.enum)) {
      if (!schemaObj.enum.includes(value)) {
        errors.push({
          keyword: 'enum',
          instancePath: path,
          schemaPath: `${path}/enum`,
          params: { allowedValues: schemaObj.enum },
          message: `值必须是以下之一: ${JSON.stringify(schemaObj.enum)}`,
        })
        isValid = false
      }
    }
    
    if ('const' in schemaObj) {
      if (JSON.stringify(value) !== JSON.stringify(schemaObj.const)) {
        errors.push({
          keyword: 'const',
          instancePath: path,
          schemaPath: `${path}/const`,
          params: { allowedValue: schemaObj.const },
          message: `值必须等于 ${JSON.stringify(schemaObj.const)}`,
        })
        isValid = false
      }
    }
    
    if (typeof value === 'string') {
      if ('minLength' in schemaObj && typeof schemaObj.minLength === 'number') {
        if (value.length < schemaObj.minLength) {
          errors.push({
            keyword: 'minLength',
            instancePath: path,
            schemaPath: `${path}/minLength`,
            params: { limit: schemaObj.minLength },
            message: `字符串长度不能少于 ${schemaObj.minLength}`,
          })
          isValid = false
        }
      }
      
      if ('maxLength' in schemaObj && typeof schemaObj.maxLength === 'number') {
        if (value.length > schemaObj.maxLength) {
          errors.push({
            keyword: 'maxLength',
            instancePath: path,
            schemaPath: `${path}/maxLength`,
            params: { limit: schemaObj.maxLength },
            message: `字符串长度不能超过 ${schemaObj.maxLength}`,
          })
          isValid = false
        }
      }
      
      if ('pattern' in schemaObj && typeof schemaObj.pattern === 'string') {
        const regex = new RegExp(schemaObj.pattern)
        if (!regex.test(value)) {
          errors.push({
            keyword: 'pattern',
            instancePath: path,
            schemaPath: `${path}/pattern`,
            params: { pattern: schemaObj.pattern },
            message: `字符串不匹配模式 ${schemaObj.pattern}`,
          })
          isValid = false
        }
      }
    }
    
    if (typeof value === 'number') {
      if ('minimum' in schemaObj && typeof schemaObj.minimum === 'number') {
        if (value < schemaObj.minimum) {
          errors.push({
            keyword: 'minimum',
            instancePath: path,
            schemaPath: `${path}/minimum`,
            params: { comparison: '>=', limit: schemaObj.minimum },
            message: `值必须 >= ${schemaObj.minimum}`,
          })
          isValid = false
        }
      }
      
      if ('maximum' in schemaObj && typeof schemaObj.maximum === 'number') {
        if (value > schemaObj.maximum) {
          errors.push({
            keyword: 'maximum',
            instancePath: path,
            schemaPath: `${path}/maximum`,
            params: { comparison: '<=', limit: schemaObj.maximum },
            message: `值必须 <= ${schemaObj.maximum}`,
          })
          isValid = false
        }
      }
      
      if ('exclusiveMinimum' in schemaObj && typeof schemaObj.exclusiveMinimum === 'number') {
        if (value <= schemaObj.exclusiveMinimum) {
          errors.push({
            keyword: 'exclusiveMinimum',
            instancePath: path,
            schemaPath: `${path}/exclusiveMinimum`,
            params: { comparison: '>', limit: schemaObj.exclusiveMinimum },
            message: `值必须 > ${schemaObj.exclusiveMinimum}`,
          })
          isValid = false
        }
      }
      
      if ('exclusiveMaximum' in schemaObj && typeof schemaObj.exclusiveMaximum === 'number') {
        if (value >= schemaObj.exclusiveMaximum) {
          errors.push({
            keyword: 'exclusiveMaximum',
            instancePath: path,
            schemaPath: `${path}/exclusiveMaximum`,
            params: { comparison: '<', limit: schemaObj.exclusiveMaximum },
            message: `值必须 < ${schemaObj.exclusiveMaximum}`,
          })
          isValid = false
        }
      }
    }
    
    if (Array.isArray(value)) {
      if ('minItems' in schemaObj && typeof schemaObj.minItems === 'number') {
        if (value.length < schemaObj.minItems) {
          errors.push({
            keyword: 'minItems',
            instancePath: path,
            schemaPath: `${path}/minItems`,
            params: { limit: schemaObj.minItems },
            message: `数组长度不能少于 ${schemaObj.minItems}`,
          })
          isValid = false
        }
      }
      
      if ('maxItems' in schemaObj && typeof schemaObj.maxItems === 'number') {
        if (value.length > schemaObj.maxItems) {
          errors.push({
            keyword: 'maxItems',
            instancePath: path,
            schemaPath: `${path}/maxItems`,
            params: { limit: schemaObj.maxItems },
            message: `数组长度不能超过 ${schemaObj.maxItems}`,
          })
          isValid = false
        }
      }
      
      if ('items' in schemaObj) {
        value.forEach((item, index) => {
          if (!validate(item, schemaObj.items, `${path}/${index}`)) {
            isValid = false
          }
        })
      }
    }
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if ('required' in schemaObj && Array.isArray(schemaObj.required)) {
        for (const prop of schemaObj.required) {
          if (!(prop in value)) {
            errors.push({
              keyword: 'required',
              instancePath: path,
              schemaPath: `${path}/required`,
              params: { missingProperty: prop },
              message: `缺少必需属性: ${prop}`,
            })
            isValid = false
          }
        }
      }
      
      if ('properties' in schemaObj && typeof schemaObj.properties === 'object') {
        for (const [prop, propSchema] of Object.entries(schemaObj.properties as Record<string, unknown>)) {
          if (prop in value) {
            if (!validate((value as Record<string, unknown>)[prop], propSchema, `${path}/${prop}`)) {
              isValid = false
            }
          }
        }
      }
      
      if ('additionalProperties' in schemaObj) {
        const allowedProps = new Set(
          Object.keys((schemaObj.properties as Record<string, unknown>) || {})
            .concat((schemaObj.required as string[]) || [])
        )
        
        for (const prop of Object.keys(value)) {
          if (!allowedProps.has(prop) && schemaObj.additionalProperties === false) {
            errors.push({
              keyword: 'additionalProperties',
              instancePath: `${path}/${prop}`,
              schemaPath: `${path}/additionalProperties`,
              params: { additionalProperty: prop },
              message: `不允许的额外属性: ${prop}`,
            })
            isValid = false
          }
        }
      }
    }
    
    return isValid
  }
  
  const valid = validate(json, schema, '')
  return { valid, errors }
}

const DEFAULT_SCHEMA = `{
  "type": "object",
  "required": ["name", "age"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "email": {
      "type": "string",
      "pattern": "^[\\\\w.-]+@[\\\\w.-]+\\\\.[a-zA-Z]{2,}$"
    }
  },
  "additionalProperties": false
}`

const DEFAULT_JSON = `{
  "name": "张三",
  "age": 25,
  "email": "zhangsan@example.com"
}`

export default function JsonSchemaVerify() {
  const [jsonInput, setJsonInput] = useState(DEFAULT_JSON)
  const [schemaInput, setSchemaInput] = useState(DEFAULT_SCHEMA)
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const parsedJson = useMemo(() => {
    try {
      return JSON.parse(jsonInput)
    } catch {
      return null
    }
  }, [jsonInput])

  const parsedSchema = useMemo(() => {
    try {
      return JSON.parse(schemaInput)
    } catch {
      return null
    }
  }, [schemaInput])

  const validationResult = useMemo(() => {
    setError('')
    
    if (!parsedJson) {
      setError('JSON解析失败')
      return null
    }
    
    if (!parsedSchema) {
      setError('Schema解析失败')
      return null
    }
    
    try {
      return validateJsonSchema(parsedJson, parsedSchema)
    } catch (e) {
      setError('验证失败: ' + (e as Error).message)
      return null
    }
  }, [parsedJson, parsedSchema])

  const reset = () => {
    setJsonInput(DEFAULT_JSON)
    setSchemaInput(DEFAULT_SCHEMA)
    setError('')
  }

  const outputValue = validationResult 
    ? validationResult.valid 
      ? '验证通过' 
      : JSON.stringify(validationResult.errors, null, 2)
    : ''

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex flex-col gap-4 h-[calc(100vh-14rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="flex flex-col gap-2 min-h-0">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              JSON Schema
            </label>
            <textarea
              value={schemaInput}
              onChange={e => setSchemaInput(e.target.value)}
              placeholder="输入JSON Schema..."
              className="flex-1 px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary font-mono text-sm focus:outline-none focus:border-accent resize-none min-h-[200px]"
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col gap-2 min-h-0">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              JSON数据
            </label>
            <textarea
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
              placeholder="输入要验证的JSON..."
              className="flex-1 px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary font-mono text-sm focus:outline-none focus:border-accent resize-none min-h-[200px]"
              spellCheck={false}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-sm text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {validationResult && (
          <div className={`p-4 rounded-xl ${
            validationResult.valid
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : 'bg-rose-500/10 border border-rose-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {validationResult.valid ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500" />
              )}
              <span className={`text-lg font-bold ${
                validationResult.valid ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {validationResult.valid ? '验证通过' : `验证失败 (${validationResult.errors.length} 个错误)`}
              </span>
            </div>

            {!validationResult.valid && validationResult.errors.length > 0 && (
              <div className="space-y-2">
                {validationResult.errors.map((err, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-bg-surface border border-border-base"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-text-primary mb-1">
                          {err.message || `验证失败: ${err.keyword}`}
                        </div>
                        <div className="text-xs text-text-muted space-y-0.5">
                          {err.instancePath && (
                            <div>路径: <code className="text-accent">{err.instancePath}</code></div>
                          )}
                          <div>关键字: <code className="text-accent">{err.keyword}</code></div>
                          {Object.keys(err.params).length > 0 && (
                            <div>参数: <code className="text-text-secondary">{JSON.stringify(err.params)}</code></div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => copy(JSON.stringify(err, null, 2))}
                        className="p-1 rounded hover:bg-bg-raised shrink-0"
                      >
                        {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3 text-text-muted" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
