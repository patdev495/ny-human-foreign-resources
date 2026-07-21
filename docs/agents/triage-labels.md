# Triage Labels

Các skills sử dụng sáu vai trò triage. File này ánh xạ từng vai trò sang chuỗi nhãn thực tế trong issue tracker của repo.

Vì repo dùng **Local Markdown**, nhãn được ghi dưới dạng dòng `Status:` trong mỗi file issue.

## Bảng ánh xạ nhãn

| Nhãn chuẩn (skills) | Nhãn trong tracker | Ý nghĩa |
|---|---|---|
| `needs-triage` | `needs-triage` | Maintainer cần đánh giá issue này |
| `needs-info` | `needs-info` | Chờ người báo cáo cung cấp thêm thông tin |
| `ready-for-agent` | `ready-for-agent` | Đã đặc tả đầy đủ, agent có thể xử lý không cần người giám sát |
| `ready-for-human` | `ready-for-human` | Cần người thực hiện |
| `wontfix` | `wontfix` | Sẽ không xử lý |
| `done` | `done` | Issue đã hoàn thành |

## Cách dùng

Mỗi file issue bắt đầu bằng:

```markdown
---
Status: needs-triage
Feature: hr-foreign
Issue: 01
---

# [Tiêu đề issue]
...
```

Khi skill đề cập đến một vai trò (ví dụ: "apply the AFK-ready triage label"), dùng chuỗi nhãn trong cột "Nhãn trong tracker" của bảng trên.
