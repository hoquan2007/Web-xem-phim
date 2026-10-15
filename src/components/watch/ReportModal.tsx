"use client";
import { useId, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
const reasons = [
  "Video không chạy hoặc màn hình đen",
  "Không có âm thanh",
  "Phụ đề sai hoặc lệch tiếng",
  "Sai tập phim",
  "Tải chậm, giật lag",
  "Vấn đề khác",
];
export function ReportModal({
  isOpen,
  onClose,
  movieTitle,
  episodeName,
}: {
  isOpen: boolean;
  onClose: () => void;
  movieTitle: string;
  episodeName?: string;
}) {
  const [reason, setReason] = useState(reasons[0]);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const id = useId();
  const close = () => {
    setSubmitted(false);
    setDescription("");
    onClose();
  };
  return (
    <Dialog
      open={isOpen}
      onClose={close}
      title={submitted ? "Đã tạo file báo cáo" : "Tạo báo cáo sự cố"}
    >
      {submitted ? (
        <>
          <p className="text-sm text-muted" role="status">
            Báo cáo được tải về máy của bạn. Website hiện chưa có hệ thống gửi
            báo cáo tới đội kỹ thuật.
          </p>
          <button className="film-button mt-5" onClick={close}>
            Đóng báo cáo
          </button>
        </>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const report = JSON.stringify(
              {
                movieTitle,
                episodeName,
                reason,
                description: description.slice(0, 2000),
                createdAt: new Date().toISOString(),
                url: window.location.href,
              },
              null,
              2,
            );
            const url = URL.createObjectURL(
              new Blob([report], { type: "application/json" }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = "ptq-bao-loi-phim.json";
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setSubmitted(true);
          }}
        >
          <p className="text-sm text-muted break-words">
            {movieTitle}
            {episodeName ? ` · ${episodeName}` : ""}
          </p>
          <p className="notice">
            Báo cáo sẽ tải thành file trên máy, chưa được gửi tới đội kỹ thuật.
          </p>
          <fieldset>
            <legend className="film-label">Vấn đề gặp phải</legend>
            <div className="grid gap-1">
              {reasons.map((value) => (
                <label
                  className="flex gap-3 items-center min-h-11 text-sm"
                  key={value}
                >
                  <input
                    type="radio"
                    name={id}
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                    className="accent-amber-400"
                  />
                  {value}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="film-label" htmlFor={`${id}-description`}>
              Mô tả thêm (không bắt buộc)
            </label>
            <textarea
              className="film-field"
              id={`${id}-description`}
              maxLength={2000}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: video dừng ở phút 12:30"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" className="film-button" onClick={close}>
              Hủy bỏ
            </button>
            <button className="film-button primary">Tải file báo cáo</button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
