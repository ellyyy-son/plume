"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { createClient } from "@/utils/supabase/client";
import {
    startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, format, addMonths, isSameDay, isSameMonth,
} from "date-fns";
import CustomSelect from "./select";

type Event = {
    id: string;
    name: string;
    date: Date;
    time: string;
    category: string;
    notes: string;
};

type Task = {
    id: string;
    task_details: string;
    is_complete: boolean;
    created_at: string;
    task_title: string;
    task_deadline: string;
    completion_datetime: string;
    task_difficulty: string;
};

type ModalMode = "list" | "form";

const CATEGORIES = ["Work", "Personal", "School", "Health", "Other"];
const CATEGORY_COLORS: Record<string, string> = {
    Work: "bg-blue-200 text-blue-800",
    Personal: "bg-pink-200 text-pink-800",
    School: "bg-yellow-200 text-yellow-800",
    Health: "bg-green-200 text-green-800",
    Other: "bg-purple-200 text-purple-800",
};
const TASK_DIFFICULTY_COLORS: Record<string, string> = {
    Easy: "bg-emerald-200 text-emerald-800",
    Medium: "bg-orange-200 text-orange-800",
    Hard: "bg-red-200 text-red-800",
};

// Parses a "yyyy-MM-dd" string as local midnight to avoid UTC off-by-one issues
function parseLocalDate(dateStr: string): Date {
    const d = new Date(dateStr); // correctly parses "+00" as UTC
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getDeadlineUrgency(deadline: string): "overdue" | "today" | "soon" | null {
    const today = new Date();
    const due = parseLocalDate(deadline);
    const diffDays = Math.ceil((due.getTime() - new Date(today.setHours(0, 0, 0, 0)).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "overdue";
    if (diffDays === 0) return "today";
    if (diffDays <= 3) return "soon";
    return null;
}

const URGENCY_ICONS: Record<string, string> = {
    overdue: "🚨",
    today: "⚠️",
    soon: "⏰",
};

const URGENCY_LABELS: Record<string, string> = {
    overdue: "overdue",
    today: "due today",
    soon: "due soon",
};

const URGENCY_BADGE_COLORS: Record<string, string> = {
    overdue: "bg-red-100 text-red-700",
    today: "bg-orange-100 text-orange-700",
    soon: "bg-yellow-100 text-yellow-700",
};

export default function KawaiiCalendar() {
    const [current, setCurrent] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [modalMode, setModalMode] = useState<ModalMode>("list");
    const [modal, setModal] = useState<{ open: boolean; date: Date | null }>({ open: false, date: null });
    const [form, setForm] = useState({ name: "", time: "12:00", category: "Work", notes: "" });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [user_id, setUserID] = useState("");

    const router = useRouter();
    const supabase = createClient();

    const gridStart = startOfWeek(startOfMonth(current));
    const gridEnd = endOfWeek(endOfMonth(current));
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUserID(user.id);
        }
        loadUser();
    }, []);

    useEffect(() => {
        if (!user_id) return;
        getEventsForMonth();
        getTasks();
    }, [user_id, current]);

    async function getTasks() {
        const { data, error } = await supabase
            .from('task')
            .select('*')
            .eq('user_id', user_id);

        if (error) {
            console.error('Get Tasks Error:', error.message);
            return;
        }

        const loaded: Task[] = data.map(row => ({
            id: row.id.toString(),
            task_details: row.task_details,
            is_complete: row.is_complete,
            created_at: row.created_at,
            task_title: row.task_title,
            task_deadline: row.task_deadline,
            completion_datetime: row.completion_datetime,
            task_difficulty: row.task_difficulty,
        }));

        setTasks(loaded);
    }

    async function getEventsForMonth() {
        const monthStart = format(startOfMonth(current), "yyyy-MM-dd");
        const monthEnd = format(endOfMonth(current), "yyyy-MM-dd");

        const { data, error } = await supabase
            .from('events')
            .select()
            .eq('user_id', user_id)
            .gte('event_date', monthStart)
            .lte('event_date', monthEnd);

        if (error) {
            console.error('Get Events Error:', error.message);
            return;
        }

        const loaded: Event[] = data.map(row => ({
            id: row.event_id.toString(),
            name: row.event_name,
            date: parseLocalDate(row.event_date),
            time: row.event_time ?? "12:00",
            category: row.event_category,
            notes: row.notes ?? "",
        }));

        setEvents(loaded);
    }

    const openListModal = (date: Date) => {
        setModal({ open: true, date });
        setModalMode("list");
    };

    const openNewEventForm = () => {
        setEditingId(null);
        setForm({ name: "", time: "12:00", category: "Work", notes: "" });
        setModalMode("form");
    };

    const openEditForm = (ev: Event) => {
        setEditingId(ev.id);
        setForm({ name: ev.name, time: ev.time, category: ev.category, notes: ev.notes });
        setModalMode("form");
    };

    const closeModal = () => setModal({ open: false, date: null });

    async function saveEvent() {
        if (!form.name || !modal.date) return;

        if (editingId) {
            const { data, error } = await supabase
                .from('events')
                .update({
                    event_name: form.name,
                    event_time: form.time,
                    event_category: form.category,
                    notes: form.notes,
                })
                .eq('event_id', editingId)
                .eq('user_id', user_id)
                .select()
                .single();

            if (error) {
                console.error('Update Event Error:', error.message);
                return;
            }

            setEvents(prev => prev.map(e => e.id === editingId ? {
                ...e,
                name: data.event_name,
                time: data.event_time ?? "12:00",
                category: data.event_category,
                notes: data.notes ?? "",
            } : e));

        } else {
            const { data, error } = await supabase
                .from('events')
                .insert({
                    user_id,
                    event_name: form.name,
                    event_date: format(modal.date, "yyyy-MM-dd"),
                    event_time: form.time,
                    event_category: form.category,
                    notes: form.notes,
                })
                .select()
                .single();

            if (error) {
                console.error('Save Event Error:', error.message);
                return;
            }

            setEvents(prev => [...prev, {
                id: data.event_id.toString(),
                name: data.event_name,
                date: modal.date!,
                time: data.event_time ?? "12:00",
                category: data.event_category,
                notes: data.notes ?? "",
            }]);
        }

        setModalMode("list");
        setEditingId(null);
    }

    async function deleteEvent(id: string) {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('event_id', id)
            .eq('user_id', user_id);

        if (error) {
            console.error('Delete Event Error:', error.message);
            return;
        }

        setEvents(prev => prev.filter(e => e.id !== id));
    }

    const selectedDayEvents = modal.date
        ? events.filter(e => isSameDay(e.date, modal.date!))
        : [];

    const selectedDayTasks = modal.date
        ? tasks.filter(t =>
            t.task_deadline && isSameDay(parseLocalDate(t.task_deadline), modal.date!)
        )
        : [];

    return (
        <div className="min-h-screen items-center justify-center bg-[#F0B6CF] py-6 px-12">
            {/* Title */}
            <h1 className="font-cherry text-6xl text-center tracking-widest text-[#2E2805] drop-shadow-lg drop-shadow-black/20 p-8">
                CALENDAR
            </h1>
            <div className="rounded-3xl w-full max-w-5xl shadow-xl shadow-black/20 overflow-hidden font-delius bg-[#CCC38D]">
                <div className="bg-[#CCC38D]">
                    {/* Header */}
                    <div className="flex flex-row items-center px-6 py-6">
                        <div className="flex-1 flex justify-start">
                            <button
                                onClick={() => setCurrent(addMonths(current, -1))}
                                className="bg-transparent border-2 border-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl text-white hover:bg-[#92cbee] transition-colors"
                            >←</button>
                        </div>
                        <div className="flex flex-row gap-x-8 text-lg">
                            <CustomSelect
                                value={format(current, "MMMM")}
                                options={Array.from({ length: 12 }, (_, i) => format(new Date(2000, i), "MMMM"))}
                                onChange={val => {
                                    const m = new Date(current);
                                    m.setMonth(new Date(`${val} 1`).getMonth());
                                    setCurrent(m);
                                }}
                            />
                            <CustomSelect
                                value={format(current, "yyyy")}
                                options={["2024", "2025", "2026", "2027", "2028"]}
                                onChange={val => {
                                    const d = new Date(current);
                                    d.setFullYear(+val);
                                    setCurrent(d);
                                }}
                            />
                        </div>
                        <div className="flex-1 flex justify-end">
                            <button
                                onClick={() => setCurrent(addMonths(current, 1))}
                                className="bg-transparent border-2 border-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl text-white hover:bg-[#92cbee] transition-colors"
                            >→</button>
                        </div>
                    </div>

                    {/* Day labels */}
                    <div className="grid grid-cols-7 bg-[#ADD3EA] text-center text-lg font-bold text-[#2E2805] py-6 px-6 rounded-t-xl shadow-md border-y-2 border-[#719db8]">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                            <div key={d}>{d}</div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="relative bg-[#FBF5D1]">
                        <div className="grid grid-cols-7 place-content-center px-6 gap-y-2 pt-4 pb-24">
                            {days.map(day => {
                                const isToday = isSameDay(day, new Date());
                                const inMonth = isSameMonth(day, current);
                                const dayEvents = events.filter(e => isSameDay(e.date, day));
                                const dayTasks = tasks.filter(t =>
                                    t.task_deadline && isSameDay(parseLocalDate(t.task_deadline), day)
                                );
                                const allItems = [...dayEvents, ...dayTasks];

                                // Highest urgency icon for the cell
                                const urgencies = dayTasks
                                    .filter(t => !t.is_complete && t.task_deadline)
                                    .map(t => getDeadlineUrgency(t.task_deadline))
                                    .filter(Boolean);
                                const topUrgency = urgencies.includes("overdue") ? "overdue"
                                    : urgencies.includes("today") ? "today"
                                        : urgencies.includes("soon") ? "soon"
                                            : null;

                                return (
                                    <div
                                        key={day.toISOString()}
                                        onClick={() => openListModal(day)}
                                        className={`flex flex-col items-center justify-start
                                            w-full h-[100px] p-1 cursor-pointer transition-colors
                                            ${inMonth ? "opacity-100" : "opacity-40"}`}
                                    >
                                        {/* Date number + urgency icon */}
                                        <div className="relative">
                                            <div className={`text-2xl font-black flex justify-center items-center
                                                w-12 h-12 rounded-2xl transition-colors tracking-tight
                                                ${isToday
                                                    ? "bg-blue-200 text-[#2E2805] shadow-md shadow-blue-950/10"
                                                    : "text-[#2E2805] hover:bg-[#bfba9ba4]"
                                                }`}
                                            >
                                                {format(day, "d")}
                                            </div>
                                            {/* Urgency icon badge on top-right of date */}
                                            {topUrgency && (
                                                <span className="absolute -top-2 -right-3 text-[20px] leading-none">
                                                    {URGENCY_ICONS[topUrgency]}
                                                </span>
                                            )}
                                        </div>

                                        {/* Events */}
                                        {dayEvents.slice(0, 2).map(ev => (
                                            <div
                                                key={ev.id}
                                                className={`mt-0.5 text-[11px] font-semibold tracking-wide rounded px-1 truncate w-full text-center shadow-sm
                                                    ${CATEGORY_COLORS[ev.category] ?? "bg-pink-300 text-pink-900"}`}
                                            >
                                                {ev.name}
                                            </div>
                                        ))}

                                        {/* Tasks filling remaining slots */}
                                        {dayEvents.length < 2 && dayTasks.slice(0, 2 - dayEvents.length).map(t => {
                                            const urgency = t.is_complete ? null : getDeadlineUrgency(t.task_deadline);
                                            return (
                                                <div
                                                    key={t.id}
                                                    className={`mt-0.5 text-[11px] font-semibold tracking-wide rounded px-1 truncate w-full text-center shadow-sm
                                                        ${t.is_complete
                                                            ? "bg-gray-200 text-gray-500 line-through"
                                                            : (TASK_DIFFICULTY_COLORS[t.task_difficulty] ?? "bg-orange-200 text-orange-800")
                                                        }`}
                                                >
                                                    {t.task_title}
                                                </div>
                                            );
                                        })}

                                        {allItems.length > 2 && (
                                            <div className="text-[10px] font-medium text-[#2e2805a8] mt-0.5">
                                                +{allItems.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Modal */}
                {modal.open && (
                    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                        <div className="bg-white outline-4 outline-[#F0B6CF] rounded-3xl p-8 w-md shadow-2xl">

                            {/* LIST VIEW */}
                            {modalMode === "list" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-black tracking-tight text-[#2E2805] text-lg">
                                            {modal.date ? format(modal.date, "EEEE, MMMM d") : ""}
                                        </h2>
                                        <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                                    </div>

                                    {/* Events */}
                                    {selectedDayEvents.length === 0 ? (
                                        <p className="text-sm font-medium text-[#2e2805a8] text-center py-2">No events yet.</p>
                                    ) : (
                                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                                            {selectedDayEvents.map(ev => (
                                                <li key={ev.id} className="bg-white px-4 py-3 flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 shadow-sm rounded-full ${CATEGORY_COLORS[ev.category]}`}>
                                                                {ev.category}
                                                            </span>
                                                            <span className="text-xs font-medium text-[#2e280570]">{ev.time}</span>
                                                        </div>
                                                        <p className="font-black tracking-tight text-[#2e2805] text-sm mt-1 truncate">{ev.name}</p>
                                                        {ev.notes && <p className="text-xs font-medium text-[#2e280570] truncate">{ev.notes}</p>}
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <button
                                                            onClick={() => openEditForm(ev)}
                                                            className="text-xs font-bold bg-[#ADD3EA] hover:bg-[#92cbee] text-[#163F55] border-2 border-[#8FBCD6] px-2 py-1 rounded-full transition-colors shadow-sm"
                                                        >edit</button>
                                                        <button
                                                            onClick={() => deleteEvent(ev.id)}
                                                            className="text-xs font-bold bg-[#F0B6CF] hover:bg-pink-300 border-2 border-[#d790af] text-pink-800 px-3 py-1 rounded-full transition-colors shadow-sm"
                                                        >del</button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {/* Tasks due */}
                                    {selectedDayTasks.length > 0 && (
                                        <div>
                                            <p className="text-xs font-extrabold tracking-widest uppercase text-[#2e2805a8] mb-1">Tasks Due</p>
                                            <ul className="space-y-2 max-h-40 overflow-y-auto">
                                                {selectedDayTasks.map(t => {
                                                    const urgency = t.is_complete ? null : getDeadlineUrgency(t.task_deadline);
                                                    return (
                                                        <li key={t.id} className="bg-white px-4 py-3 flex items-start gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 shadow-sm rounded-full
                                                                        ${TASK_DIFFICULTY_COLORS[t.task_difficulty] ?? "bg-orange-200 text-orange-800"}`}>
                                                                        {t.task_difficulty}
                                                                    </span>
                                                                    {urgency && (
                                                                        <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 shadow-sm rounded-full
                                                                            ${URGENCY_BADGE_COLORS[urgency]}`}>
                                                                            {URGENCY_ICONS[urgency]} {URGENCY_LABELS[urgency]}
                                                                        </span>
                                                                    )}
                                                                    {t.is_complete && (
                                                                        <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 shadow-sm rounded-full bg-gray-200 text-gray-500">
                                                                            ✓ done
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className={`font-black tracking-tight text-[#2e2805] text-sm mt-1 truncate
                                                                    ${t.is_complete ? "line-through opacity-50" : ""}`}>
                                                                    {t.task_title}
                                                                </p>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}

                                    <button
                                        onClick={openNewEventForm}
                                        className="w-full font-bold tracking-wide bg-[#ADD3EA] hover:bg-[#92cbee] text-[#163F55] py-2 rounded-full border-2 border-[#8FBCD6] text-sm transition-colors shadow-md"
                                    >
                                        add event +
                                    </button>
                                </div>
                            )}

                            {/* FORM VIEW */}
                            {modalMode === "form" && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <button
                                            onClick={() => setModalMode("list")}
                                            className="text-[#2e2805a8] hover:text-[#2e2805f1] text-sm font-semibold"
                                        >← back</button>
                                        <h2 className="font-black tracking-tight text-[#2E2805] text-sm">
                                            {editingId ? "Edit Event" : "New Event"}
                                        </h2>
                                    </div>
                                    <div>
                                        <label className="text-xs font-extrabold tracking-widest uppercase text-[#2e2805a8]">Event Name*</label>
                                        <input
                                            value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="Input name"
                                            className="w-full border-b border-[#F0B6CF] text-sm font-semibold text-[#2E2805] placeholder:text-[#c9b8c0] placeholder:font-normal py-1 ps-0.75 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-extrabold tracking-widest uppercase text-[#2e2805a8]">Date*</label>
                                        <div className="text-sm font-semibold text-[#2E2805] border-b border-[#F0B6CF] py-1 ps-0.75">
                                            {modal.date ? format(modal.date, "EEEE, MMMM d") : ""}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-extrabold tracking-widest uppercase text-[#2e2805a8]">Time</label>
                                        <br />
                                        <input
                                            type="time"
                                            value={form.time}
                                            onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                                            className="text-sm font-semibold text-[#2E2805] p-1.5 rounded-t-lg border-b border-[#F0B6CF] bg-[#f0b6cf31] focus:outline-none shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-extrabold tracking-widest uppercase text-[#2e2805a8]">Category</label>
                                        <br />
                                        <select
                                            value={form.category}
                                            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                            className="mt-1 text-sm font-semibold text-[#2E2805] bg-[#f0b6cf31] border-b border-[#F0B6CF] rounded-t-lg px-2 py-1.5 focus:outline-none shadow-sm"
                                        >
                                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-extrabold tracking-widest uppercase text-[#2e2805a8]">Notes</label>
                                        <textarea
                                            value={form.notes}
                                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                            placeholder="Input notes"
                                            className="w-full border-b border-[#F0B6CF] bg-[#f0b6cf31] rounded-t-lg text-sm font-semibold text-[#2E2805] placeholder:text-[#c9b8c0] placeholder:font-normal px-3 py-3 shadow-sm focus:outline-none resize-none"
                                            rows={4}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={saveEvent}
                                            className="flex-1 font-bold tracking-wide bg-[#ADD3EA] hover:bg-[#92cbee] border-2 border-[#8FBCD6] text-[#163F55] py-1.5 rounded-full text-sm transition-colors shadow-md"
                                        >
                                            {editingId ? "update" : "save"}
                                        </button>
                                        <button
                                            onClick={() => setModalMode("list")}
                                            className="flex-1 font-bold tracking-wide border-2 border-[#dc9eb9] bg-[#F0B6CF] hover:bg-pink-300 text-pink-800 py-1.5 rounded-full text-sm transition-colors shadow-md"
                                        >
                                            cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}