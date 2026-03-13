import React from 'react'
import {
  LayoutDashboard, Package, MapPin, Brain, TrendingUp, Filter
} from 'lucide-react'

const navItems = [
  {
    section: 'Tổng quan',
    items: [
      { id: 'dashboard', label: 'Bảng Điểu Khiển',        icon: <LayoutDashboard size={16} /> },
      { id: 'products',  label: 'Sản Phẩm',          icon: <Package size={16} /> },
    ]
  },
  {
    section: 'Phân Tích AI',
    items: [
      { id: 'regional',  label: 'Nhu Cầu Khu Vực',   icon: <MapPin size={16} /> },
      { id: 'ai',        label: 'Đề Xuất Đặt Hàng', icon: <Brain size={16} />, badge: '3 CAO' },
      { id: 'profit',    label: 'Rủi Ro Lợi Nhuận',   icon: <TrendingUp size={16} />, badge: '' },
      { id: 'ahp',       label: 'Ma Trận AHP',       icon: <Filter size={16} /> },
    ]
  },
]

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Brain size={18} />
        </div>
        <div className="sidebar-brand-text">
          <h2>InventIQ</h2>
          <span>Nền tảng AI v1.0</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(section => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map(item => (
              <div
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => setActivePage(item.id)}
              >
                {item.icon}
                {item.label}
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border)',
        fontSize: '11px',
        color: 'var(--text-muted)',
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
          Trạng thái Dữ Liệu
        </div>
        <div>Đồng bộ gần nhất: {new Date().toLocaleString('vi-VN')}</div>
        <div style={{ marginTop: 4, color: 'var(--accent-green)' }}>● Trực tuyến</div>
      </div>
    </aside>
  )
}
