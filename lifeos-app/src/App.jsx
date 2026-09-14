import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Home, CalendarDays, BarChart3, CalendarRange, GraduationCap, Wallet,
  Target, FolderKanban, LineChart as LineChartIcon, Settings as SettingsIcon,
  Repeat2, Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight,
  Flame, Moon, BookOpen, TrendingUp, TrendingDown, AlertCircle, Clock,
  Bell, Circle, CircleCheck, ListChecks, PiggyBank, Menu,
  Dumbbell
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from "recharts";
import { storage } from "./storage.js";

/* ============================================================================
   LIFE OS — design tokens
   Palette: ink navy (#152238) for structure/sidebar, warm paper (#F7F5F1) bg,
   deep spruce (#2F6F5E) as the single primary accent (growth/progress),
   clay (#B4562B) reserved strictly for money-out / overdue / deadlines,
   slate blue (#3E6FA3) for informational / school.
   Type: "Space Grotesk" for headings & big numbers (structural, technical
   personality fitting an "operating system"), "Inter" for UI/body text.
   ============================================================================ */

const COLORS = {
  ink: "#152238",
  inkSoft: "#2A3B57",
  paper: "#F7F5F1",
  card: "#FFFFFF",
  border: "#E6E2D8",
  text: "#1E2430",
  textMuted: "#767161",
  primary: "#2F6F5E",
  primarySoft: "#E4EEE9",
  clay: "#B4562B",
  claySoft: "#F5E5DA",
  blue: "#3E6FA3",
  blueSoft: "#E4ECF3",
  amber: "#C08A1E",
  amberSoft: "#F6EBD6",
  gray: "#9A968A",
  graySoft: "#EFEDE7",
};

