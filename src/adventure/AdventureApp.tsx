import { useEffect, useRef, useState } from "react";
import { useBrowserView } from "./navigation";
import { useAuthStore } from "@/store/authStore";
import { post, request, REGISTRATION_PASSWORD_HINT } from "@/services/api";
import { Scene } from "./Scene";
import { JourneyView } from "./JourneyView";
import { detectDeviceCategory } from "./device";
import { explorationProgress } from "./exploration";
import type { MaterialExtractionProgress } from "./materialExtraction";
import { createMaterialSource, reviewMaterialSource, quizSourceText, recoveredMaterialSource, type MaterialSource } from "./materialSources";
import { DurationPicker } from "./DurationPicker";
import { ExperimentResults } from "./ExperimentResults";
import { QuizPanel } from "./QuizPanel";
import { permanentGuestFailure, publishGuestSessions, type GuestPublicationStatus } from "./guestPublication";
import { GuestHistorySync } from "./GuestHistorySync";
import { studyTopics } from "./topics";
import {
  breakStatus,
  totalDuration,
  depart,
  elapsedSeconds,
  focused,
  leaveFocusView,
  restore,
  returnFromBackground,
  sessionEndAt,
  tick,
  type ActiveTrip,
} from "./focus";
import { isValidBreakPlan } from "../../backend/src/adventure/domain";
import { emptySaved, readSaved, writeSaved, type Saved } from "./storage";
import { updateQuizDrafts, type QuizDraft, type QuizQuestion } from "./quizDrafts";
import { analyzeSession, knowledgeGaps, reviewPlan } from "./learning";
import {
  localDayKey,
  millisecondsUntilNextLocalDay,
  shouldRefreshWorkspaceClock,
} from "./idleClock";
import {
  person,
  settle,
  snapshot,
  type Session,
  type Snapshot,
} from "../../backend/src/adventure/domain";
import "./adventure.css";
const stations = [
  "Ga Khởi đầu",
  "Đồng cỏ Gió",
  "Rừng Sương mù",
  "Đèo Ánh sao",
  "Thành phố Bình minh",
];
const stories = [
  "Một tấm vé nhỏ, một hành trình lớn. Toa của bạn đã sẵn sàng.",
  "Gió mang theo hương cỏ mới. Mỗi phút tập trung là một bước đến chân trời.",
  "Trong làn sương, bạn tìm thấy một mảnh bản đồ. Núi cao hay bờ biển đang chờ phía trước?",
  "Những vì sao soi đường. Bạn đã đi xa hơn chính mình của ngày hôm qua.",
  "Bình minh lên trên những mái nhà. Mỗi nỗ lực nhỏ đã góp thành chuyến đi này.",
];
const nav = [
  { id: "station", icon: "⌂", label: "Ga chính" },
  { id: "map", icon: "⌁", label: "Bản đồ hành trình" },
  { id: "carriage", icon: "▣", label: "Toa của tôi" },
  { id: "group", icon: "♧", label: "Đoàn tàu" },
  { id: "journal", icon: "▤", label: "Nhật ký học tập" },
  { id: "experiments", icon: "◎", label: "Lịch sử chuyến đi" },
];
const clock = (seconds: number) =>
  `${Math.floor(Math.max(0, seconds) / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(Math.max(0, seconds) % 60)
    .toString()
    .padStart(2, "0")}`;
const date = (time: number) =>
  new Date(time).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
