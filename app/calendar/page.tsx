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

type ModalMode = "list" | "form";

const CATEGORIES = ["Work", "Personal", "School", "Health", "Other"];
const CATEGORY_COLORS: Record<string, string> = {
    Work: "bg-blue-200 text-blue-800",
    Personal: "bg-pink-200 text-pink-800",
    School: "bg-yellow-200 text-yellow-800",
    Health: "bg-green-200 text-green-800",
    Other: "bg-purple-200 text-purple-800",
};

export default function KawaiiCalendar() {
    const [current, setCurrent] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
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
    }, [user_id, current]);

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
            date: new Date(row.event_date),
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

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-pink-200 p-6">
            <div className="rounded-3xl w-full max-w-5xl shadow-lg shadow-black/20 overflow-hidden font-delius">
                <div className="bg-[#CCC38D]">

                    {/* Title */}
                    <h1 className="font-cherry bg-[#bbad65db]/20 text-6xl text-center tracking-widest text-[#2E4633] drop-shadow-sm drop-shadow-black/20 p-8">
                        CALENDAR
                    </h1>

                    {/* Header */}
                    <div className="flex flex-row items-center px-6 py-6">
                        <div className="flex-1" />
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

                    {/* Day labels — reverted to original */}
                    <div className="grid grid-cols-7 bg-[#ADD3EA] text-center text-lg font-bold text-blue-700 py-5 px-6">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                            <div key={d}>{d}</div>
                        ))}
                    </div>

                    {/* Grid + cat wrapper */}
                    <div className="relative bg-[#FBF5D1]">
                        <div className="grid grid-cols-7 place-items-center px-6 gap-y-5 pt-4 pb-24">
                            {days.map(day => {
                                const isToday = isSameDay(day, new Date());
                                const inMonth = isSameMonth(day, current);
                                const dayEvents = events.filter(e => isSameDay(e.date, day));
                                return (
                                    <div
                                        key={day.toISOString()}
                                        onClick={() => openListModal(day)}
                                        className={`flex flex-col items-center justify-start
                                            w-full min-h-[60px] p-1 cursor-pointer transition-colors
                                            ${inMonth ? "opacity-100" : "opacity-40"}`}
                                    >
                                        <div className={`text-2xl font-black flex justify-center items-center
                                            w-12 h-12 rounded-2xl transition-colors tracking-tight
                                            ${isToday
                                                ? "bg-blue-200 text-[#163F55] shadow-md shadow-blue-950/10"
                                                : "text-[#163F55] hover:bg-yellow-200"
                                            }`}
                                        >
                                            {format(day, "d")}
                                        </div>
                                        {dayEvents.slice(0, 2).map(ev => (
                                            <div
                                                key={ev.id}
                                                className={`mt-0.5 text-[11px] font-semibold tracking-wide rounded px-1 truncate w-full text-center
                                                    ${CATEGORY_COLORS[ev.category] ?? "bg-pink-300 text-pink-900"}`}
                                            >
                                                {ev.name}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-[10px] font-medium text-[#a0aec0] mt-0.5">
                                                +{dayEvents.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Cat — bottom right */}
                        <div className="absolute bottom-2 right-4 z-10">
                            <img
                                src="/animal_placeholder.png"
                                className="w-28 h-28 object-contain"
                            />
                        </div>
                    </div>
                </div>

                {/* Modal */}
                {modal.open && (
                    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                        <div className="bg-[#FFEDF5] outline-4 outline-[#F0B6CF] rounded-3xl p-8 w-md shadow-2xl">

                            {/* LIST VIEW */}
                            {modalMode === "list" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-black tracking-tight text-[#163F55] text-lg">
                                            {modal.date ? format(modal.date, "EEEE, MMMM d") : ""}
                                        </h2>
                                        <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                                    </div>

                                    {selectedDayEvents.length === 0 ? (
                                        <p className="text-sm font-medium text-[#a0aec0] text-center py-4">No events yet.</p>
                                    ) : (
                                        <ul className="space-y-2 max-h-64 overflow-y-auto">
                                            {selectedDayEvents.map(ev => (
                                                <li key={ev.id}
                                                    className="bg-white rounded-2xl px-4 py-3 flex items-start justify-between gap-2 shadow-sm">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full ${CATEGORY_COLORS[ev.category]}`}>
                                                                {ev.category}
                                                            </span>
                                                            <span className="text-xs font-medium text-[#a0aec0]">{ev.time}</span>
                                                        </div>
                                                        <p className="font-black tracking-tight text-[#163F55] text-sm mt-1 truncate">{ev.name}</p>
                                                        {ev.notes && <p className="text-xs font-medium text-[#a0aec0] truncate">{ev.notes}</p>}
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <button
                                                            onClick={() => openEditForm(ev)}
                                                            className="text-xs font-bold bg-[#ADD3EA] hover:bg-[#92cbee] text-[#163F55] px-2 py-1 rounded-full transition-colors"
                                                        >edit</button>
                                                        <button
                                                            onClick={() => deleteEvent(ev.id)}
                                                            className="text-xs font-bold bg-pink-200 hover:bg-pink-300 text-pink-800 px-2 py-1 rounded-full transition-colors"
                                                        >del</button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <button
                                        onClick={openNewEventForm}
                                        className="w-full font-bold tracking-wide bg-[#ADD3EA] hover:bg-[#92cbee] text-[#163F55] py-2 rounded-full text-sm transition-colors"
                                    >
                                        + add event
                                    </button>
                                </div>
                            )}

                            {/* FORM VIEW */}
                            {modalMode === "form" && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <button
                                            onClick={() => setModalMode("list")}
                                            className="text-[#a0aec0] hover:text-gray-600 text-sm font-semibold"
                                        >← back</button>
                                        <h2 className="font-black tracking-tight text-[#163F55] text-sm">
                                            {editingId ? "Edit Event" : "New Event"}
                                        </h2>
                                    </div>
                                    <div>
                                        <label className="text-xs font-extrabold tracking-widest uppercase text-[#a0aec0]">Event Name*</label>
                                        <input
                                            value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="Input name"
                                            className="w-full border-b border-[#F0B6CF] bg-transparent text-sm font-semibold text-[#163F55] placeholder:text-[#c9b8c0] placeholder:font-normal py-1 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-extrabold tracking-widest uppercase text-[#a0aec0]">Date*</label>
                                        <div className="text-sm font-semibold text-[#163F55] border-b border-[#F0B6CF] py-1">
                                            {modal.date ? format(modal.date, "EEEE, MMMM d") : ""}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-extrabold tracking-widest uppercase text-[#a0aec0]">Time</label>
                                        <br />
                                        <input
                                            type="time"
                                            value={form.time}
                                            onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                                            className="text-sm font-semibold text-[#163F55] border-b border-[#F0B6CF] bg-transparent focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-extrabold tracking-widest uppercase text-[#a0aec0]">Category</label>
                                        <br />
                                        <select
                                            value={form.category}
                                            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                            className="mt-1 text-sm font-semibold text-[#163F55] bg-white border-b border-[#F0B6CF] rounded-lg px-2 py-0.5 focus:outline-none"
                                        >
                                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-extrabold tracking-widest uppercase text-[#a0aec0]">Notes</label>
                                        <textarea
                                            value={form.notes}
                                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                            placeholder="Input notes"
                                            className="w-full border-b border-[#F0B6CF] bg-transparent text-sm font-semibold text-[#163F55] placeholder:text-[#c9b8c0] placeholder:font-normal px-2 py-2 focus:outline-none resize-none"
                                            rows={4}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={saveEvent}
                                            className="flex-1 font-bold tracking-wide bg-[#ADD3EA] hover:bg-[#92cbee] text-[#163F55] py-1.5 rounded-full text-sm transition-colors"
                                        >
                                            {editingId ? "update" : "save"}
                                        </button>
                                        <button
                                            onClick={() => setModalMode("list")}
                                            className="flex-1 font-bold tracking-wide bg-pink-200 hover:bg-pink-300 text-pink-800 py-1.5 rounded-full text-sm transition-colors"
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