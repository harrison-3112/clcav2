# CloudMetrics (v1.5.0)

CloudMetrics là một ứng dụng máy tính (Desktop application) tiện lợi, kết hợp giữa **Node.js/Express backend** và **WebView2 wrapper (C# WinForms)**. Ứng dụng được thiết kế chuyên biệt để xử lý dữ liệu kiểm tra sản xuất, tổng hợp báo cáo lỗi trạm lắp ráp, truy xuất nhanh file log kiểm tra và tạo báo cáo hiệu suất (yield) hàng ngày của nhà máy.

---

## 🗺️ Kiến trúc Hệ thống (Architecture)

Ứng dụng bao gồm 3 lớp kiến trúc hoạt động phối hợp nhịp nhàng:

### 1. Desktop Host (C# WinForms + WebView2)
* **Tệp mã nguồn:** [ClcaDesktopHost.cs](file:///c:/Users/PC/Downloads/clca/desktop-host/ClcaDesktopHost.cs) biên dịch thành file thực thi `CloudMetrics.exe`.
* **Cơ chế khởi động:** Hiển thị màn hình chờ động (Splash Screen) mượt mà vẽ bằng thư viện đồ họa GDI+ cục bộ. Song song đó, ứng dụng chạy ẩn tiến trình Node.js (`server.js`) trên cổng mặc định `5000`. Khi giao diện Web gửi tín hiệu sẵn sàng (`clca-ui-ready`), màn hình chờ tự động mờ dần và ẩn đi.
* **COM Bridge (`clcaHost`):** Thiết lập một lớp cầu nối COM giữa JavaScript của WebView2 và C# Host. Cung cấp phương thức `BrowseSave` hoạt động trên luồng đơn STA (Single Threaded Apartment) để gọi hộp thoại lưu file hệ thống ("Save As" dialog) nguyên bản của Windows, cho phép lưu file báo cáo đầu ra trực tiếp về máy người dùng qua giao thức mạng cục bộ.
* **Quản lý vòng đời:** Kiểm soát Mutex ứng dụng để đảm bảo chạy duy nhất một instance (`CloudMetrics_SingleInstance_SLA_NPI`). Tự động dọn dẹp và kết thúc (Kill) tiến trình Node.js chạy ngầm khi đóng cửa sổ chính.

### 2. Backend (Node.js & Express Server)
* **Tệp đầu vào:** [server.js](file:///c:/Users/PC/Downloads/clca/server.js) đóng vai trò làm máy chủ API nội bộ.
* **Cơ chế routing:** Tự động đăng ký các endpoint nghiệp vụ tách biệt từ thư mục [routes/](file:///c:/Users/PC/Downloads/clca/routes).
* **Độ ổn định cao:** Cài đặt các bộ giám sát crash guards (`uncaughtException` và `unhandledRejection`) nhằm giữ máy chủ luôn hoạt động liên tục kể cả khi phát sinh lỗi ngoại lệ hoặc bất đồng bộ.
* **Hệ thống ghi log:** Sử dụng module ghi log tùy biến hỗ trợ xoay vòng tệp log (Log rotation) tự động (`cloudmetrics.log`) đặt trong thư mục `logs/` để kiểm soát dung lượng ổ cứng.

### 3. Frontend UI (Vanilla HTML/JS/CSS)
* **Thư mục tài nguyên:** Nằm tại thư mục [ui/](file:///c:/Users/PC/Downloads/clca/ui) ở root (chứa [index.html](file:///c:/Users/PC/Downloads/clca/ui/index.html), [app.js](file:///c:/Users/PC/Downloads/clca/ui/app.js) và [styles.css](file:///c:/Users/PC/Downloads/clca/ui/styles.css)).
* **Đặc điểm:** Thiết kế hiện đại, mượt mà với hiệu ứng chuyển đổi mờ (glassmorphism) và vi-hoạt ảnh (micro-animations). Tích hợp chế độ Dark Mode/Light Mode và chuyển ngữ Tiếng Anh/Tiếng Trung lưu trữ persistent trong `localStorage`.

---

## 📦 Chi tiết Các Phân hệ (Modules)

### 1. CLCA Generator (`clca`)
* **Chức năng:** Tổng hợp báo cáo kiểm tra lỗi trạm sản xuất dựa trên tệp Excel thô chứa 2 bảng dữ liệu bắt buộc là **Data** và **Detail**. Ứng dụng tự động ánh xạ cấu trúc cột dữ liệu lỗi, so khớp tên trạm và ghi vào biểu mẫu Excel định dạng sẵn tại [sample.xlsx](file:///c:/Users/PC/Downloads/clca/config/sample.xlsx).
* **Tính năng đặc biệt:** 
  * Ánh xạ thông tin mã vạch của khách hàng (Customer SN mapping) từ cột chỉ định trong Sheet Detail.
  * Tự động áp dụng các bộ quy tắc lọc theo cấu hình riêng cho từng trạm kiểm tra (Ví dụ: để trống cột SN hoặc Description đối với trạm `Leak Test01`).
  * Hỗ trợ xuất gộp báo cáo từ nhiều file Work Order (WO) khác nhau thành các Sheet Excel riêng biệt trong cùng một tệp kết quả.
* **Danh sách API:**
  * `POST /api/generate`: Tiếp nhận các tệp tin Excel tải lên để tiến hành kết xuất báo cáo CLCA đơn lẻ hoặc gộp.
  * `POST /api/clca/precheck`: Đọc nhanh và kiểm tra cấu trúc file Excel tải lên. Xác định các cột bị thiếu, kiểm tra các trạm được chọn có khớp với dữ liệu thực tế không trước khi thực hiện xuất báo cáo.
  * `POST /api/inspect-model` & `POST /api/inspect-stations`: Đọc tệp dữ liệu thô để phân tích nhanh tên Model hiện tại và danh sách các trạm test thực tế xuất hiện trong file Excel.

### 2. MES Daily Report (`mesdaily`)
* **Chức năng:** Lấy thông tin Yield và Defect trực tiếp từ máy chủ cơ sở dữ liệu MES qua MES API (`http://10.24.97.22/MES_API/api/MESApi/ApiAll`) để tự động tạo báo cáo hiệu suất RTY Daily & Defect Daily.
* **Tính năng đặc biệt:**
  * **Cơ chế phân đoạn ngày (Daily Chunks):** Do giới hạn hiệu năng của MES API đối với lượng bản ghi khổng lồ, ứng dụng chia nhỏ thời gian truy vấn thành các phân đoạn tối đa 2 ngày (`getDailyDateChunks`) để truy xuất dữ liệu cuốn chiếu, loại bỏ tình trạng timeout và nghẽn mạng.
  * Lọc trùng lặp bản ghi lỗi B006 thông minh (`dedupeB006Rows`) để đảm bảo số liệu thống kê chính xác tuyệt đối.
* **Danh sách API:**
  * `POST /api/generate/mesdaily`: Gọi các lệnh truy vấn dữ liệu B005 (Yield) và B006 (Detail Defect) của MES, xử lý lọc và xuất báo cáo Excel thành phẩm.
  * `POST /api/mesdaily/r001-search`: Tra cứu nhanh lịch sử lỗi của MES theo dải thời gian và Work Order (WO).

### 3. QuickLog / LogSN (`quicklog`)
* **Chức năng:** Hỗ trợ kỹ sư tìm kiếm và mở trực tiếp các file log kiểm tra vật lý định dạng `.txt` của các sản phẩm lỗi dựa vào SN hoặc Customer SN.
* **Tính năng đặc biệt:**
  * **Tra cứu log mạng cục bộ (UNC Path):** Quét trực tiếp file log trên thư mục máy chủ chia sẻ mạng (ví dụ `\\10.24.111.80\Testlog\camera\VO0301\...`).
  * **Tích hợp MES Trace:** Gọi API S001 của MES để dịch từ mã SN sang Customer SN/WO hiện tại của máy, sau đó gọi A003/A004 để dựng lịch sử chạy trạm & lịch sử sửa chữa của sản phẩm.
  * **Định vị file log theo mốc thời gian:** Lấy thông tin EndTime từ MES để quét thư mục log của ngày tương ứng, so khớp và tìm kiếm file log chuẩn xác nhất trong khoảng sai lệch thời gian cho phép (mặc định 30 giây).
  * **Mở tệp trực tiếp:** Hộp thoại cho phép kích đúp và mở file log cục bộ/mạng trực tiếp bằng Notepad hoặc chương trình chỉnh sửa mặc định trên máy tính của bạn.
* **Danh sách API:**
  * `POST /api/quicklog/search` / `POST /api/quicklog/mes-trace/search`: Tìm kiếm danh sách lịch sử kiểm tra.
  * `POST /api/quicklog/open-log` / `POST /api/quicklog/mes-trace/open-log`: Khởi chạy trình đọc file mặc định của hệ điều hành Windows để mở tệp log đích.

---

## ⚙️ Hướng dẫn Cấu hình (Configuration Guide)

Toàn bộ các file cấu hình định dạng JSON của hệ thống được lưu trữ tập trung tại thư mục [config/](file:///c:/Users/PC/Downloads/clca/config). Dưới đây là chi tiết công dụng của từng tệp:

| Tên File cấu hình | Mô tả chi tiết chức năng |
| :--- | :--- |
| **`app.settings.json`** | Cấu hình mạng (`server.host`, `server.port`), giới hạn kích thước tải file (`upload.maxFileSizeMb`), ngôn ngữ và giao diện mặc định, cùng các thiết lập bộ nhớ đệm mở log (`quicklog.openLogCacheMax`). |
| **`quicklog.models.json`** | Định nghĩa danh sách các mẫu sản phẩm (Models - ví dụ: EO0303, VO0301) cùng với đường dẫn máy chủ chia sẻ mạng UNC tương ứng (`path`), mã dự án (`project`), và đồ gá (`fixture`). Cấu hình IP gốc của máy chủ log cũng nằm tại đây. |
| **`quicklog.local-stations.json`**| Bật/tắt chế độ cấu hình trạm cục bộ, quản lý danh sách trạm được cấp phép tra cứu file log thô, và thiết lập các tên trạm thay thế (Station Aliases). |
| **`logging.json`** | Cấu hình bộ ghi log của server backend Express. Định nghĩa cấp độ ghi log (`level`), thư mục chứa file log, dung lượng tối đa và số lượng tệp log lưu trữ trước khi xoay vòng. |
| **`modules.json`** | Quản lý việc bật/tắt (kích hoạt hoặc ẩn đi) các phân hệ tính năng trên thanh Menu của phần mềm (như CLCA Generator, MES Daily, QuickLog). |
| **`clca.settings.json`** | Cấu hình cài đặt CLCA: tên file kết quả mặc định, yêu cầu gộp báo cáo khi chọn nhiều file và cấu hình trạm đặc biệt (`stationRules` như `Leak Test01`). |
| **`mesdaily.settings.json`** | Định nghĩa giờ chốt ca mặc định (`defaultHour`), tiền tố tên báo cáo kết quả và định dạng ghi chuỗi ngày tháng năm trong tệp Excel. |
| **`stations.json`** | File quản lý toàn bộ danh sách trạm kiểm tra master của nhà máy, thiết lập các nhóm preset trạm test (ví dụ SMT, DIP, FATP) để người dùng chọn nhanh trên giao diện. |

---

## 📁 Cấu trúc Thư mục & Liên kết Junctions

Để đảm bảo khả năng tương thích ngược giữa các phiên bản cũ và cấu trúc module mới, hệ thống duy trì các liên kết Junctions (Symlink của Windows) từ thư mục gốc của dự án chỉ sang các tài nguyên backend nằm sâu trong thư mục `app/`:

* `config` 🔗 Chỉ sang thư mục cấu hình thực tế [app/backend/config/](file:///c:/Users/PC/Downloads/clca/app/backend/config)
* `ui` 🔗 Chỉ sang thư mục giao diện Web thực tế [ui/](file:///c:/Users/PC/Downloads/clca/ui)
* `MES API` 🔗 Chỉ sang module xử lý MES thực tế [app/backend/modules/mes-daily/](file:///c:/Users/PC/Downloads/clca/app/backend/modules/mes-daily)
* `routes` 🔗 Chỉ sang thư mục định tuyến Express thực tế [app/backend/routes/](file:///c:/Users/PC/Downloads/clca/app/backend/routes)
* `services` 🔗 Chỉ sang thư mục helper xử lý tệp Excel thực tế [app/backend/services/](file:///c:/Users/PC/Downloads/clca/app/backend/services)

---

## 💻 Hướng dẫn Biên dịch và Vận hành (Developer Guide)

### 1. Vận hành độc lập Backend Node.js
Để chạy thử hoặc kiểm tra các API backend độc lập từ terminal:

1. Di chuyển vào thư mục gốc của dự án.
2. Cài đặt các gói phụ thuộc cần thiết:
   ```powershell
   npm install
   ```
3. Khởi động server backend Express:
   ```powershell
   node server.js
   ```
4. Truy cập giao diện Web thông qua trình duyệt tại địa chỉ: `http://localhost:5000` (hoặc cổng được cấu hình trong `app.settings.json`).

### 2. Biên dịch Desktop Host (CloudMetrics.exe)
Để tự đóng gói lại giao diện WebView2 và C# Wrapper thành tệp tin chạy trực tiếp `CloudMetrics.exe`, bạn sử dụng công cụ biên dịch dòng lệnh C# (`csc.exe`) đi kèm với cài đặt .NET Framework của Windows:

1. Mở cửa sổ **Developer PowerShell / Command Prompt** của Windows.
2. Chạy lệnh biên dịch sau tại thư mục gốc của dự án:
   ```powershell
   csc.exe /target:winexe /out:"CloudMetrics.exe" /win32icon:"ui new\clca_icon_multi.ico" /reference:Microsoft.Web.WebView2.Core.dll /reference:Microsoft.Web.WebView2.WinForms.dll /reference:System.dll /reference:System.Drawing.dll /reference:System.Windows.Forms.dll /win32manifest:desktop-host\app.manifest desktop-host\ClcaDesktopHost.cs
   ```
3. Sau khi biên dịch thành công, file `CloudMetrics.exe` sẽ được tạo ra tại thư mục gốc.

> [!WARNING]
> Khi phân phối ứng dụng `CloudMetrics.exe`, bắt buộc phải đi kèm các thư viện liên kết động sau trong cùng thư mục:
> * `Microsoft.Web.WebView2.Core.dll`
> * `Microsoft.Web.WebView2.WinForms.dll`
> * `WebView2Loader.dll`

---

## 🛠️ Quy tắc Phát triển (Development Rules)

> [!IMPORTANT]
> * **Sửa đổi mã nguồn:** Bạn hoàn toàn được phép chỉnh sửa tất cả các file xử lý logic trong `server.js`, các file routing trong `app/backend/routes/`, helper trong `services/`, và module tính toán trong `app/backend/modules/` để mở rộng chức năng hoặc sửa lỗi.
> * **Tùy biến giao diện:** Để thay đổi giao diện UI/UX của ứng dụng, chỉ thực hiện chỉnh sửa 3 tệp tin giao diện chính: [app.js](file:///c:/Users/PC/Downloads/clca/ui/app.js), [index.html](file:///c:/Users/PC/Downloads/clca/ui/index.html) và [styles.css](file:///c:/Users/PC/Downloads/clca/ui/styles.css) nằm trong thư mục `ui/`.
