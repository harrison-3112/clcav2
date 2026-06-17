# CloudMetrics Config Guide — All App

Tài liệu này hướng dẫn chỉnh từng file config trong app CloudMetrics. Phase 1 đã tích hợp thật cho `quicklog.models.json` và `app.settings.json`; các config còn lại đã chuẩn bị format để tích hợp ở phase sau.

## Trạng thái tích hợp hiện tại

### Đã active trong Phase 1

- `config/quicklog.models.json`
- `config/app.settings.json`

### Đã tạo format, chưa active hoàn toàn

- `config/logging.json`
- `config/modules.json`
- `config/clca.settings.json`
- `config/mesdaily.settings.json`
- `config/stations.json` nếu có sẵn trong app

---

## 1. `config/quicklog.models.json`

### Mục đích

Quản lý model, network path, project folder, fixture folder cho QuickLog/LogSN.

### Ví dụ

```json
{
  "models": [
    {
      "name": "EO0303",
      "path": "\\10.24.111.80\Testlog\camera\EO0303\SYNC LOCAL DATA",
      "project": "EO0303",
      "fixture": "J01",
      "enabled": true,
      "description": "EO0303 camera testlog root"
    }
  ]
}
```

### Cách thêm model mới

Thêm object mới vào mảng `models`:

```json
{
  "name": "EO0304",
  "path": "\\10.24.111.80\Testlog\camera\EO0304\SYNC LOCAL DATA",
  "project": "EO0304",
  "fixture": "J01",
  "enabled": true,
  "description": "EO0304 camera testlog root"
}
```

### Lưu ý path UNC

Windows Explorer hiển thị:

```text
\10.24.111.80\Testlog\camera\EO0303\SYNC LOCAL DATA
```

Trong JSON phải viết:

```json
"path": "\\10.24.111.80\Testlog\camera\EO0303\SYNC LOCAL DATA"
```

### Test sau khi sửa

1. Restart server.
2. Mở QuickLog.
3. Dropdown Model phải thấy model mới.
4. Chọn model, Mode phải load được.
5. Search SN.
6. Open Log.

---

## 2. `config/app.settings.json`

### Mục đích

Cấu hình chung cho server, upload, UI, QuickLog runtime và Browse Save timeout.

