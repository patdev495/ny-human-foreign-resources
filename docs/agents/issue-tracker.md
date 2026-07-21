# Issue Tracker: Local Markdown

Issues và PRDs cho repo này là các file markdown trong thư mục `.scratch/`.

## Cấu trúc thư mục

```
.scratch/
├── <feature-slug>/
│   ├── PRD.md                   # Product Requirements Document
│   └── issues/
│       ├── 01-<slug>.md
│       ├── 02-<slug>.md
│       └── ...
```

## Quy ước

- Một tính năng / module = một thư mục: `.scratch/<feature-slug>/`
- PRD ở: `.scratch/<feature-slug>/PRD.md`
- Issues ở: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, đánh số từ `01`
- Trạng thái triage ghi dưới dạng dòng `Status:` gần đầu mỗi file issue (xem `triage-labels.md` để biết chuỗi nhãn)
- Lịch sử comment gắn vào cuối file dưới heading `## Comments`

## Feature slugs cho dự án này

| Feature slug | Mô tả |
|---|---|
| `hr-foreign` | Quản lý nhân sự nước ngoài |
| `housekeeping` | Quản lý tạp vụ |
| `vehicle-dispatch` | Điều xe |
| `dormitory-costs` | Chi phí ký túc xá |
| `auth` | Xác thực & phân quyền |
| `reports` | Báo cáo & thống kê |

## Khi skill nói "publish to the issue tracker"

Tạo file mới trong `.scratch/<feature-slug>/issues/` (tạo thư mục nếu chưa có).

## Khi skill nói "fetch the relevant ticket"

Đọc file tại đường dẫn được tham chiếu. Người dùng thường truyền đường dẫn hoặc số issue trực tiếp.