const CAT_COLORS = ["#2F6F5E", "#3E6FA3", "#B4562B", "#C08A1E", "#7A6A9C", "#4C7C8C"];

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
`;

/* ---------------------------------------------------------------------- */
/* Date utilities                                                          */
/* ---------------------------------------------------------------------- */
const pad2 = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const todayISO = () => toISO(new Date());
const parseISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (s, n) => {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const startOfWeek = (s) => {
  const d = parseISO(s);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISO(d);
};
const weekDates = (mondayISO) => Array.from({ length: 7 }, (_, i) => addDays(mondayISO, i));
const startOfMonth = (s) => {
  const d = parseISO(s);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
};
const daysInMonth = (s) => {
  const d = parseISO(s);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
};
const monthDates = (firstOfMonthISO) => {
  const n = daysInMonth(firstOfMonthISO);
  return Array.from({ length: n }, (_, i) => addDays(firstOfMonthISO, i));
};
const addMonths = (s, n) => {
  const d = parseISO(s);
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
};
const monthLabel = (s) => parseISO(s).toLocaleDateString("en-US", { month: "long", year: "numeric" });
const dayLabel = (s) => parseISO(s).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
const shortDay = (s) => parseISO(s).toLocaleDateString("en-US", { weekday: "short" });
const shortDate = (s) => parseISO(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const weekRangeLabel = (mondayISO) => {
  const sun = addDays(mondayISO, 6);
  return `${shortDate(mondayISO)} – ${shortDate(sun)}`;
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const money = (n) => {
  const v = Number(n) || 0;
  return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 });
};

/* ---------------------------------------------------------------------- */
/* Default seed data (only used the very first time, so the app doesn't   */
/* open empty)                                                             */
/* ---------------------------------------------------------------------- */
function seedData() {
  const today = todayISO();
  const monday = startOfWeek(today);
  const classes = [
    { id: uid(), name: "Networking", color: "#2F6F5E" },
    { id: uid(), name: "Databases", color: "#3E6FA3" },
    { id: uid(), name: "Calculus", color: "#B4562B" },
  ];
  const tasks = [
    { id: uid(), name: "Study Networking", description: "VLANs + trunking review", date: today, time: "18:00", dueDate: "", priority: "High", category: "School", project: "", tags: ["Deep Work"], recurring: "none", reminder: "18:00", status: "not_started", notes: "", completions: {} },
    { id: uid(), name: "Math homework", description: "Problem set 4", date: today, time: "19:30", dueDate: today, priority: "Medium", category: "School", project: "", tags: ["Deadline"], recurring: "none", reminder: "", status: "not_started", notes: "", completions: {} },
    { id: uid(), name: "Workout", description: "Push day", date: today, time: "21:00", dueDate: "", priority: "Low", category: "Fitness", project: "", tags: [], recurring: "daily", reminder: "21:00", status: "not_started", notes: "", completions: { [addDays(today, -1)]: true, [addDays(today, -2)]: true } },
    { id: uid(), name: "Morning reading", description: "15 minutes", date: addDays(today, -6), time: "08:00", dueDate: "", priority: "Low", category: "Personal", project: "", tags: [], recurring: "daily", reminder: "", status: "not_started", notes: "", completions: { [addDays(today, -1)]: true, [addDays(today, -3)]: true, [addDays(today, -4)]: true } },
  ];
  const goals = [
    {
      id: uid(), title: "Learn Networking", description: "Get comfortable with routing & switching fundamentals", deadline: addDays(today, 40), category: "School", notes: "",
      milestones: [
        { id: uid(), name: "Basic Networking", done: true },
        { id: uid(), name: "VLANs", done: true },
        { id: uid(), name: "Routing", done: false },
        { id: uid(), name: "OSPF", done: false },
        { id: uid(), name: "Firewalls", done: false },
      ],
    },
    {
      id: uid(), title: "Save an emergency fund", description: "Three months of expenses set aside", deadline: addDays(today, 120), category: "Money", notes: "",
      milestones: [
        { id: uid(), name: "Open separate savings account", done: true },
        { id: uid(), name: "Reach $500", done: false },
        { id: uid(), name: "Reach $1,500", done: false },
      ],
    },
  ];
  const projects = [
    {
      id: uid(), name: "Networking Project", description: "Lab work for the networking class", deadline: addDays(today, 20), status: "In Progress", notes: "",
      tasks: [
        { id: uid(), name: "VLANs", done: true },
        { id: uid(), name: "Trunking", done: true },
        { id: uid(), name: "Inter-VLAN routing", done: true },
        { id: uid(), name: "DHCP", done: true },
        { id: uid(), name: "STP", done: false },
        { id: uid(), name: "OSPF", done: false },
        { id: uid(), name: "EtherChannel", done: false },
        { id: uid(), name: "Firewall", done: false },
        { id: uid(), name: "NAT", done: false },
        { id: uid(), name: "Final project", done: false },
      ],
    },
  ];
  const habits = [
    { id: uid(), name: "Sleep 7+ hours", category: "Health", targetPerWeek: 7, color: "#3E6FA3", completions: {} },
    { id: uid(), name: "Study", category: "School", targetPerWeek: 6, color: "#2F6F5E", completions: {} },
    { id: uid(), name: "Exercise", category: "Fitness", targetPerWeek: 3, color: "#B4562B", completions: {} },
    { id: uid(), name: "Drink water", category: "Health", targetPerWeek: 7, color: "#C08A1E", completions: {} },
  ];
  for (let i = 1; i <= 6; i++) {
    const d = addDays(today, -i);
    habits[0].completions[d] = Math.random() > 0.25;
    habits[1].completions[d] = Math.random() > 0.3;
    habits[2].completions[d] = Math.random() > 0.55;
    habits[3].completions[d] = Math.random() > 0.2;
  }
  const assignments = [
    { id: uid(), name: "Networking Assignment", classId: classes[0].id, dueDate: addDays(today, 2), priority: "High", status: "In Progress", description: "Subnetting worksheet" },
    { id: uid(), name: "Database ER diagram", classId: classes[1].id, dueDate: addDays(today, 5), priority: "Medium", status: "Not Started", description: "" },
    { id: uid(), name: "Calc problem set 3", classId: classes[2].id, dueDate: addDays(today, -1), priority: "High", status: "Overdue", description: "" },
  ];
  const transactions = [];
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, -i);
    if (Math.random() > 0.5) transactions.push({ id: uid(), type: "expense", amount: Math.round(5 + Math.random() * 40), category: ["Food", "Transport", "Subscriptions", "Fun"][Math.floor(Math.random() * 4)], date: d, note: "" });
  }
  transactions.push({ id: uid(), type: "income", amount: 750, category: "Salary", date: addDays(today, -12), note: "Base pay" });
  transactions.push({ id: uid(), type: "income", amount: 60, category: "Freelance", date: addDays(today, -3), note: "" });

  const dailyLogs = {};
  for (let i = 1; i <= 9; i++) {
    const d = addDays(today, -i);
    dailyLogs[d] = { sleepHours: +(5.5 + Math.random() * 3).toFixed(1), studyHours: +(Math.random() * 3).toFixed(1), exerciseDone: Math.random() > 0.5, notes: "" };
  }

  return {
    profile: { name: "Tariq" },
    weeklyTargets: { sleepHours: 7, studyHours: 10, exerciseSessions: 3, income: 100, savings: 50 },
    tasks,
    habits,
    classes,
    assignments,
    transactions,
    goals,
    projects,
    dailyLogs,
    categories: ["School", "Work", "Personal", "Fitness", "Money"],
    tags: ["Important", "Quick", "Deep Work", "Deadline", "Exam"],
    notifSettings: { enabled: false },
  };
}

/* ---------------------------------------------------------------------- */
/* Storage hook                                                           */
/* ---------------------------------------------------------------------- */
const STORAGE_KEY = "lifeos:data:v1";

function useLifeOSData() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        if (res && res.value) {
          setData(JSON.parse(res.value));
        } else {
          setData(seedData());
        }
      } catch (e) {
        setData(seedData());
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded || !data) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      storage.set(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
    }, 350);
    return () => clearTimeout(saveTimer.current);
  }, [data, loaded]);

  return [data, setData, loaded];
}

/* ---------------------------------------------------------------------- */
/* Task scheduling helpers (supports recurring tasks)                     */
/* ---------------------------------------------------------------------- */
function isTaskScheduledOn(task, dateISO) {
  if (!task.date) return false;
  if (task.recurring === "daily") return dateISO >= task.date;
  if (task.recurring === "weekly") {
    if (dateISO < task.date) return false;
    return parseISO(dateISO).getDay() === parseISO(task.date).getDay();
  }
  return task.date === dateISO;
}
function isTaskDoneOn(task, dateISO) {
  if (task.recurring && task.recurring !== "none") {
    return !!(task.completions && task.completions[dateISO]);
  }
  return task.status === "completed";
}
function tasksForDate(tasks, dateISO) {
  return tasks.filter((t) => isTaskScheduledOn(t, dateISO));
}
function isOverdue(task) {
  if (!task.dueDate) return false;
  if (task.recurring && task.recurring !== "none") return false;
  return task.status !== "completed" && task.status !== "cancelled" && task.dueDate < todayISO();
}

/* ---------------------------------------------------------------------- */
/* Small UI atoms                                                         */
/* ---------------------------------------------------------------------- */
function Card({ children, style, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Pill({ children, bg, color }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 999,
        background: bg,
        color: color,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

const STATUS_STYLE = {
  not_started: { bg: COLORS.graySoft, color: COLORS.textMuted, label: "Not started" },
  in_progress: { bg: COLORS.blueSoft, color: COLORS.blue, label: "In progress" },
  completed: { bg: COLORS.primarySoft, color: COLORS.primary, label: "Completed" },
  overdue: { bg: COLORS.claySoft, color: COLORS.clay, label: "Overdue" },
  cancelled: { bg: COLORS.graySoft, color: COLORS.textMuted, label: "Cancelled" },
};
function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.not_started;
  return <Pill bg={s.bg} color={s.color}>{s.label}</Pill>;
}
const PRIORITY_STYLE = {
  High: { bg: COLORS.claySoft, color: COLORS.clay },
  Medium: { bg: COLORS.amberSoft, color: COLORS.amber },
  Low: { bg: COLORS.graySoft, color: COLORS.textMuted },
};
function PriorityPill({ priority }) {
  const s = PRIORITY_STYLE[priority] || PRIORITY_STYLE.Low;
  return <Pill bg={s.bg} color={s.color}>{priority}</Pill>;
}

function ProgressBar({ value, color = COLORS.primary, track = COLORS.graySoft, height = 8 }) {
  const v = clamp(value, 0, 100);
  return (
    <div style={{ width: "100%", height, borderRadius: 999, background: track, overflow: "hidden" }}>
      <div style={{ width: `${v}%`, height: "100%", background: color, borderRadius: 999, transition: "width .4s ease" }} />
    </div>
  );
}

function CircularProgress({ value, size = 96, stroke = 10, color = COLORS.primary, label }) {
  const v = clamp(value, 0, 100);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (v / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={COLORS.graySoft} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: size * 0.24, color: COLORS.text }}>{Math.round(v)}%</div>
        {label && <div style={{ fontSize: 11, color: COLORS.textMuted }}>{label}</div>}
      </div>
    </div>
  );
}

function IconBtn({ icon, onClick, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 30, height: 30, borderRadius: 8, border: `1px solid ${COLORS.border}`,
        background: COLORS.card, color: danger ? COLORS.clay : COLORS.textMuted, cursor: "pointer",
      }}
    >
      {icon}
    </button>
  );
}

function Btn({ children, onClick, variant = "primary", small, style, type = "button" }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center",
    fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: "pointer",
    borderRadius: 10, border: "1px solid transparent",
    padding: small ? "6px 12px" : "9px 16px", fontSize: small ? 13 : 14,
    transition: "opacity .15s ease",
  };
  const variants = {
    primary: { background: COLORS.ink, color: "#fff" },
    outline: { background: COLORS.card, color: COLORS.text, border: `1px solid ${COLORS.border}` },
    ghost: { background: "transparent", color: COLORS.textMuted },
    danger: { background: COLORS.claySoft, color: COLORS.clay },
  };
  return (
    <button type={type} onClick={onClick} style={{ ...base, ...variants[variant], ...style }} onMouseDown={(e) => e.currentTarget.style.opacity = "0.85"} onMouseUp={(e) => e.currentTarget.style.opacity = "1"}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, color: COLORS.textMuted, fontWeight: 500 }}>
      {label}
      {children}
    </label>
  );
}
const inputStyle = {
  border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 10px",
  fontSize: 14, fontFamily: "'Inter',sans-serif", color: COLORS.text, background: "#fff", outline: "none",
};

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(21,34,56,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: wide ? 560 : 440, maxWidth: "100%",
          maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(21,34,56,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 17, color: COLORS.text }}>{title}</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: COLORS.textMuted }}><X size={20} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon, text, action }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: COLORS.textMuted }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, opacity: 0.6 }}>{icon}</div>
      <div style={{ fontSize: 14, marginBottom: action ? 14 : 0 }}>{text}</div>
      {action}
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 600, color: COLORS.text, margin: 0 }}>{children}</h2>
      {right}
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <Card style={{ padding: 16, flex: "1 1 160px", minWidth: 150 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: accent || COLORS.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", color: accent ? "#fff" : COLORS.primary }}>
          {icon}
        </div>
        <div style={{ fontSize: 12.5, color: COLORS.textMuted, fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: COLORS.text }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

/* ---------------------------------------------------------------------- */
/* Navigation config                                                      */
/* ---------------------------------------------------------------------- */
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "daily", label: "Daily", icon: CalendarDays },
  { key: "weekly", label: "Weekly", icon: BarChart3 },
  { key: "monthly", label: "Monthly", icon: CalendarRange },
  { key: "school", label: "School", icon: GraduationCap },
  { key: "money", label: "Money", icon: Wallet },
  { key: "goals", label: "Goals", icon: Target },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "habits", label: "Habits", icon: Repeat2 },
  { key: "analytics", label: "Analytics", icon: LineChartIcon },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

/* ============================================================================
   ROOT APP
   ============================================================================ */
export default function LifeOS() {
  const [data, setData, loaded] = useLifeOSData();
  const [page, setPage] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!loaded || !data) {
    return (
      <div style={{ minHeight: 480, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.paper, fontFamily: "'Inter',sans-serif", color: COLORS.textMuted }}>
        Loading Life OS…
      </div>
    );
  }

  const update = (fn) => setData((prev) => {
    const next = typeof fn === "function" ? fn(structuredClone(prev)) : fn;
    return next;
  });

  const pageProps = { data, update, selectedDate, setSelectedDate, setPage };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", color: COLORS.text, background: COLORS.paper, minHeight: 600, display: "flex", position: "relative", borderRadius: 8, overflow: "hidden" }}>
      <style>{FONT_IMPORT}{`
        * { box-sizing: border-box; }
        input, select, textarea { font-family: 'Inter',sans-serif; }
        input:focus, select:focus, textarea:focus { border-color: ${COLORS.primary} !important; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 8px; }
        @media (max-width: 860px) {
          .lifeos-sidebar { position: fixed !important; left: 0; top: 0; bottom: 0; z-index: 900; transform: translateX(-100%); transition: transform .25s ease; }
          .lifeos-sidebar.open { transform: translateX(0); }
          .lifeos-main { width: 100% !important; }
        }
      `}</style>

      <Sidebar page={page} setPage={(p) => { setPage(p); setMobileNavOpen(false); }} name={data.profile.name} open={mobileNavOpen} />

      {mobileNavOpen && <div onClick={() => setMobileNavOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 800 }} />}

      <div className="lifeos-main" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", maxHeight: 780, overflowY: "auto" }}>
        <TopBar page={page} onMenu={() => setMobileNavOpen(true)} />
        <div style={{ padding: "20px 24px 40px" }}>
          {page === "dashboard" && <Dashboard {...pageProps} />}
          {page === "daily" && <Daily {...pageProps} />}
          {page === "weekly" && <Weekly {...pageProps} />}
          {page === "monthly" && <Monthly {...pageProps} />}
          {page === "school" && <School {...pageProps} />}
          {page === "money" && <Money {...pageProps} />}
          {page === "goals" && <Goals {...pageProps} />}
          {page === "projects" && <Projects {...pageProps} />}
          {page === "habits" && <Habits {...pageProps} />}
          {page === "analytics" && <Analytics {...pageProps} />}
          {page === "settings" && <SettingsPage {...pageProps} />}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ page, setPage, name, open }) {
  return (
    <div className={`lifeos-sidebar${open ? " open" : ""}`} style={{ width: 216, background: COLORS.ink, color: "#CBD4C8", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "22px 20px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: "#fff" }}>Ω</div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: "#fff" }}>Life OS</div>
          <div style={{ fontSize: 11, color: "#8A9488" }}>{name ? `${name}'s system` : "personal system"}</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "6px 12px", overflowY: "auto" }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = page === n.key;
          return (
            <button
              key={n.key}
              onClick={() => setPage(n.key)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", marginBottom: 2, borderRadius: 9, border: "none",
                background: active ? "#24365A" : "transparent",
                color: active ? "#fff" : "#AEB6AA", cursor: "pointer",
                fontSize: 13.5, fontWeight: active ? 600 : 500, textAlign: "left",
              }}
            >
              <Icon size={16} strokeWidth={2} />
              {n.label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: 16, fontSize: 11, color: "#6C776A", borderTop: "1px solid #24365A" }}>
        Daily → Weekly → Monthly → Long-term
      </div>
    </div>
  );
}

