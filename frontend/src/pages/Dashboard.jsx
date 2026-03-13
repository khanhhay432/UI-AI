import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts'
import { DollarSign, ShoppingBag, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

// ── Mock data (mirrors real API response shape) ────────────────────────────
const MOCK_METRICS = {
  total_revenue: 42871.43,
  total_profit:  13208.67,
  total_orders:  52,
  total_products: 48,
  avg_profit_margin_pct: 26.8,
  avg_discount_pct: 8.4,
  high_risk_products: 6,
  pending_reorders: 8,
  sales_trend: [
    { period: '2019-10', revenue: 980 },
    { period: '2019-11', revenue: 1240 },
    { period: '2020-04', revenue: 410 },
    { period: '2020-06', revenue: 1320 },
    { period: '2020-08', revenue: 2590 },
    { period: '2020-11', revenue: 3102 },
    { period: '2020-12', revenue: 1876 },
    { period: '2021-01', revenue: 5864 },
    { period: '2021-03', revenue: 1554 },
    { period: '2021-09', revenue: 882 },
    { period: '2021-11', revenue: 2719 },
    { period: '2022-03', revenue: 1143 },
    { period: '2022-06', revenue: 1036 },
    { period: '2022-07', revenue: 705 },
    { period: '2022-08', revenue: 1138 },
    { period: '2022-10', revenue: 4475 },
    { period: '2022-12', revenue: 397 },
    { period: '2023-02', revenue: 1449 },
    { period: '2023-04', revenue: 4054 },
    { period: '2023-06', revenue: 1709 },
    { period: '2023-07', revenue: 262 },
    { period: '2023-09', revenue: 2289 },
    { period: '2023-10', revenue: 185 },
    { period: '2023-11', revenue: 2029 },
  ],
  top_products: [
    { product_name: 'Apple iPhone 14', revenue: 8399.93, profit: 2519.93, margin: 0.30 },
    { product_name: 'Samsung Galaxy S7', revenue: 899.95, profit: 269.99, margin: 0.30 },
    { product_name: 'Motorola Smart Phone', revenue: 2484.87, profit: 1148.90, margin: 0.46 },
    { product_name: 'Google Pixel 7', revenue: 699.99, profit: 209.99, margin: 0.30 },
    { product_name: 'Hewlett Packard Copier', revenue: 3449.99, profit: 1379.99, margin: 0.40 },
    { product_name: 'GBC DocuBind TL300', revenue: 3434.72, profit: -584.85, margin: -0.17 },
    { product_name: 'Chromcraft Tables', revenue: 1706.18, profit: 85.31, margin: 0.05 },
    { product_name: 'Canon imageCLASS', revenue: 1999.96, profit: 599.96, margin: 0.30 },
  ]
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="label">{label}</div>
        {payload.map((p, i) => (
          <div key={i} className="value" style={{ color: p.color }}>
            {p.name}: ${p.value?.toLocaleString()}
          </div>
        ))}
      </div>
    )
  }
  return null
}

