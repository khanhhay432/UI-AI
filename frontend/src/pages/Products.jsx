import React, { useState } from 'react'
import { Package, Search } from 'lucide-react'

const PRODUCTS = [
  { product_id:'FUR-BO-10001798', product_name:'Bush Somerset Collection Bookcase', category:'Furniture', sub_category:'Bookcases', total_sales:523.92, total_qty:3, total_profit:83.82, avg_margin:0.16, avg_discount:0.0, order_count:2, velocity_score:0.41, risk_flags:'SLOW_MOVER', risk_score:30 },
  { product_id:'FUR-CH-10000454', product_name:'Hon Deluxe Fabric Stacking Chairs', category:'Furniture', sub_category:'Chairs', total_sales:731.94, total_qty:3, total_profit:219.58, avg_margin:0.30, avg_discount:0.0, order_count:1, velocity_score:0.30, risk_flags:'SLOW_MOVER', risk_score:30 },
  { product_id:'OFF-LA-10000240', product_name:'Self-Adhesive Address Labels', category:'Office Supplies', sub_category:'Labels', total_sales:14.62, total_qty:2, total_profit:6.87, avg_margin:0.47, avg_discount:0.0, order_count:1, velocity_score:0.11, risk_flags:'SLOW_MOVER', risk_score:30 },
  { product_id:'FUR-TA-10000577', product_name:'Bretford CR4500 Rectangular Table', category:'Furniture', sub_category:'Tables', total_sales:957.58, total_qty:5, total_profit:-383.03, avg_margin:-0.40, avg_discount:0.45, order_count:1, velocity_score:0.44, risk_flags:'UNPROFITABLE, OVER_DISCOUNTED', risk_score:100 },
  { product_id:'OFF-ST-10000760', product_name:'Eldon Fold N Roll Cart System', category:'Office Supplies', sub_category:'Storage', total_sales:22.37, total_qty:2, total_profit:2.52, avg_margin:0.11, avg_discount:0.20, order_count:1, velocity_score:0.12, risk_flags:'SLOW_MOVER', risk_score:30 },
  { product_id:'TEC-PH-10002275', product_name:'Moto E (2nd Generation)', category:'Technology', sub_category:'Phones', total_sales:907.15, total_qty:6, total_profit:90.72, avg_margin:0.10, avg_discount:0.20, order_count:1, velocity_score:0.51, risk_flags:'SLOW_MOVER', risk_score:30 },
  { product_id:'TEC-PH-10000169', product_name:'Apple iPhone 12', category:'Technology', sub_category:'Phones', total_sales:4399.96, total_qty:16, total_profit:1319.96, avg_margin:0.30, avg_discount:0.0, order_count:4, velocity_score:0.90, risk_flags:'OK', risk_score:0 },
  { product_id:'TEC-AC-10004061', product_name:'Logitech MX Master Mouse', category:'Technology', sub_category:'Accessories', total_sales:299.85, total_qty:9, total_profit:89.97, avg_margin:0.30, avg_discount:0.0, order_count:3, velocity_score:0.72, risk_flags:'OK', risk_score:0 },
  { product_id:'TEC-PH-10001530', product_name:'Motorola Smart Phone', category:'Technology', sub_category:'Phones', total_sales:2484.87, total_qty:7, total_profit:1148.90, avg_margin:0.46, avg_discount:0.0, order_count:1, velocity_score:0.62, risk_flags:'SLOW_MOVER', risk_score:30 },
  { product_id:'TEC-PH-10004093', product_name:'Samsung Galaxy S7', category:'Technology', sub_category:'Phones', total_sales:899.95, total_qty:3, total_profit:269.99, avg_margin:0.30, avg_discount:0.0, order_count:1, velocity_score:0.30, risk_flags:'SLOW_MOVER', risk_score:30 },
  { product_id:'FUR-CH-10000777', product_name:'Global Leather Mid-Back Chair', category:'Furniture', sub_category:'Chairs', total_sales:1819.98, total_qty:6, total_profit:727.99, avg_margin:0.40, avg_discount:0.0, order_count:1, velocity_score:0.55, risk_flags:'SLOW_MOVER', risk_score:30 },
  { product_id:'OFF-BI-10004654', product_name:'GBC DocuBind TL300 Electric Binder', category:'Office Supplies', sub_category:'Binders', total_sales:3434.72, total_qty:2, total_profit:-584.85, avg_margin:-0.17, avg_discount:0.0, order_count:1, velocity_score:0.22, risk_flags:'UNPROFITABLE', risk_score:80 },
  { product_id:'TEC-CO-10004722', product_name:'HP LaserJet 3310 Copier', category:'Technology', sub_category:'Copiers', total_sales:3449.99, total_qty:8, total_profit:1379.99, avg_margin:0.40, avg_discount:0.0, order_count:1, velocity_score:0.70, risk_flags:'SLOW_MOVER', risk_score:30 },
  { product_id:'TEC-PH-10003988', product_name:'Apple iPhone 13 Pro', category:'Technology', sub_category:'Phones', total_sales:7799.94, total_qty:24, total_profit:2339.94, avg_margin:0.30, avg_discount:0.0, order_count:3, velocity_score:0.95, risk_flags:'OK', risk_score:0 },
  { product_id:'TEC-PH-10003965', product_name:'Apple iPhone 14', category:'Technology', sub_category:'Phones', total_sales:8399.93, total_qty:21, total_profit:2519.93, avg_margin:0.30, avg_discount:0.0, order_count:3, velocity_score:0.98, risk_flags:'OK', risk_score:0 },
  { product_id:'TEC-AC-10002167', product_name:'Apple AirPods Pro', category:'Technology', sub_category:'Accessories', total_sales:999.96, total_qty:8, total_profit:299.96, avg_margin:0.30, avg_discount:0.0, order_count:2, velocity_score:0.68, risk_flags:'OK', risk_score:0 },
  { product_id:'OFF-AP-10002311', product_name:'Holmes Air Purifier Filter', category:'Office Supplies', sub_category:'Appliances', total_sales:68.81, total_qty:5, total_profit:-123.86, avg_margin:-1.80, avg_discount:0.80, order_count:1, velocity_score:0.25, risk_flags:'UNPROFITABLE, OVER_DISCOUNTED', risk_score:100 },
  { product_id:'CA-2023-139536', product_name:'Brother MFC-9970CDW Printer', category:'Technology', sub_category:'Copiers', total_sales:3999.99, total_qty:2, total_profit:-199.98, avg_margin:-0.05, avg_discount:0.20, order_count:1, velocity_score:0.22, risk_flags:'UNPROFITABLE, OVER_DISCOUNTED', risk_score:70 },
  { product_id:'TEC-PH-10004545', product_name:'Google Pixel 7', category:'Technology', sub_category:'Phones', total_sales:699.99, total_qty:3, total_profit:209.99, avg_margin:0.30, avg_discount:0.0, order_count:1, velocity_score:0.30, risk_flags:'SLOW_MOVER', risk_score:30 },
  { product_id:'TEC-AC-10003291', product_name:'Dell Thunderbolt Dock WD19TBS', category:'Technology', sub_category:'Accessories', total_sales:299.99, total_qty:2, total_profit:89.99, avg_margin:0.30, avg_discount:0.0, order_count:1, velocity_score:0.22, risk_flags:'SLOW_MOVER', risk_score:30 },
]