### Ví dụ

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 5000
  },
  "upload": {
    "maxFileSizeMb": 50,
    "tempFolderName": "clca_generator_uploads"
  },
  "ui": {
    "defaultLanguage": "en",
    "defaultTheme": "system"
  },
  "quicklog": {
    "openLogCacheMax": 500,
    "logTimeToleranceSeconds": 5,
    "returnCheckedPathsOnFail": true,
    "deriveLogPathFromSourceFile": true
  },
  "browseSave": {
    "timeoutMs": 12000
  }
}
```

### Field đang active ở Phase 1

- `server.host`
- `server.port`
- `upload.maxFileSizeMb`
- `upload.tempFolderName`
- `ui.defaultLanguage`
- `ui.defaultTheme`
- `quicklog.openLogCacheMax`
- `browseSave.timeoutMs`

### Cách chỉnh thường dùng

Đổi port server:

```json
"port": 5001
```

Tăng upload limit lên 100 MB:

```json
"maxFileSizeMb": 100
```

Đổi default language sang Chinese nếu chưa có localStorage override:

```json
"defaultLanguage": "cn"
```

Tăng cache Open Log:

```json
"openLogCacheMax": 1000
```

---

## 3. `config/logging.json`

### Mục đích

Chuẩn bị cho Phase 2: backend logging, request timing, checkedPaths khi Open Log fail.

### Ví dụ

```json
{
  "level": "info",
  "writeFile": true,
  "folder": "logs",
  "includeRequestTiming": true,
  "includeQuickLogCheckedPaths": true,
  "includeConfigLoadWarnings": true,
  "maxFileSizeMb": 10,
  "maxFiles": 10
}
```

### Khi debug Open Log

Giữ:

```json
"includeQuickLogCheckedPaths": true
```

Khi Open Log fail, cần gửi `checkedPaths` để đối chiếu folder thật.

---

## 4. `config/modules.json`

### Mục đích

Chuẩn bị cho Phase 3/4: quản lý bật/tắt module, title, menuTitle, endpoint.

### Ví dụ

```json
{
  "modules": {
    "quicklog": {
      "enabled": true,
      "title": { "en": "QuickLog", "cn": "QuickLog" },
      "menuTitle": { "en": "QuickLog", "cn": "QuickLog" },
      "endpoint": "/api/quicklog/search"
    }
  }
}
```

### Ẩn module

```json
"mesdaily": {
  "enabled": false
}
```

Lưu ý: cần phase tích hợp frontend loader thì việc enable/disable mới tác động UI.

---

## 5. `config/clca.settings.json`

### Mục đích

Chuẩn bị config rule CLCA, nhất là rule station đặc biệt.

### Ví dụ

```json
{
  "defaultOutputName": "CLCA_Report.xlsx",
  "merge": {
    "requireMergeForMultipleFiles": true,
    "defaultMergeEnabled": false
  },
  "csnMapping": {
    "defaultEnabled": false
  },
  "stationRules": {
    "Leak Test01": {
      "leaveSnCodeBlank": true,
      "leaveDescriptionBlank": true,
      "disableCustomerSnMapping": true
    }
  }
}
```

### Rule cố định không được regression

Với `Leak Test01`:

- `SN码` để trống.
- `Description` để trống.
- Không mapping `SN` → `CUSTOMER_SN`.

---

## 6. `config/mesdaily.settings.json`

### Mục đích

Chuẩn bị config MES Daily default time/output behavior.

### Ví dụ

```json
{
  "defaultHour": 15,
  "defaultOutputPrefix": "MES Data",
  "resetStateOnOpen": true,
  "autoOutputNameFromToDate": true,
  "dateTagFormat": "MM.DD"
}
```

### Chỉnh giờ mặc định

```json
"defaultHour": 8
```

### Chỉnh prefix output

```json
"defaultOutputPrefix": "MES Daily"
```

---

## 7. `config/stations.json`

### Mục đích

Nguồn station/preset chính. `Station.txt` nên chỉ giữ làm fallback legacy.

### Ví dụ

```json
{
  "stations": [
    "SMT_Bot1",
    "SMT_Bot2",
    "DIP_PCBA_01",
    "Leak Test01"
  ],
  "presets": {
    "SMT": ["SMT_Bot1", "SMT_Bot2"],
    "DIP": ["DIP_PCBA_01"],
    "FATP": ["Leak Test01"]
  },
  "aliases": {
    "CHECK Test": "CHECK"
  }
}
```

---

## Quy trình an toàn khi chỉnh config

1. Backup file JSON trước khi sửa.
2. Sửa đúng dấu phẩy JSON.
3. Validate JSON:

```bash
node -e "JSON.parse(require('fs').readFileSync('config/app.settings.json','utf8')); console.log('OK')"
```

4. Restart server.
5. Test module liên quan.
6. Nếu fail, rollback file config cũ.

---

## Checklist Phase 1 sau khi thay package

### Server/app settings

- `GET /api/app/settings` trả `success: true`.
- Đổi `browseSave.timeoutMs`, refresh app, Browse Save timeout dùng giá trị mới.
- Đổi `upload.maxFileSizeMb`, restart server, multer limit dùng giá trị mới.

### QuickLog

- `GET /api/quicklog/models` trả đủ `VO0301`, `EO0302`, `EO0303`.
- Search SN theo model mới được.
- Open Log mở đúng model path.

### Regression cần kiểm tra

- CLCA vẫn generate được.
- MES Daily vẫn render date/time được.
- UI theme/language không bị reset nếu localStorage đã có giá trị.
