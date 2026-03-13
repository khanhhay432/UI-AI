import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import TopHeader from './components/TopHeader'
import Dashboard from './pages/Dashboard'
import RegionalDemand from './pages/RegionalDemand'
import AIRecommendations from './pages/AIRecommendations'
import ProfitAnalysis from './pages/ProfitAnalysis'
import Products from './pages/Products'
import AHPAnalysis from './pages/AHPAnalysis'
import './index.css'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')

  const pageMap = {
    dashboard:   { component: <Dashboard />,        title: 'Bảng Điều Khiển (Dashboard)',   subtitle: 'Thông minh tồn kho theo thời gian thực' },
    products:    { component: <Products />,          title: 'Danh Mục Sản Phẩm',       subtitle: 'Chỉ số hiệu suất & đánh giá rủi ro' },
    regional:    { component: <RegionalDemand />,    title: 'Nhu Cầu Theo Khu Vực',       subtitle: 'Phân tích nhu cầu theo vị trí địa lý' },
    ai:          { component: <AIRecommendations />, title: 'Đề Xuất AI',    subtitle: 'Đề xuất đặt hàng thông minh bằng XGBoost' },
    profit:      { component: <ProfitAnalysis />,    title: 'Phân Tích Rủi Ro Lợi Nhuận',  subtitle: 'Đánh giá rủi ro tồn kho & tối ưu lợi nhuận' },
    ahp:         { component: <AHPAnalysis />,       title: 'Ma Trận AHP & Trọng Số',  subtitle: 'Đánh giá đa tiêu chí (Analytic Hierarchy Process)' },
  }

  const current = pageMap[activePage] || pageMap.dashboard

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="main-content">
        <TopHeader title={current.title} subtitle={current.subtitle} />
        <div className="page-container">
          {current.component}
        </div>
      </div>
    </div>
  )
}
