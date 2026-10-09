import { useEffect, useState } from "react";
import { API_URL, request } from "../services/api";
import type { DeviceCategory } from "../../backend/src/adventure/domain";
import { studyTopics } from "./topics";

type Run = {
  id: string; tripCode: string; testerCode: string; topic: string; goalSummary: string;
  targetSeconds: number; elapsedSeconds: number; focusedSeconds: number; distractions: number;
  deviceCategory: DeviceCategory | null;
  completed: boolean; quizScore: number | null; quizTotal: number | null; startedAt: string; endedAt: string;
};
type Results = { runs: Run[]; total: number; limit: number; offset: number };
const duration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const time = (value: string) => new Date(value).toLocaleString("vi-VN");
const deviceLabels: Record<DeviceCategory, string> = {
  pc: "PC", ios: "iOS", android: "Android", tablet: "iPad/Tablet",
  unknown: "Không xác định",
};
const deviceLabel = (category: Run["deviceCategory"]) =>
  category == null ? "Chưa ghi nhận" : deviceLabels[category];
export function ExperimentResults() {
  const [data, setData] = useState<Results | null>(null);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    request<Results>(`/experiments?limit=50&offset=${offset}`, {}, false).then(value => {
      if (!cancelled) { setData(value); setError(""); }
    }).catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "Không tải được lịch sử."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [offset, revision]);
  useEffect(() => {
    const refresh = () => { if (!document.hidden) setRevision(value => value + 1); };
    const interval = setInterval(refresh, 30000);
    window.addEventListener("online", refresh);
    return () => { clearInterval(interval); window.removeEventListener("online", refresh); };
  }, []);
  const refresh = () => { setLoading(true); setRevision(value => value + 1); };
  return <section className="experiment-results">
    <div className="page-heading"><span className="eyebrow">NHỮNG CHẶNG ĐƯỜNG ĐÃ QUA</span>
      <h1>Lịch sử chuyến đi</h1>
      <p>Mọi phiên đã lưu đều tự xuất hiện ở đây, kể cả chuyến kết thúc sớm. Mỗi chuyến có mã ẩn danh, thời gian, thiết bị, tóm tắt mục tiêu, số lần xao nhãng và điểm quiz sau khi làm xong.</p>
    </div>
    <div className="choice-row"><button disabled={loading} onClick={refresh}>{loading ? "Đang tải…" : "Cập nhật lịch sử"}</button>
      <a className="experiment-export" href={`${API_URL}/experiments/export.csv`} download="viendu-trip-history.csv">Tải dữ liệu CSV</a></div>
    {error && <p role="alert" className="info-box">{error}</p>}
    {data && <><p>{data.total} chuyến công khai · Chuyến offline xuất hiện sau khi gửi thành công. Lịch sử cập nhật mỗi 30 giây.</p>
      {data.runs.length ? <div className="experiment-table-wrap"><table className="experiment-table"><caption>Lịch sử các chuyến học</caption>
        <thead><tr><th>Mã chuyến</th><th>Thời gian</th><th>Thiết bị</th><th>Mục tiêu / Chủ đề</th><th>Thời lượng</th><th>Tập trung</th><th>Xao nhãng</th><th>Điểm</th></tr></thead>
        <tbody>{data.runs.map(r => <tr key={r.id}><td><strong>{r.tripCode}</strong><br/><small>{r.testerCode}</small></td>
          <td><time dateTime={r.startedAt}>Bắt đầu: {time(r.startedAt)}</time><br/><time dateTime={r.endedAt}>Kết thúc: {time(r.endedAt)}</time></td>
          <td>{deviceLabel(r.deviceCategory)}</td>
          <td className="experiment-goal"><strong>{r.goalSummary}</strong><br/><small>{studyTopics.find(t => t.id === r.topic)?.name ?? r.topic}</small></td>
          <td>{duration(r.elapsedSeconds)} / {duration(r.targetSeconds)}<br/><small>{r.completed ? "Đủ giờ" : "Kết thúc sớm"}</small></td>
          <td>{duration(r.focusedSeconds)}</td><td>{r.distractions} lần</td>
          <td>{r.quizTotal === null || r.quizScore === null ? "Chưa làm" : `${r.quizScore}/${r.quizTotal}`}</td></tr>)}</tbody></table></div>
        : <div className="panel"><h2>Chưa có chuyến đi nào</h2><p>Kết thúc và lưu một phiên học để chuyến đi tự xuất hiện trong lịch sử.</p></div>}
      <div className="choice-row"><button disabled={loading || offset === 0} onClick={() => { setLoading(true); setData(null); setOffset(Math.max(0, offset - 50)); }}>Trang trước</button>
        <button disabled={loading || offset + 50 >= data.total} onClick={() => { setLoading(true); setData(null); setOffset(offset + 50); }}>Trang sau</button></div></>}
    <p className="material-hint">Thời gian tập trung loại trừ khoảng rời phiên; đồng hồ chuyến vẫn chạy liên tục. Điểm quiz được chấm trên máy chủ. Email tài khoản và nội dung tài liệu học được giữ riêng. CSV chứa tối đa 10.000 chuyến gần nhất.</p>
  </section>;
}
