# Hướng dẫn Phát triển cho AI Agent (AGENT.md)

Tài liệu này cung cấp hướng dẫn lập trình, cấu trúc thư mục, kiến trúc hệ thống và các quy tắc phát triển quan trọng dành riêng cho các AI Agent khi làm việc trên dự án **CloudMetrics**.

---

## 🗺️ 1. Kiến trúc Hệ thống (System Architecture)

CloudMetrics là một ứng dụng lai kết hợp giữa Desktop và Web, bao gồm:
1. **Desktop Host (C# WinForms + WebView2)**: Đóng gói giao diện, quản lý vòng đời ứng dụng và cung cấp các tương tác native với hệ điều hành Windows.
2. **Backend (Node.js + Express)**: Đóng vai trò máy chủ trung gian API cục bộ, chịu trách nhiệm xử lý các tệp Excel, truy vấn dữ liệu MES API, và quét tìm các file log vật lý.
3. **Frontend UI (HTML, CSS, JS thuần)**: Giao diện người dùng tương tác, chạy bên trong trình bao WebView2.

```mermaid
graph TD
    User([Người dùng]) -->|Tương tác| UI[Frontend UI - HTML/JS/CSS]
    UI -->|WebView2 COM Bridge| Host[Desktop Host - C# WinForms]
    UI -->|API Requests| Express[Backend - Node.js Express]
    Express -->|Query| MES_API[MES API - http://10.24.97.22]
    Express -->|Scan UNC Paths| LogServers[Log Servers - \\10.24.111.80\Testlog]
    Express -->|Read/Write Excel| LocalFS[(Hệ thống tệp cục bộ)]
    Host -->|Khởi chạy/Kill| Express
```

---

## 📁 2. Cấu trúc Thư mục & Liên kết Junctions

Để thuận tiện cho việc phát triển và tương thích ngược, dự án sử dụng các **Windows Directory Junctions (Symlinks)** tại thư mục gốc trỏ trực tiếp vào các tài nguyên backend nằm trong thư mục `app/backend/`.

### Sơ đồ ánh xạ thư mục:
* `config` 🔗 trỏ tới [app/backend/config/](file:///c:/Users/PC/Downloads/clca/app/backend/config)
* `ui` 🔗 trỏ tới [ui/](file:///c:/Users/PC/Downloads/clca/ui) (Thư mục giao diện Web tĩnh được Express phục vụ trực tiếp)
* `MES API` 🔗 trỏ tới [app/backend/modules/mes-daily/](file:///c:/Users/PC/Downloads/clca/app/backend/modules/mes-daily) (Nghiệp vụ cốt lõi của MES Daily)
* `routes` 🔗 trỏ tới [app/backend/routes/](file:///c:/Users/PC/Downloads/clca/app/backend/routes) (Định tuyến API Express)
* `services` 🔗 trỏ tới [app/backend/services/](file:///c:/Users/PC/Downloads/clca/app/backend/services) (Các hàm tiện ích/hỗ trợ backend)

> [!IMPORTANT]
> Khi Agent muốn chỉnh sửa các file cấu hình, route, dịch vụ hoặc giao diện, **hãy luôn thao tác qua các Junctions ở root** hoặc đường dẫn vật lý thực tế để tránh mất mát dữ liệu hoặc không đồng bộ.

---

## ⚙️ 3. Cấu hình Hệ thống (Configurations)

Tất cả các cấu hình của hệ thống được lưu ở dạng tệp JSON tại thư mục `config/` (vật lý: `app/backend/config/`):

1. **[app.settings.json](file:///c:/Users/PC/Downloads/clca/app/backend/config/app.settings.json)**:
   - `server`: Định nghĩa IP (`host`) và Cổng (`port`, mặc định `5000`) chạy server Node.js.
   - `upload`: Dung lượng file tối đa cho phép upload (`maxFileSizeMb`, mặc định `50MB`).
   - `quicklog`: Cấu hình dung lượng cache và dung lượng sai lệch thời gian cho phép khi quét file log (`logTimeToleranceSeconds`).
2. **[quicklog.models.json](file:///c:/Users/PC/Downloads/clca/app/backend/config/quicklog.models.json)**:
   - Danh sách các model được hỗ trợ quét log (`models` - ví dụ `VO0301`).
   - Cấu hình thông tin API MES Trace (`mesTrace`).
   - Sơ đồ ánh xạ tên cột CSV mặc định (`csvMappers`) và tên các trạm kiểm tra (`stationsList`).
3. **[quicklog.local-stations.json](file:///c:/Users/PC/Downloads/clca/app/backend/config/quicklog.local-stations.json)** *(nếu có)*:
   - Dùng để cấu hình bật/tắt quyền kiểm tra log cục bộ của từng trạm và thiết lập bí danh (Station Aliases).
4. **[logging.json](file:///c:/Users/PC/Downloads/clca/app/backend/config/logging.json)**:
   - Quản lý cơ chế ghi log backend (`cloudmetrics.log`). Hỗ trợ cấu hình mức độ ghi log (`level`), thư mục log, và xoay vòng log tự động (`maxFileSizeMb`, `maxFiles`).
5. **[modules.json](file:///c:/Users/PC/Downloads/clca/app/backend/config/modules.json)**:
   - Bật/tắt các phân hệ tính năng trên giao diện thanh Menu (`clca`, `mesdaily`, `quicklog`).
6. **[clca.settings.json](file:///c:/Users/PC/Downloads/clca/app/backend/config/clca.settings.json)**:
   - Quy tắc lọc trạm CLCA đặc thù (Ví dụ: `stationRules` quy định trạm `Leak Test01` sẽ được để trống thông tin SN và Description).
7. **[mesdaily.settings.json](file:///c:/Users/PC/Downloads/clca/app/backend/config/mesdaily.settings.json)**:
   - Định nghĩa giờ chốt ca (`defaultHour`) và các tiền tố báo cáo xuất ra.
8. **[stations.json](file:///c:/Users/PC/Downloads/clca/app/backend/config/stations.json)**:
   - Chứa danh sách các trạm master và các nhóm preset trạm test (SMT, DIP, FATP) dùng cho CLCA.

---

## 🛰️ 4. Sơ đồ Định tuyến API Backend (Routing map)

Backend Express được khởi chạy từ tệp [server.js](file:///c:/Users/PC/Downloads/clca/server.js). Nó đăng ký các định tuyến thông qua các file định tuyến mô-đun trong [routes/](file:///c:/Users/PC/Downloads/clca/routes):

### 1. Phân hệ CLCA Generator (`routes/clca.routes.js`)
* **`POST /api/generate`**: Nhận file excel thô từ client, thực thi công cụ kết xuất báo cáo mẫu Excel (`Sample.xlsx`). Hỗ trợ xuất gộp nhiều file WO (`mergeAllWo`).
* **`POST /api/clca/precheck`**: Kiểm tra trước cấu trúc cột dữ liệu trong file Excel tải lên.
* **`POST /api/inspect-model`**: Đọc nhanh cột `MODEL_NAME` từ file dữ liệu Excel.
* **`POST /api/inspect-stations`**: Trích xuất các trạm test thực tế trong file Excel và so khớp với danh sách trạm đã đăng ký trên hệ thống.
* **`GET /api/stations`**: Trả về danh sách trạm master và các presets.

### 2. Phân hệ MES Daily Report (`routes/mesdaily.routes.js`)
* **`POST /api/generate/mesdaily`**: Gọi nghiệp vụ MES Daily Logic để truy vấn dữ liệu B005 & B006 từ MES API, lọc trùng lặp và ghi vào biểu mẫu Excel.
* **`POST /api/mesdaily/r001-search`**: Truy tìm dữ liệu lịch sử đầu vào theo thời gian và WO bằng command R001.

### 3. Phân hệ QuickLog (`routes/quicklog.routes.js`)
* **`GET /api/quicklog/models`**: Trả về danh sách models cấu hình.
* **`GET /api/quicklog/modes`**: Trả về danh sách chế độ chạy (PROD, QA, v.v.).
* **`GET /api/quicklog/stations`**: Quét thư mục vật lý để tìm các thư mục trạm có sẵn.
* **`POST /api/quicklog/search`**: Tìm kiếm tệp log trong thư mục UNC dựa trên SN, Mode, và Fixture.
* **`POST /api/quicklog/open-log`**: Sử dụng lệnh hệ điều hành Windows (`cmd.exe /c start`) để mở trực tiếp file log đã tìm thấy trên máy tính.
* **`POST /api/quicklog/mes-trace/search`**: Thực thi MES Trace để tra cứu lịch sử hành trình sửa chữa của SN thông qua API MES.
* **`POST /api/quicklog/mes-trace/open-log`**: Ánh xạ từ thông tin lịch sử MES để tìm và mở file log tương ứng ở thư mục mạng cục bộ.

---

## 🛠️ 5. Hướng dẫn Biên dịch và Vận hành (Compilation & Run)

### Vận hành Server Node.js độc lập:
1. Đảm bảo đã ở thư mục gốc của dự án.
2. Cài đặt các thư viện:
   ```powershell
   npm install
   ```
3. Khởi động server backend Express:
   ```powershell
   node server.js
   ```
   *Server mặc định lắng nghe trên cổng `5000` (`http://localhost:5000`).*

### Biên dịch Desktop Host (CloudMetrics.exe):
Trình bao C# Desktop Host được biên dịch trực tiếp từ mã nguồn [ClcaDesktopHost.cs](file:///c:/Users/PC/Downloads/clca/desktop-host/ClcaDesktopHost.cs).

1. Mở terminal Windows PowerShell.
2. Kiểm tra xem trình biên dịch C# (`csc.exe`) của .NET Framework đã được đăng ký trong PATH hoặc sử dụng đường dẫn đầy đủ của nó (ví dụ: `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe`).
3. Chạy lệnh biên dịch sau tại thư mục gốc:
   ```powershell
   csc.exe /target:winexe /out:"CloudMetrics.exe" /win32icon:"ui\clca_icon_multi.ico" /reference:Microsoft.Web.WebView2.Core.dll /reference:Microsoft.Web.WebView2.WinForms.dll /reference:System.dll /reference:System.Drawing.dll /reference:System.Windows.Forms.dll /win32manifest:desktop-host\app.manifest desktop-host\ClcaDesktopHost.cs
   ```
4. Khi chạy tệp thực thi `CloudMetrics.exe`, **bắt buộc** phải giữ các file sau ở cùng thư mục:
   - `Microsoft.Web.WebView2.Core.dll`
   - `Microsoft.Web.WebView2.WinForms.dll`
   - `WebView2Loader.dll`
   - Thư mục `runtime/node/node.exe` (để ứng dụng tự khởi chạy server ngầm cục bộ nếu máy không cài sẵn node) hoặc server sẽ tự động fallback sang lệnh `node` của hệ thống.

---

## 💡 6. Các cơ chế hoạt động đặc thù cần lưu ý

1. **COM Bridge (`clcaHost`)**:
   - WebView2 cung cấp đối tượng cầu nối COM đồng bộ `window.chrome.webview.hostObjects.sync.clcaHost` sang mã nguồn C#.
   - Phương thức `BrowseSave(defaultFileName)` được sử dụng để hiển thị hộp thoại "Save As" nguyên bản của Windows. Nó chạy trên một luồng đơn STA (Single Threaded Apartment) được quản lý trong C# để tránh xung đột với luồng giao diện chính.
2. **Cơ chế phân đoạn ngày của MES API (Daily Chunks)**:
   - API MES (`B005`/`B006`) bị giới hạn hiệu năng khi truy vấn lượng dữ liệu cực lớn trong dải ngày dài.
   - Để giải quyết vấn đề timeout hoặc tràn bộ nhớ, backend chia nhỏ khoảng thời gian truy vấn thành các phân đoạn 2 ngày (`getDailyDateChunks` tại [logic.js](file:///c:/Users/PC/Downloads/clca/app/backend/modules/mes-daily/logic.js#L138)) và thực hiện tải dữ liệu cuốn chiếu.
3. **Cơ chế Quét Log UNC (QuickLog)**:
   - Log kiểm tra vật lý thường nằm ở thư mục mạng dùng chung (ví dụ `\\10.24.111.80\Testlog\camera\VO0301\SYNC LOCAL DATA\`).
   - Việc tìm kiếm log dựa vào sự kết hợp giữa **Mã SN của sản phẩm**, **Thời gian kết thúc trạm kiểm tra (EndTime)** và **Trạng thái Pass/Fail**.
   - Thời gian log được quét khớp bằng cách so sánh timestamp trong tên file hoặc thời gian sửa đổi file vật lý (`mtime`/`ctime`) với `EndTime` thực tế của MES, cho phép sai lệch tối đa theo cấu hình `logTimeToleranceSeconds`.
4. **Cơ chế Template Path & Global Active Program (Mới)**:
   - Ứng dụng hỗ trợ cấu trúc Template Path động cho quá trình quy hoạch cấu trúc file Log, thay vì bị fix cứng. Sử dụng các biến đại diện: `{Root}`, `{Model}`, `{Mode}`, `{Station}`, `{Fixture}`, `{Date}`, `{Result}`.
   - Giá trị "Active Program" được lựa chọn trên phạm vi toàn cục (Global) tại bảng Cài đặt (Settings), lưu tại `localStorage` và tự động áp dụng cho tất cả các tính năng cần mở/quét Log (Local Log, MES Trace, Defect Daily).
   - Khi tìm Log cho MES Trace (do MES không lưu trữ `Fixture` - máy test nào), Backend sẽ thực hiện kỹ thuật **"Nội suy giá trị giả"** (`__FIXTURE__`) để tự động cắt chuỗi và tìm ra chính xác thư mục cha chứa danh sách các máy test dựa trên Template Path phức tạp.

---

## 🚫 7. Quy tắc lập trình và phát triển dành cho Agent

1. **Không phá vỡ các Comments & Docstrings cũ**: Hãy luôn bảo toàn các chú thích code hiện có trừ khi được yêu cầu sửa đổi trực tiếp các hàm đó.
2. **Quản lý Vòng đời & Crash Server**: Luôn duy trì các hàm xử lý sự kiện `uncaughtException` và `unhandledRejection` tại đầu file `server.js` để tránh việc backend crash làm tắt toàn bộ ứng dụng desktop của người dùng.
3. **Thao tác UI**: Khi chỉnh sửa giao diện Frontend, chỉ sửa đổi các file trong thư mục `ui/` (`app.js`, `index.html`, `styles.css`). Tránh đưa các tài nguyên bên ngoài không cần thiết vào dự án.
4. **Không sử dụng placeholders**: Khi cần demo hoặc thiết kế hình ảnh, hãy dùng các công cụ thực tế hoặc sinh ảnh đúng mục đích sử dụng.
5. **Đọc kỹ tệp cấu hình**: Luôn kiểm tra xem tệp cấu hình JSON tương ứng có tồn tại không trước khi đọc/ghi, và đảm bảo bắt lỗi (`try-catch`) khi phân tích cú pháp JSON để ứng dụng có thể tự hồi phục bằng các giá trị mặc định (`fallback defaults`).
6. **Lỗi trắng trang (Mất UI module)**: Nếu ứng dụng Desktop khởi chạy bình thường nhưng giao diện trắng bóc, không load được các module trên `index.html`, **NGUYÊN NHÂN THƯỜNG LÀ DO LỖI CÚ PHÁP (Syntax Error) TRONG `ui/app.js`**. Vì giao diện được render chủ yếu qua JavaScript, một lỗi thiếu dấu ngoặc sẽ làm toàn bộ script ngừng chạy. Hãy luôn chạy lệnh `node -c ui/app.js` để kiểm tra cú pháp sau khi thực hiện các thay đổi lớn (như xoá khối lệnh) bằng công cụ `replace_file_content`.
7. **Cẩn trọng khi thay thế mã nguồn**: Khi sử dụng công cụ `replace_file_content` hoặc `multi_replace_file_content`, phải đối chiếu thật kỹ `ReplacementContent` với `TargetContent`. Tuyệt đối không được vô tình cắt gọt/xóa mất các dòng lệnh quan trọng (như `addEventListener`, khai báo biến) nằm lân cận khối logic đang cần sửa đổi. Rất nhiều lỗi (chẳng hạn nút bấm không hoạt động) sinh ra do xóa nhầm event listener.
8. **Xử lý trạng thái rỗng (Empty State/Fallback)**: Khi thiết kế tính năng cài đặt hoặc load dữ liệu, luôn phải lường trước trường hợp API backend trả về danh sách rỗng (lần chạy đầu tiên của user hoặc user xóa hết dữ liệu). Bắt buộc phải triển khai logic dự phòng (fallback) để tự động khởi tạo/hiển thị các dữ liệu mặc định (ví dụ: gán sẵn `MFGX`) ở cả biến lưu trữ (state) và UI thay vì để giao diện trống trơn.
9. **Hiểu đúng UX Intent với Popup/Modal**: Khi triển khai các popup cảnh báo trước thao tác nguy hiểm (như sửa config), không bắt sự kiện một cách tùy tiện gây cản trở trải nghiệm. Cụ thể: hãy gắn cảnh báo vào hành động sửa đổi thực sự (ví dụ: gán sự kiện `focusin` trên các ô `input`) để user vẫn có thể xem danh sách cấu hình, thay vì khóa cả màn hình khi họ vừa bấm tab cấu hình.
10. **Kiểm tra chéo từ điển Đa ngôn ngữ (i18n)**: Mỗi khi thêm mới một element UI có dùng thuộc tính `data-i18n` (ví dụ nút "Add Program"), **bắt buộc** mở file `ui/js/core/globals.js` để khai báo bổ sung cặp Key-Value cho toàn bộ các ngôn ngữ (tiếng Anh, Trung, Việt). Quên việc này sẽ dẫn đến lỗi khuyết thiếu chữ trên giao diện.
11. **Lỗi trắng trang do mất Element ID khi redesign HTML (ROOTCAUSE quan trọng)**: Lỗi app blank/white screen lặp đi lặp lại nhiều lần có **rootcause chung** như sau:
    - **Nguyên nhân**: `ui/js/main.js` bind event listener ở **global scope** (dòng 788-797) cho các element chung: `btnGenerate`, `btnClear`, `btnSelectAll`, `btnSelectNone`, `btnPresetSmt`, `btnPresetDip`, `btnPresetFatp`, `btnBrowseOutput`, `inputOutput`, `toastClose`, `btnClearLog`. Các element này được khai báo `const` trong `ui/js/core/globals.js` và `ui/js/modules/stations.js`/`landing.js`. Nếu **bất kỳ** element nào không tồn tại trong `index.html`, biến sẽ là `null`, và khi `main.js` gọi `null.addEventListener()` → **JS crash ngay tại dòng đó** → toàn bộ script sau đó không chạy → app trắng bóc, không render module nào.
    - **Tại sao lặp lại**: Mỗi lần redesign HTML (đặc biệt khi đắp mockup từ file tĩnh như `mesdaily-unified.html`), mockup thường chỉ chứa UI cho **1 module cụ thể** mà **quên giữ lại các element chung** (`btn-generate`, `btn-clear`, `station-panel`, `station-grid`, `input-output`, `btn-browse-output`) cần cho module khác (CLCA, QuickLog). Khi đắp mockup đè lên `index.html`, các element chung bị mất → JS crash → app blank.
    - **Cách phòng tránh (BẮT BUỘC)**:
      1. **Trước khi đắp HTML mới**: Inventory tất cả element ID mà JS bind ở global scope. Danh sách tối thiểu phải có: `btn-generate`, `btn-clear`, `btn-browse-output`, `input-output`, `station-panel`, `station-grid`, `btn-select-all`, `btn-select-none`, `btn-preset-smt`, `btn-preset-dip`, `btn-preset-fatp`, `btn-clear-log`, `toast-close`, `console-output`, `landing-enter`, `landing-lang-en`, `landing-lang-cn`, `landing-theme-toggle`, `module-sidebar`, `workspace-sidebar`, `sidebar-backdrop`, `module-title`, `file-cards`, `grr-result-panel`, `console-panel`, `progress-container`, `progress-bar`, `status-footer`, `status-ping`, `status-dot`, `status-text`, `settings-modal`, `toast`.
      2. **Sau khi đắp HTML**: Chạy lệnh `node -c` cho **tất cả** file JS (`ui/js/core/*.js` + `ui/js/modules/*.js` + `ui/js/main.js`) để kiểm tra syntax.
      3. **Kiểm tra runtime**: Chạy `node server.js` và mở `http://localhost:5000` để verify app render module bình thường.
      4. **Quy tắc vàng**: Mockup HTML mới **KHÔNG BAO GIỜ** được xóa các element chung — chỉ thêm/sửa nội dung trong `mes-panel`, giữ nguyên các section bên ngoài (Generate/Clear buttons, Station Panel, Output, Console).
12. Respect Global State Management (No Local DOM Queries for State)
**The Mistake:** Using local `document.querySelectorAll` to read UI state (like selected stations) instead of the application's central state manager.
**The Rule:** NEVER bypass the global state management pattern. If the project uses a centralized state manager (e.g., `globals.js`, `stations.js`, `getSelectedStations()`), you MUST use those exposed functions to retrieve state. Do not read state directly from the DOM unless it's a completely isolated component.
13. Strict Data Schema Tracing (API to UI)
**The Mistake:** Blindly assuming two different backend endpoints (or two different modes) return the exact same data schema (e.g., assuming `Time` is mapped to `defectTime` or assuming `ModelName` exists).
**The Rule:** Whenever mapping backend data to the frontend (especially rendering tables or charts), you MUST trace the EXACT payload schema returned by the specific backend API route/service handling the request. Do not reuse legacy mapping functions blindly without verifying the keys match the new payload.
14. Script Execution Order & DOM Dependencies
**The Mistake:** Placing DOM-dependent initialization logic or cross-file function calls in a script that loads *before* its dependencies in `index.html`.
**The Rule:** Always check the `<script>` load order in `index.html` (or the main entry point) when refactoring, splitting, or merging JavaScript files. 
- If Script A loads before Script B, Script A MUST NOT invoke functions defined in Script B during its global execution.
- Maintain a strict separation of concerns: keep utility/rendering functions pure, and let the later-loaded Controller scripts handle the orchestration and DOM binding.