const riskColor = s => s >= 70 ? '#ef4444' : s >= 30 ? '#f59e0b' : '#10b981'
const riskBadge = flags => {
  if (flags === 'OK') return <span className="badge badge-green">OK</span>
  if (flags.includes('UNPROFITABLE')) return <span className="badge badge-red">RISK</span>
  return <span className="badge badge-amber">WATCH</span>
}

export default function Products() {
  const [search, setSearch]   = useState('')
  const [catFilter, setCat]   = useState('All')

  const categories = ['All', ...new Set(PRODUCTS.map(p => p.category))]

  const filtered = PRODUCTS.filter(p => {
    const matchSearch = p.product_name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = catFilter === 'All' || p.category === catFilter
    return matchSearch && matchCat
  })

  return (
    <div>
      <div className="page-header">
        <h1>Danh Mục Sản Phẩm</h1>
        <p>Chi tiết hiệu suất, tỷ số tốc độ bán và cảnh báo rủi ro AI cho {PRODUCTS.length} sản phẩm</p>
      </div>

      {/* Summary strip */}
      <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        {[
          { label:'Tổng Sản Phẩm', value: PRODUCTS.length, color:'var(--accent-blue)' },
          { label:'Khỏe Mạnh',        value: PRODUCTS.filter(p=>p.risk_flags==='OK').length, color:'var(--accent-green)' },
          { label:'Cần Chú Ý',          value: PRODUCTS.filter(p=>p.risk_flags.includes('SLOW_MOVER') && !p.risk_flags.includes('UNPROFITABLE')).length, color:'var(--accent-amber)' },
          { label:'Rủi Ro',        value: PRODUCTS.filter(p=>p.risk_flags.includes('UNPROFITABLE')).length, color:'var(--accent-red)' },
        ].map(k => (
          <div key={k.label} style={{
            background:'var(--bg-card)', border:'1px solid var(--border)',
            borderRadius:'var(--radius-md)', padding:'14px 20px',
            display:'flex', flexDirection:'column', gap:4, minWidth:130,
          }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px' }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            style={{
              width:'100%', padding:'8px 12px 8px 34px',
              background:'var(--bg-card)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-sm)', color:'var(--text-primary)', fontSize:13,
              outline:'none',
            }}
          />
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding:'6px 14px', borderRadius:20, fontSize:12, cursor:'pointer',
              border:`1px solid ${catFilter===c ? 'var(--accent-blue)' : 'var(--border)'}`,
              background: catFilter===c ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: catFilter===c ? 'var(--accent-blue)' : 'var(--text-secondary)',
              fontWeight: catFilter===c ? 700 : 400,
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Danh Sách Sản Phẩm</div>
            <div className="card-subtitle">{filtered.length} kết quả</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-muted)' }}>
            <Package size={14} /> {filtered.length} / {PRODUCTS.length}
          </div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Sản Phẩm</th>
                <th>Danh Mục</th>
                <th>Doanh Thu</th>
                <th>SL</th>
                <th>Lợi Nhuận</th>
                <th>Biên LN</th>
                <th>Giảm Giá</th>
                <th>Tốc Độ Bán</th>
                <th>Trạng Thái</th>
                <th>Điểm Rủi Ro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={i}>
                  <td style={{ maxWidth:180 }}>
                    <div style={{ color:'var(--text-primary)', fontWeight:500, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.product_name}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>{p.product_id}</div>
                  </td>
                  <td>
                    <span className={`badge ${p.category === 'Technology' ? 'badge-blue' : p.category === 'Furniture' ? 'badge-purple' : 'badge-gray'}`}>
                      {p.category.split(' ')[0]}
                    </span>
                  </td>
                  <td style={{ fontWeight:600, color:'var(--text-primary)' }}>${p.total_sales.toFixed(0)}</td>
                  <td>{p.total_qty}</td>
                  <td style={{ color: p.total_profit < 0 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight:600 }}>
                    ${p.total_profit.toFixed(0)}
                  </td>
                  <td style={{ color: p.avg_margin < 0 ? 'var(--accent-red)': p.avg_margin < 0.1 ? 'var(--accent-amber)' : 'var(--text-primary)', fontWeight:600 }}>
                    {(p.avg_margin*100).toFixed(1)}%
                  </td>
                  <td>{(p.avg_discount*100).toFixed(0)}%</td>
                  <td>
                    <div className="gauge-bar" style={{ width:60 }}>
                      <div className="gauge-fill" style={{ width:`${p.velocity_score*100}%`, background:'var(--accent-blue)' }} />
                    </div>
                    <span style={{ fontSize:10, color:'var(--text-muted)' }}>{(p.velocity_score*100).toFixed(0)}%</span>
                  </td>
                  <td>{riskBadge(p.risk_flags)}</td>
                  <td>
                    <span style={{ fontSize:13, fontWeight:700, color:riskColor(p.risk_score) }}>{p.risk_score}</span>
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
