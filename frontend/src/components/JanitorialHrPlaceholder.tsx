import React from "react";

export const JanitorialHrPlaceholder: React.FC = () => (
  <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-12 text-center space-y-4 my-6">
    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-amber-100 shadow-inner">
      🧹
    </div>
    <div className="space-y-2 max-w-md mx-auto">
      <div className="flex items-center justify-center gap-2">
        <h2 className="text-xl font-bold text-slate-800">Quản lý Nhân sự Tạp vụ</h2>
        <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          Chưa triển khai
        </span>
      </div>
      <p className="text-sm text-slate-500 leading-relaxed">
        Phân hệ quản lý hồ sơ, chấm công, ca làm việc và chi phí dành cho Nhân sự Tạp vụ hiện chưa được triển khai. Tính năng sẽ sẵn sàng ở phiên bản cập nhật tiếp theo!
      </p>
    </div>
  </div>
);
