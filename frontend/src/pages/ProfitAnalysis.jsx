import React, { useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { AlertTriangle } from 'lucide-react'

const PROFIT_DATA = [
  { product_id:'OFF-BI-10004654', product_name:'GBC DocuBind TL300', category:'Office Supplies',
    total_profit:-584.85, avg_margin:-0.17, avg_discount:0.0,  order_count:1, risk_flags:'UNPROFITABLE', risk_score:80, recommendation:'Review pricing or discontinue' },
  { product_id:'FUR-TA-10000577', product_name:'Bretford CR4500 Table', category:'Furniture',
    total_profit:-383.03, avg_margin:-0.40, avg_discount:0.45, order_count:1, risk_flags:'UNPROFITABLE, OVER_DISCOUNTED', risk_score:100, recommendation:'Reduce discount — margin destroyed' },
  { product_id:'OFF-AP-10002311', product_name:'Holmes Air Purifier Filter', category:'Office Supplies',
    total_profit:-123.86, avg_margin:-1.80, avg_discount:0.80, order_count:1, risk_flags:'UNPROFITABLE, OVER_DISCOUNTED', risk_score:100, recommendation:'Extreme discount — immediate price correction' },
  { product_id:'FUR-BO-10004834', product_name:'Safeco Executive Bookcase', category:'Furniture',
    total_profit:-178.76, avg_margin:-0.21, avg_discount:0.20, order_count:1, risk_flags:'UNPROFITABLE, SLOW_MOVER', risk_score:80, recommendation:'Discontinue or deep promotion' },
  { product_id:'TEC-CO-10001840', product_name:'Brother MFC-9970CDW Printer', category:'Technology',
    total_profit:-199.98, avg_margin:-0.05, avg_discount:0.20, order_count:1, risk_flags:'UNPROFITABLE, OVER_DISCOUNTED', risk_score:70, recommendation:'Remove discount — near-zero margin at 20% off' },
  { product_id:'FUR-CH-10000454', product_name:'Hon Deluxe Stacking Chairs', category:'Furniture',
    total_profit:219.58, avg_margin:0.30, avg_discount:0.0,  order_count:1, risk_flags:'SLOW_MOVER', risk_score:30, recommendation:'Promote to widen distribution' },
  { product_id:'TEC-PH-10000169', product_name:'Apple iPhone 12', category:'Technology',
    total_profit:1319.96, avg_margin:0.30, avg_discount:0.0, order_count:4, risk_flags:'OK', risk_score:0, recommendation:'Monitor — within acceptable range' },
  { product_id:'TEC-PH-10004093', product_name:'Samsung Galaxy S7', category:'Technology',
    total_profit:269.99, avg_margin:0.30, avg_discount:0.0, order_count:1, risk_flags:'SLOW_MOVER', risk_score:30, recommendation:'Promote via marketing campaign' },
  { product_id:'OFF-AP-10002892', product_name:'Belkin 6 Outlet', category:'Office Supplies',
    total_profit:34.47, avg_margin:0.30, avg_discount:0.0, order_count:1, risk_flags:'SLOW_MOVER', risk_score:30, recommendation:'Promote to increase velocity' },
  { product_id:'TEC-CO-10004722', product_name:'HP LaserJet 3310 Copier', category:'Technology',
    total_profit:1379.99, avg_margin:0.40, avg_discount:0.0, order_count:1, risk_flags:'SLOW_MOVER', risk_score:30, recommendation:'High margin — target Corporate segment' },
  { product_id:'FUR-CH-10000777', product_name:'Global Leather Mid-Back Chair', category:'Furniture',
    total_profit:727.99, avg_margin:0.40, avg_discount:0.0, order_count:1, risk_flags:'SLOW_MOVER', risk_score:30, recommendation:'Promote — excellent margin product' },
  { product_id:'TEC-PH-10001530', product_name:'Motorola Smart Phone', category:'Technology',
    total_profit:1148.90, avg_margin:0.46, avg_discount:0.0, order_count:1, risk_flags:'SLOW_MOVER', risk_score:30, recommendation:'Expand distribution' },
]

const scatterData = PROFIT_DATA.map(p => ({
  x: parseFloat((p.avg_discount * 100).toFixed(1)),
  y: parseFloat((p.avg_margin * 100).toFixed(1)),
  name: p.product_name,
  risk: p.risk_score,
}))

const riskColor = (score) => {
  if (score >= 70) return '#ef4444'
  if (score >= 30) return '#f59e0b'
  return '#10b981'
}

const flagsBadges = (flags) => {
  if (!flags || flags === 'OK') return <span className="badge badge-green">OK</span>
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {flags.split(', ').map(f => (
        <span key={f} className={
          f === 'UNPROFITABLE'    ? 'badge badge-red'   :
          f === 'OVER_DISCOUNTED' ? 'badge badge-amber' :
                                    'badge badge-blue'
        }>{f}</span>
      ))}
    </div>
  )
}