type MaterialInfo = { sourceId?: string; name: string; size: number; type: string; status: string; message: string };
export default function AdventureApp() {
  const { user, bootstrap, ready } = useAuthStore();
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);
  if (!ready) return <div className="adventure empty">Đang mở hành trình…</div>;
  return <><GuestHistorySync accountId={user?.id} /><AdventureWorkspace key={user?.id ?? "guest"} /></>;
}
function AdventureWorkspace() {
  const [requestedView, setView] = useBrowserView();
  const views = ["station", "map", "carriage", "group", "journal", "experiments", "ticket", "focus", "summary", "account"];
  const view = views.includes(requestedView) ? requestedView : "station";
  const { user, login, logout, offline: authOffline, needsLogin } = useAuthStore();
  const owner = user?.id ?? "guest";
  const [saved, setSaved] = useState<Saved>(emptySaved);
  const current = useRef(saved),
    ownerRef = useRef(owner);
  const workspaceLive = useRef(false);
  const [guestPublication, setGuestPublication] = useState<Record<string, GuestPublicationStatus>>({});
  const hasActiveTrip = Boolean(saved.active);
  const [loaded, setLoaded] = useState(false),
    [exclusive, setExclusive] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [now, setNow] = useState(() => Date.now()),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false),
    [online, setOnline] = useState(true);
  const lastLocalDay = useRef(localDayKey(now));
  const [goal, setGoal] = useState(""),
    [topic, setTopic] = useState("biology"),
    [documentText, setDocumentText] = useState("");
  const [sources, setSources] = useState<MaterialSource[]>([]);
  const originalFiles = useRef(new Map<string, File>());
  const [handwritten, setHandwritten] = useState(false);
  const [materials, setMaterials] = useState<MaterialInfo[]>([]);
  const [materialProgress, setMaterialProgress] = useState<(MaterialExtractionProgress & { file: string }) | null>(null);
  const materialRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { materialRequest.current?.abort(); }, [view]);
  const [breakCount, setBreakCount] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [minutes, setMinutes] = useState(25),
    [mode, setMode] = useState<"solo" | "group">("solo");
  const plannedBreaks = {count:breakCount,seconds:breakMinutes * 60};
  const validBreaks = breakCount === 0 || isValidBreakPlan(plannedBreaks, minutes * 60);
  const [carriageName, setCarriageName] = useState(""),
    [groupName, setGroupName] = useState(""),
    [invite, setInvite] = useState("");
  const [inviteResult, setInviteResult] = useState<{
    token: string;
    expires: number;
  } | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState("");
  const [confirm, setConfirm] = useState<"finish" | "leave" | "reset" | null>(null),
    [summary, setSummary] = useState<Session | null>(null);
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);
  const commitRef = useRef<(v: Saved) => boolean>(() => false);
  function commit(value: Saved) {
    if (
      ownerRef.current !== "guest" &&
      value.snapshot &&
      current.current.snapshot &&
      value.snapshot.revision < current.current.snapshot.revision
    )
      value = { ...value, snapshot: current.current.snapshot };
    try {
      writeSaved(ownerRef.current, value);
      current.current = value;
      setSaved(value);
      return true;
    } catch {
      setError(
        "Không lưu được trên thiết bị. Có thể bộ nhớ đã đầy. Hãy xuất dữ liệu; phiên hiện tại chưa bị xóa.",
      );
      return false;
    }
  }
  const finishRef = useRef<() => void>(() => {});
  useEffect(() => {
    commitRef.current = commit;
  });
  useEffect(() => {
    ownerRef.current = owner;
    let release: (() => void) | undefined,
      disposed = false;
    if (!navigator.locks) {
      queueMicrotask(() =>
        setError(
          "Trình duyệt cần hỗ trợ Web Locks và kết nối HTTPS hoặc localhost.",
        ),
      );
      return;
    }
    void navigator.locks.request(
      `train-adventure:${owner}`,
      { ifAvailable: true },
      async (lock) => {
        if (disposed) return;
        if (!lock) {
          setError(
            "Hành trình đang mở ở cửa sổ khác. Đóng cửa sổ đó rồi tải lại để tiếp tục.",
          );
          return;
        }
        try {
          const value = readSaved(owner);
          if (value.active) value.active = restore(value.active, Date.now());
          if (owner === "guest")
            value.snapshot = snapshot(value.local, owner, Date.now());
          if (commitRef.current(value)) {
            workspaceLive.current = true;
            setLoaded(true);
            setExclusive(true);
          }
        } catch (e) {
          setStorageError(true);
          setError(e instanceof Error ? e.message : "Không đọc được dữ liệu.");
        }
        await new Promise<void>((resolve) => {
          release = resolve;
          if (disposed) resolve();
        });
      },
    );
    return () => {
      disposed = true;
      workspaceLive.current = false;
      release?.();
    };
  }, [owner]);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const refreshClock = () => {
      const at = Date.now();
      const currentDay = localDayKey(at);
      if (
        shouldRefreshWorkspaceClock(
          hasActiveTrip,
          lastLocalDay.current,
          currentDay,
        )
      ) {
        lastLocalDay.current = currentDay;
        setNow(at);
      }
      return at;
    };
    const scheduleNextLocalDay = () => {
      timeout = setTimeout(() => {
        refreshClock();
        scheduleNextLocalDay();
      }, millisecondsUntilNextLocalDay(Date.now()) + 50);
    };
    refreshClock();
    if (hasActiveTrip) {
      interval = setInterval(() => {
        const at = refreshClock();
        const trip = current.current.active;
        if (trip && elapsedSeconds(trip, at) >= trip.target)
          finishRef.current();
      }, 1000);
    }
    else scheduleNextLocalDay();
    const connectivity = () => setOnline(navigator.onLine);
    connectivity();
    window.addEventListener("online", connectivity);
    window.addEventListener("offline", connectivity);
    window.addEventListener("focus", refreshClock);
    document.addEventListener("visibilitychange", refreshClock);
    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
      window.removeEventListener("online", connectivity);
      window.removeEventListener("offline", connectivity);
      window.removeEventListener("focus", refreshClock);
      document.removeEventListener("visibilitychange", refreshClock);
    };
  }, [hasActiveTrip]);
  useEffect(() => {
    if (!loaded || !exclusive) return;
    const checkpoint = () => {
      const s = current.current;
      if (s.active) {
        const at = Date.now();
        const active = view === "focus" && !document.hidden && document.hasFocus()
          ? returnFromBackground(s.active, at)
          : tick(s.active, at);
        commitRef.current({ ...s, active });
      }
    };
    const away = () => {
      if (current.current.active)
        commitRef.current({
          ...current.current,
          active: depart(current.current.active, Date.now()),
        });
    };
    const returned = () => {
      const s = current.current;
      if (s.active && view === "focus" && !document.hidden && document.hasFocus())
        commitRef.current({ ...s, active: returnFromBackground(s.active, Date.now()) });
    };
    const visibility = () => document.hidden ? away() : returned();
    const interval = setInterval(checkpoint, 5000);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", away);
    window.addEventListener("blur", away);
    window.addEventListener("focus", returned);
    if (view !== "focus" && current.current.active)
      commitRef.current({ ...current.current, active: leaveFocusView(current.current.active, Date.now()) });
    else returned();
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", away);
      window.removeEventListener("blur", away);
      window.removeEventListener("focus", returned);
    };
  }, [loaded, exclusive, view]);
  async function run<T>(action: () => Promise<T>): Promise<void> {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Thao tác chưa hoàn tất. Hãy thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  const syncing = useRef<Promise<void> | null>(null);
  function sync(): Promise<void> {
    if (needsLogin) return Promise.reject(new Error("Đăng nhập lại để đồng bộ. Phiên và dữ liệu cục bộ vẫn được giữ."));
    if (syncing.current) return syncing.current;
    const id = ownerRef.current;
    syncing.current = (async () => {
      if (id === "guest") {
        const isCurrent = () => workspaceLive.current && ownerRef.current === id;
        while (isCurrent()) {
          const unpublished = Object.values(current.current.local.sessions).filter(session =>
            session.userId === "guest" && !current.current.guestPublished?.includes(session.id));
          if (!unpublished.length) return;
          await publishGuestSessions({
            sessions: unpublished,
            publishedIds: current.current.guestPublished ?? [],
            isCurrent,
            continueAfterFailure: permanentGuestFailure,
            send: session => post<{ tripCode: string }>("/adventure/guest-sessions", session, false),
            markPublished: sessionId => commit({ ...current.current,
              guestPublished: [...new Set([...(current.current.guestPublished ?? []), sessionId])] }),
            onStatus: status => setGuestPublication(value => ({ ...value, [status.sessionId]: status })),
          });
          // Stop on a failed request/save; retain unacknowledged trips for the next retry.
          if (unpublished.some(session => !current.current.guestPublished?.includes(session.id))) return;
        }
        return;
      }
      while (current.current.pending.length) {
        const session = current.current.pending[0];
        const result = await post<Snapshot>("/adventure/sessions", session);
        if (ownerRef.current !== id) return;
        if (
          !commit({
            ...current.current,
            pending: current.current.pending.filter((p) => p.id !== session.id),
            snapshot: result,
          })
        )
          return;
      }
      const result = await request<Snapshot>("/adventure");
      if (ownerRef.current === id)
        commit({ ...current.current, snapshot: result });
    })().finally(() => {
      syncing.current = null;
    });
    return syncing.current;
  }
  useEffect(() => {
    if (!loaded || !exclusive || !online || needsLogin) return;
    let disposed = false;
    if (owner === "guest") {
      const retry = () => { void sync().catch(e => {
          if (!disposed) setError(e instanceof Error ? e.message : "Chưa gửi được chuyến vào lịch sử.");
        }); };
      retry();
      const interval = setInterval(retry, 60000);
      return () => { disposed = true; clearInterval(interval); };
    }
    void sync()
      .then(() =>
        request<{ topics: { id: string; name: string }[] }>("/topics"),
      )
      .then((r) => {
        if (!disposed) {
          setTopics(r.topics);
        }
      })
      .catch((e) => {
        if (!disposed)
          setError(e instanceof Error ? e.message : "Chưa đồng bộ được.");
      });
    return () => {
      disposed = true;
    };
    // Sync on sign-in and reconnection; explicit refresh is also available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, exclusive, owner, online, needsLogin]);
  const data = saved.snapshot;
  const carriage = data?.person;
  const group = data?.group;
  const pendingSoloSeconds = saved.pending.filter(session => !session.groupId &&
    session.userId === owner && !data?.sessions.some(stored => stored.id === session.id))
    .reduce((total, session) => total + session.seconds, 0);
  const pendingSoloProgress = explorationProgress(carriage?.journey, pendingSoloSeconds);
  const personalJourney = carriage?.journey && pendingSoloSeconds > 0
    ? { ...carriage.journey, station: pendingSoloProgress.station, remaining: pendingSoloProgress.remainingSeconds }
    : carriage?.journey;
  const journey = mode === "group" && group ? group.journey : personalJourney;
  const trainCars =
    mode === "group" && group
      ? group.members
      : [
          {
            id: owner,
            name: carriage?.name ?? "Toa Mây",
            color: carriage?.color ?? "#398575",
          },
        ];
  const availableTopics = [
    ...studyTopics,
    ...topics.filter((t) => !studyTopics.some((s) => s.id === t.id)),
  ];
  const active = saved.active
    ? tick(saved.active, Math.max(now, saved.active.lastAt))
    : null;
  // Group contributions need server confirmation of membership and the daily cap.
  const rest = active ? breakStatus(active, now) : null;
  const mapActive = active && !(mode === "group" && group) && active.groupId === null ? active : null;
  const mapProgress = explorationProgress(journey, mapActive ? focused(mapActive) : 0, mapActive?.target);
  const sessions = [...saved.pending, ...(data?.sessions ?? [])];
  const summarySession = summary
    ? sessions.find((session) => session.id === summary.id) ?? summary
    : view === "summary"
      ? sessions.find((session) => session.id === saved.summarySessionId) ?? null
      : null;
  const minutesTotal = Math.floor((carriage?.seconds ?? 0) / 60);
  const go = (next: string) => {
    if (next !== "focus" && current.current.active)
      commit({ ...current.current, active: leaveFocusView(current.current.active, Date.now()) });
    setError("");
    setNotice("");
    setView(next);
    window.scrollTo({ top: 0, behavior: "auto" });
  };
  async function mutation(path: string, body: unknown): Promise<Snapshot> {
    if (needsLogin) throw new Error("Đăng nhập lại để cập nhật đoàn hoặc đồng bộ trang trí.");
    const id = ownerRef.current;
    const result = await post<Snapshot>(`/adventure/${path}`, body);
    if (ownerRef.current === id && workspaceLive.current)
      commit({ ...current.current, snapshot: result });
    return result;
  }
  function start() {
    if (
      busy || materialRequest.current ||
      !loaded ||
      !exclusive ||
      current.current.active ||
      goal.trim().length < 3 ||
      minutes < 1 ||
      minutes > 240 ||
      !Number.isInteger(minutes) || !validBreaks
    )
      return;
    const at = Date.now();
    const trip: ActiveTrip = {
      id: crypto.randomUUID(),
      owner,
      goal: goal.trim(),
      topic,
      document: documentText,
      materials,
      sources,
      target: minutes * 60,
      breakPlan: breakCount > 0 ? plannedBreaks : undefined,
      deviceCategory: detectDeviceCategory(navigator.userAgent, navigator.maxTouchPoints),
      groupId: mode === "group" && group ? group.id : null,
      started: at,
      lastAt: at,
      segments: [],
      state: "focus",
      reconnect: 0,
    };
    if (commit({ ...current.current, active: trip })) {
      setSummary(null);
      go("focus");
    }
  }
  function finish() {
    const trip = current.current.active;
    const at = Date.now();
    if (!trip || at < trip.lastAt) return;
    const next = tick(trip, at);
    const s: Session = {
      id: next.id,
      userId: owner,
      groupId: next.groupId,
      goal: next.goal,
      topic: next.topic,
      started: next.started,
      ended: sessionEndAt(trip, at),
      target: next.target,
      breakPlan: next.breakPlan,
      segments: next.segments,
      seconds: focused(next),
      contribution: 0,
      rules: "train-v1",
      distractions: next.distractions ?? 0,
      deviceCategory: next.deviceCategory,
    };
    const value = structuredClone(current.current);
    value.active = null;
    value.notes[s.id] = next.document;
    (value.materials ??= {})[s.id] = next.materials ?? [];
    (value.sources ??= {})[s.id] = next.sources ?? [];
    value.summarySessionId = s.id;
    if (owner === "guest") {
      try {
        const result = settle(value.local, s, at);
        value.snapshot = snapshot(value.local, owner, at);
        s.contribution = result.contribution;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không lưu được phiên.");
        return;
      }
    } else value.pending.push(s);
    if (commit(value)) {
      setConfirm(null);
      setSummary(s);
      go("summary");
      if (online) void run(sync);
    }
  }
  useEffect(() => {
    finishRef.current = finish;
  });
  async function customize(
    color = carriage?.color ?? "#398575",
    decor = carriage?.decor ?? "plant",
    at = now,
  ) {
    const value = {
      name: carriageName.trim() || carriage?.name || "Toa Mây",
      color,
      decor,
    };
    if (user) await mutation("carriage", value);
    else {
      const local = structuredClone(current.current.local);
      Object.assign(person(local, owner), value);
      commit({
        ...current.current,
        local,
        snapshot: snapshot(local, owner, at),
      });
    }
    setNotice("Đã lưu toa của bạn.");
  }
  function exportData() {
    downloadData(JSON.stringify(current.current, null, 2), "vien-du-backup.json");
  }
  async function importMaterials(files: File[]) {
    if (!files.length || busy || materialRequest.current || !workspaceLive.current || view !== "ticket") return;
    if (files.length > 10 || materials.length + files.length > 10) {
      setError("Mỗi chuyến tối đa 10 tài liệu. Hãy gộp nội dung hoặc bắt đầu chuyến mới.");
      return;
    }
    const id = owner;
    const controller = new AbortController();
    materialRequest.current = controller;
    const isCurrent = () => workspaceLive.current && ownerRef.current === id &&
      materialRequest.current === controller && !controller.signal.aborted;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { extractMaterialFile } = await import("./materialExtraction");
      if (!isCurrent()) return;
      let used = sources.reduce((total, source) => total + source.text.length + source.name.length + 12, 0);
      const importedSources: MaterialSource[] = [];
      const originals = new Map<string, File>();
      const imported: MaterialInfo[] = [];
      for (const file of files) {
        if (!isCurrent()) return;
        setMaterialProgress({ file: file.name, phase: "loading", progress: 0 });
        const remaining = Math.max(0, 50000 - used - file.name.length - 12);
        const result = handwritten && file.size <= 32 * 1024 * 1024 && /\.(pdf|png|jpe?g|webp)$/i.test(file.name)
          ? {name:file.name,size:file.size,type:file.type,text:"",status:"empty",message:"Chữ viết tay: chọn Đọc bằng AI hoặc nhập bản chép rồi xác nhận.",source:"local-ocr",quality:"needs-review"}
          : await extractMaterialFile(file, {
          maxTextChars: remaining,
          signal: controller.signal,
          onProgress: (progress) => { if (isCurrent()) setMaterialProgress({ file: file.name, ...progress }); },
        });
        if (!isCurrent()) return;
        const { name, size, type, status, message } = result;
        const source = createMaterialSource(crypto.randomUUID(), result);
        imported.push({ sourceId:source.id, name, size, type, status, message });
        importedSources.push(source);
        originals.set(source.id, file);
        used += result.text.length + file.name.length + 12;
      }
      for (const [sourceId, file] of originals) originalFiles.current.set(sourceId, file);
      setSources((current) => [...current, ...importedSources]);
      setMaterials((current) => [...current, ...imported]);
      setNotice("Đã giữ nguồn tài liệu riêng với ghi chú. Kiểm tra kết quả đọc trước khi tạo câu hỏi.");
    } catch (e) {
      if (isCurrent()) setError(e instanceof Error ? e.message : "Không đọc được tài liệu.");
    } finally {
      if (materialRequest.current === controller) {
        materialRequest.current = null;
        if (workspaceLive.current && ownerRef.current === id) {
          setMaterialProgress(null);
          setBusy(false);
        }
      }
    }
  }
  async function readHandwriting(sourceId: string) {
    if (busy || materialRequest.current || view !== "ticket") return;
    if (!user || needsLogin) { setError("Đăng nhập để đọc chữ viết tay bằng AI."); return; }
    const file = originalFiles.current.get(sourceId);
    if (!file || file.size > 32 * 1024 * 1024) { setError("Hãy nhập lại tệp gốc, tối đa 32 MiB."); return; }
    const id = ownerRef.current;
    const controller = new AbortController();
    materialRequest.current = controller;
    const isCurrent = () => workspaceLive.current && ownerRef.current === id && materialRequest.current === controller && !controller.signal.aborted;
    setBusy(true); setError(""); setMaterialProgress({file:file.name,phase:"recognizing",progress:0});
    try {
      const data = await new Promise<string>((resolve,reject) => {
        const reader = new FileReader();
        const abort = () => { reader.abort(); reject(new Error("Đã hủy đọc tài liệu.")); };
        controller.signal.addEventListener("abort",abort,{once:true});
        reader.onload = () => { controller.signal.removeEventListener("abort",abort); resolve(String(reader.result).split(",")[1] ?? ""); };
        reader.onerror = () => { controller.signal.removeEventListener("abort",abort); reject(new Error("Không đọc được tệp gốc.")); };
        reader.readAsDataURL(file);
      });
      if (!isCurrent()) return;
      const extension = file.name.split(".").pop()?.toLowerCase();
      const mimeType = extension === "pdf" ? "application/pdf" : extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
      const result = await request<{text:string;message?:string}>("/materials/read", {method:"POST",body:JSON.stringify({mimeType,data}),signal:controller.signal});
      if (!isCurrent()) return;
      setSources((items) => items.map((source) => source.id === sourceId ? {...source,text:result.text,source:"ai-vision",requiresReview:true,reviewed:false} : source));
      setMaterials((items) => items.map((item) => item.sourceId === sourceId ? {...item,status:result.text ? "extracted" : "empty",message:result.message ?? "AI đã đọc. Hãy kiểm tra từ vựng, nghĩa và các chỗ [không rõ]."} : item));
      setNotice("AI đã đọc tệp gốc. Kiểm tra và sửa nội dung trước khi xác nhận làm nguồn câu hỏi.");
    } catch(e) { if (isCurrent()) setError(e instanceof Error ? e.message : "Không đọc được chữ viết tay."); }
    finally { if (materialRequest.current === controller) { materialRequest.current = null; if(workspaceLive.current && ownerRef.current === id) {setBusy(false);setMaterialProgress(null);} } }
  }
  function exportRawData() {
    try {
      downloadData(localStorage.getItem(`train-adventure:v1:${owner}`) ?? "null", "vien-du-recovery.json");
    } catch {
      setError("Trình duyệt đang chặn truy cập bộ nhớ. Hãy bật lưu trữ cho ứng dụng rồi tải lại.");
    }
  }
  function downloadData(text: string, filename: string) {
    const blob = new Blob([text], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function generateQuiz(session: Session, count: number): Promise<QuizQuestion[]> {
    if (!user || needsLogin) throw new Error("Đăng nhập lại để tạo quiz AI.");
    const id = ownerRef.current;
    if (current.current.summarySessionId !== session.id)
      throw new Error("Chuyến đã đổi. Hãy mở lại chuyến cần ôn tập.");
    await sync();
    if (ownerRef.current !== id || !workspaceLive.current ||
        current.current.summarySessionId !== session.id)
      throw new Error("Chuyến đã đổi trước khi quiz được tạo.");
    if (current.current.snapshot?.sessions.find((item) => item.id === session.id)?.quiz)
      throw new Error("Chuyến này đã có điểm. Hãy mở một chuyến ôn tập mới để làm thêm câu hỏi.");
    const text = quizSourceText(current.current.notes[session.id] ?? "",
      current.current.sources?.[session.id] ?? [], current.current.materials?.[session.id] ?? []);
    const result = await post<QuizQuestion[]>("/quiz/generate", {
      topic: session.topic,
      goal: session.goal,
      count,
      documentAttached: Boolean(current.current.materials?.[session.id]?.length),
      ...(text && text.length >= 10 && text.length <= 50000 ? { documentText: text } : {}),
    });
    if (ownerRef.current !== id || !workspaceLive.current ||
        current.current.summarySessionId !== session.id)
      throw new Error("Chuyến đã đổi trước khi quiz được lưu.");
    return result;
  }
  function saveQuizDraft(ownerId: string, sessionId: string, draft: QuizDraft) {
    if (!workspaceLive.current || ownerRef.current !== ownerId ||
        current.current.summarySessionId !== sessionId) return;
    commitRef.current({
      ...current.current,
      quizDrafts: updateQuizDrafts(current.current.quizDrafts, sessionId, draft),
    });
  }
  async function gradeQuiz(sessionId: string, answers: { id: string; selected: number }[]): Promise<Session> {
    if (!user || needsLogin) throw new Error("Đăng nhập lại để chấm quiz.");
    const id = ownerRef.current;
    if (!workspaceLive.current || current.current.summarySessionId !== sessionId)
      throw new Error("Chuyến đã đổi. Hãy mở lại chuyến cần chấm.");
    const result = await mutation("quiz", { sessionId, answers });
    if (ownerRef.current !== id || !workspaceLive.current ||
        current.current.summarySessionId !== sessionId)
      throw new Error("Chuyến đã đổi trước khi kết quả quiz được hiển thị.");
    const graded = result.sessions.find((session) => session.id === sessionId);
    if (!graded) throw new Error("Máy chủ chưa trả lại chuyến đã chấm.");
    return graded;
  }
  function startReviewTrip(session: Session) {
    if (current.current.active) {
      go("focus");
      setNotice("Chuyến hiện tại vẫn đang chạy. Kết thúc chuyến đó trước khi chuẩn bị chuyến ôn tập.");
      return;
    }
    const plan = reviewPlan(
      session,
      current.current.notes[session.id] ?? "",
      current.current.materials?.[session.id] ?? [],
    );
    setGoal(plan.goal);
    setTopic(plan.topic);
    setDocumentText(plan.documentText);
    setMaterials(plan.materials);
    const restoredSources = current.current.sources?.[session.id] ?? [];
    setSources(structuredClone(restoredSources.length ? restoredSources : plan.materials.length ? [recoveredMaterialSource(plan.documentText,plan.materials)] : []));
    setMinutes(plan.minutes);
    setBreakCount(0);
    setBreakMinutes(5);
    setMode(session.groupId && group && session.groupId === group.id ? "group" : "solo");
    go("ticket");
  }
  const progress = journey
    ? Math.min(100, (journey.remaining / journey.threshold) * 100)
    : 0;
  return (
    <div className="adventure">
      <aside className="sidebar">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            go("station");
          }}
        >
          <span className="brand-icon">▥</span>
          <span>
            viễn du<small>HỌC TẬP · KHÁM PHÁ</small>
          </span>
        </a>
        <div className="nav-heading">KHÔNG GIAN CỦA BẠN</div>
        <nav aria-label="Điều hướng chính">
          {nav.map((n) => (
            <button
              key={n.id}
              className={view === n.id ? "nav active" : "nav"}
              aria-current={view === n.id ? "page" : undefined}
              onClick={() => go(n.id)}
            >
              <span>{n.icon}</span>
              {n.label}
              {n.id === "station" && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="little-ticket">
            <span>✧ Mỗi ngày một chút</span>
            <p>
              Không cần đi thật nhanh.
              <br />
              Chỉ cần tiếp tục hành trình.
            </p>
          </div>
          <button className="account" onClick={() => go("account")}>
            <span className="avatar">{(user?.name ?? "B")[0]}</span>
            <span>
              {user?.name ?? "Bạn lữ hành"}
              <small>
                {user ? "Tài khoản của bạn" : "Đang học trên thiết bị này"}
              </small>
            </span>
            <span>↗</span>
          </button>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span>
            Không gian học tập <span className="slash">/</span>{" "}
            <strong>
              {nav.find((n) => n.id === view)?.label ??
                (
                  {
                    ticket: "Vé học",
                    focus: "Chuyến đang chạy",
                    summary: "Thành quả",
                    account: "Tài khoản",
                  } as Record<string, string>
                )[view] ??
                "Ga chính"}
            </strong>
          </span>
          <div className="top-actions">
            <span className={`connection ${online ? "" : "offline"}`}>
              {online && !authOffline && !needsLogin
                ? "● Sẵn sàng lên đường"
                : "○ Đang offline"}
            </span>
            <button
              aria-label="Mở tài khoản"
              className="avatar"
              onClick={() => go("account")}
            >
              {(user?.name ?? "B")[0]}
            </button>
          </div>
        </header>
        <main key={view} className="view-entrance">
          {error && (
            <div className="message error" role="alert">
              {error}
              <button
                aria-label="Đóng thông báo lỗi"
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}
          {notice && (
            <div className="message" role="status">
              {notice}
            </div>
          )}
          {needsLogin && <div className="sync-banner"><span>Hành trình đang dùng dữ liệu trên thiết bị. Đăng nhập lại để đồng bộ; bạn vẫn có thể tiếp tục học.</span><button onClick={() => go("account")}>Đăng nhập lại</button></div>}
          {saved.pending.length > 0 && (
            <div className="sync-banner">
              <span>
                {saved.pending.length} phiên đã lưu trên thiết bị · chờ máy chủ
                xác nhận
              </span>
              <button
                disabled={busy || !user || !online || needsLogin}
                onClick={() => void run(sync)}
              >
                Đồng bộ lại ↻
              </button>
            </div>
          )}
          {!loaded ? (
            <div className="empty">
              <h1>{storageError ? "Cần khôi phục dữ liệu hành trình" : error ? "Chưa mở được hành trình" : "Đang mở toa của bạn…"}</h1>
              <p>{storageError ? "Tải bản dữ liệu gốc để giữ lại trước khi tạo hành trình mới trên thiết bị này." : "Dữ liệu hành trình sẽ xuất hiện tại đây."}</p>
              {storageError && <div className="choice-row">
                <button className="primary" onClick={exportRawData}>Tải dữ liệu gốc</button>
                <button onClick={() => setConfirm("reset")}>Tạo lại hành trình cục bộ</button>
              </div>}
              {error && <button onClick={() => window.location.reload()}>Thử mở lại</button>}
            </div>
          ) : (
            <>
              {view === "station" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        CHƯƠNG 01 · THEO DẤU BÌNH MINH
                      </div>
                      <h1>
                        Một hành trình mới,
                        <br />
                        bắt đầu từ hôm nay<span className="orange">.</span>
                      </h1>
                      <p>
                        Dành một khoảng lặng cho việc học. Để toa tàu đưa bạn đi
                        xa.
                      </p>
                    </div>
                    <div className="date-chip">
                      ◷{" "}
                      <span>
                        {new Date(now).toLocaleDateString("vi-VN", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="dashboard-grid">
                    <section className="hero-card">
                      <div className="hero-label">
                        <span className="pill">
                          ✦ HÀNH TRÌNH CỦA{" "}
                          {mode === "group" && group ? "ĐOÀN" : "BẠN"}
                        </span>
                        <span className="chapter">
                          0{(journey?.station ?? 0) + 1} / 05
                        </span>
                      </div>
                      <JourneyView
                        journey={journey}
                        carriages={trainCars}
                        ownId={owner}
                        decor={carriage?.decor}
                      />
                      <div className="hero-caption">
                        <div>
                          <span className="eyebrow">BẠN ĐANG Ở</span>
                          <h2>{stations[journey?.station ?? 0]}</h2>
                          <p>{stories[journey?.station ?? 0]}</p>
                        </div>
                        <button
                          className="round-button"
                          aria-label="Xem bản đồ"
                          onClick={() => go("map")}
                        >
                          ↗
                        </button>
                      </div>
                      <div className="journey-progress">
                        <div>
                          <span>
                            {journey?.station === 4
                              ? "Đã đến đích · phần dư được giữ lại"
                              : `Trạm tiếp theo: ${stations[(journey?.station ?? 0) + 1]}`}
                          </span>
                          <strong>
                            {Math.floor((journey?.remaining ?? 0) / 60)} /{" "}
                            {Math.floor((journey?.threshold ?? 1800) / 60)} phút
                          </strong>
                        </div>
                        <progress max="100" value={progress} />
                      </div>
                    </section>
                    <section className="ticket-card">
                      <div className="eyebrow">CHUYẾN ĐI TIẾP THEO</div>
                      <h2>
                        Mang mục tiêu nhỏ,
                        <br />
                        đi một chặng xa.
                      </h2>
                      <p>
                        Mỗi phút tập trung nuôi lớn toa tàu và mở ra vùng đất
                        mới.
                      </p>
                      <div className="ticket-divider" />
                      <label className="field-label" htmlFor="quick-goal">
                        HÔM NAY BẠN MUỐN HỌC GÌ?
                      </label>
                      <textarea
                        id="quick-goal"
                        maxLength={500}
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="Ví dụ: Hiểu chương 2 môn Sinh học…"
                        rows={3}
                      />
                      <DurationPicker value={minutes} onChange={setMinutes} breakCount={breakCount} breakMinutes={breakMinutes} onBreakCountChange={setBreakCount} onBreakMinutesChange={setBreakMinutes} />
                      <button
                        className="primary"
                        onClick={() => go(active ? "focus" : "ticket")}
                      >
                        {active
                          ? "Tiếp tục chuyến đang học"
                          : "Chuẩn bị lên tàu"}{" "}
                        <span>→</span>
                      </button>
                      <small className="ticket-footnote">
                        ♧ Đi một mình cũng là một hành trình đẹp.
                      </small>
                    </section>
                  </div>
                  <div className="stat-row">
                    <Stat
                      icon="◷"
                      label="PHÚT ĐÃ TẬP TRUNG"
                      value={`${minutesTotal}`}
                      detail="Từng phút đều có ý nghĩa"
                    />
                    <Stat
                      icon="▤"
                      label="CHUYẾN ĐÃ LƯU"
                      value={`${sessions.length}`}
                      detail="Gồm cả những chặng ngắn"
                    />
                    <Stat
                      icon="⚑"
                      label="TRẠM ĐÃ KHÁM PHÁ"
                      value={`${(carriage?.journey.station ?? 0) + 1} / 5`}
                      detail="Một thế giới đang chờ bạn"
                    />
                  </div>
                  <div className="section-heading">
                    <h2>Hành trình là của bạn</h2>
                    <span>Từng bước nhỏ, mỗi ngày</span>
                  </div>
                  <div className="feature-row">
                    <button className="feature" onClick={() => go("carriage")}>
                      <span className="feature-icon peach">▣</span>
                      <div>
                        <h3>Một toa mang dấu ấn riêng</h3>
                        <p>Đổi màu, đặt tên và lưu những kỷ niệm.</p>
                      </div>
                      <span>↗</span>
                    </button>
                    <button className="feature" onClick={() => go("group")}>
                      <span className="feature-icon green">♧</span>
                      <div>
                        <h3>Cùng bạn bè đi xa hơn</h3>
                        <p>Nối toa. Khác lịch học, chung điểm đến.</p>
                      </div>
                      <span>↗</span>
                    </button>
                  </div>
                </>
              )}
              {view === "ticket" && (
                <>
                  <Heading
                    kicker="TẤM VÉ CỦA BẠN"
                    title="Bạn muốn đi đâu hôm nay?"
                    text="Chọn một mục tiêu vừa sức. Bạn có thể kết thúc và lưu phần đã học."
                  />
                  <div className="two-columns">
                    <section className="panel form">
                      <label>
                        Mục tiêu học tập
                        <textarea
                          value={goal}
                          maxLength={500}
                          onChange={(e) => setGoal(e.target.value)}
                          placeholder="Mình muốn hiểu điều gì sau chuyến này?"
                        />
                      </label>
                      <label>
                        Chủ đề
                        <select
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                        >
                          {availableTopics.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <DurationPicker value={minutes} onChange={setMinutes} breakCount={breakCount} breakMinutes={breakMinutes} onBreakCountChange={setBreakCount} onBreakMinutesChange={setBreakMinutes} />
                      <label>
                        Ghi chú riêng (độc lập với tệp)
                        <textarea
                          rows={5}
                          maxLength={50000}
                          disabled={busy}
                          value={documentText}
                          onChange={(e) => setDocumentText(e.target.value)}
                          placeholder="Dán nội dung bài học. Chỉ gửi tới dịch vụ AI khi bạn chọn tạo quiz."
                        />
                      </label>
                      <label className="handwriting-option"><input type="checkbox" checked={handwritten} disabled={busy} onChange={(e) => setHandwritten(e.target.checked)} /> Tài liệu viết tay · đọc bằng AI hoặc tự chép</label>
                      <label className="file-label">
                        Nhập tài liệu · mọi loại tệp
                        <input
                          type="file"
                          multiple
                          disabled={busy}
                          onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            e.target.value = "";
                            void importMaterials(files);
                          }}
                        />
                      </label>
                      <p className="material-hint">Word (.docx), PowerPoint (.pptx), Excel (.xlsx/.xls), PDF, OpenDocument và văn bản. OCR đọc tiếng Việt và tiếng Anh từ PDF quét, ảnh PNG/JPG/WebP/BMP ngay trên thiết bị. Tối đa 32 MiB/tệp, 10 tệp/chuyến, 50.000 ký tự; ảnh tối đa 20 megapixel, PDF tối đa 20 trang được đọc và 20 trang dùng OCR. Tệp chưa hỗ trợ đọc vẫn hiển thị tên và báo trạng thái.</p>
                      {materialProgress && <div className="material-progress">
                        <p role="status"><strong>{materialProgress.file}</strong><br/>
                          {{ loading: "Đang nạp bộ đọc", recognizing: "Đang nhận diện chữ (OCR)", rendering: "Đang dựng trang", extracting: "Đang đọc văn bản" }[materialProgress.phase]}
                          {materialProgress.page != null && ` · Trang ${materialProgress.page}${materialProgress.totalPages ? `/${materialProgress.totalPages}` : ""}`}
                        </p>
                        <progress aria-label="Tiến độ đọc tài liệu" max={1} value={materialProgress.progress} />
                        <button onClick={() => materialRequest.current?.abort()}>Hủy đọc tài liệu</button>
                      </div>}
                      <p className="material-hint">Xóa ghi chú không xóa nguồn tài liệu. Nút “Đọc bằng AI” gửi riêng tệp đã chọn tới máy chủ và Google Gemini để nhận diện chữ viết tay; bạn kiểm tra kết quả trước khi dùng. Tệp gốc chỉ được giữ tạm trong bộ nhớ cửa sổ này.</p>
                      {sources.map((source) => <details className="material-source" key={source.id} open={!source.reviewed}>
                        <summary>{source.name} · {source.reviewed ? "Đã kiểm tra" : "Cần kiểm tra nội dung"}</summary>
                        <label>Nội dung nguồn · {source.name}<textarea rows={8} maxLength={50000} disabled={busy} value={source.text} onChange={(e) => setSources((items) => items.map((item) => item.id === source.id ? {...item,text:e.target.value,reviewed:false} : item))} placeholder="Nhập hoặc sửa bản chép đúng của tài liệu. Không tự dịch nội dung." /></label>
                        <div className="choice-row">
                          <button disabled={busy || source.text.trim().length < 10} onClick={() => { try { const reviewed = reviewMaterialSource(source, source.text); setSources((items) => items.map((item) => item.id === source.id ? reviewed : item)); setError(""); } catch(e) { setError(e instanceof Error ? e.message : "Không xác nhận được tài liệu."); } }}>Xác nhận nội dung đã kiểm tra</button>
                          <button disabled={busy || !originalFiles.current.has(source.id) || !/\.(pdf|png|jpe?g|webp)$/i.test(source.name)} onClick={() => void readHandwriting(source.id)}>Đọc bằng AI · gửi tệp này</button>
                          <button disabled={busy} onClick={() => { originalFiles.current.delete(source.id); setSources((items) => items.filter((item) => item.id !== source.id)); setMaterials((items) => items.filter((file) => source.covers ? !source.covers.includes(file.name) : file.sourceId !== source.id)); }}>Gỡ tài liệu</button>
                        </div>
                        {!originalFiles.current.has(source.id) && <small>Muốn đọc lại bằng AI, hãy nhập lại tệp gốc.</small>}
                      </details>)}
                      {!!materials.length && <ul className="material-list" aria-label="Tài liệu đã chọn">{materials.map((file, i) => <li key={`${i}:${file.name}`}>
                        <strong>{file.name}</strong><span>{(file.size / 1024).toFixed(1)} KB · {file.message}</span>
                      </li>)}</ul>}
                    </section>
                    <section className="panel form">
                      <div className="eyebrow">ĐIỂM ĐẾN</div>
                      <h2>{stations[journey?.station ?? 0]}</h2>
                      <div className="choice-row">
                        <button
                          className={mode === "solo" ? "selected" : ""}
                          onClick={() => setMode("solo")}
                        >
                          Một mình
                        </button>
                        <button
                          disabled={!group}
                          className={mode === "group" ? "selected" : ""}
                          onClick={() => setMode("group")}
                        >
                          Cùng đoàn
                        </button>
                      </div>
                      <p>
                        {mode === "group"
                          ? "Đóng góp được máy chủ xác nhận sau phiên, tối đa 60 phút/ngày theo múi giờ đoàn."
                          : "Tiến độ được giữ trong hành trình cá nhân của bạn."}
                      </p>
                      <div className="info-box">
                        <h3>Hỗ trợ tập trung</h3>
                        <p>Mọi chuyến đã lưu, kể cả chuyến kết thúc sớm, sẽ tự công khai trong Lịch sử chuyến đi:
                          mã ẩn danh, chủ đề, tóm tắt mục tiêu, thời gian, loại thiết bị, số lần xao nhãng và điểm quiz.
                          Email tài khoản, tài liệu, lời giải và chi tiết trả lời được giữ riêng.</p>
                        <p>
                          Khi bạn rời cửa sổ, đồng hồ vẫn tiếp tục nhưng khoảng đó được ghi là
                          xao nhãng và không cộng vào thời gian học. Khi quay lại, phiên tiếp
                          tục ngay. Bạn có thể kết thúc và lưu phần đã học bất cứ lúc nào.
                        </p>
                        <p>
                          Web và bản desktop này chỉ nhắc tập trung; không chặn
                          ứng dụng khác.
                        </p>
                        <p>Đồng bộ phiên trong 30 ngày từ lúc bắt đầu. Khi offline, hãy giữ dữ liệu trình duyệt hoặc xuất bản sao.</p>
                        <p>
                          Quiz là tùy chọn. Điểm thấp không trừ tiến độ của bạn
                          hoặc đoàn.
                        </p>
                      </div>
                      <button
                        className="primary"
                        disabled={
                          busy ||
                          !!active ||
                          goal.trim().length < 3 ||
                          !Number.isInteger(minutes) ||
                          minutes < 1 ||
                          minutes > 240 || !validBreaks ||
                          !exclusive
                        }
                        onClick={start}
                      >
                        Bắt đầu chuyến ·{" "}
                        {Number.isFinite(minutes) ? minutes : "…"} phút →
                      </button>
                      {active && (
                        <button onClick={() => go("focus")}>
                          Tiếp tục phiên đang mở
                        </button>
                      )}
                    </section>
                  </div>
                </>
              )}
              {view === "focus" &&
                (active ? (
                  <>
                    <div className="focus-heading">
                      <span className="pill">
                        {active.groupId
                          ? "ĐỒNG HÀNH BẤT ĐỒNG BỘ"
                          : "CHUYẾN CÁ NHÂN"}
                      </span>
                      <h1>{active.goal}</h1>
                      <p>
                        {rest ? "Dừng chân một chút. Chuyến sẽ tự tiếp tục sau giải lao." : active.state === "away"
                          ? "Đồng hồ vẫn chạy. Khoảng thời gian bạn rời đi không được cộng vào thời gian học."
                          : "Không vội vàng. Chỉ cần hiện diện ở đây."}
                      </p>
                    </div>
                    <section className="focus-card">
                      <div
                        className="timer"
                        role="timer"
                        aria-label={rest ? "Thời gian giải lao còn lại" : "Thời gian học còn lại"}
                      >
                        {clock(rest ? rest.remainingSeconds : active.target - elapsedSeconds(active, now))}
                      </div>
                      {rest && <p className="break-status" role="status">Trạm dừng chân {rest.index}/{rest.count} · tự tiếp tục lúc {new Date(rest.endsAt).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})}</p>}
                      {active.breakPlan && <p className="material-hint">{active.target / 60} phút học · {active.breakPlan.count} lượt nghỉ × {active.breakPlan.seconds / 60} phút · tổng chuyến {totalDuration(active) / 60} phút</p>}
                      <div className="timer-label">
                        {Math.floor(focused(active) / 60)} PHÚT ĐÃ HỌC ·{" "}
                        {Math.round((focused(active) / active.target) * 100)}%
                        CHẶNG ĐƯỜNG
                        <br />
                        {active.distractions ?? 0} LẦN XAO NHÃNG
                      </div>
                      <JourneyView
                        initial="2d"
                        journey={
                          active.groupId && group?.id === active.groupId
                            ? group.journey
                            : personalJourney
                        }
                        carriages={
                          active.groupId && group?.id === active.groupId
                            ? group.members
                            : [
                                {
                                  id: owner,
                                  name: carriage?.name ?? "Toa Mây",
                                  color: carriage?.color ?? "#398575",
                                },
                              ]
                        }
                        ownId={owner}
                        decor={carriage?.decor}
                        fog={active.state === "away" && !rest}
                        calm
                        draftSeconds={active.groupId ? 0 : focused(active)}
                        targetSeconds={active.target}
                        focusState={rest ? "break" : active.state}
                        reconnect={active.reconnect}
                      />
                      {active.groupId && <p className="overhead-hint">Bản đồ đoàn mở thêm vùng sau khi máy chủ xác nhận phần đóng góp của phiên này.</p>}
                      <div className="focus-controls">
                        {now < active.lastAt && <div className="info-box">
                          <p>Đồng hồ thiết bị đang chạy lùi. Hãy đặt lại giờ đúng để tiếp tục; dữ liệu phiên vẫn được giữ.</p>
                          <button onClick={exportData}>Xuất bản sao phiên học</button>
                        </div>}
                        <button disabled={now < active.lastAt} onClick={() => setConfirm("finish")}>
                          Kết thúc và lưu
                        </button>
                      </div>
                    </section>
                    {active.document && (
                      <details className="panel study-notes">
                        <summary>Tài liệu của bạn · đọc ngay tại đây</summary>
                        <pre>{active.document}</pre>
                      </details>
                    )}
                    {active.sources?.map((source) => <details className="panel study-notes" key={source.id}><summary>Nguồn tài liệu · {source.name}{!source.reviewed && " · chưa kiểm tra"}</summary><pre>{source.text || "Chưa đọc được nội dung nguồn."}</pre></details>)}
                    {!!active.materials?.length && <div className="panel material-list" aria-label="Tệp của phiên học">{active.materials.map((file, i) => <p key={`${i}:${file.name}`}><strong>{file.name}</strong> · {file.message}</p>)}</div>}
                  </>
                ) : (
                  <Empty
                    title="Chưa có chuyến đang chạy"
                    text="Chuẩn bị một tấm vé và bắt đầu hành trình của bạn."
                    action="Chuẩn bị vé"
                    onClick={() => go("ticket")}
                  />
                ))}
              {view === "map" && (
                <>
                  <Heading
                    kicker="BẢN ĐỒ KHÁM PHÁ"
                    title="Theo dấu bình minh"
                    text="Năm trạm dừng. Vô vàn điều nhỏ bé để khám phá."
                  />
                  {group && (
                    <div className="choice-row">
                      <button
                        className={mode === "solo" ? "selected" : ""}
                        onClick={() => setMode("solo")}
                      >
                        Bản đồ của tôi
                      </button>
                      <button
                        className={mode === "group" ? "selected" : ""}
                        onClick={() => setMode("group")}
                      >
                        Bản đồ đoàn
                      </button>
                    </div>
                  )}
                  <JourneyView
                    initial="2d"
                    journey={journey}
                    carriages={trainCars}
                    ownId={owner}
                    decor={carriage?.decor}
                    draftSeconds={mapActive ? focused(mapActive) : 0}
                    targetSeconds={mapActive?.target}
                  />
                  {mode === "group" && group && <p className="overhead-hint">Bản đồ đoàn dùng tiến độ đã được máy chủ xác nhận, gồm giới hạn đóng góp mỗi ngày.</p>}
                  {mode === "solo" && pendingSoloSeconds > 0 && <p className="overhead-hint">Vùng đã học được giữ trên thiết bị; các phiên đang chờ đồng bộ sẽ được máy chủ xác nhận khi có mạng.</p>}
                  <div className="station-list">
                    {stations.map((s, i) => (
                      <article
                        key={s}
                        className={`station-stop ${i <= mapProgress.station ? "unlocked" : ""}`}
                      >
                        <span className="station-number">
                          {i <= mapProgress.station ? "✓" : "?"}
                        </span>
                        <div>
                          <small>
                            {i === mapProgress.station
                              ? "BẠN ĐANG Ở ĐÂY"
                              : i < mapProgress.station
                                ? "ĐÃ KHÁM PHÁ"
                                : "CHƯA MỞ"}
                          </small>
                          <h2>{i <= mapProgress.station ? s : "Vùng chưa khám phá"}</h2>
                          <p>
                            {i <= mapProgress.station
                              ? stories[i]
                              : "Học thêm để mở cảnh quan và câu chuyện ở trạm này."}
                          </p>
                        </div>
                        {i === mapProgress.station && (
                          <strong>
                            {Math.floor(mapProgress.remainingSeconds / 60)} phút
                            tích lũy
                          </strong>
                        )}
                      </article>
                    ))}
                  </div>
                  {journey?.voteUntil && (
                    <section className="panel">
                      <h2>Chọn ngã rẽ của hành trình</h2>
                      <p>
                        Hết hạn {date(journey.voteUntil)}. Hòa phiếu hoặc không
                        có phiếu: qua núi.
                      </p>
                      <div className="choice-row">
                        {(["mountain", "coast"] as const).map((branch) => (
                          <button
                            key={branch}
                            aria-pressed={journey.votes[owner] === branch}
                            className={
                              journey.votes[owner] === branch ? "selected" : ""
                            }
                            disabled={busy || needsLogin}
                            onClick={() =>
                              void run(async () => {
                                if (user)
                                  await mutation("vote", { mode, branch });
                                else {
                                  const local = structuredClone(
                                    current.current.local,
                                  );
                                  person(local, owner).journey.votes[owner] =
                                    branch;
                                  commit({
                                    ...current.current,
                                    local,
                                    snapshot: snapshot(
                                      local,
                                      owner,
                                      Date.now(),
                                    ),
                                  });
                                }
                              })
                            }
                          >
                            {branch === "mountain" ? "△ Qua núi" : "≈ Ven biển"}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                  <p className="muted">
                    Tuyến hiện tại:{" "}
                    {journey?.branch === "coast" ? "Ven biển" : "Qua núi"} · Mỗi
                    phút học hợp lệ tương ứng một đơn vị. Phần dư ở đích được
                    giữ lại.
                  </p>
                </>
              )}
              {view === "carriage" && (
                <>
                  <Heading
                    kicker="GÓC NHỎ CỦA RIÊNG BẠN"
                    title={carriage?.name ?? "Toa của tôi"}
                    text="Toa tàu luôn đi cùng bạn, kể cả khi bạn chuyển hoặc rời đoàn."
                  />
                  <Scene
                    color={carriage?.color}
                    decor={carriage?.decor}
                    station={journey?.station}
                    branch={journey?.branch}
                  />
                  <div className="two-columns">
                    <section className="panel form">
                      <h2>Đặt dấu ấn của bạn</h2>
                      <label>
                        Tên toa
                        <input
                          maxLength={60}
                          placeholder={carriage?.name}
                          value={carriageName}
                          onChange={(e) => setCarriageName(e.target.value)}
                        />
                      </label>
                      <button
                        disabled={busy}
                        onClick={() => {
                          const at = Date.now();
                          void run(() => customize(undefined, undefined, at));
                        }}
                      >
                        Lưu tên toa
                      </button>
                      <h3>Màu toa</h3>
                      <div className="swatches">
                        {["#398575", "#d98b55", "#7384b3", "#b97186"].map(
                          (color, i) => (
                            <button
                              key={color}
                              style={{ background: color }}
                              aria-label={
                                ["Xanh lá", "Cam đất", "Xanh tím", "Hồng"][i]
                              }
                              aria-pressed={carriage?.color === color}
                              disabled={busy}
                              onClick={() => {
                                const at = Date.now();
                                void run(() => customize(color, undefined, at));
                              }}
                            >
                              {carriage?.color === color ? "✓" : ""}
                            </button>
                          ),
                        )}
                      </div>
                      <h3>Góc cửa sổ</h3>
                      <div className="choice-row">
                        {["plant", "books", "stars"].map((decor, i) => (
                          <button
                            key={decor}
                            className={
                              carriage?.decor === decor ? "selected" : ""
                            }
                            disabled={busy}
                            onClick={() =>
                              {
                                const at = Date.now();
                                void run(() => customize(undefined, decor, at));
                              }
                            }
                          >
                            {["♣ Chậu cây", "▤ Sách", "✦ Ngôi sao"][i]}
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="panel">
                      <h2>Kệ kỷ niệm</h2>
                      <p>
                        Trang trí không tăng điểm học. Thành quả đến từ thời
                        gian bạn dành cho bản thân.
                      </p>
                      <div className="souvenirs">
                        <div>
                          ⚑<h3>Biển tên lữ hành</h3>
                          <p>
                            {sessions.length
                              ? "Đã có chuyến đầu tiên"
                              : "Hoàn thành một phiên để nhận"}
                          </p>
                        </div>
                        <div>
                          ✦<h3>Dấu ấn hiểu bài</h3>
                          <p>
                            {sessions.filter((s) => s.quiz).length} phiên đã làm
                            quiz
                          </p>
                        </div>
                        <div>
                          ♧<h3>Người khám phá</h3>
                          <p>
                            {(carriage?.journey.station ?? 0) + 1} trạm cá nhân
                          </p>
                        </div>
                      </div>
                      <h3>
                        {minutesTotal} XP · {Math.floor(minutesTotal / 60) + 1}{" "}
                        cấp toa
                      </h3>
                      <p>
                        1 phút học hợp lệ = 1 XP. Không mất XP vì nghỉ hoặc xao
                        nhãng.
                      </p>
                    </section>
                  </div>
                </>
              )}
              {view === "group" && (
                <>
                  <Heading
                    kicker="KHÁC LỊCH HỌC · CHUNG ĐIỂM ĐẾN"
                    title={group?.name ?? "Đi cùng những người bạn"}
                    text="Đoàn riêng từ 2 đến 6 người. Mỗi người giữ mục tiêu và nhịp học của mình."
                  />
                  {!user || needsLogin ? (
                    <Empty
                      title="Nối toa bằng một tài khoản"
                      text="Đăng nhập để mời bạn bè và đồng bộ hành trình. Bạn vẫn có thể học cá nhân ngay trên thiết bị."
                      action="Đăng nhập / đăng ký"
                      onClick={() => go("account")}
                    />
                  ) : group ? (
                    <>
                      <div className="group-cars">
                        {group.members.map((m) => (
                          <article className="panel member" key={m.id}>
                            <div
                              style={{ background: m.color }}
                              className="mini-car"
                            >
                              ▣
                            </div>
                            <h3>{m.name}</h3>
                            <p>
                              {m.id === group.owner ? "Chủ đoàn" : "Thành viên"}
                              {m.id === user.id ? " · Bạn" : ""}
                            </p>
                            {group.owner === user.id && m.id !== user.id && (
                              <button
                                disabled={busy}
                                onClick={() =>
                                  void run(() =>
                                    mutation("transfer", { userId: m.id }),
                                  )
                                }
                              >
                                Chuyển quyền chủ đoàn
                              </button>
                            )}
                          </article>
                        ))}
                      </div>
                      <div className="two-columns">
                        <section className="panel">
                          <h2>Chuyến đi chung</h2>
                          <p>
                            {group.members.length} / 6 toa · Múi giờ{" "}
                            {group.timezone}
                          </p>
                          <p>
                            Đã đến {stations[group.journey.station]}. Ngưỡng
                            chặng này được giữ nguyên khi thành viên thay đổi.
                          </p>
                          <button
                            className="primary"
                            onClick={() => {
                              setMode("group");
                              go("ticket");
                            }}
                          >
                            Đóng góp một phiên học →
                          </button>
                          <h3>Nhật ký đoàn</h3>
                          {group.journey.journal.length ? (
                            group.journey.journal.map((e, i) => (
                              <p key={i}>
                                {date(e.at)} · {e.text}
                              </p>
                            ))
                          ) : (
                            <p>
                              Chuyến đi đang bắt đầu. Hãy cùng nhau mở trạm đầu
                              tiên.
                            </p>
                          )}
                        </section>
                        <section className="panel form">
                          <h2>Lời mời & quyền riêng tư</h2>
                          <p>
                            Chỉ tên toa và trang trí được chia sẻ. Đoàn không
                            thấy tài liệu, lời giải hay chi tiết trả lời quiz.
                          </p>
                          {group.owner === user.id && (
                            <>
                              <button
                                disabled={busy}
                                onClick={() =>
                                  void run(async () =>
                                    setInviteResult(
                                      await post("/adventure/invite", {}),
                                    ),
                                  )
                                }
                              >
                                Tạo mã mời (hết hạn sau 24 giờ)
                              </button>
                              {inviteResult && (
                                <div className="info-box">
                                  <label>
                                    Mã mời
                                    <input
                                      readOnly
                                      value={inviteResult.token}
                                      onFocus={(e) => e.target.select()}
                                    />
                                  </label>
                                  <small>
                                    Hết hạn {date(inviteResult.expires)}
                                  </small>
                                  <button
                                    disabled={busy}
                                    onClick={() =>
                                      void run(async () => {
                                        await navigator.clipboard.writeText(
                                          inviteResult.token,
                                        );
                                        setNotice("Đã sao chép mã mời.");
                                      })
                                    }
                                  >
                                    Sao chép
                                  </button>
                                </div>
                              )}
                              <button
                                disabled={busy}
                                onClick={() =>
                                  void run(async () => {
                                    await post("/adventure/invite/revoke", {});
                                    setInviteResult(null);
                                    setNotice("Đã thu hồi các mã mời.");
                                  })
                                }
                              >
                                Thu hồi lời mời
                              </button>
                            </>
                          )}
                          <button
                            className="danger-button"
                            disabled={
                              !!active || saved.pending.length > 0 || busy
                            }
                            onClick={() => setConfirm("leave")}
                          >
                            Rời đoàn
                          </button>
                          <small>
                            Hãy đồng bộ các phiên trước khi rời. Chủ đoàn rời sẽ
                            chuyển quyền cho thành viên tham gia sớm nhất còn
                            lại.
                          </small>
                          <button
                            disabled={busy}
                            onClick={() => void run(sync)}
                          >
                            Cập nhật tiến độ ↻
                          </button>
                        </section>
                      </div>
                    </>
                  ) : (
                    <div className="two-columns">
                      <section className="panel form">
                        <h2>Mở một đoàn mới</h2>
                        <label>
                          Tên đoàn
                          <input
                            maxLength={60}
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Những người đi tìm bình minh"
                          />
                        </label>
                        <button
                          className="primary"
                          disabled={busy || !groupName.trim()}
                          onClick={() =>
                            void run(() =>
                              mutation("groups", {
                                name: groupName,
                                timezone:
                                  Intl.DateTimeFormat().resolvedOptions()
                                    .timeZone,
                              }),
                            )
                          }
                        >
                          Tạo đoàn của bạn →
                        </button>
                      </section>
                      <section className="panel form">
                        <h2>Bạn có một lời mời?</h2>
                        <label>
                          Mã mời
                          <input
                            value={invite}
                            onChange={(e) => setInvite(e.target.value)}
                            placeholder="Dán mã bạn nhận được"
                          />
                        </label>
                        <button
                          disabled={busy || !invite.trim()}
                          onClick={() =>
                            void run(() =>
                              mutation("join", { token: invite.trim() }),
                            )
                          }
                        >
                          Nối toa vào đoàn
                        </button>
                      </section>
                    </div>
                  )}
                  <div className="info-box">
                    <strong>Đồng hành bất đồng bộ</strong>
                    <p>
                      Tiến độ chỉ cộng sau khi phiên học được xác nhận. Bản này
                      chưa có phòng khởi hành trực tiếp hoặc thưởng phối hợp
                      thời gian thực.
                    </p>
                  </div>
                </>
              )}
              {view === "journal" && (
                <>
                  <Heading
                    kicker="NHỮNG CHẶNG ĐƯỜNG ĐÃ QUA"
                    title="Nỗ lực của bạn, được giữ lại."
                    text="Phiên ngắn hay dài đều có giá trị. Mục tiêu tóm tắt và điểm quiz sẽ xuất hiện trong lịch sử công khai."
                  />
                  {sessions.length ? (
                    <div className="session-list">
                      {sessions.map((s) => {
                        const analysis = analyzeSession(s);
                        const gaps = knowledgeGaps(s.quiz);
                        return (
                          <button
                            key={s.id}
                            className="session-row"
                            onClick={() => {
                              setSummary(s);
                              commitRef.current({ ...current.current, summarySessionId: s.id });
                              go("summary");
                            }}
                          >
                            <span className="feature-icon green">▤</span>
                            <div className="session-row-content">
                              <h3>{s.goal}</h3>
                              <p>
                                {date(s.ended)} ·{" "}
                                {s.groupId ? "Đóng góp cho đoàn" : "Cá nhân"} ·{" "}
                                {saved.pending.some((p) => p.id === s.id)
                                  ? "Chờ đồng bộ"
                                  : "Đã lưu"}
                              </p>
                              <div className="session-analysis">
                                {analysis.breakSeconds > 0 && <p>Giải lao: {clock(analysis.breakSeconds)} · không tính xao nhãng hoặc XP</p>}
                                <span>{analysis.focusLabel} · {analysis.focusPercent === null ? "—" : `${Math.floor(analysis.focusPercent)}%`} tập trung</span>
                                <span>Số lần xao nhãng: <b>{analysis.distractions}</b></span>
                                <span>Điểm {s.quiz ? `${s.quiz.score}/${s.quiz.total}` : "Chưa làm"}</span>
                                <span>{s.quiz?.feedback
                                  ? gaps.length ? `${gaps.length} nội dung cần ôn lại` : "Chưa ghi nhận câu sai trong bộ này"
                                  : analysis.knowledgeLabel}</span>
                                <small>{analysis.focusExplanation}</small>
                              </div>
                            </div>
                            <strong>{Math.floor(s.seconds / 60)} phút ↗</strong>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <Empty
                      title="Nhật ký đang chờ chuyến đầu tiên"
                      text="Bắt đầu học và trở lại đây để nhìn thấy quãng đường của mình."
                      action="Bắt đầu"
                      onClick={() => go("ticket")}
                    />
                  )}
                  <button onClick={exportData}>
                    Xuất bản sao dữ liệu riêng
                  </button>
                </>
              )}
              {view === "experiments" && <ExperimentResults />}
              {view === "summary" &&
                (summarySession ? (
                  <>
                    <Heading
                      kicker="MỖI PHÚT ĐỀU CÓ Ý NGHĨA"
                      title="Thêm một chặng đường đáng nhớ."
                      text={summarySession.goal}
                    />
                    <div className="stat-row summary-stats">
                      <Stat
                        icon="◷"
                        label="THỜI GIAN TẬP TRUNG"
                        value={clock(summarySession.seconds)}
                        detail="Đã loại khoảng xao nhãng"
                      />
                      <Stat icon="◷" label="THỜI GIAN GIẢI LAO" value={clock(analyzeSession(summarySession).breakSeconds)} detail="Nghỉ đúng lịch không tính xao nhãng hoặc XP" />
                      <Stat
                        icon="✦"
                        label="KINH NGHIỆM TOA"
                        value={`${Math.floor(summarySession.seconds / 60)} XP`}
                        detail="1 phút tập trung = 1 XP · XP ghi nhận nỗ lực, không đo mức độ thành thạo"
                      />
                      <Stat
                        icon="↗"
                        label="SỐ LẦN XAO NHÃNG"
                        value={`${summarySession.distractions ?? summarySession.segments.filter(segment => segment.kind === "distraction").length}`}
                        detail="Mỗi lần rời phiên được ghi nhận một lần"
                      />
                      <Stat
                        icon="⚑"
                        label="TRẠNG THÁI"
                        value={
                          saved.pending.some((s) => s.id === summarySession.id)
                            ? "Đang chờ"
                            : "Đã lưu"
                        }
                        detail="Quiz không chặn lưu thành quả"
                      />
                    </div>
                    <section className="panel">
                      <h2>Mang kiến thức theo chuyến đi</h2>
                      {!!saved.materials?.[summarySession.id]?.length && <details className="material-history"><summary>Tài liệu của chuyến · {saved.materials[summarySession.id].length} tệp</summary><ul className="material-list">{saved.materials[summarySession.id].map((file, i) => <li key={`${i}:${file.name}`}><strong>{file.name}</strong><span>{file.message}</span></li>)}</ul></details>}
                      <p>
                        Ôn lại một chút trước khi nghỉ. Làm sau cũng được; phần
                        học của bạn đã được lưu.
                      </p>
                      {!!saved.materials?.[summarySession.id]?.length && !saved.sources?.[summarySession.id]?.length && <div className="info-box"><p>Tài liệu này được lưu bằng phiên bản cũ. Khôi phục bản chép đã lưu hoặc dán nội dung đúng, rồi xác nhận làm nguồn câu hỏi.</p><button onClick={() => {const value = current.current;if(value.summarySessionId !== summarySession.id) return;commitRef.current({...value,sources:{...value.sources,[summarySession.id]:[recoveredMaterialSource(value.notes[summarySession.id] ?? "",value.materials?.[summarySession.id] ?? [])]}});}}>Khôi phục / nhập bản chép tài liệu cũ</button></div>}
                      {(saved.sources?.[summarySession.id] ?? []).map((source) => <details className="material-source" key={source.id} open={!source.reviewed}>
                        <summary>Nguồn câu hỏi · {source.name} · {source.reviewed ? "Đã kiểm tra" : "Cần kiểm tra"}</summary>
                        <label>Bản chép tài liệu<textarea rows={7} maxLength={50000} value={source.text} onChange={(e) => {
                          const value = current.current;
                          if(value.summarySessionId !== summarySession.id) return;
                          commitRef.current({...value,sources:{...value.sources,[summarySession.id]:(value.sources?.[summarySession.id] ?? []).map(item => item.id === source.id ? {...item,text:e.target.value,reviewed:false} : item)}});
                        }} /></label>
                        <button disabled={source.text.trim().length < 10} onClick={() => {try {
                          const value = current.current;
                          if(value.summarySessionId !== summarySession.id) return;
                          const reviewed = reviewMaterialSource(source, source.text);
                          commitRef.current({...value,sources:{...value.sources,[summarySession.id]:(value.sources?.[summarySession.id] ?? []).map(item => item.id === source.id ? reviewed : item)}});
                          setError("");
                        } catch(e) {setError(e instanceof Error ? e.message : "Không xác nhận được nguồn.");}}}>Xác nhận nội dung đã kiểm tra</button>
                      </details>)}
                      <QuizPanel
                        key={`${owner}:${summarySession.id}`}
                        ownerId={owner}
                        session={summarySession}
                        draft={saved.quizDrafts?.[summarySession.id]}
                        canUseAI={!!user && !needsLogin}
                        needsLogin={needsLogin}
                        onGenerate={(count) => generateQuiz(summarySession, count)}
                        onSaveDraft={(draft) => saveQuizDraft(owner, summarySession.id, draft)}
                        onGrade={(answers) => gradeQuiz(summarySession.id, answers)}
                        onLogin={() => go("account")}
                        onStartReview={() => startReviewTrip(summarySession)}
                      />
                    </section>
                    <section className="panel experiment-share">
                      <h2>Chuyến đi trong lịch sử công khai</h2>
                      <p>Mã chuyến ẩn danh, thời gian, loại thiết bị, tóm tắt mục tiêu, số lần xao nhãng và điểm
                        được tự cập nhật. Chuyến kết thúc sớm cũng được ghi nhận.</p>
                      <p role="status">{owner === "guest"
                        ? saved.guestPublished?.includes(summarySession.id)
                          ? "Chuyến đã xuất hiện trong Lịch sử chuyến đi."
                          : guestPublication[summarySession.id]?.status === "save-failed"
                            ? "Máy chủ đã ghi nhận chuyến; thiết bị chưa lưu được xác nhận. Gửi lại sẽ không tạo chuyến trùng."
                            : guestPublication[summarySession.id]?.status === "sending"
                              ? "Đang gửi chuyến vào lịch sử…"
                              : guestPublication[summarySession.id]?.status === "failed"
                                ? `Chuyến vẫn được lưu trên thiết bị. ${guestPublication[summarySession.id].message}`
                                : "Chuyến đã lưu trên thiết bị và sẽ xuất hiện khi gửi thành công."
                        : needsLogin ? "Đăng nhập lại để đồng bộ chuyến vào lịch sử."
                          : saved.pending.some(session => session.id === summarySession.id)
                            ? "Chuyến đang chờ đồng bộ lên máy chủ."
                            : "Chuyến đã xuất hiện trong Lịch sử chuyến đi."}</p>
                      <div className="choice-row">
                        <button onClick={() => go("experiments")}>Xem Lịch sử chuyến đi →</button>
                        {(owner === "guest" ? !saved.guestPublished?.includes(summarySession.id) : saved.pending.some(session => session.id === summarySession.id)) &&
                          <button disabled={busy || !online || needsLogin} onClick={() => void run(sync)}>Thử đồng bộ lại</button>}
                      </div>
                    </section>
                    <button className="primary" onClick={() => go("station")}>
                      Trở về ga chính →
                    </button>
                  </>
                ) : (
                  <Empty
                    title="Thành quả đang chờ bạn"
                    text="Xem một phiên trong nhật ký để mở lại tổng kết."
                    action="Mở nhật ký"
                    onClick={() => go("journal")}
                  />
                ))}
              {view === "account" && (
                <>
                  <Heading
                    kicker="BẠN LỮ HÀNH"
                    title={
                      user
                        ? `Xin chào, ${user.name}`
                        : "Giữ hành trình bên mình"
                    }
                    text="Học cá nhân không cần tài khoản. Đăng nhập để đồng bộ và cùng bạn bè khám phá."
                  />
                  {user && (
                    <section className="panel form">
                      <h2>{user.email}</h2>
                      <p>
                        Tiến độ tài khoản và tiến độ khách được lưu riêng, không
                        tự cộng lại hai lần.
                      </p>
                      <button disabled={busy || needsLogin || !online} onClick={() => void run(sync)}>
                        Đồng bộ tài khoản
                      </button>
                      <button
                        disabled={busy || !!active}
                        onClick={() => void run(logout)}
                      >
                        Đăng xuất
                      </button>
                      <small>
                        Hoàn tất phiên đang chạy trước khi đăng xuất. Phiên chờ đồng bộ được giữ trên thiết bị cho lần đăng nhập sau.
                      </small>
                      <button onClick={exportData}>Xuất dữ liệu riêng</button>
                    </section>
                  )}
                  {(!user || needsLogin) && (
                    <form
                      className="panel form auth-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void run(async () => {
                          await login(
                            needsLogin && active && user ? user.email : email,
                            password,
                            authMode === "register" ? name : undefined,
                          );
                          go("station");
                        });
                      }}
                    >
                      <div className="choice-row">
                        <button
                          type="button"
                          className={authMode === "login" ? "selected" : ""}
                          onClick={() => setAuthMode("login")}
                        >
                          Đăng nhập
                        </button>
                        <button
                          type="button"
                          className={authMode === "register" ? "selected" : ""}
                          disabled={!!active}
                          onClick={() => setAuthMode("register")}
                        >
                          Tạo tài khoản
                        </button>
                      </div>
                      {authMode === "register" && (
                        <label>
                          Tên của bạn
                          <input
                            required
                            maxLength={100}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                          />
                        </label>
                      )}
                      <label>
                        Email
                        <input
                          required
                          type="email"
                          value={needsLogin && active && user ? user.email : email}
                          readOnly={!!active}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                        />
                      </label>
                      <label>
                        Mật khẩu
                        <input
                          required
                          type="password"
                          minLength={8}
                          maxLength={authMode === "register" ? 72 : undefined}
                          pattern={authMode === "register" ? "(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,72}" : undefined}
                          title={authMode === "register" ? REGISTRATION_PASSWORD_HINT : undefined}
                          aria-describedby={authMode === "register" ? "registration-password-hint" : undefined}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete={
                            authMode === "login"
                              ? "current-password"
                              : "new-password"
                          }
                        />
                      </label>
                      {authMode === "register" && (
                        <small id="registration-password-hint">{REGISTRATION_PASSWORD_HINT}</small>
                      )}
                      <button className="primary" disabled={busy || (!!active && !needsLogin)}>
                        {busy
                          ? "Đang kết nối…"
                          : authMode === "login"
                            ? "Đăng nhập →"
                            : "Tạo tài khoản →"}
                      </button>
                      {active && !needsLogin && (
                        <p>
                          Hãy lưu phiên khách hiện tại trước khi đổi sang tài
                          khoản.
                        </p>
                      )}
                    </form>
                  )}
                  <div className="info-box">
                    <h3>Dữ liệu và quyền riêng tư</h3>
                    <p>
                      Nội dung tài liệu được giữ trên thiết bị. Tạo câu hỏi gửi nguồn đã kiểm tra cho AI;
                      “Đọc bằng AI” gửi riêng tệp gốc đã chọn tới Google Gemini để nhận diện chữ.
                      Dữ liệu học của tài khoản được lưu trên máy chủ; đoàn chỉ xem toa và tiến độ chung.
                    </p>
                    <p>Mọi chuyến đã lưu tự công khai mã chuyến ẩn danh, chủ đề, thời gian, loại thiết bị, tóm tắt mục tiêu,
                      số lần xao nhãng và điểm quiz trong Lịch sử chuyến đi, gồm cả chuyến kết thúc sớm.
                      Phiên offline xuất hiện sau khi gửi thành công. Email tài khoản, tên tài khoản,
                      tài liệu, lời giải và chi tiết trả lời không xuất hiện trong lịch sử công khai.</p>
                    <p>
                      Ở chế độ khách, tiến độ và tài liệu được giữ trong trình duyệt này;
                      kết quả chuyến được gửi tự động vào lịch sử công khai khi có mạng.
                      Xuất bản sao trước khi xóa dữ liệu trình duyệt.
                    </p>
                    <p>Tên tài khoản gần nhất được giữ trên thiết bị để mở lại phiên offline. Đăng xuất sẽ xóa thông tin này; mật khẩu và token không được lưu lâu dài.</p>
                  </div>
                </>
              )}
            </>
          )}
          <footer className="page-footer">
            <span>VIỄN DU · HỌC ĐỂ ĐI XA</span>
            <span>Không so sánh. Không mất thành quả. Cứ tiếp tục.</span>
          </footer>
        </main>
      </div>
      {active && view !== "focus" && (
        <button className="active-trip" onClick={() => go("focus")}>
          ▥ Chuyến đang chạy · {clock(rest ? rest.remainingSeconds : active.target - elapsedSeconds(active, now))} →
        </button>
      )}
      {confirm && (
        <div className="modal-backdrop">
          <section
            className="modal panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <h2 id="confirm-title">
              {confirm === "finish"
                ? "Dừng ở ga này nhé?"
                : confirm === "reset" ? "Tạo lại hành trình trên thiết bị?" : "Rời đoàn hiện tại?"}
            </h2>
            <p>
              {confirm === "finish"
                ? "Phần thời gian học hợp lệ sẽ được lưu. Bạn không mất kinh nghiệm đã kiếm được."
                : confirm === "reset" ? "Dữ liệu cục bộ của tài khoản này sẽ bị xóa. Hãy tải dữ liệu gốc trước. Dữ liệu đã đồng bộ trên máy chủ vẫn được giữ." : "Toa cá nhân được giữ nguyên. Đóng góp cũ vẫn thuộc hành trình của đoàn."}
            </p>
            <div className="choice-row">
              <button autoFocus onClick={() => setConfirm(null)}>
                Tiếp tục hành trình
              </button>
              <button
                className="primary"
                disabled={busy}
                onClick={() => {
                  if (confirm === "finish") finish();
                  else if (confirm === "reset") {
                    try {
                      localStorage.removeItem(`train-adventure:v1:${owner}`);
                      window.location.reload();
                    } catch { setError("Không xóa được dữ liệu. Hãy kiểm tra quyền lưu trữ của trình duyệt."); }
                  }
                  else
                    void run(async () => {
                      await mutation("leave", {});
                      setMode("solo");
                      setConfirm(null);
                    });
                }}
              >
                Xác nhận
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
function Heading({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{kicker}</div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  );
}
function Stat({
  icon,
  label,
  value,
  detail,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <section className="stat">
      <span className="stat-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </section>
  );
}
function Empty({
  title,
  text,
  action,
  onClick,
}: {
  title: string;
  text: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <section className="empty panel">
      <span className="empty-icon">♧</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="primary" onClick={onClick}>
        {action} →
      </button>
    </section>
  );
}
