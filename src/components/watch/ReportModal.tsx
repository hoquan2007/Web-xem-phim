'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle2, Send } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieTitle: string;
  episodeName?: string;
}

const REPORT_REASONS = [
  'Video player không chạy / Màn hình đen',
  'Âm thanh mất tiếng / Lỗi lồng tiếng',
  'Phụ đề (Vietsub) bị lỗi hoặc lệch tiếng',
  'Tập phim bị sai hoặc bị cắt xé',
  'Tốc độ tải chậm, giật lag',
  'Khác (vui lòng mô tả bên dưới)',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  movieTitle,
  episodeName = 'Tập 1',
}) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setDescription('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white">Báo Cáo Đã Đóng Gói!</h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Cảm ơn bạn đã phản hồi. Đội ngũ kỹ thuật **HNQ Movie** sẽ kiểm tra và khắc phục link phim trong thời gian sớm nhất.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header Title */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Báo Lỗi Sự Cố Phim</h3>
                <p className="text-xs text-slate-400 font-medium truncate max-w-[240px]">
                  {movieTitle} • {episodeName}
                </p>
              </div>
            </div>

            {/* Select Reason */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Chọn vấn đề bạn gặp phải:
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedReason === reason
                        ? 'bg-amber-400/10 border-amber-400/50 text-amber-300 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="accent-amber-400"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Note text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Mô tả chi tiết bổ sung (không bắt buộc):
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Ví dụ: Phút thứ 12:30 video bị sọc đen..."
                className="w-full p-3 text-xs bg-slate-950/80 text-slate-200 placeholder-slate-500 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi Báo Cáo</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
