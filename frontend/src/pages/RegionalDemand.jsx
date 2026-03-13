import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const REGIONAL_DATA = [
  { region: 'West',    state: 'California',    total_sales: 8942, total_qty: 48, total_profit: 2987, order_count: 18, avg_margin_pct: 31.2 },
  { region: 'East',    state: 'New York',      total_sales: 3299, total_qty: 19, total_profit: 1089, order_count: 7,  avg_margin_pct: 28.6 },
  { region: 'South',   state: 'Florida',       total_sales: 1307, total_qty: 12, total_profit: 90,   order_count: 5,  avg_margin_pct: 11.3 },
  { region: 'Central', state: 'Texas',         total_sales: 5169, total_qty: 22, total_profit: -330, order_count: 8,  avg_margin_pct: -5.1 },
  { region: 'West',    state: 'Washington',    total_sales: 2225, total_qty: 12, total_profit: 721,  order_count: 5,  avg_margin_pct: 29.4 },
  { region: 'Central', state: 'Illinois',      total_sales: 1199, total_qty: 7,  total_profit: 359,  order_count: 3,  avg_margin_pct: 32.7 },
  { region: 'South',   state: 'Tennessee',     total_sales: 169,  total_qty: 5,  total_profit: -2,   order_count: 2,  avg_margin_pct: -0.9 },
  { region: 'South',   state: 'Georgia',       total_sales: 882,  total_qty: 5,  total_profit: -164, order_count: 2,  avg_margin_pct: -14.9 },
  { region: 'East',    state: 'Michigan',      total_sales: 4774, total_qty: 19, total_profit: 1708, order_count: 4,  avg_margin_pct: 37.2 },
  { region: 'West',    state: 'Oregon',        total_sales: 185,  total_qty: 4,  total_profit: 89,   order_count: 2,  avg_margin_pct: 44.1 },
  { region: 'East',    state: 'Pennsylvania',  total_sales: 79,   total_qty: 8,  total_profit: 32,   order_count: 2,  avg_margin_pct: 40.3 },
  { region: 'East',    state: 'Ohio',          total_sales: 141,  total_qty: 5,  total_profit: 13,   order_count: 2,  avg_margin_pct: 9.6 },
  { region: 'West',    state: 'Colorado',      total_sales: 70,   total_qty: 9,  total_profit: 31,   order_count: 2,  avg_margin_pct: 44.3 },
  { region: 'West',    state: 'Arizona',       total_sales: 1449, total_qty: 11, total_profit: 434,  order_count: 2,  avg_margin_pct: 32.0 },
  { region: 'West',    state: 'New Mexico',    total_sales: 285,  total_qty: 6,  total_profit: 50,   order_count: 2,  avg_margin_pct: 17.7 },
  { region: 'East',    state: 'North Carolina', total_sales: 15, total_qty: 3,  total_profit: 5,    order_count: 1,  avg_margin_pct: 35.0 },
  { region: 'South',   state: 'Kentucky',      total_sales: 993, total_qty: 5,  total_profit: 261,  order_count: 1,  avg_margin_pct: 26.3 },
  { region: 'West',    state: 'California',    total_sales: 143, total_qty: 5,  total_profit: 47,   order_count: 3,  avg_margin_pct: 32.7 },
]

const regionColors = { West: '#3b82f6', East: '#8b5cf6', Central: '#f59e0b', South: '#10b981' }

const regions = [...new Set(REGIONAL_DATA.map(r => r.region))]

const regionSummary = regions.map(region => ({
  region,
  total_sales:  REGIONAL_DATA.filter(r => r.region === region).reduce((s, r) => s + r.total_sales, 0),
  total_profit: REGIONAL_DATA.filter(r => r.region === region).reduce((s, r) => s + r.total_profit, 0),
  order_count:  REGIONAL_DATA.filter(r => r.region === region).reduce((s, r) => s + r.order_count, 0),
}))

