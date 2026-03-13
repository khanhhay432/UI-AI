import React from 'react'
import { RefreshCw } from 'lucide-react'

export default function TopHeader({ title, subtitle }) {
  const now = new Date().toLocaleDateString('vi-VN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  })

  return (
    <header className="top-header">
      <div>
        <div className="header-title">{title}</div>
        <div className="header-subtitle">{subtitle} · {now}</div>
      </div>
      <div className="header-right">
        <div className="header-badge">
          <span className="status-dot" />
          Hệ thống hoạt động ổn định
        </div>
        <button
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '8px 14px',
            color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px',
          }}
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>
    </header>
  )
}
