# Nền Tảng AI Quản Lý & Tối Ưu Hàng Tồn Kho (InventIQ) 🚀

Dự án này là một HỆ THỐNG QUẢN LÝ TỒN KHO THÔNG MINH mô phỏng quy mô của các tập đoàn e-commerce lớn (như Amazon). Hệ thống tích hợp các thuật toán Machine Learning (**XGBoost**, **Isolation Forest**) và **Ma trận AHP** để dự báo nhu cầu, đề xuất đặt hàng lại và phát hiện các rủi ro thua lỗ từ dữ liệu bán hàng.

## 🌟 Các Tính Năng Chính
- **Bảng Điều Khiển (Dashboard):** Theo dõi tổng quan doanh thu, lợi nhuận, và trạng thái các mặt hàng rủi ro.
- **Phân Tích Nhu Cầu Từng Khu Vực:** Phân bổ doanh số và biên lợi nhuận theo từng vùng và tiểu bang.
- **Đề Xuất Hàng Tồn Kho (AI Reorder):** Ứng dụng mô hình **XGBoost** để đề xuất số lượng nhập hàng bổ sung kèm theo thang đo độ tự tin.
- **Phân Tích Rủi Ro Lợi Nhuận:** Ứng dụng **Isolation Forest** để tìm ra các sản phẩm lạm dụng giảm giá hoặc chậm luân chuyển.
- **Đánh Giá Đa Tiêu Chí (Ma Trận AHP):** Sử dụng hệ thống tính toán AHP để định lượng các chỉ số kinh doanh.

---

## 💻 Hướng Dẫn Cài Đặt và Khởi Chạy

Dự án này bao gồm hai khối chính: **Backend (Python)** và **Frontend (React/Vite)**. Để chạy được trên máy của bạn, cần đáp ứng các yêu cầu sau:

### Yêu Cầu Hệ Thống (Prerequisites)
1. Cài đặt [Python 3.10 trở lên](https://www.python.org/downloads/)
2. Cài đặt [Node.js (LTS version)](https://nodejs.org/)

---

### Bước 1: Khởi động Backend (FastAPI / Machine Learning)

Mở **Terminal** (hoặc Command Prompt / PowerShell), di chuyển tới thư mục gốc của dự án (`/AI`) và thực hiện các lệnh sau:

```bash
# Trỏ vào thư mục dự án
cd "đường-dẫn-tới-thư-mục-của-bạn/AI"

# Cài đặt các thư viện Python theo chuẩn cấu hình được tạo sẵn
pip install -r backend/requirements.txt

# Khởi động máy chủ Server
uvicorn backend.main:app --reload --port 8000
```
*Lưu ý: Bạn có thể xem toàn bộ hệ thống tài liệu API ở địa chỉ URL: `http://localhost:8000/docs` (sau khi server chạy thành công).*

---

### Bước 2: Khởi động Frontend (React / Vite)

Mở một cửa sổ **Terminal mới** (không đóng cái số 1), tiếp tục trỏ tới thư mục `frontend` của dự án:

```bash
# Từ thư mục gốc, đi vào thư mục frontend
cd "đường-dẫn-tới-thư-mục-của-bạn/AI/frontend"

# Cài đặt các dependencies cho React
npm install

# Khởi động Giao Diện Người Dùng (UI Server)
npm run dev
```

---

### Bước 3: Trải nghiệm Hệ Thống
Sau khi bạn đã khởi chạy được cả Backend và Frontend, mở trình duyệt web lên (Chrome, Edge, Safari, v.v...) và truy cập:

👉 **http://localhost:5173**

---

## 📂 Kiến trúc Thư Mục (Project Structure)
Dự án được phân bổ dựa trên mô hình Clean Architecture kết hợp MLOps:

```text
├── ai_engine/           # (Models) Các model học máy (XGBoost, Isolation Forest)
├── backend/             # (FastAPI) Toàn bộ API, định tuyến, phân mảnh schema 
├── data/                # Dataset đầu vào (.csv)
├── data_pipeline/       # Hệ thống ETL (trích xuất, làm sạch, kỹ thuật tính năng)
├── deployment/          # File triển khai Docker, Vercel, Render
├── frontend/            # Giao diện người dùng (React, Vite, Recharts)
├── mlops/               # Các cơ chế lập trình lịch trình (APScheduler) và retraining model
└── database/            # Schema và cơ cấu bảng (Postgres SQL)
```

## 🛠 Tech Stack
- **Data & AI:** Pandas, Scikit-learn, XGBoost, Numpy
- **Backend:** FastAPI, Pydantic, Uvicorn (Phát triển nội bộ với tốc độ cao)
- **Frontend:** React, Vite, Lucide-React, Recharts (Giao diện chuẩn Dark-Mode)
