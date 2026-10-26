import { useState, useMemo } from 'react'
import { Search, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface PortInfo {
  port: number
  service: string
  protocol: 'TCP' | 'UDP' | 'TCP/UDP'
  description: string
  category: string
}

const PORTS: PortInfo[] = [
  { port: 20, service: 'FTP Data', protocol: 'TCP', description: '文件传输协议数据端口', category: '文件传输' },
  { port: 21, service: 'FTP Control', protocol: 'TCP', description: '文件传输协议控制端口', category: '文件传输' },
  { port: 22, service: 'SSH', protocol: 'TCP', description: '安全外壳协议，远程登录', category: '远程访问' },
  { port: 23, service: 'Telnet', protocol: 'TCP', description: '远程终端协议', category: '远程访问' },
  { port: 25, service: 'SMTP', protocol: 'TCP', description: '简单邮件传输协议', category: '邮件服务' },
  { port: 53, service: 'DNS', protocol: 'TCP/UDP', description: '域名系统服务', category: '网络服务' },
  { port: 67, service: 'DHCP Server', protocol: 'UDP', description: 'DHCP服务器端口', category: '网络服务' },
  { port: 68, service: 'DHCP Client', protocol: 'UDP', description: 'DHCP客户端端口', category: '网络服务' },
  { port: 69, service: 'TFTP', protocol: 'UDP', description: '简单文件传输协议', category: '文件传输' },
  { port: 80, service: 'HTTP', protocol: 'TCP', description: '超文本传输协议', category: 'Web服务' },
  { port: 110, service: 'POP3', protocol: 'TCP', description: '邮局协议版本3', category: '邮件服务' },
  { port: 119, service: 'NNTP', protocol: 'TCP', description: '网络新闻传输协议', category: '新闻服务' },
  { port: 123, service: 'NTP', protocol: 'UDP', description: '网络时间协议', category: '网络服务' },
  { port: 135, service: 'RPC', protocol: 'TCP', description: '远程过程调用', category: 'Windows服务' },
  { port: 137, service: 'NetBIOS Name', protocol: 'TCP/UDP', description: 'NetBIOS名称服务', category: 'Windows服务' },
  { port: 138, service: 'NetBIOS Datagram', protocol: 'UDP', description: 'NetBIOS数据报服务', category: 'Windows服务' },
  { port: 139, service: 'NetBIOS Session', protocol: 'TCP', description: 'NetBIOS会话服务', category: 'Windows服务' },
  { port: 143, service: 'IMAP', protocol: 'TCP', description: '互联网消息访问协议', category: '邮件服务' },
  { port: 161, service: 'SNMP', protocol: 'UDP', description: '简单网络管理协议', category: '网络管理' },
  { port: 162, service: 'SNMP Trap', protocol: 'UDP', description: 'SNMP陷阱', category: '网络管理' },
  { port: 389, service: 'LDAP', protocol: 'TCP', description: '轻量级目录访问协议', category: '目录服务' },
  { port: 443, service: 'HTTPS', protocol: 'TCP', description: '安全HTTP协议', category: 'Web服务' },
  { port: 445, service: 'SMB', protocol: 'TCP', description: '服务器消息块', category: 'Windows服务' },
  { port: 465, service: 'SMTPS', protocol: 'TCP', description: 'SMTP over SSL', category: '邮件服务' },
  { port: 514, service: 'Syslog', protocol: 'UDP', description: '系统日志', category: '日志服务' },
  { port: 515, service: 'LPR', protocol: 'TCP', description: '行式打印机守护进程', category: '打印服务' },
  { port: 587, service: 'SMTP Submission', protocol: 'TCP', description: 'SMTP提交端口', category: '邮件服务' },
  { port: 636, service: 'LDAPS', protocol: 'TCP', description: 'LDAP over SSL', category: '目录服务' },
  { port: 993, service: 'IMAPS', protocol: 'TCP', description: 'IMAP over SSL', category: '邮件服务' },
  { port: 995, service: 'POP3S', protocol: 'TCP', description: 'POP3 over SSL', category: '邮件服务' },
  { port: 1080, service: 'SOCKS', protocol: 'TCP', description: 'SOCKS代理', category: '代理服务' },
  { port: 1194, service: 'OpenVPN', protocol: 'TCP/UDP', description: 'OpenVPN', category: 'VPN' },
  { port: 1433, service: 'MSSQL', protocol: 'TCP', description: 'Microsoft SQL Server', category: '数据库' },
  { port: 1434, service: 'MSSQL Monitor', protocol: 'UDP', description: 'MSSQL监听器', category: '数据库' },
  { port: 1521, service: 'Oracle DB', protocol: 'TCP', description: 'Oracle数据库', category: '数据库' },
  { port: 1701, service: 'L2TP', protocol: 'UDP', description: '二层隧道协议', category: 'VPN' },
  { port: 1723, service: 'PPTP', protocol: 'TCP', description: '点对点隧道协议', category: 'VPN' },
  { port: 2049, service: 'NFS', protocol: 'TCP', description: '网络文件系统', category: '文件传输' },
  { port: 3306, service: 'MySQL', protocol: 'TCP', description: 'MySQL数据库', category: '数据库' },
  { port: 3389, service: 'RDP', protocol: 'TCP', description: '远程桌面协议', category: '远程访问' },
  { port: 5432, service: 'PostgreSQL', protocol: 'TCP', description: 'PostgreSQL数据库', category: '数据库' },
  { port: 5672, service: 'AMQP', protocol: 'TCP', description: '高级消息队列协议', category: '消息队列' },
  { port: 5900, service: 'VNC', protocol: 'TCP', description: '虚拟网络计算', category: '远程访问' },
  { port: 6379, service: 'Redis', protocol: 'TCP', description: 'Redis数据库', category: '数据库' },
  { port: 8080, service: 'HTTP Proxy', protocol: 'TCP', description: 'HTTP代理/备用HTTP', category: 'Web服务' },
  { port: 8443, service: 'HTTPS Alt', protocol: 'TCP', description: '备用HTTPS端口', category: 'Web服务' },
  { port: 9000, service: 'PHP-FPM', protocol: 'TCP', description: 'PHP FastCGI进程管理器', category: 'Web服务' },
  { port: 9090, service: 'Prometheus', protocol: 'TCP', description: 'Prometheus监控', category: '监控' },
  { port: 9200, service: 'Elasticsearch', protocol: 'TCP', description: 'Elasticsearch HTTP', category: '数据库' },
  { port: 9300, service: 'Elasticsearch', protocol: 'TCP', description: 'Elasticsearch传输', category: '数据库' },
  { port: 11211, service: 'Memcached', protocol: 'TCP', description: 'Memcached缓存', category: '数据库' },
  { port: 27017, service: 'MongoDB', protocol: 'TCP', description: 'MongoDB数据库', category: '数据库' },
  { port: 5000, service: 'Flask/Docker', protocol: 'TCP', description: 'Flask开发服务器/Docker Registry', category: '开发工具' },
  { port: 3000, service: 'Node.js', protocol: 'TCP', description: 'Node.js开发服务器', category: '开发工具' },
  { port: 4200, service: 'Angular', protocol: 'TCP', description: 'Angular开发服务器', category: '开发工具' },
  { port: 5173, service: 'Vite', protocol: 'TCP', description: 'Vite开发服务器', category: '开发工具' },
  { port: 8000, service: 'Django', protocol: 'TCP', description: 'Django开发服务器', category: '开发工具' },
]

const CATEGORIES = [...new Set(PORTS.map(p => p.category))]

export default function PortReference() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null)
  const { copy, copied } = useClipboard()

  const filteredPorts = useMemo(() => {
    return PORTS.filter(port => {
      const matchesSearch = !search ||
        port.service.toLowerCase().includes(search.toLowerCase()) ||
        port.description.toLowerCase().includes(search.toLowerCase()) ||
        port.port.toString().includes(search)
      
      const matchesCategory = !selectedCategory || port.category === selectedCategory
      const matchesProtocol = !selectedProtocol || port.protocol === selectedProtocol || 
        (selectedProtocol === 'TCP/UDP' && port.protocol === 'TCP/UDP')
      
      return matchesSearch && matchesCategory && matchesProtocol
    })
  }, [search, selectedCategory, selectedProtocol])

  const reset = () => {
    setSearch('')
    setSelectedCategory(null)
    setSelectedProtocol(null)
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索端口、服务或描述..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-bg-surface border border-border-base text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
        
        <select
          value={selectedCategory || ''}
          onChange={e => setSelectedCategory(e.target.value || null)}
          className="px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="">全部分类</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <select
          value={selectedProtocol || ''}
          onChange={e => setSelectedProtocol(e.target.value || null)}
          className="px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="">全部协议</option>
          <option value="TCP">TCP</option>
          <option value="UDP">UDP</option>
          <option value="TCP/UDP">TCP/UDP</option>
        </select>
      </div>

      <div className="text-xs text-text-muted mb-3">
        共 {filteredPorts.length} 个端口
      </div>

      <div className="overflow-x-auto rounded-xl border border-border-base">
        <table className="w-full text-sm">
          <thead className="bg-bg-surface">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-text-muted">端口</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">服务</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">协议</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">描述</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">分类</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-base">
            {filteredPorts.map(port => (
              <tr key={`${port.port}-${port.service}`} className="hover:bg-bg-surface/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-accent">{port.port}</span>
                    <button
                      onClick={() => copy(port.port.toString())}
                      className="p-1 rounded hover:bg-bg-raised opacity-0 group-hover:opacity-100"
                    >
                      {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3 text-text-muted" />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-text-primary">{port.service}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    port.protocol === 'TCP' ? 'bg-blue-500/10 text-blue-400' :
                    port.protocol === 'UDP' ? 'bg-green-500/10 text-green-400' :
                    'bg-purple-500/10 text-purple-400'
                  }`}>
                    {port.protocol}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{port.description}</td>
                <td className="px-4 py-3 text-text-muted text-xs">{port.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPorts.length === 0 && (
        <div className="text-center py-8 text-text-muted">
          没有找到匹配的端口
        </div>
      )}
    </ToolLayout>
  )
}
