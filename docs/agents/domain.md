# Domain Docs

Hướng dẫn các engineering skills đọc tài liệu domain của repo này khi khám phá codebase.

## Trước khi explore, đọc các file sau

- **`CONTEXT.md`** ở root của repo — ngôn ngữ domain và thuật ngữ dự án
- **`docs/adr/`** — các Architectural Decision Records. Đọc ADR liên quan đến vùng bạn sắp làm việc

Nếu các file này chưa tồn tại, **tiếp tục im lặng**. Đừng báo lỗi hay đề xuất tạo chúng ngay — skill `/grill-with-docs` sẽ tạo chúng khi các thuật ngữ và quyết định thực sự được giải quyết.

## Cấu trúc file (Single-context)

```
/
├── CONTEXT.md              ← ngôn ngữ domain, glossary
├── AGENTS.md               ← cấu hình agent
├── docs/
│   ├── adr/
│   │   ├── 0001-*.md
│   │   └── ...
│   └── agents/
│       ├── issue-tracker.md
│       ├── triage-labels.md
│       └── domain.md
├── .scratch/               ← local issue tracker
│   └── <feature-slug>/
│       ├── PRD.md
│       └── issues/
└── src/
```

## Dùng đúng thuật ngữ của glossary

Khi output đặt tên cho một khái niệm domain (trong tiêu đề issue, đề xuất refactor, tên test), dùng thuật ngữ như đã định nghĩa trong `CONTEXT.md`. Đừng tự ý dùng từ đồng nghĩa mà glossary tránh dùng.

Nếu khái niệm cần dùng chưa có trong glossary — đó là tín hiệu: hoặc bạn đang phát minh ngôn ngữ mà dự án chưa dùng (xem xét lại), hoặc có gap thực sự (ghi chú cho `/grill-with-docs`).

## Cảnh báo xung đột ADR

Nếu output của bạn mâu thuẫn với ADR hiện có, hãy nêu rõ thay vì im lặng ghi đè:

> _Mâu thuẫn với ADR-0001 (…) — nhưng đáng xem xét lại vì…_

## Các module chính của dự án này

| Module | Mô tả |
|---|---|
| Quản lý nhân sự nước ngoài | Hồ sơ, hợp đồng, visa, phép năm của nhân viên nước ngoài |
| Quản lý tạp vụ | Lịch làm việc, phân công, theo dõi tạp vụ |
| Điều xe | Đặt xe, lịch trình tài xế, theo dõi xe |
| Chi phí ký túc xá | Ghi nhận chi phí ở, phân bổ theo nhân viên, thanh toán |