function TopBar({ page, onMenu }) {
  const nav = NAV.find((n) => n.key === page);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.paper, position: "sticky", top: 0, zIndex: 5 }}>
      <button className="lifeos-menu-btn" onClick={onMenu} style={{ display: "none", border: "none", background: "transparent", cursor: "pointer" }}>
        <Menu size={20} />
      </button>
      <style>{`@media (max-width:860px){ .lifeos-menu-btn{ display:flex !important; } }`}</style>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 19 }}>{nav ? nav.label : ""}</div>
      <div style={{ marginLeft: "auto", fontSize: 13, color: COLORS.textMuted }}>{dayLabel(todayISO())}</div>
    </div>
  );
}

/* ============================================================================
   DASHBOARD
   ============================================================================ */
function Dashboard({ data, update, setPage, setSelectedDate }) {
  const today = todayISO();
  const monday = startOfWeek(today);
  const wDates = weekDates(monday);

  const todayTasks = tasksForDate(data.tasks, today);
  const doneToday = todayTasks.filter((t) => isTaskDoneOn(t, today)).length;
  const completionPct = todayTasks.length ? (doneToday / todayTasks.length) * 100 : 0;

  const log = data.dailyLogs[today] || {};
  const todayIncome = data.transactions.filter((t) => t.date === today && t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const todayExpense = data.transactions.filter((t) => t.date === today && t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  let weekDone = 0, weekTotal = 0;
  wDates.forEach((d) => {
    const dt = tasksForDate(data.tasks, d);
    weekTotal += dt.length;
    weekDone += dt.filter((t) => isTaskDoneOn(t, d)).length;
  });
  const weekPct = weekTotal ? (weekDone / weekTotal) * 100 : 0;

  const deadlines = useMemo(() => {
    const list = [];
    data.tasks.forEach((t) => { if (t.dueDate && t.status !== "completed" && t.status !== "cancelled" && (!t.recurring || t.recurring === "none")) list.push({ label: t.name, date: t.dueDate, type: "Task" }); });
    data.assignments.forEach((a) => { if (a.status !== "Completed" && a.status !== "Cancelled") list.push({ label: a.name, date: a.dueDate, type: "Assignment" }); });
    return list.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  }, [data.tasks, data.assignments, today]);

  const toggleTask = (task) => update((d) => {
    const t = d.tasks.find((x) => x.id === task.id);
    if (t.recurring && t.recurring !== "none") {
      t.completions = t.completions || {};
      t.completions[today] = !t.completions[today];
    } else {
      t.status = t.status === "completed" ? "not_started" : "completed";
    }
    return d;
  });

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <StatCard icon={<ListChecks size={16} />} label="Today's completion" value={`${Math.round(completionPct)}%`} sub={`${doneToday}/${todayTasks.length} tasks`} />
        <StatCard icon={<CircleCheck size={16} />} label="Tasks completed" value={doneToday} sub="today" />
        <StatCard icon={<Moon size={16} />} label="Sleep" value={log.sleepHours ? `${log.sleepHours}h` : "—"} sub="last night" accent={COLORS.blue} />
        <StatCard icon={<BookOpen size={16} />} label="Study time" value={log.studyHours ? `${log.studyHours}h` : "—"} sub="today" accent={COLORS.blue} />
        <StatCard icon={<TrendingUp size={16} />} label="Today's income" value={money(todayIncome)} accent={COLORS.primary} />
        <StatCard icon={<TrendingDown size={16} />} label="Today's expenses" value={money(todayExpense)} accent={COLORS.clay} />
        <StatCard icon={<BarChart3 size={16} />} label="Weekly progress" value={`${Math.round(weekPct)}%`} sub="tasks this week" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr)", gap: 16 }}>
        <Card style={{ padding: 20 }}>
          <SectionTitle right={<Btn small variant="ghost" onClick={() => setPage("daily")}>Open Daily →</Btn>}>Today's tasks</SectionTitle>
          {todayTasks.length === 0 ? (
            <EmptyState icon={<ListChecks size={30} />} text="Nothing scheduled for today yet." action={<Btn small onClick={() => setPage("daily")}>Add a task</Btn>} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {todayTasks.map((t) => {
                const done = isTaskDoneOn(t, today);
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, background: done ? COLORS.primarySoft : COLORS.paper }}>
                    <button onClick={() => toggleTask(t)} style={{ border: "none", background: "transparent", cursor: "pointer", color: done ? COLORS.primary : COLORS.gray, display: "flex" }}>
                      {done ? <CircleCheck size={19} /> : <Circle size={19} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, textDecoration: done ? "line-through" : "none", color: done ? COLORS.textMuted : COLORS.text }}>{t.name}</div>
                      {t.time && <div style={{ fontSize: 11.5, color: COLORS.textMuted }}>{t.time}</div>}
                    </div>
                    <PriorityPill priority={t.priority || "Low"} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 20, display: "flex", alignItems: "center", gap: 18 }}>
            <CircularProgress value={completionPct} label="today" />
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Today's progress</div>
              <div style={{ fontSize: 13, color: COLORS.textMuted }}>{doneToday} of {todayTasks.length} planned items done. Keep going — this feeds directly into your weekly numbers.</div>
            </div>
          </Card>

          <Card style={{ padding: 20 }}>
            <SectionTitle>Upcoming deadlines</SectionTitle>
            {deadlines.length === 0 ? (
              <EmptyState icon={<AlertCircle size={26} />} text="No deadlines coming up." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {deadlines.map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13.5 }}>{d.label}</div>
                    <Pill bg={d.date === today ? COLORS.claySoft : COLORS.graySoft} color={d.date === today ? COLORS.clay : COLORS.textMuted}>
                      {d.date === today ? "Today" : shortDate(d.date)}
                    </Pill>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   DAILY
   ============================================================================ */
function Daily({ data, update, selectedDate, setSelectedDate }) {
  const d = selectedDate;
  const [showTaskModal, setShowTaskModal] = useState(null); // null | 'new' | task
  const [noteDraft, setNoteDraft] = useState(data.dailyLogs[d]?.notes || "");
  const [quickTx, setQuickTx] = useState({ type: "expense", amount: "", category: data.categories[0] || "Personal" });

  useEffect(() => { setNoteDraft(data.dailyLogs[d]?.notes || ""); }, [d]);

  const dayTasks = tasksForDate(data.tasks, d).sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  const doneCount = dayTasks.filter((t) => isTaskDoneOn(t, d)).length;
  const pct = dayTasks.length ? (doneCount / dayTasks.length) * 100 : 0;

  const dayAssignments = data.assignments.filter((a) => a.dueDate === d);
  const dayTx = data.transactions.filter((t) => t.date === d);
  const income = dayTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const log = data.dailyLogs[d] || {};

  const toggleTask = (task) => update((dt) => {
    const t = dt.tasks.find((x) => x.id === task.id);
    if (t.recurring && t.recurring !== "none") {
      t.completions = t.completions || {};
      t.completions[d] = !t.completions[d];
    } else {
      t.status = t.status === "completed" ? "not_started" : "completed";
    }
    return dt;
  });

  const removeTask = (id) => update((dt) => { dt.tasks = dt.tasks.filter((t) => t.id !== id); return dt; });

  const saveTask = (task) => update((dt) => {
    if (task.id) {
      const i = dt.tasks.findIndex((t) => t.id === task.id);
      dt.tasks[i] = task;
    } else {
      dt.tasks.push({ ...task, id: uid(), completions: {}, date: task.date || d });
    }
    return dt;
  });

  const saveLog = (patch) => update((dt) => {
    dt.dailyLogs[d] = { ...(dt.dailyLogs[d] || {}), ...patch };
    return dt;
  });

  const addTx = () => {
    if (!quickTx.amount) return;
    update((dt) => {
      dt.transactions.push({ id: uid(), type: quickTx.type, amount: Number(quickTx.amount), category: quickTx.category, date: d, note: "" });
      return dt;
    });
    setQuickTx({ ...quickTx, amount: "" });
  };

  return (
    <div>
      <DateNav date={d} onChange={setSelectedDate} labelFn={dayLabel} unit="day" />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 16, marginTop: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <SectionTitle right={<Btn small onClick={() => setShowTaskModal("new")}><Plus size={14} /> Add task</Btn>}>
              Tasks & schedule
            </SectionTitle>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <ProgressBar value={pct} />
              <div style={{ fontSize: 12.5, color: COLORS.textMuted, whiteSpace: "nowrap" }}>{doneCount}/{dayTasks.length}</div>
            </div>
            {dayTasks.length === 0 ? (
              <EmptyState icon={<ListChecks size={28} />} text="No tasks for this day." action={<Btn small onClick={() => setShowTaskModal("new")}>Add the first task</Btn>} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dayTasks.map((t) => {
                  const done = isTaskDoneOn(t, d);
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 10px", borderRadius: 10, background: done ? COLORS.primarySoft : COLORS.paper }}>
                      <button onClick={() => toggleTask(t)} style={{ border: "none", background: "transparent", cursor: "pointer", color: done ? COLORS.primary : COLORS.gray, marginTop: 1 }}>
                        {done ? <CircleCheck size={19} /> : <Circle size={19} />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 13.5, fontWeight: 500, textDecoration: done ? "line-through" : "none", color: done ? COLORS.textMuted : COLORS.text }}>{t.name}</div>
                          {t.time && <Pill bg={COLORS.graySoft} color={COLORS.textMuted}><Clock size={10} />{t.time}</Pill>}
                          {t.category && <Pill bg={COLORS.blueSoft} color={COLORS.blue}>{t.category}</Pill>}
                          {t.recurring !== "none" && <Pill bg={COLORS.amberSoft} color={COLORS.amber}><Repeat2 size={10} />{t.recurring}</Pill>}
                          <PriorityPill priority={t.priority || "Low"} />
                        </div>
                        {t.description && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>{t.description}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <IconBtn icon={<Pencil size={13} />} onClick={() => setShowTaskModal(t)} />
                        <IconBtn icon={<Trash2 size={13} />} danger onClick={() => removeTask(t.id)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card style={{ padding: 20 }}>
            <SectionTitle>Notes</SectionTitle>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={() => saveLog({ notes: noteDraft })}
              placeholder="Anything worth remembering about today…"
              style={{ ...inputStyle, width: "100%", minHeight: 80, resize: "vertical" }}
            />
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <SectionTitle><GraduationCap size={16} style={{ marginRight: 6, verticalAlign: -3 }} />School</SectionTitle>
            {dayAssignments.length === 0 ? (
              <div style={{ fontSize: 13, color: COLORS.textMuted }}>Nothing due today.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                {dayAssignments.map((a) => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13 }}>{a.name}</div>
                    <StatusPill status={a.status.toLowerCase().replace(" ", "_")} />
                  </div>
                ))}
              </div>
            )}
            <Field label="Study hours logged today">
              <input type="number" step="0.5" min="0" style={inputStyle} defaultValue={log.studyHours || ""} onBlur={(e) => saveLog({ studyHours: e.target.value ? Number(e.target.value) : undefined })} />
            </Field>
          </Card>

          <Card style={{ padding: 20 }}>
            <SectionTitle><Dumbbell size={16} style={{ marginRight: 6, verticalAlign: -3 }} />Health</SectionTitle>
            <div style={{ display: "flex", gap: 10 }}>
              <Field label="Sleep (hours)">
                <input type="number" step="0.5" min="0" style={inputStyle} defaultValue={log.sleepHours || ""} onBlur={(e) => saveLog({ sleepHours: e.target.value ? Number(e.target.value) : undefined })} />
              </Field>
              <Field label="Exercised?">
                <select style={inputStyle} value={log.exerciseDone ? "yes" : "no"} onChange={(e) => saveLog({ exerciseDone: e.target.value === "yes" })}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
            </div>
          </Card>

          <Card style={{ padding: 20 }}>
            <SectionTitle><Wallet size={16} style={{ marginRight: 6, verticalAlign: -3 }} />Money</SectionTitle>
            <div style={{ display: "flex", gap: 14, marginBottom: 12, fontSize: 13 }}>
              <div>Income <b style={{ color: COLORS.primary }}>{money(income)}</b></div>
              <div>Expenses <b style={{ color: COLORS.clay }}>{money(expense)}</b></div>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <select style={{ ...inputStyle, flex: "0 0 90px" }} value={quickTx.type} onChange={(e) => setQuickTx({ ...quickTx, type: e.target.value })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input placeholder="Amount" type="number" style={{ ...inputStyle, flex: 1, minWidth: 0 }} value={quickTx.amount} onChange={(e) => setQuickTx({ ...quickTx, amount: e.target.value })} />
              <Btn small onClick={addTx}><Plus size={13} /></Btn>
            </div>
            {dayTx.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {dayTx.map((t) => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span style={{ color: COLORS.textMuted }}>{t.category}</span>
                    <span style={{ color: t.type === "income" ? COLORS.primary : COLORS.clay, fontWeight: 600 }}>{t.type === "income" ? "+" : "-"}{money(t.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {showTaskModal && (
        <TaskModal
          task={showTaskModal === "new" ? null : showTaskModal}
          defaultDate={d}
          categories={data.categories}
          tags={data.tags}
          projects={data.projects}
          onClose={() => setShowTaskModal(null)}
          onSave={(t) => { saveTask(t); setShowTaskModal(null); }}
        />
      )}
    </div>
  );
}

function DateNav({ date, onChange, labelFn, unit }) {
  const step = unit === "day" ? (n) => addDays(date, n) : unit === "week" ? (n) => addDays(date, n * 7) : (n) => addMonths(date, n);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <IconBtn icon={<ChevronLeft size={15} />} onClick={() => onChange(step(-1))} />
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, minWidth: 200 }}>{labelFn(date)}</div>
      <IconBtn icon={<ChevronRight size={15} />} onClick={() => onChange(step(1))} />
      <Btn small variant="outline" onClick={() => onChange(unit === "month" ? startOfMonth(todayISO()) : unit === "week" ? startOfWeek(todayISO()) : todayISO())}>Today</Btn>
    </div>
  );
}

/* ============================================================================
   TASK MODAL (add / edit)
   ============================================================================ */
function TaskModal({ task, defaultDate, categories, tags, projects, onClose, onSave }) {
  const [f, setF] = useState(task ? { ...task } : {
    id: null, name: "", description: "", date: defaultDate, time: "", dueDate: "",
    priority: "Medium", category: categories[0] || "Personal", project: "", tags: [],
    recurring: "none", reminder: "", status: "not_started", notes: "",
  });
  const set = (k, v) => setF({ ...f, [k]: v });
  const toggleTag = (tag) => setF({ ...f, tags: f.tags.includes(tag) ? f.tags.filter((x) => x !== tag) : [...f.tags, tag] });

  return (
    <Modal title={task ? "Edit task" : "Add task"} onClose={onClose} wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Name"><input style={inputStyle} value={f.name} onChange={(e) => set("name", e.target.value)} autoFocus /></Field>
        <Field label="Description"><textarea style={{ ...inputStyle, minHeight: 60 }} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Date"><input type="date" style={inputStyle} value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
          <Field label="Time"><input type="time" style={inputStyle} value={f.time} onChange={(e) => set("time", e.target.value)} /></Field>
          <Field label="Due date"><input type="date" style={inputStyle} value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></Field>
          <Field label="Reminder"><input type="time" style={inputStyle} value={f.reminder} onChange={(e) => set("reminder", e.target.value)} /></Field>
          <Field label="Priority">
            <select style={inputStyle} value={f.priority} onChange={(e) => set("priority", e.target.value)}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </Field>
          <Field label="Category">
            <select style={inputStyle} value={f.category} onChange={(e) => set("category", e.target.value)}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Project">
            <select style={inputStyle} value={f.project} onChange={(e) => set("project", e.target.value)}>
              <option value="">None</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Recurring">
            <select style={inputStyle} value={f.recurring} onChange={(e) => set("recurring", e.target.value)}>
              <option value="none">One-off</option><option value="daily">Daily</option><option value="weekly">Weekly</option>
            </select>
          </Field>
        </div>
        <Field label="Tags">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tags.map((t) => (
              <button key={t} onClick={() => toggleTag(t)} type="button" style={{
                border: `1px solid ${f.tags.includes(t) ? COLORS.primary : COLORS.border}`,
                background: f.tags.includes(t) ? COLORS.primarySoft : "#fff", color: f.tags.includes(t) ? COLORS.primary : COLORS.textMuted,
                borderRadius: 999, padding: "4px 10px", fontSize: 12, cursor: "pointer",
              }}>{t}</button>
            ))}
          </div>
        </Field>
        <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 50 }} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => f.name.trim() && onSave(f)}>Save task</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
   WEEKLY
   ============================================================================ */
function Weekly({ data, update, selectedDate, setSelectedDate }) {
  const monday = startOfWeek(selectedDate);
  const dates = weekDates(monday);
  const today = todayISO();
  const isPast = addDays(monday, 6) < today;

  const perDay = dates.map((d) => {
    const dt = tasksForDate(data.tasks, d);
    const done = dt.filter((t) => isTaskDoneOn(t, d)).length;
    const log = data.dailyLogs[d] || {};
    const tx = data.transactions.filter((t) => t.date === d);
    const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = tx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const habitsDone = data.habits.filter((h) => h.completions[d]).length;
    return { date: d, total: dt.length, done, pct: dt.length ? (done / dt.length) * 100 : 0, sleep: log.sleepHours, study: log.studyHours, exercise: log.exerciseDone, income, expense, habitsDone };
  });

  const totalTasks = perDay.reduce((s, p) => s + p.total, 0);
  const totalDone = perDay.reduce((s, p) => s + p.done, 0);
  const totalIncome = perDay.reduce((s, p) => s + p.income, 0);
  const totalExpense = perDay.reduce((s, p) => s + p.expense, 0);
  const sleepVals = perDay.filter((p) => p.sleep).map((p) => p.sleep);
  const avgSleep = sleepVals.length ? sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length : 0;
  const totalStudy = perDay.reduce((s, p) => s + (p.study || 0), 0);
  const exerciseSessions = perDay.filter((p) => p.exercise).length;
  const savings = totalIncome - totalExpense;

  const goalsDone = data.goals.filter((g) => g.deadline >= monday && g.deadline <= addDays(monday, 6) && goalProgress(g) === 100).length;
  const habitTargetsHit = data.habits.filter((h) => dates.filter((d) => h.completions[d]).length >= h.targetPerWeek).length;

  const targets = data.weeklyTargets;

  const weekGoalRows = [
    { label: "Sleep", value: avgSleep, target: targets.sleepHours, fmt: (v) => `${v.toFixed(1)}h avg` },
    { label: "Study", value: totalStudy, target: targets.studyHours, fmt: (v) => `${v.toFixed(1)}h` },
    { label: "Exercise", value: exerciseSessions, target: targets.exerciseSessions, fmt: (v) => `${v}/${targets.exerciseSessions}` },
    { label: "Income", value: totalIncome, target: targets.income, fmt: (v) => money(v) },
    { label: "Savings", value: savings, target: targets.savings, fmt: (v) => money(v) },
  ];

  return (
    <div>
      <DateNav date={monday} onChange={setSelectedDate} labelFn={weekRangeLabel} unit="week" />

      {isPast && (
        <Card style={{ padding: "12px 16px", marginTop: 14, background: COLORS.primarySoft, border: `1px solid ${COLORS.primary}22`, display: "flex", alignItems: "center", gap: 8 }}>
          <CircleCheck size={16} color={COLORS.primary} />
          <div style={{ fontSize: 13, color: COLORS.inkSoft }}>Week summary — {totalDone}/{totalTasks} tasks completed, {money(savings)} saved, {goalsDone} goal(s) hit their deadline. Nothing here is ever deleted; scroll back any time.</div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 10, marginTop: 16 }}>
        {perDay.map((p) => (
          <Card key={p.date} style={{ padding: 12, background: p.date === today ? COLORS.primarySoft : COLORS.card }}>
            <div style={{ fontSize: 11.5, color: COLORS.textMuted, fontWeight: 600 }}>{shortDay(p.date)}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{shortDate(p.date)}</div>
            <CircularProgress value={p.pct} size={54} stroke={6} />
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8, lineHeight: 1.5 }}>
              <div>{p.done}/{p.total} tasks</div>
              <div>{p.sleep ? `${p.sleep}h sleep` : "—"}</div>
              <div>{p.study ? `${p.study}h study` : "—"}</div>
              <div style={{ color: p.expense ? COLORS.clay : undefined }}>{p.income || p.expense ? `${money(p.income - p.expense)}` : "—"}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 20, marginTop: 16 }}>
        <SectionTitle>Weekly goals</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {weekGoalRows.map((r) => {
            const pct = r.target ? clamp((r.value / r.target) * 100, 0, 100) : 0;
            return (
              <div key={r.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ fontWeight: 500 }}>{r.label}: {r.fmt(r.target)}</span>
                  <span style={{ color: COLORS.textMuted }}>{r.fmt(r.value)} · {Math.round(pct)}%</span>
                </div>
                <ProgressBar value={pct} color={pct >= 100 ? COLORS.primary : COLORS.blue} />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ============================================================================
   MONTHLY
   ============================================================================ */
function Monthly({ data, selectedDate, setSelectedDate }) {
  const first = startOfMonth(selectedDate);
  const dates = monthDates(first);

  const rows = dates.map((d) => {
    const dt = tasksForDate(data.tasks, d);
    const done = dt.filter((t) => isTaskDoneOn(t, d)).length;
    const log = data.dailyLogs[d] || {};
    const tx = data.transactions.filter((t) => t.date === d);
    const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = tx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    return { date: d, total: dt.length, done, sleep: log.sleepHours || 0, study: log.study || log.studyHours || 0, income, expense };
  });

  const income = rows.reduce((s, r) => s + r.income, 0);
  const expense = rows.reduce((s, r) => s + r.expense, 0);
  const savings = income - expense;
  const sleepVals = rows.filter((r) => r.sleep).map((r) => r.sleep);
  const avgSleep = sleepVals.length ? sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length : 0;
  const totalStudy = rows.reduce((s, r) => s + r.study, 0);
  const exerciseCount = dates.filter((d) => data.dailyLogs[d]?.exerciseDone).length;
  const totalTasks = rows.reduce((s, r) => s + r.total, 0);
  const totalDone = rows.reduce((s, r) => s + r.done, 0);
  const taskPct = totalTasks ? (totalDone / totalTasks) * 100 : 0;

  const monthGoals = data.goals.filter((g) => g.deadline >= first && g.deadline <= addDays(first, dates.length - 1));
  const goalPct = monthGoals.length ? (monthGoals.filter((g) => goalProgress(g) === 100).length / monthGoals.length) * 100 : 0;

  const schoolAssign = data.assignments.filter((a) => a.dueDate >= first && a.dueDate <= addDays(first, dates.length - 1));
  const schoolPct = schoolAssign.length ? (schoolAssign.filter((a) => a.status === "Completed").length / schoolAssign.length) * 100 : 0;

  const chartData = rows.map((r) => ({ day: shortDate(r.date).split(" ")[1], income: r.income, expense: r.expense, tasks: r.total ? Math.round((r.done / r.total) * 100) : 0 }));

  return (
    <div>
      <DateNav date={first} onChange={setSelectedDate} labelFn={monthLabel} unit="month" />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16, marginBottom: 16 }}>
        <StatCard icon={<TrendingUp size={16} />} label="Income" value={money(income)} accent={COLORS.primary} />
        <StatCard icon={<TrendingDown size={16} />} label="Expenses" value={money(expense)} accent={COLORS.clay} />
        <StatCard icon={<PiggyBank size={16} />} label="Savings" value={money(savings)} />
        <StatCard icon={<BookOpen size={16} />} label="Study hours" value={totalStudy.toFixed(1)} accent={COLORS.blue} />
        <StatCard icon={<Moon size={16} />} label="Avg sleep" value={avgSleep ? `${avgSleep.toFixed(1)}h` : "—"} accent={COLORS.blue} />
        <StatCard icon={<Dumbbell size={16} />} label="Exercise days" value={exerciseCount} />
        <StatCard icon={<GraduationCap size={16} />} label="School progress" value={`${Math.round(schoolPct)}%`} />
        <StatCard icon={<ListChecks size={16} />} label="Task completion" value={`${Math.round(taskPct)}%`} />
        <StatCard icon={<Target size={16} />} label="Goal completion" value={`${Math.round(goalPct)}%`} />
      </div>

      <Card style={{ padding: 20 }}>
        <SectionTitle>Trends this month</SectionTitle>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid stroke={COLORS.border} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} interval={Math.ceil(chartData.length / 12)} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 12 }} />
              <Bar dataKey="income" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill={COLORS.clay} radius={[4, 4, 0, 0]} name="Expense" />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================================
   SCHOOL
   ============================================================================ */
function goalProgress(g) {
  if (!g.milestones || g.milestones.length === 0) return 0;
  return Math.round((g.milestones.filter((m) => m.done).length / g.milestones.length) * 100);
}
function projectProgress(p) {
  if (!p.tasks || p.tasks.length === 0) return 0;
  return Math.round((p.tasks.filter((t) => t.done).length / p.tasks.length) * 100);
}

function School({ data, update }) {
  const [classModal, setClassModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);

  const total = data.assignments.length;
  const done = data.assignments.filter((a) => a.status === "Completed").length;
  const pct = total ? (done / total) * 100 : 0;
  const upcoming = data.assignments.filter((a) => a.status !== "Completed").sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);

  const saveClass = (c) => update((d) => { if (c.id) { const i = d.classes.findIndex((x) => x.id === c.id); d.classes[i] = c; } else d.classes.push({ ...c, id: uid() }); return d; });
  const removeClass = (id) => update((d) => { d.classes = d.classes.filter((c) => c.id !== id); d.assignments = d.assignments.filter((a) => a.classId !== id); return d; });
  const saveAssign = (a) => update((d) => { if (a.id) { const i = d.assignments.findIndex((x) => x.id === a.id); d.assignments[i] = a; } else d.assignments.push({ ...a, id: uid() }); return d; });
  const removeAssign = (id) => update((d) => { d.assignments = d.assignments.filter((a) => a.id !== id); return d; });

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <StatCard icon={<GraduationCap size={16} />} label="Classes" value={data.classes.length} />
        <StatCard icon={<ListChecks size={16} />} label="Overall progress" value={`${Math.round(pct)}%`} sub={`${done}/${total} assignments`} />
        <StatCard icon={<AlertCircle size={16} />} label="Overdue" value={data.assignments.filter(isOverdueAssignment).length} accent={COLORS.clay} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.4fr)", gap: 16 }}>
        <Card style={{ padding: 20 }}>
          <SectionTitle right={<Btn small onClick={() => setClassModal({})}><Plus size={14} />Class</Btn>}>Classes</SectionTitle>
          {data.classes.length === 0 ? <EmptyState icon={<GraduationCap size={26} />} text="No classes yet." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.classes.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: COLORS.paper }}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: c.color }} />
                  <div style={{ flex: 1, fontSize: 13.5 }}>{c.name}</div>
                  <IconBtn icon={<Pencil size={13} />} onClick={() => setClassModal(c)} />
                  <IconBtn icon={<Trash2 size={13} />} danger onClick={() => removeClass(c.id)} />
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <SectionTitle>Upcoming deadlines</SectionTitle>
            {upcoming.length === 0 ? <div style={{ fontSize: 13, color: COLORS.textMuted }}>Nothing pending.</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {upcoming.map((a) => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span>{a.name}</span>
                    <span style={{ color: a.dueDate < todayISO() ? COLORS.clay : COLORS.textMuted }}>{shortDate(a.dueDate)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionTitle right={<Btn small onClick={() => setAssignModal({})}><Plus size={14} />Assignment</Btn>}>Assignments & exams</SectionTitle>
          {data.assignments.length === 0 ? <EmptyState icon={<ListChecks size={26} />} text="No assignments yet." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.assignments.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((a) => {
                const cls = data.classes.find((c) => c.id === a.classId);
                const overdue = isOverdueAssignment(a);
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 10, background: COLORS.paper }}>
                    <div style={{ width: 10, height: 10, borderRadius: 999, background: cls?.color || COLORS.gray, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{a.name}</div>
                      <div style={{ fontSize: 11.5, color: COLORS.textMuted }}>{cls?.name || "No class"} · due {shortDate(a.dueDate)}</div>
                    </div>
                    <PriorityPill priority={a.priority} />
                    <StatusPill status={overdue ? "overdue" : a.status.toLowerCase().replace(" ", "_")} />
                    <IconBtn icon={<Pencil size={13} />} onClick={() => setAssignModal(a)} />
                    <IconBtn icon={<Trash2 size={13} />} danger onClick={() => removeAssign(a.id)} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {classModal && <ClassModal cls={classModal} onClose={() => setClassModal(null)} onSave={(c) => { saveClass(c); setClassModal(null); }} />}
      {assignModal && <AssignModal assignment={assignModal} classes={data.classes} onClose={() => setAssignModal(null)} onSave={(a) => { saveAssign(a); setAssignModal(null); }} />}
    </div>
  );
}
function isOverdueAssignment(a) { return a.status !== "Completed" && a.status !== "Cancelled" && a.dueDate < todayISO(); }

function ClassModal({ cls, onClose, onSave }) {
  const [f, setF] = useState({ id: cls.id || null, name: cls.name || "", color: cls.color || CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)] });
  return (
    <Modal title={cls.id ? "Edit class" : "Add class"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Name"><input style={inputStyle} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <Field label="Color">
          <div style={{ display: "flex", gap: 8 }}>
            {CAT_COLORS.map((c) => (
              <button key={c} onClick={() => setF({ ...f, color: c })} style={{ width: 26, height: 26, borderRadius: 999, background: c, border: f.color === c ? `2px solid ${COLORS.ink}` : "2px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => f.name.trim() && onSave(f)}>Save</Btn>
        </div>
      </div>
    </Modal>
  );
}

function AssignModal({ assignment, classes, onClose, onSave }) {
  const [f, setF] = useState({
    id: assignment.id || null, name: assignment.name || "", classId: assignment.classId || (classes[0]?.id || ""),
    dueDate: assignment.dueDate || todayISO(), priority: assignment.priority || "Medium", status: assignment.status || "Not Started", description: assignment.description || "",
  });
  return (
    <Modal title={assignment.id ? "Edit assignment" : "Add assignment"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Name"><input style={inputStyle} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <Field label="Class">
          <select style={inputStyle} value={f.classId} onChange={(e) => setF({ ...f, classId: e.target.value })}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Due date"><input type="date" style={inputStyle} value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
          <Field label="Priority">
            <select style={inputStyle} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select>
          </Field>
          <Field label="Status">
            <select style={inputStyle} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              <option>Not Started</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
            </select>
          </Field>
        </div>
        <Field label="Description"><textarea style={{ ...inputStyle, minHeight: 60 }} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => f.name.trim() && onSave(f)}>Save</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
   MONEY
   ============================================================================ */
function Money({ data, update }) {
  const [txModal, setTxModal] = useState(null);
  const [monthAnchor, setMonthAnchor] = useState(startOfMonth(todayISO()));
  const today = todayISO();
  const monday = startOfWeek(today);

  const all = data.transactions;
  const sum = (list, type) => list.filter((t) => t.type === type).reduce((s, t) => s + Number(t.amount), 0);

  const todayList = all.filter((t) => t.date === today);
  const weekList = all.filter((t) => t.date >= monday && t.date <= addDays(monday, 6));
  const monthList = all.filter((t) => t.date >= monthAnchor && t.date <= addDays(monthAnchor, daysInMonth(monthAnchor) - 1));
  const totalSavings = sum(all, "income") - sum(all, "expense");

  const catBreakdown = useMemo(() => {
    const map = {};
    monthList.filter((t) => t.type === "expense").forEach((t) => { map[t.category] = (map[t.category] || 0) + Number(t.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [monthList]);

  const saveTx = (t) => update((d) => { if (t.id) { const i = d.transactions.findIndex((x) => x.id === t.id); d.transactions[i] = t; } else d.transactions.push({ ...t, id: uid() }); return d; });
  const removeTx = (id) => update((d) => { d.transactions = d.transactions.filter((t) => t.id !== id); return d; });

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <StatCard icon={<Wallet size={16} />} label="Today" value={money(sum(todayList, "income") - sum(todayList, "expense"))} />
        <StatCard icon={<CalendarDays size={16} />} label="This week" value={money(sum(weekList, "income") - sum(weekList, "expense"))} />
        <StatCard icon={<CalendarRange size={16} />} label="This month" value={money(sum(monthList, "income") - sum(monthList, "expense"))} />
        <StatCard icon={<PiggyBank size={16} />} label="Total savings" value={money(totalSavings)} accent={totalSavings >= 0 ? COLORS.primary : COLORS.clay} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 16 }}>
        <Card style={{ padding: 20 }}>
          <SectionTitle right={<Btn small onClick={() => setTxModal({})}><Plus size={14} />Add</Btn>}>All transactions</SectionTitle>
          {all.length === 0 ? <EmptyState icon={<Wallet size={26} />} text="No transactions logged yet." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 420, overflowY: "auto" }}>
              {all.slice().sort((a, b) => b.date.localeCompare(a.date)).map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: COLORS.paper }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: t.type === "income" ? COLORS.primarySoft : COLORS.claySoft, color: t.type === "income" ? COLORS.primary : COLORS.clay, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {t.type === "income" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{t.category}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>{shortDate(t.date)}{t.note ? ` · ${t.note}` : ""}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: t.type === "income" ? COLORS.primary : COLORS.clay }}>
                    {t.type === "income" ? "+" : "-"}{money(t.amount)}
                  </div>
                  <IconBtn icon={<Pencil size={12} />} onClick={() => setTxModal(t)} />
                  <IconBtn icon={<Trash2 size={12} />} danger onClick={() => removeTx(t.id)} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionTitle right={<div style={{ display: "flex", gap: 4 }}>
            <IconBtn icon={<ChevronLeft size={13} />} onClick={() => setMonthAnchor(addMonths(monthAnchor, -1))} />
            <IconBtn icon={<ChevronRight size={13} />} onClick={() => setMonthAnchor(addMonths(monthAnchor, 1))} />
          </div>}>Spending — {monthLabel(monthAnchor)}</SectionTitle>
          {catBreakdown.length === 0 ? <EmptyState icon={<PiggyBank size={26} />} text="No expenses logged this month." /> : (
            <>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={catBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {catBreakdown.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                {catBreakdown.map((c, i) => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                    <div style={{ width: 9, height: 9, borderRadius: 999, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    <div style={{ flex: 1 }}>{c.name}</div>
                    <div style={{ fontWeight: 600 }}>{money(c.value)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {txModal && <TxModal tx={txModal} categories={data.categories} onClose={() => setTxModal(null)} onSave={(t) => { saveTx(t); setTxModal(null); }} />}
    </div>
  );
}

function TxModal({ tx, categories, onClose, onSave }) {
  const [f, setF] = useState({
    id: tx.id || null, type: tx.type || "expense", amount: tx.amount || "", category: tx.category || categories[0] || "Other",
    date: tx.date || todayISO(), note: tx.note || "",
  });
  return (
    <Modal title={tx.id ? "Edit transaction" : "Add transaction"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Type">
            <select style={inputStyle} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select>
          </Field>
          <Field label="Amount"><input type="number" style={inputStyle} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} autoFocus /></Field>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Category / source"><input style={inputStyle} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
          <Field label="Date"><input type="date" style={inputStyle} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        </div>
        <Field label="Note"><input style={inputStyle} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => f.amount && onSave({ ...f, amount: Number(f.amount) })}>Save</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
   GOALS
   ============================================================================ */
function Goals({ data, update }) {
  const [modal, setModal] = useState(null);
  const save = (g) => update((d) => { if (g.id) { const i = d.goals.findIndex((x) => x.id === g.id); d.goals[i] = g; } else d.goals.push({ ...g, id: uid() }); return d; });
  const remove = (id) => update((d) => { d.goals = d.goals.filter((g) => g.id !== id); return d; });
  const toggleMilestone = (goalId, mid) => update((d) => {
    const g = d.goals.find((x) => x.id === goalId);
    const m = g.milestones.find((x) => x.id === mid);
    m.done = !m.done;
    return d;
  });

  return (
    <div>
      <SectionTitle right={<Btn small onClick={() => setModal({})}><Plus size={14} />New goal</Btn>}>Long-term goals</SectionTitle>
      {data.goals.length === 0 ? <EmptyState icon={<Target size={30} />} text="No goals yet — set your first one." action={<Btn small onClick={() => setModal({})}>Add a goal</Btn>} /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {data.goals.map((g) => {
            const pct = goalProgress(g);
            return (
              <Card key={g.id} style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <Pill bg={COLORS.blueSoft} color={COLORS.blue}>{g.category}</Pill>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15.5, marginTop: 6 }}>{g.title}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <IconBtn icon={<Pencil size={13} />} onClick={() => setModal(g)} />
                    <IconBtn icon={<Trash2 size={13} />} danger onClick={() => remove(g.id)} />
                  </div>
                </div>
                {g.description && <div style={{ fontSize: 12.5, color: COLORS.textMuted, marginBottom: 10 }}>{g.description}</div>}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <ProgressBar value={pct} />
                  <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>{pct}%</div>
                </div>
                <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginBottom: 10 }}>Deadline {shortDate(g.deadline)}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {g.milestones.map((m) => (
                    <div key={m.id} onClick={() => toggleMilestone(g.id, m.id)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                      {m.done ? <CircleCheck size={16} color={COLORS.primary} /> : <Circle size={16} color={COLORS.gray} />}
                      <span style={{ textDecoration: m.done ? "line-through" : "none", color: m.done ? COLORS.textMuted : COLORS.text }}>{m.name}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {modal && <GoalModal goal={modal} categories={data.categories} onClose={() => setModal(null)} onSave={(g) => { save(g); setModal(null); }} />}
    </div>
  );
}

function GoalModal({ goal, categories, onClose, onSave }) {
  const [f, setF] = useState({
    id: goal.id || null, title: goal.title || "", description: goal.description || "", deadline: goal.deadline || addDays(todayISO(), 30),
    category: goal.category || categories[0] || "Personal", notes: goal.notes || "", milestones: goal.milestones ? [...goal.milestones] : [],
  });
  const [newMilestone, setNewMilestone] = useState("");
  const addMilestone = () => { if (!newMilestone.trim()) return; setF({ ...f, milestones: [...f.milestones, { id: uid(), name: newMilestone.trim(), done: false }] }); setNewMilestone(""); };
  const removeMilestone = (id) => setF({ ...f, milestones: f.milestones.filter((m) => m.id !== id) });
  const toggleMilestone = (id) => setF({ ...f, milestones: f.milestones.map((m) => (m.id === id ? { ...m, done: !m.done } : m)) });

  return (
    <Modal title={goal.id ? "Edit goal" : "New goal"} onClose={onClose} wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Title"><input style={inputStyle} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} autoFocus /></Field>
        <Field label="Description"><textarea style={{ ...inputStyle, minHeight: 50 }} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Deadline"><input type="date" style={inputStyle} value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Field>
          <Field label="Category">
            <select style={inputStyle} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {["School", "Money", "Fitness", "Work", "Personal", "Other"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Milestones">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            {f.milestones.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => toggleMilestone(m.id)} type="button" style={{ border: "none", background: "transparent", cursor: "pointer", color: m.done ? COLORS.primary : COLORS.gray }}>
                  {m.done ? <CircleCheck size={17} /> : <Circle size={17} />}
                </button>
                <div style={{ flex: 1, fontSize: 13 }}>{m.name}</div>
                <IconBtn icon={<Trash2 size={12} />} danger onClick={() => removeMilestone(m.id)} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Add a milestone" value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMilestone())} />
            <Btn small onClick={addMilestone}><Plus size={13} /></Btn>
          </div>
        </Field>
        <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 50 }} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => f.title.trim() && onSave(f)}>Save goal</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
   PROJECTS
   ============================================================================ */
function Projects({ data, update }) {
  const [modal, setModal] = useState(null);
  const save = (p) => update((d) => { if (p.id) { const i = d.projects.findIndex((x) => x.id === p.id); d.projects[i] = p; } else d.projects.push({ ...p, id: uid() }); return d; });
  const remove = (id) => update((d) => { d.projects = d.projects.filter((p) => p.id !== id); return d; });
  const toggleTask = (projId, tid) => update((d) => {
    const p = d.projects.find((x) => x.id === projId);
    const t = p.tasks.find((x) => x.id === tid);
    t.done = !t.done;
    return d;
  });

  return (
    <div>
      <SectionTitle right={<Btn small onClick={() => setModal({})}><Plus size={14} />New project</Btn>}>Projects</SectionTitle>
      {data.projects.length === 0 ? <EmptyState icon={<FolderKanban size={30} />} text="No projects yet." action={<Btn small onClick={() => setModal({})}>Add a project</Btn>} /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {data.projects.map((p) => {
            const pct = projectProgress(p);
            const doneCount = p.tasks.filter((t) => t.done).length;
            return (
              <Card key={p.id} style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 15.5 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 3 }}>{doneCount}/{p.tasks.length} tasks · due {p.deadline ? shortDate(p.deadline) : "—"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <IconBtn icon={<Pencil size={13} />} onClick={() => setModal(p)} />
                    <IconBtn icon={<Trash2 size={13} />} danger onClick={() => remove(p.id)} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <ProgressBar value={pct} />
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{pct}%</div>
                </div>
                <StatusPill status={(p.status || "in_progress").toLowerCase().replace(" ", "_")} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12, maxHeight: 180, overflowY: "auto" }}>
                  {p.tasks.map((t) => (
                    <div key={t.id} onClick={() => toggleTask(p.id, t.id)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                      {t.done ? <CircleCheck size={15} color={COLORS.primary} /> : <Circle size={15} color={COLORS.gray} />}
                      <span style={{ textDecoration: t.done ? "line-through" : "none", color: t.done ? COLORS.textMuted : COLORS.text }}>{t.name}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {modal && <ProjectModal project={modal} onClose={() => setModal(null)} onSave={(p) => { save(p); setModal(null); }} />}
    </div>
  );
}

function ProjectModal({ project, onClose, onSave }) {
  const [f, setF] = useState({
    id: project.id || null, name: project.name || "", description: project.description || "", deadline: project.deadline || "",
    status: project.status || "In Progress", notes: project.notes || "", tasks: project.tasks ? [...project.tasks] : [],
  });
  const [newTask, setNewTask] = useState("");
  const addTask = () => { if (!newTask.trim()) return; setF({ ...f, tasks: [...f.tasks, { id: uid(), name: newTask.trim(), done: false }] }); setNewTask(""); };
  const removeTask = (id) => setF({ ...f, tasks: f.tasks.filter((t) => t.id !== id) });
  const toggleTask = (id) => setF({ ...f, tasks: f.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });

  return (
    <Modal title={project.id ? "Edit project" : "New project"} onClose={onClose} wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Name"><input style={inputStyle} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <Field label="Description"><textarea style={{ ...inputStyle, minHeight: 50 }} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Deadline"><input type="date" style={inputStyle} value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Field>
          <Field label="Status">
            <select style={inputStyle} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              <option>Not Started</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
            </select>
          </Field>
        </div>
        <Field label="Tasks / subtasks">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8, maxHeight: 200, overflowY: "auto" }}>
            {f.tasks.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => toggleTask(t.id)} type="button" style={{ border: "none", background: "transparent", cursor: "pointer", color: t.done ? COLORS.primary : COLORS.gray }}>
                  {t.done ? <CircleCheck size={17} /> : <Circle size={17} />}
                </button>
                <div style={{ flex: 1, fontSize: 13 }}>{t.name}</div>
                <IconBtn icon={<Trash2 size={12} />} danger onClick={() => removeTask(t.id)} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Add a task" value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTask())} />
            <Btn small onClick={addTask}><Plus size={13} /></Btn>
          </div>
        </Field>
        <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 50 }} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => f.name.trim() && onSave(f)}>Save project</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
   HABITS
   ============================================================================ */
function Habits({ data, update }) {
  const [modal, setModal] = useState(null);
  const monday = startOfWeek(todayISO());
  const dates = weekDates(monday);
  const today = todayISO();

  const save = (h) => update((d) => { if (h.id) { const i = d.habits.findIndex((x) => x.id === h.id); d.habits[i] = h; } else d.habits.push({ ...h, id: uid(), completions: {} }); return d; });
  const remove = (id) => update((d) => { d.habits = d.habits.filter((h) => h.id !== id); return d; });
  const toggle = (id, date) => update((d) => {
    const h = d.habits.find((x) => x.id === id);
    h.completions[date] = !h.completions[date];
    return d;
  });

  const streak = (h) => {
    let s = 0, d = today;
    while (h.completions[d]) { s++; d = addDays(d, -1); }
    return s;
  };

  return (
    <div>
      <SectionTitle right={<Btn small onClick={() => setModal({})}><Plus size={14} />New habit</Btn>}>Habits</SectionTitle>
      {data.habits.length === 0 ? <EmptyState icon={<Repeat2 size={30} />} text="No habits yet." action={<Btn small onClick={() => setModal({})}>Add a habit</Btn>} /> : (
        <Card style={{ padding: 20, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", fontSize: 12, color: COLORS.textMuted, fontWeight: 500, paddingBottom: 10 }}>Habit</th>
                {dates.map((d) => (
                  <th key={d} style={{ fontSize: 11.5, color: d === today ? COLORS.primary : COLORS.textMuted, fontWeight: 600, paddingBottom: 10, width: 44 }}>{shortDay(d)}</th>
                ))}
                <th style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500, paddingBottom: 10 }}>Streak</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.habits.map((h) => {
                const weekCount = dates.filter((d) => h.completions[d]).length;
                return (
                  <tr key={h.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "10px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 9, height: 9, borderRadius: 999, background: h.color }} />
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{h.name}</div>
                          <div style={{ fontSize: 11, color: COLORS.textMuted }}>{weekCount}/{h.targetPerWeek} this week</div>
                        </div>
                      </div>
                    </td>
                    {dates.map((d) => (
                      <td key={d} style={{ textAlign: "center" }}>
                        <button onClick={() => toggle(h.id, d)} style={{ border: "none", background: "transparent", cursor: "pointer", color: h.completions[d] ? h.color : COLORS.graySoft }}>
                          <CircleCheck size={20} />
                        </button>
                      </td>
                    ))}
                    <td style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: COLORS.amber }}>
                      <Flame size={13} style={{ verticalAlign: -2 }} /> {streak(h)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <IconBtn icon={<Pencil size={12} />} onClick={() => setModal(h)} />
                        <IconBtn icon={<Trash2 size={12} />} danger onClick={() => remove(h.id)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      {modal && <HabitModal habit={modal} onClose={() => setModal(null)} onSave={(h) => { save(h); setModal(null); }} />}
    </div>
  );
}

function HabitModal({ habit, onClose, onSave }) {
  const [f, setF] = useState({ id: habit.id || null, name: habit.name || "", category: habit.category || "Personal", targetPerWeek: habit.targetPerWeek || 7, color: habit.color || CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)], completions: habit.completions || {} });
  return (
    <Modal title={habit.id ? "Edit habit" : "New habit"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Name"><input style={inputStyle} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Category"><input style={inputStyle} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
          <Field label="Target / week"><input type="number" min="1" max="7" style={inputStyle} value={f.targetPerWeek} onChange={(e) => setF({ ...f, targetPerWeek: Number(e.target.value) })} /></Field>
        </div>
        <Field label="Color">
          <div style={{ display: "flex", gap: 8 }}>
            {CAT_COLORS.map((c) => (
              <button key={c} onClick={() => setF({ ...f, color: c })} style={{ width: 26, height: 26, borderRadius: 999, background: c, border: f.color === c ? `2px solid ${COLORS.ink}` : "2px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => f.name.trim() && onSave(f)}>Save</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
   ANALYTICS
   ============================================================================ */
function Analytics({ data }) {
  const [range, setRange] = useState(30);
  const today = todayISO();
  const dates = Array.from({ length: range }, (_, i) => addDays(today, -(range - 1 - i)));

  const rows = dates.map((d) => {
    const dt = tasksForDate(data.tasks, d);
    const done = dt.filter((t) => isTaskDoneOn(t, d)).length;
    const log = data.dailyLogs[d] || {};
    const tx = data.transactions.filter((t) => t.date === d);
    const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = tx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const habitTotal = data.habits.length;
    const habitDone = data.habits.filter((h) => h.completions[d]).length;
    return {
      date: d, label: shortDate(d), taskPct: dt.length ? Math.round((done / dt.length) * 100) : null,
      sleep: log.sleepHours || null, study: log.studyHours || null, income, expense, savings: income - expense,
      habitPct: habitTotal ? Math.round((habitDone / habitTotal) * 100) : null,
    };
  });

  const avg = (key) => { const v = rows.filter((r) => r[key] != null); return v.length ? v.reduce((s, r) => s + r[key], 0) / v.length : 0; };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[7, 30, 90, 365].map((r) => (
          <button key={r} onClick={() => setRange(r)} style={{
            border: `1px solid ${range === r ? COLORS.ink : COLORS.border}`, background: range === r ? COLORS.ink : "#fff",
            color: range === r ? "#fff" : COLORS.text, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            {r === 7 ? "7 days" : r === 30 ? "30 days" : r === 90 ? "3 months" : "1 year"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <StatCard icon={<ListChecks size={16} />} label="Avg task completion" value={`${Math.round(avg("taskPct"))}%`} />
        <StatCard icon={<Moon size={16} />} label="Avg sleep" value={`${avg("sleep").toFixed(1)}h`} accent={COLORS.blue} />
        <StatCard icon={<BookOpen size={16} />} label="Avg study" value={`${avg("study").toFixed(1)}h`} accent={COLORS.blue} />
        <StatCard icon={<Repeat2 size={16} />} label="Avg habit completion" value={`${Math.round(avg("habitPct"))}%`} />
        <StatCard icon={<PiggyBank size={16} />} label="Net savings" value={money(rows.reduce((s, r) => s + r.savings, 0))} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <ChartCard title="Task completion %">
          <AreaChart data={rows}>
            <defs><linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.35} /><stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke={COLORS.border} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} interval={Math.ceil(rows.length / 10)} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 12 }} />
            <Area type="monotone" dataKey="taskPct" stroke={COLORS.primary} fill="url(#taskGrad)" strokeWidth={2} connectNulls />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Sleep & study hours">
          <LineChart data={rows}>
            <CartesianGrid stroke={COLORS.border} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} interval={Math.ceil(rows.length / 10)} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="sleep" name="Sleep (h)" stroke={COLORS.blue} strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="study" name="Study (h)" stroke={COLORS.amber} strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ChartCard>

        <ChartCard title="Income vs expenses">
          <BarChart data={rows}>
            <CartesianGrid stroke={COLORS.border} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} interval={Math.ceil(rows.length / 10)} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 12 }} formatter={(v) => money(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="income" name="Income" fill={COLORS.primary} radius={[3, 3, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill={COLORS.clay} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Habit completion %">
          <AreaChart data={rows}>
            <defs><linearGradient id="habitGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.35} /><stop offset="100%" stopColor={COLORS.blue} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke={COLORS.border} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} interval={Math.ceil(rows.length / 10)} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 12 }} />
            <Area type="monotone" dataKey="habitPct" stroke={COLORS.blue} fill="url(#habitGrad)" strokeWidth={2} connectNulls />
          </AreaChart>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <Card style={{ padding: 20 }}>
      <SectionTitle>{title}</SectionTitle>
      <div style={{ width: "100%", height: 230 }}>
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ============================================================================
   SETTINGS
   ============================================================================ */
function SettingsPage({ data, update }) {
  const [name, setName] = useState(data.profile.name);
  const [targets, setTargets] = useState(data.weeklyTargets);
  const [newCat, setNewCat] = useState("");
  const [newTag, setNewTag] = useState("");
  const [notifStatus, setNotifStatus] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");

  const saveProfile = () => update((d) => { d.profile.name = name; return d; });
  const saveTargets = () => update((d) => { d.weeklyTargets = targets; return d; });
  const addCategory = () => { if (!newCat.trim()) return; update((d) => { d.categories = [...d.categories, newCat.trim()]; return d; }); setNewCat(""); };
  const removeCategory = (c) => update((d) => { d.categories = d.categories.filter((x) => x !== c); return d; });
  const addTag = () => { if (!newTag.trim()) return; update((d) => { d.tags = [...d.tags, newTag.trim()]; return d; }); setNewTag(""); };
  const removeTag = (t) => update((d) => { d.tags = d.tags.filter((x) => x !== t); return d; });

  const requestNotif = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifStatus(perm);
    update((d) => { d.notifSettings = { enabled: perm === "granted" }; return d; });
    if (perm === "granted") new Notification("Life OS", { body: "Reminders are on while this tab stays open." });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
      <Card style={{ padding: 20 }}>
        <SectionTitle>Profile</SectionTitle>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...inputStyle, flex: 1 }} value={name} onChange={(e) => setName(e.target.value)} />
          <Btn onClick={saveProfile}>Save</Btn>
        </div>
      </Card>

      <Card style={{ padding: 20 }}>
        <SectionTitle>Weekly targets</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Field label="Sleep (h/night avg)"><input type="number" style={inputStyle} value={targets.sleepHours} onChange={(e) => setTargets({ ...targets, sleepHours: Number(e.target.value) })} /></Field>
          <Field label="Study (h/week)"><input type="number" style={inputStyle} value={targets.studyHours} onChange={(e) => setTargets({ ...targets, studyHours: Number(e.target.value) })} /></Field>
          <Field label="Exercise (sessions/week)"><input type="number" style={inputStyle} value={targets.exerciseSessions} onChange={(e) => setTargets({ ...targets, exerciseSessions: Number(e.target.value) })} /></Field>
          <Field label="Income ($/week)"><input type="number" style={inputStyle} value={targets.income} onChange={(e) => setTargets({ ...targets, income: Number(e.target.value) })} /></Field>
          <Field label="Savings ($/week)"><input type="number" style={inputStyle} value={targets.savings} onChange={(e) => setTargets({ ...targets, savings: Number(e.target.value) })} /></Field>
        </div>
        <Btn onClick={saveTargets}>Save targets</Btn>
      </Card>

      <Card style={{ padding: 20 }}>
        <SectionTitle>Categories</SectionTitle>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {data.categories.map((c) => (
            <Pill key={c} bg={COLORS.blueSoft} color={COLORS.blue}>{c} <X size={11} style={{ cursor: "pointer" }} onClick={() => removeCategory(c)} /></Pill>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="New category" value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} />
          <Btn small onClick={addCategory}><Plus size={13} /></Btn>
        </div>
      </Card>

      <Card style={{ padding: 20 }}>
        <SectionTitle>Tags</SectionTitle>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {data.tags.map((t) => (
            <Pill key={t} bg={COLORS.graySoft} color={COLORS.textMuted}>{t} <X size={11} style={{ cursor: "pointer" }} onClick={() => removeTag(t)} /></Pill>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="New tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} />
          <Btn small onClick={addTag}><Plus size={13} /></Btn>
        </div>
      </Card>

      <Card style={{ padding: 20 }}>
        <SectionTitle><Bell size={16} style={{ marginRight: 6, verticalAlign: -3 }} />Notifications</SectionTitle>
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>
          Browser notifications fire for reminders while Life OS is open in a tab. Status: <b style={{ color: COLORS.text }}>{notifStatus}</b>
        </div>
        <Btn onClick={requestNotif} variant="outline">Enable browser notifications</Btn>
      </Card>
    </div>
  );
}