export default function RegionalDemand() {
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All' ? REGIONAL_DATA : REGIONAL_DATA.filter(r => r.region === filter)

  const getMarginBadge = (pct) => {
    if (pct < 0)  return <span className="badge badge-red">{pct.toFixed(1)}%</span>
    if (pct < 10) return <span className="badge badge-amber">{pct.toFixed(1)}%</span>
    return <span className="badge badge-green">{pct.toFixed(1)}%</span>
  }

  return (
    <div>
      <div className="page-header">
        <h1>Phân Tích Nhu Cầu Từng Khu Vực</h1>
        <p>Chi tiết nhu cầu địa lý — doanh thu và lợi nhuận theo khu vực (Region) và tiểu bang (State)</p>
      </div>

      {/* Region Summary Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {regionSummary.map(r => (
          <div
            key={r.region}
            className="kpi-card"
            style={{
              '--card-accent': `linear-gradient(90deg, ${regionColors[r.region]}, ${regionColors[r.region]}88)`,
              cursor: 'pointer',
              opacity: filter !== 'All' && filter !== r.region ? 0.5 : 1,
            }}
            onClick={() => setFilter(filter === r.region ? 'All' : r.region)}
          >
            <div className="kpi-label">{r.region}</div>
            <div className="kpi-value">${(r.total_sales / 1000).toFixed(1)}K</div>
            <div className="kpi-sub">
              <span style={{ color: r.total_profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                ${r.total_profit.toFixed(0)} lợi nhuận
              </span>
              · {r.order_count} đơn hàng
            </div>
          </div>
        ))}
      </div>

      {/* Region Bar Chart */}
      <div className="chart-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Doanh Số Vùng</div>
              <div className="card-subtitle">So sánh doanh thu & lợi nhuận</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="region" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={v => `$${v.toFixed(2)}`}
              />
              <Bar dataKey="total_sales"  name="Doanh Thu"  fill="#3b82f6" radius={[3,3,0,0]} />
              <Bar dataKey="total_profit" name="Lợi Nhuận" fill="#10b981" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Biên Lợi Nhuận Bang</div>
              <div className="card-subtitle">Lợi nhuận theo tiểu bang (top 8)</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={REGIONAL_DATA.slice(0,8)}
              layout="vertical"
              margin={{ left: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 10 }} tickFormatter={v => `$${v.toFixed(0)}`} />
              <YAxis dataKey="state" type="category" stroke="var(--text-muted)" tick={{ fontSize: 10 }} width={60} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={v => `$${v.toFixed(2)}`}
              />
              <Bar dataKey="total_profit" name="Lợi Nhuận" radius={[0,3,3,0]}
                fill="#8b5cf6"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Chi Tiết Nhu Cầu Tại Các Bang</div>
            <div className="card-subtitle">{filtered.length} bang đang hiển thị · Nhấn vào thẻ vùng để lọc</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['All', ...regions].map(r => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                style={{
                  padding: '4px 12px', borderRadius: 12, fontSize: 12, cursor: 'pointer',
                  border: `1px solid ${filter === r ? (regionColors[r] || 'var(--accent-blue)') : 'var(--border)'}`,
                  background: filter === r ? `${(regionColors[r] || '#3b82f6')}22` : 'transparent',
                  color: filter === r ? (regionColors[r] || 'var(--accent-blue)') : 'var(--text-secondary)',
                  fontWeight: filter === r ? 700 : 400,
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vùng (Region)</th>
                <th>Bang (State)</th>
                <th>Doanh Thu</th>
                <th>SL Đã Bán</th>
                <th>Lợi Nhuận</th>
                <th>Số Đơn Hàng</th>
                <th>Biên Lợi Nhuận TB</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i}>
                  <td>
                    <span className="badge" style={{
                      background: `${regionColors[row.region]}22`,
                      color: regionColors[row.region],
                      border: `1px solid ${regionColors[row.region]}44`,
                    }}>
                      {row.region}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{row.state}</td>
                  <td>${row.total_sales.toLocaleString()}</td>
                  <td>{row.total_qty}</td>
                  <td style={{ color: row.total_profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                    ${row.total_profit.toFixed(0)}
                  </td>
                  <td>{row.order_count}</td>
                  <td>{getMarginBadge(row.avg_margin_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
