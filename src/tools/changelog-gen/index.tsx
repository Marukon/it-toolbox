import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface Commit {
  hash: string
  type: string
  scope: string
  description: string
  body: string
  breaking: boolean
}

function parseCommit(line: string): Commit | null {
  const match = line.match(/^([a-f0-9]+)\s+(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?:\s*(.+)$/)
  if (!match) return null

  const [, hash, type, scope = '', description] = match
  return {
    hash: hash.slice(0, 7),
    type,
    scope: scope.replace(/[()]/g, ''),
    description: description.trim(),
    body: '',
    breaking: line.includes('!'),
  }
}

function groupCommits(commits: Commit[]): Record<string, Commit[]> {
  const groups: Record<string, Commit[]> = {
    '✨ 新功能': [],
    '🐛 Bug 修复': [],
    '📝 文档': [],
    '💎 重构': [],
    '🚀 性能优化': [],
    '✅ 测试': [],
    '🔧 构建/工具': [],
    '💥 破坏性变更': [],
  }

  for (const commit of commits) {
    if (commit.breaking) {
      groups['💥 破坏性变更'].push(commit)
    }
    switch (commit.type) {
      case 'feat':
        groups['✨ 新功能'].push(commit)
        break
      case 'fix':
        groups['🐛 Bug 修复'].push(commit)
        break
      case 'docs':
        groups['📝 文档'].push(commit)
        break
      case 'refactor':
        groups['💎 重构'].push(commit)
        break
      case 'perf':
        groups['🚀 性能优化'].push(commit)
        break
      case 'test':
        groups['✅ 测试'].push(commit)
        break
      case 'build':
      case 'ci':
      case 'chore':
        groups['🔧 构建/工具'].push(commit)
        break
    }
  }

  return groups
}

export default function ChangelogGen() {
  const [gitLog, setGitLog] = useState('')
  const [version, setVersion] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const { copy, copied } = useClipboard()

  const commits = useMemo<Commit[]>(() => {
    const lines = gitLog.split('\n').filter(l => l.trim())
    return lines.map(parseCommit).filter((c): c is Commit => c !== null)
  }, [gitLog])

  const groups = useMemo(() => groupCommits(commits), [commits])

  const changelog = useMemo(() => {
    if (commits.length === 0) return ''

    const versionLine = version ? `## ${version}` : '## [Unreleased]'
    const dateLine = date ? ` - ${date}` : ''

    let md = `${versionLine}${dateLine}\n\n`

    for (const [groupTitle, groupCommits] of Object.entries(groups)) {
      if (groupCommits.length === 0) continue
      md += `### ${groupTitle}\n\n`
      for (const commit of groupCommits) {
        const scope = commit.scope ? `**${commit.scope}**: ` : ''
        md += `- ${scope}${commit.description} ([${commit.hash}])\n`
      }
      md += '\n'
    }

    return md
  }, [commits, groups, version, date])

  const example = `a1b2c3d feat(auth): 添加OAuth2.0登录支持
e4f5g6h fix(api): 修复用户列表分页问题
i7j8k9l docs: 更新README安装说明
m0n1o2p refactor(utils): 重构日期格式化函数
q3r4s5t perf(search): 优化搜索性能
u6v7w8x test(auth): 添加登录单元测试
y9z0a1b chore: 更新依赖版本
c2d3e4f feat!: 重构API接口（破坏性变更）`

  return (
    <ToolLayout meta={meta} onReset={() => { setGitLog(''); setVersion(''); setDate(new Date().toISOString().split('T')[0]) }}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">版本号</label>
            <input
              className="tool-input"
              placeholder="例如：v1.2.0"
              value={version}
              onChange={e => setVersion(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">发布日期</label>
            <input
              type="date"
              className="tool-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Git Log（每行一个提交）</label>
          <textarea
            className="tool-input font-mono text-sm h-40 resize-none"
            placeholder="粘贴 git log --oneline 输出..."
            value={gitLog}
            onChange={e => setGitLog(e.target.value)}
            spellCheck={false}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGitLog(example)}
              className="btn-ghost text-xs"
            >
              加载示例
            </button>
            <span className="text-xs text-text-muted">
              已解析 {commits.length} 个 Conventional Commits
            </span>
          </div>
        </div>

        {commits.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(groups).map(([title, c]) => (
              c.length > 0 && (
                <span key={title} className="px-2 py-1 text-xs rounded-md bg-bg-raised text-text-muted border border-border-base">
                  {title.split(' ')[0]} {c.length}
                </span>
              )
            ))}
          </div>
        )}

        {changelog && (
          <div className="bg-bg-surface rounded-lg border border-border-base overflow-hidden">
            <div className="px-4 py-2 bg-bg-raised border-b border-border-base flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">生成的 CHANGELOG.md</span>
              <button onClick={() => copy(changelog)} className="btn-ghost text-xs gap-1">
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                复制
              </button>
            </div>
            <pre className="p-4 font-mono text-sm text-text-primary whitespace-pre-wrap overflow-auto max-h-80">
              {changelog}
            </pre>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
