import React, { useState } from 'react'
import { Brain, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

const RECOMMENDATIONS = [
  {
    product_id: 'TEC-PH-10004093', product_name: 'Samsung Galaxy S7',
    category: 'Technology', recommended_qty: 9, urgency: 'HIGH',
    confidence: 0.91, risk_flags: 'OK',
    reason: 'High velocity + seasonal spike detected in Q4. Rolling avg exceeds safety stock.',
    model: 'XGBoost DemandForecaster v1',
  },
  {
    product_id: 'TEC-PH-10000169', product_name: 'Apple iPhone 12',
    category: 'Technology', recommended_qty: 12, urgency: 'HIGH',
    confidence: 0.88, risk_flags: 'OK',
    reason: 'Corporate segment demand rising. 4 reorders in last 30 days. Predicted qty: 11.4',
    model: 'XGBoost DemandForecaster v1',
  },
  {
    product_id: 'FUR-CH-10000777', product_name: 'Global Leather Mid-Back Chair',
    category: 'Furniture', recommended_qty: 8, urgency: 'HIGH',
    confidence: 0.83, risk_flags: 'OK',
    reason: 'High profit margin (40%) + rising demand in East region. Low volatility — reliable mover.',
    model: 'XGBoost DemandForecaster v1',
  },
  {
    product_id: 'OFF-BI-10004654', product_name: 'GBC DocuBind TL300',
    category: 'Office Supplies', recommended_qty: 0, urgency: 'LOW',
    confidence: 0.72, risk_flags: 'UNPROFITABLE',
    reason: 'Negative margin (-17%). Avoid restocking until pricing strategy is revised.',
    model: 'ProfitOptimizer + Heuristic',
  },
  {
    product_id: 'TEC-CO-10001840', product_name: 'Brother MFC-9970CDW Laser Printer',
    category: 'Technology', recommended_qty: 2, urgency: 'MEDIUM',
    confidence: 0.65, risk_flags: 'OVER_DISCOUNTED',
    reason: 'High discount (20%) eroded margin. Modest reorder with pricing review recommended.',
    model: 'ReorderRecommender v1',
  },
  {
    product_id: 'FUR-BO-10004834', product_name: 'Safeco Executive Wire Desk Bookcase',
    category: 'Furniture', recommended_qty: 0, urgency: 'LOW',
    confidence: 0.78, risk_flags: 'UNPROFITABLE, SLOW_MOVER',
    reason: 'Negative profit and only 1 order lifetime. Consider discontinuation.',
    model: 'ProfitOptimizer AI',
  },
  {
    product_id: 'OFF-AP-10002892', product_name: 'Belkin 6 Outlet Surge Protector',
    category: 'Office Supplies', recommended_qty: 6, urgency: 'MEDIUM',
    confidence: 0.80, risk_flags: 'OK',
    reason: 'Steady demand across Consumer segment. 34% profit margin. Solid performer.',
    model: 'ReorderRecommender v1',
  },
  {
    product_id: 'TEC-AC-10003027', product_name: 'Kensington Laptop Car Adapter',
    category: 'Technology', recommended_qty: 3, urgency: 'LOW',
    confidence: 0.70, risk_flags: 'SLOW_MOVER',
    reason: 'Low order frequency but decent margin. Light reorder to maintain availability.',
    model: 'ReorderRecommender v1',
  },
]

const urgencyBadge = (u) => {
  if (u === 'HIGH')   return <span className="badge badge-red">● HIGH</span>
  if (u === 'MEDIUM') return <span className="badge badge-amber">● MEDIUM</span>
  return <span className="badge badge-green">● LOW</span>
}

const flagBadge = (flags) => {
  if (flags === 'OK') return <span className="badge badge-gray">OK</span>
  return flags.split(', ').map(f => (
    <span key={f} className="badge badge-red" style={{ marginRight: 4 }}>{f}</span>
  ))
}

export default function AIRecommendations() {
  const [filter, setFilter] = useState('ALL')
  const [actioned, setActioned] = useState({})

  const filtered = filter === 'ALL'
    ? RECOMMENDATIONS
    : RECOMMENDATIONS.filter(r => r.urgency === filter)

  const action = (id, type) => setActioned(prev => ({ ...prev, [id]: type }))

  const highCount   = RECOMMENDATIONS.filter(r => r.urgency === 'HIGH').length
  const medCount    = RECOMMENDATIONS.filter(r => r.urgency === 'MEDIUM').length
  const totalReorder = RECOMMENDATIONS.reduce((s, r) => s + r.recommended_qty, 0)
  const avgConf   = (RECOMMENDATIONS.reduce((s,r) => s + r.confidence, 0) / RECOMMENDATIONS.length * 100).toFixed(0)

  return (
    <div>
      <div className="page-header">
        <h1>Đề Xuất Đặt Hàng Mới Từ AI</h1>
        <p>Gợi ý bằng thuật toán XGBoost và Isolation Forest dựa trên dự báo nhu cầu, phân tích lợi nhuận và mức độ biến động</p>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Cực Kỳ Cấp Bách (HIGH)',    value: highCount,    badge: 'badge-red',    suffix: ' món' },
          { label: 'Cần Đặt Thêm (MEDIUM)',  value: medCount,     badge: 'badge-amber',  suffix: ' món' },
          { label: 'Tổng Quy Mô', value: totalReorder, badge: 'badge-blue', suffix: ' unit' },
          { label: 'Độ Tự Tin TB',  value: `${avgConf}%`, badge: 'badge-green', suffix: '' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ fontSize: 28 }}>{k.value}{k.suffix}</div>
            <span className={`badge ${k.badge}`}>Kết quả từ Mô hình AI</span>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: `1px solid ${filter === f ? 'var(--accent-blue)' : 'var(--border)'}`,
              background: filter === f ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: filter === f ? 'var(--accent-blue)' : 'var(--text-secondary)',
              fontWeight: filter === f ? 700 : 400,
              transition: 'all 0.2s',
            }}
          >
            {f} {f !== 'ALL' && `(${RECOMMENDATIONS.filter(r => r.urgency === f).length})`}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
          <Brain size={14} />
          Powered by XGBoost + Isolation Forest
        </div>
      </div>

      {/* Recommendation Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((rec) => {
          const status = actioned[rec.product_id]
          const isApproved = status === 'approved'
          const isDismissed = status === 'dismissed'

          return (
            <div
              key={rec.product_id}
              className="card"
              style={{
                opacity: isDismissed ? 0.45 : 1,
                borderColor: isApproved ? 'rgba(16,185,129,0.4)'
                           : isDismissed ? 'var(--border)'
                           : rec.urgency === 'HIGH' ? 'rgba(239,68,68,0.3)'
                           : rec.urgency === 'MEDIUM' ? 'rgba(245,158,11,0.3)'
                           : 'var(--border)',
                transition: 'all 0.3s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                {/* Left */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    {urgencyBadge(rec.urgency)}
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{rec.product_name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {rec.product_id} · {rec.category}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {rec.reason}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {flagBadge(rec.risk_flags)}
                    <span className="badge badge-purple" style={{ fontSize: 10 }}>
                      {rec.model}
                    </span>
                  </div>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Số Lượng Đề Xuất</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: rec.recommended_qty === 0 ? 'var(--accent-red)' : 'var(--accent-cyan)' }}>
                      {rec.recommended_qty === 0 ? 'ĐÌNH CHỈ' : `+${rec.recommended_qty}`}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Độ tự tin: {(rec.confidence * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div className="gauge-bar" style={{ width: 120 }}>
                    <div
                      className="gauge-fill"
                      style={{
                        width: `${rec.confidence * 100}%`,
                        background: rec.confidence > 0.85 ? 'var(--accent-green)'
                                  : rec.confidence > 0.7  ? 'var(--accent-amber)'
                                  : 'var(--accent-red)'
                      }}
                    />
                  </div>

                  {/* Action buttons */}
                  {!status ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => action(rec.product_id, 'approved')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                          color: 'var(--accent-green)', fontWeight: 600, transition: 'all 0.2s'
                        }}
                      >
                        <CheckCircle size={12} /> Duyệt Qua
                      </button>
                      <button
                        onClick={() => action(rec.product_id, 'dismissed')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                          color: 'var(--accent-red)', fontWeight: 600, transition: 'all 0.2s'
                        }}
                      >
                        <XCircle size={12} /> Bỏ Qua
                      </button>
                    </div>
                  ) : (
                    <span className={`badge ${isApproved ? 'badge-green' : 'badge-gray'}`}>
                      {isApproved ? '✓ Đã Duyệt' : '✗ Đã Bỏ Qua'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