export default function ProfitAnalysis() {
  const [sortBy, setSortBy] = useState('risk_score')

  const unprofitable    = PROFIT_DATA.filter(p => p.risk_flags.includes('UNPROFITABLE')).length
  const overDiscounted  = PROFIT_DATA.filter(p => p.risk_flags.includes('OVER_DISCOUNTED')).length
  const slowMovers      = PROFIT_DATA.filter(p => p.risk_flags.includes('SLOW_MOVER')).length
  const healthy         = PROFIT_DATA.filter(p => p.risk_flags === 'OK').length
  const avgRisk         = (PROFIT_DATA.reduce((s, p) => s + p.risk_score, 0) / PROFIT_DATA.length).toFixed(1)

  const sorted = [...PROFIT_DATA].sort((a, b) => b[sortBy] - a[sortBy])

  return (
    <div>
      <div className="page-header">
        <h1>Phân Tích Rủi Ro Lợi Nhuận</h1>
        <p>Thuật toán Isolation Forest + kiểm duyệt quy tắc kinh doanh — tìm ra sản phẩm thua lỗ, lạm dụng giảm giá và hàng chậm luân chuyển</p>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Thua Lỗ',    value: unprofitable,  color: '#ef4444', sub: 'biên LN âm' },
          { label: 'Lạm Dụng Giảm Giá', value: overDiscounted, color: '#f59e0b', sub: 'giảm > 20% & LN thấp' },
          { label: 'Tồn Kho Lâu',     value: slowMovers,    color: '#3b82f6', sub: 'dưới 3 đơn hàng' },
          { label: 'Điểm Rủi Ro TB',  value: avgRisk,       color: '#8b5cf6', sub: 'trên thang 100' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.color, fontSize: 36 }}>{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {unprofitable > 0 && (
        <div className="alert-banner error" style={{ marginBottom: 24 }}>
          <AlertTriangle size={16} />
          <strong>{unprofitable} sản phẩm</strong> đang chịu mức thua lỗ. Yêu cầu xem xét điều chỉnh giá ngay lập tức.
        </div>
      )}

      {/* Charts Row */}
      <div className="chart-grid" style={{ marginBottom: 24 }}>
        {/* Scatter Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Mức Giảm Giá (Discount) / Biên Lợi Nhuận (Margin)</div>
              <div className="card-subtitle">Mỗi điểm = 1 sản phẩm. Nằm dưới vạch đỏ = rủi ro thua lỗ</div>
            </div>
            <span className="card-badge">Bản Đồ Rủi Ro</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="x" name="Discount %" type="number"
                stroke="var(--text-muted)" tick={{ fontSize: 10 }}
                label={{ value: 'Discount %', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }}
              />
              <YAxis
                dataKey="y" name="Margin %" type="number"
                stroke="var(--text-muted)" tick={{ fontSize: 10 }}
                label={{ value: 'Margin %', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}
              />
              <ReferenceLine
                y={0} stroke="var(--accent-red)" strokeDasharray="4 4"
                label={{ value: 'Break-even', fill: 'var(--accent-red)', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v, n) => [`${v}%`, n]}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter
                data={scatterData}
                shape={(props) => {
                  const { cx, cy, payload } = props
                  const color = riskColor(payload.risk)
                  return <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.85} stroke={color} strokeWidth={1} />
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
            {[['#ef4444', 'Rủi ro cao (≥70)'], ['#f59e0b', 'Trung bình (30–69)'], ['#10b981', 'Rủi ro thấp (<30)']].map(([c, l]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Phân Bố Rủi Ro</div>
              <div className="card-subtitle">Phân bổ cờ hiệu (flag) trên toàn danh mục</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 8 }}>
            {[
              { label: 'Sản Phẩm Thua Lỗ',    count: unprofitable,  total: PROFIT_DATA.length, color: '#ef4444' },
              { label: 'Giảm Giá Quá Mức', count: overDiscounted, total: PROFIT_DATA.length, color: '#f59e0b' },
              { label: 'Tồn Kho Lâu',              count: slowMovers,    total: PROFIT_DATA.length, color: '#3b82f6' },
              { label: 'Hàng Khỏe Mạnh',         count: healthy,       total: PROFIT_DATA.length, color: '#10b981' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.count} / {item.total}
                  </span>
                </div>
                <div className="gauge-bar">
                  <div className="gauge-fill"
                    style={{ width: `${(item.count / item.total) * 100}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Risk Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Sổ Đăng Ký Rủi Ro Sản Phẩm</div>
            <div className="card-subtitle">{PROFIT_DATA.length} sản phẩm · Isolation Forest + Bộ kiểm duyệt quy tắc</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['risk_score', 'avg_margin', 'avg_discount'].map(k => (
              <button key={k} onClick={() => setSortBy(k)} style={{
                padding: '4px 12px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
                border: `1px solid ${sortBy === k ? 'var(--accent-blue)' : 'var(--border)'}`,
                background: sortBy === k ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: sortBy === k ? 'var(--accent-blue)' : 'var(--text-secondary)',
                fontWeight: sortBy === k ? 700 : 400,
              }}>{k.replace(/_/g, ' ')}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Sản Phẩm</th>
                <th>Phân Loại</th>
                <th>Lợi Nhuận</th>
                <th>Biên LN</th>
                <th>Giảm Giá</th>
                <th>Số Đơn</th>
                <th>Cờ Hiệu</th>
                <th>Điểm Rủi Ro</th>
                <th>Đề Xuất Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={i}>
                  <td style={{ maxWidth: 160 }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.product_name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.product_id}</div>
                  </td>
                  <td>{p.category}</td>
                  <td style={{ color: p.total_profit < 0 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 600 }}>
                    ${p.total_profit.toFixed(0)}
                  </td>
                  <td style={{ color: p.avg_margin < 0 ? 'var(--accent-red)' : 'var(--text-primary)', fontWeight: 600 }}>
                    {(p.avg_margin * 100).toFixed(1)}%
                  </td>
                  <td>{(p.avg_discount * 100).toFixed(0)}%</td>
                  <td>{p.order_count}</td>
                  <td>{flagsBadges(p.risk_flags)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="gauge-bar" style={{ width: 60 }}>
                        <div className="gauge-fill"
                          style={{ width: `${p.risk_score}%`, background: riskColor(p.risk_score) }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: riskColor(p.risk_score) }}>
                        {p.risk_score}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 180 }}>
                    {p.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
