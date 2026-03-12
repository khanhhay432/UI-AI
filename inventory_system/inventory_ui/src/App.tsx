import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, TrendingUp, AlertTriangle, CheckCircle, Database, Server, RefreshCw } from 'lucide-react';

const API_URL = "http://localhost:8000";

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Data for add feature
  const [formData, setFormData] = useState({
    name: '', current_stock: 10, lead_time_days: 7, holding_cost: 1.0
  });

  // AI Recommendation State
  const [selectedProduct, setSelectedProduct] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/products/`);
      setProducts(res.data);
      if (res.data.length > 0 && !selectedProduct) {
        setSelectedProduct(res.data[0].id.toString());
      }
    } catch (error) {
      console.error("Error connecting to API", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/products/`, formData);
      alert('Đã lưu sản phẩm thành công!');
      setFormData({ name: '', current_stock: 10, lead_time_days: 7, holding_cost: 1.0 });
      fetchProducts();
    } catch (error) {
      alert('Lỗi: Không thể kết nối tới server Backend.');
    }
  };

  const getAIRecommendation = async () => {
    if (!selectedProduct) return;
    try {
      setIsAnalyzing(true);
      const res = await axios.get(`${API_URL}/recommend/${selectedProduct}`);
      setAiResult(res.data);
    } catch (error) {
      alert("Lỗi truy xuất AI Models.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col h-screen sticky top-0">
        <div className="flex items-center gap-3 text-indigo-700 font-bold text-xl mb-10">
          <Database className="w-6 h-6" />
          <span>Vercel Deploy UI</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          {['overview', 'inventory', 'ai'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-3
                ${activeTab === tab ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-100 border-l-4 border-transparent'}`}
            >
              {tab === 'overview' && <Server className="w-5 h-5"/>}
              {tab === 'inventory' && <Package className="w-5 h-5"/>}
              {tab === 'ai' && <TrendingUp className="w-5 h-5"/>}
              
              {tab === 'overview' && 'Tổng quan Hệ thống'}
              {tab === 'inventory' && 'Quản lý Kho hàng'}
              {tab === 'ai' && 'AI Phân tích nhu cầu'}
            </button>
          ))}
        </nav>
        
        <div className="mt-auto p-4 bg-slate-100 rounded-lg text-xs justify-center items-center flex gap-2 text-slate-500">
           <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Dịch vụ đang chạy
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto w-full">
        {activeTab === 'overview' && (
          <div className="max-w-5xl mx-auto animation-fade-in">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Tổng quan Hệ thống</h1>
            <p className="text-slate-500 mb-8">Ứng dụng giao diện web độc lập (React/Vite). Sẵn sàng deploy lên nền tảng Vercel.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-slate-500 font-medium mb-2">Tổng sản phẩm lưu trữ</span>
                <span className="text-3xl font-bold text-slate-800">{products.length} <span className="text-sm font-normal text-slate-400">loại</span></span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-slate-500 font-medium mb-2">Lệnh nhập kho chờ duyệt</span>
                <span className="text-3xl font-bold text-indigo-600">-- <span className="text-sm font-normal text-slate-400">lệnh</span></span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-slate-500 font-medium mb-2">Trạng thái Máy chủ API</span>
                <span className="text-3xl font-bold text-emerald-600 flex items-center gap-2">OK <Server className="w-6 h-6"/></span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="max-w-5xl mx-auto animation-fade-in">
            <h1 className="text-3xl font-bold text-slate-800 mb-8">Quản lý Kho hàng</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Add form */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-max">
                <h2 className="text-xl font-bold mb-6 text-slate-800">Khai báo Thuộc tính</h2>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Tên sản phẩm / Danh mục</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Tồn kho khả dụng (cái)</label>
                    <input type="number" required value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Thời gian chờ (ngày)</label>
                      <input type="number" required value={formData.lead_time_days} onChange={e => setFormData({...formData, lead_time_days: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Khấu hao ($)</label>
                      <input type="number" step="0.1" required value={formData.holding_cost} onChange={e => setFormData({...formData, holding_cost: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors mt-4">
                    Đẩy dữ liệu lên Server
                  </button>
                </form>
              </div>

              {/* Data Table */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-800">Dữ liệu lưu trữ ({products.length})</h2>
                  <button onClick={fetchProducts} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="overflow-x-auto pb-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-medium text-sm border-b border-slate-200">
                        <th className="px-6 py-4">Mã SP</th>
                        <th className="px-6 py-4">Tên nghiệp vụ</th>
                        <th className="px-6 py-4">Tồn khả dụng</th>
                        <th className="px-6 py-4">Lead Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="px-6 py-4 text-slate-400">#{p.id}</td>
                          <td className="px-6 py-4 font-medium">{p.name}</td>
                          <td className="px-6 py-4 text-slate-600">{p.current_stock} pcs</td>
                          <td className="px-6 py-4 text-slate-600">{p.lead_time_days} days</td>
                        </tr>
                      ))}
                      {products.length === 0 && !loading && (
                        <tr><td colSpan={4} className="text-center py-10 text-slate-400">Chưa có dữ liệu.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="max-w-4xl mx-auto animation-fade-in">
             <h1 className="text-3xl font-bold text-slate-800 mb-2">Trí tuệ Nhân tạo - Phân tích Chiến lược</h1>
             <p className="text-slate-500 mb-8">Truy xuất dữ liệu XGBoost Cloud API để cân nhắc rủi ro về tồn kho đối với từng sản phẩm.</p>
             
             <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Chỉ định thuộc tính / Danh mục cần kiểm tra</label>
                  <div className="flex gap-4">
                    <select 
                      value={selectedProduct} 
                      onChange={e => setSelectedProduct(e.target.value)}
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>[Mã: {p.id}] {p.name} (Tồn hiện tại: {p.current_stock})</option>
                      ))}
                    </select>
                    <button 
                      onClick={getAIRecommendation}
                      disabled={isAnalyzing || !selectedProduct}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-medium px-6 py-3 rounded-lg flex gap-2 items-center transition-opacity disabled:opacity-50"
                    >
                      {isAnalyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                      Bắt đầu Xử lý XGBoost
                    </button>
                  </div>
                </div>

                {/* Status Board */}
                {aiResult && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 text-sm font-bold text-slate-600 flex justify-between">
                      <span>BÁO CÁO PHÂN TÍCH RỦI RO</span>
                      <span>Product: {aiResult.product_name}</span>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-slate-500 font-medium mb-1">Mức cầu dự kiến trong đợt giao tiếp theo:</p>
                        <p className="text-3xl font-bold text-slate-800 mb-6">{aiResult.predicted_demand} <span className="text-lg font-normal text-slate-400">cái</span></p>
                        
                        <p className="text-slate-500 font-medium mb-1">Số lượng hàng hóa cấp bách cần nhập:</p>
                        <p className={`text-4xl font-bold ${aiResult.recommended_order_quantity > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                           +{aiResult.recommended_order_quantity} <span className="text-lg font-normal opacity-70">kiện</span>
                        </p>
                      </div>

                      <div className={`p-6 rounded-xl flex items-start gap-4 ${aiResult.recommended_order_quantity > 0 ? "bg-rose-50 border border-rose-100" : "bg-emerald-50 border border-emerald-100"}`}>
                         {aiResult.recommended_order_quantity > 0 ? (
                           <AlertTriangle className="w-8 h-8 text-rose-500 flex-shrink-0" />
                         ) : (
                           <CheckCircle className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                         )}
                         <div>
                            <h3 className={`font-bold text-lg mb-2 ${aiResult.recommended_order_quantity > 0 ? "text-rose-800" : "text-emerald-800"}`}>
                              {aiResult.status}
                            </h3>
                            <p className={`text-sm leading-relaxed ${aiResult.recommended_order_quantity > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                              {aiResult.recommended_order_quantity > 0 
                                ? `Trữ lượng tồn kho khả dụng hiện đang thấp hơn mức rủi ro an toàn cho phép. Hệ thống AI đề nghị xuất ngay 1 lệnh nhập số lượng bổ sung là ${aiResult.recommended_order_quantity} sản phẩm!`
                                : `Mức tồn trữ hiện tại thỏa mãn tiêu chuẩn an toàn cung ứng. Không phát sinh rủi ro, không cần đặt hàng bổ sung trong đợt này.`}
                            </p>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}
      </main>

      <style>{`
        .animation-fade-in {
           animation: fadeIn 0.4s ease-in-out;
        }
        @keyframes fadeIn {
           0% { opacity: 0; transform: translateY(10px); }
           100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