const KPICard = ({ label, value, sub, delta, icon, accent }) => (
  <div className="kpi-card" style={{ '--card-accent': accent }}>
    <div className="kpi-card-header">
      <div className="kpi-label">{label}</div>
      <div className="kpi-icon" style={{ background: `${accent.split(',')[0].replace('linear-gradient(135deg', '').trim()}22` }}>
        {icon}
      </div>
    </div>
    <div className="kpi-value">{value}</div>
    <div className="kpi-sub">
      {delta !== undefined && (
        <span className={`kpi-delta ${delta >= 0 ? 'positive' : 'negative'}`}>
          {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(delta)}%
        </span>
      )}
      <span>{sub}</span>
    </div>
  </div>
)

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In production this calls: GET /dashboard/metrics
    setTimeout(() => {
      setData(MOCK_METRICS)
      setLoading(false)
    }, 800)
  }, [])

  if (loading) return (
    <div className="loading-container">
      <div className="spinner" />
      <span style={{ color: 'var(--text-secondary)' }}>Đang tải dữ liệu trí tuệ phân tích...</span>
    </div>
  )

  const { total_revenue, total_profit, total_orders, total_products,
          avg_profit_margin_pct, avg_discount_pct, high_risk_products,
          pending_reorders, sales_trend, top_products } = data

  const profitPct = ((total_profit / total_revenue) * 100).toFixed(1)

  return (
    <div>
      {/* Alerts */}
      {high_risk_products > 0 && (
        <div className="alert-banner warning">
          <AlertTriangle size={16} />
          <strong>{high_risk_products} sản phẩm rủi ro cao</strong> bị phát hiện — biên độ lợi nhuận cực kỳ thấp.
          Xem phần Phân Tích Lợi Nhuận để biết chi tiết.
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard
          label="Tổng Doanh Thu"
          value={`$${(total_revenue / 1000).toFixed(1)}K`}
          sub="Tất cả đơn hàng"
          delta={+12.4}
          accent="linear-gradient(135deg, #3b82f6, #06b6d4)"
          icon={<DollarSign size={16} color="#3b82f6" />}
        />
        <KPICard
          label="Tổng Lợi Nhuận"
          value={`$${(total_profit / 1000).toFixed(1)}K`}
          sub={`${profitPct}% tỷ suất lợi nhuận`}
          delta={+7.8}
          accent="linear-gradient(135deg, #10b981, #06b6d4)"
          icon={<TrendingUp size={16} color="#10b981" />}
        />
        <KPICard
          label="Tổng Đơn Hàng"
          value={total_orders.toLocaleString()}
          sub="Số lượng mã đơn"
          delta={+3.2}
          accent="linear-gradient(135deg, #8b5cf6, #3b82f6)"
          icon={<ShoppingBag size={16} color="#8b5cf6" />}
        />
        <KPICard
          label="Biên Lợi Nhuận TB"
          value={`${avg_profit_margin_pct}%`}
          sub={`${avg_discount_pct}% giảm giá TB`}
          delta={+1.1}
          accent="linear-gradient(135deg, #f59e0b, #ef4444)"
          icon={<Package size={16} color="#f59e0b" />}
        />
        <KPICard
          label="Sản Phẩm Rủi Ro"
          value={high_risk_products}
          sub="Cần xem xét ngay lập tức"
          delta={-2}
          accent="linear-gradient(135deg, #ef4444, #8b5cf6)"
          icon={<AlertTriangle size={16} color="#ef4444" />}
        />
        <KPICard
          label="Chờ Đặt Hàng Mới"
          value={pending_reorders}
          sub="Đề xuất từ AI"
          accent="linear-gradient(135deg, #06b6d4, #10b981)"
          icon={<Package size={16} color="#06b6d4" />}
        />
      </div>

      {/* Sales Trend Chart */}
      <div className="chart-grid-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Xu Hướng Doanh Thu</div>
              <div className="card-subtitle">Doanh số hàng tháng 2019–2023</div>
            </div>
            <span className="card-badge">Biểu Đồ Theo Thời Gian</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={sales_trend}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" stroke="var(--text-muted)" tick={{ fontSize: 10 }} interval={3} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(1)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#3b82f6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Tóm Tắt Chỉ Số</div>
              <div className="card-subtitle">Tổng quan nền tảng</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Doanh Thu',  val: `$${(total_revenue/1000).toFixed(1)}K`, color: '#3b82f6', pct: 100 },
              { label: 'Lợi Nhuận',   val: `$${(total_profit/1000).toFixed(1)}K`,  color: '#10b981', pct: parseFloat(profitPct) },
              { label: 'Biên Lợi Nhuận',   val: `${avg_profit_margin_pct}%`,            color: '#8b5cf6', pct: avg_profit_margin_pct },
              { label: 'Giảm Giá', val: `${avg_discount_pct}%`,                 color: '#f59e0b', pct: avg_discount_pct * 5 },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.val}</span>
                </div>
                <div className="gauge-bar">
                  <div
                    className="gauge-fill"
                    style={{ width: `${Math.min(item.pct, 100)}%`, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products Chart */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Sản Phẩm Đứng Đầu (Theo Doanh Thu)</div>
            <div className="card-subtitle">Doanh thu so với lợi nhuận</div>
          </div>
          <span className="card-badge">Biểu Đồ Cột</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={top_products} margin={{ right: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="product_name"
              stroke="var(--text-muted)"
              tick={{ fontSize: 10 }}
              tickFormatter={v => v.split(' ').slice(0,2).join(' ')}
            />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(1)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
            />
            <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[3,3,0,0]} />
            <Bar dataKey="profit"  name="Profit"  fill="#10b981" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
