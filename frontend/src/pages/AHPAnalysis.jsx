import React, { useState, useMemo } from 'react'
import { CheckCircle, AlertTriangle } from 'lucide-react'

// Random Index cho số lượng tiêu chí n
const RI = { 1: 0, 2: 0, 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45 }

export default function AHPAnalysis() {
  const criteria = ['Tốc độ bán hàng', 'Tỷ suất lợi nhuận', 'Mức độ biến động', 'Rủi ro lưu kho']
  const n = criteria.length

  // Khởi tạo ma trận so sánh cặp mang giá trị mặc định (1)
  const initialMatrix = Array(n).fill(null).map(() => Array(n).fill(1))
  
  // Thiết lập một vài giá trị để minh họa
  initialMatrix[0][1] = 3;  initialMatrix[1][0] = 1/3; // Tốc độ tốt hơn Lợi nhuận một chút
  initialMatrix[0][2] = 5;  initialMatrix[2][0] = 1/5; // Tốc độ tốt hơn Biến động nhiều
  initialMatrix[0][3] = 7;  initialMatrix[3][0] = 1/7; // Tốc độ tốt hơn Rủi ro rất nhiều
  initialMatrix[1][2] = 2;  initialMatrix[2][1] = 1/2; // Lợi nhuận tốt hơn Biến động
  initialMatrix[1][3] = 4;  initialMatrix[3][1] = 1/4; // Lợi nhuận tốt hơn Rủi ro
  initialMatrix[2][3] = 2;  initialMatrix[3][2] = 1/2; // Biến động tốt hơn Rủi ro

  const [matrix, setMatrix] = useState(initialMatrix)

  // Hàm tính toán AHP
  const ahpResult = useMemo(() => {
    // 1. Tính tổng các cột
    const colSums = Array(n).fill(0)
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) colSums[j] += matrix[i][j]
    }

    // 2. Chuẩn hóa ma trận và tính trọng số (Eigenvector)
    const normalized = Array(n).fill(null).map(() => Array(n).fill(0))
    const weights = Array(n).fill(0)

    for (let i = 0; i < n; i++) {
      let rowSum = 0
      for (let j = 0; j < n; j++) {
        normalized[i][j] = matrix[i][j] / colSums[j]
        rowSum += normalized[i][j]
      }
      weights[i] = rowSum / n
    }

    // 3. Đo lường tỷ số nhất quán (Consistency Ratio)
    let lambdaMax = 0
    for (let i = 0; i < n; i++) {
      let aw = 0
      for (let j = 0; j < n; j++) {
        aw += matrix[i][j] * weights[j]
      }
      lambdaMax += aw / weights[i]
    }
    lambdaMax = lambdaMax / n

    const CI = (lambdaMax - n) / (n - 1) || 0
    const CR = n > 2 ? CI / RI[n] : 0

    return { weights, normalized, CI, CR, lambdaMax }
  }, [matrix, n])

  const handleMatrixChange = (i, j, val) => {
    const newVol = parseFloat(val) || 1
    const newMatrix = [...matrix.map(row => [...row])]
    newMatrix[i][j] = newVol
    newMatrix[j][i] = 1 / newVol
    setMatrix(newMatrix)
  }

  const { weights, CR } = ahpResult

  return (
    <div>
      <div className="page-header">
        <h1>Ma Trận AHP & Trọng Số Quyết Định</h1>
        <p>Quá trình Phân tích Cấp bậc (Analytic Hierarchy Process) giúp đánh giá độ quan trọng của các tiêu chí kinh doanh.</p>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Ma Trận So Sánh Cặp</div>
              <div className="card-subtitle">So sánh mức độ quan trọng giữa các yếu tố (Thang điểm 1-9)</div>
            </div>
            <span className="card-badge">Đầu vào</span>
          </div>
          <table className="data-table" style={{ background: 'var(--bg-secondary)', borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr>
                <th>Tiêu chí</th>
                {criteria.map(c => <th key={c} style={{textAlign:'center'}}>{c.split(' ')[1]}</th>)}
              </tr>
            </thead>
            <tbody>
              {criteria.map((ci, i) => (
                <tr key={ci}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ci}</td>
                  {criteria.map((cj, j) => (
                    <td key={cj} style={{ padding: '8px', textAlign:'center' }}>
                      {i === j ? (
                        <span style={{ color: 'var(--text-muted)' }}>1</span>
                      ) : i < j ? (
                        <select
                          value={matrix[i][j] >= 1 ? matrix[i][j].toFixed(0) : (1/matrix[i][j]).toFixed(0) * -1}
                          onChange={(e) => {
                            const v = parseInt(e.target.value)
                            const realVal = v > 0 ? v : 1 / Math.abs(v)
                            handleMatrixChange(i, j, realVal)
                          }}
                          style={{
                            background: 'var(--bg-primary)', border: '1px solid var(--border)',
                            color: 'var(--text-primary)', padding: '4px 8px', borderRadius: 4, width: '100%'
                          }}
                        >
                          <option value="9">9 (Rất rất quan trọng hơn)</option>
                          <option value="7">7 (Rất quan trọng hơn)</option>
                          <option value="5">5 (Quan trọng hơn)</option>
                          <option value="3">3 (Hơi quan trọng hơn)</option>
                          <option value="1">1 (Quan trọng như nhau)</option>
                          <option value="-3">1/3 (Kém quan trọng hơn 1 chút)</option>
                          <option value="-5">1/5 (Kém quan trọng hơn)</option>
                          <option value="-7">1/7 (Rất kém quan trọng hơn)</option>
                          <option value="-9">1/9 (Cực kỳ kém quan trọng)</option>
                        </select>
                      ) : (
                        <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                          {matrix[i][j] % 1 === 0 ? matrix[i][j] : `1/${Math.round(1/matrix[i][j])}`}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Kết Quả Trọng Số (Weights)</div>
              <div className="card-subtitle">Phân bổ ảnh hưởng của từng tiêu chí vào mô hình</div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: CR < 0.1 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              padding: '6px 12px', borderRadius: 20,
              color: CR < 0.1 ? 'var(--accent-green)' : 'var(--accent-red)',
              fontSize: 12, fontWeight: 700
            }}>
              {CR < 0.1 ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              CR = {CR.toFixed(3)} {CR < 0.1 ? '(Nhất quán)' : '(Thiếu nhất quán!)'}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {criteria.map((c, i) => {
              const weightPct = weights[i] * 100
              return (
                <div key={c}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{c}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-blue)' }}>
                      {weightPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="gauge-bar" style={{ height: 10 }}>
                    <div
                      className="gauge-fill"
                      style={{
                        width: `${weightPct}%`,
                        background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))'
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="alert-banner info" style={{ marginTop: 24, fontSize: 12 }}>
            💡 Trọng số này sẽ được ứng dụng trực tiếp vào cấu trúc đánh giá rủi ro và xác định độ ưu tiên nhập hàng (Reorder Recommendations) trong mô hình XGBoost.
          </div>
        </div>
      </div>
    </div>
  )
}
