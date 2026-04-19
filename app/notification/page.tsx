"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

type NotificationSettings = {
    tasks_enabled: boolean;
    events_enabled: boolean;
    journal_enabled: boolean;
    tasks_send_time: string;
    events_send_time: string;
    journal_send_time: string;
    tasks_days_before: number;
    events_days_before: number;
};



const DEFAULT_SETTINGS: NotificationSettings = {
    tasks_enabled: false,
    events_enabled: false,
    journal_enabled: false,
    tasks_send_time: "08:00",
    events_send_time: "08:00",
    journal_send_time: "20:00",
    tasks_days_before: 1,
    events_days_before: 1,
};

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none shadow-inner ${enabled ? "bg-[#F0B6CF]" : "bg-[#CCC38D]/60"
                }`}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-md transition-all duration-300 ${enabled ? "translate-x-6 bg-white" : "translate-x-0 bg-white/80"
                    }`}
            />
        </button>
    );
}

function NotificationCard({
    title,
    enabled,
    sendTime,
    daysBefore,
    showDaysBefore,
    accentColor,
    onToggle,
    onTimeChange,
    onDaysChange,
}: {
    title: string;
    enabled: boolean;
    sendTime: string;
    daysBefore?: number;
    showDaysBefore?: boolean;
    accentColor: string;
    onToggle: (v: boolean) => void;
    onTimeChange: (v: string) => void;
    onDaysChange?: (v: number) => void;
}) {
    return (
        <div
            className={`rounded-2xl p-6 transition-all duration-300 font-delius border-2 ${enabled
                ? "bg-[#FDFFF7] shadow-lg border-transparent"
                : "bg-white/40 border-[#CCC38D]/30 shadow-sm opacity-60"
                }`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h3 className="font-black text-[#2E2805] tracking-tight">{title}</h3>
                    </div>
                </div>
                <Toggle enabled={enabled} onChange={onToggle} />
            </div>

            {enabled && (
                <div className="space-y-3 pt-3 border-t border-[#F0B6CF]/30">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold tracking-widest uppercase text-[#2e2805a8]">
                            Send time
                        </label>
                        <input
                            type="time"
                            value={sendTime}
                            onChange={e => onTimeChange(e.target.value)}
                            className="text-sm font-semibold text-[#2E2805] bg-[#f0b6cf20] border-b border-[#F0B6CF] px-2 py-1 rounded-t-lg focus:outline-none"
                        />
                    </div>

                    {showDaysBefore && onDaysChange && (
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-extrabold tracking-widest uppercase text-[#2e2805a8]">
                                Notify days before
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onDaysChange(Math.max(1, (daysBefore ?? 1) - 1))}
                                    className="w-7 h-7 rounded-full bg-[#F0B6CF] hover:bg-pink-300 text-[#2E2805] font-black text-sm transition-colors flex items-center justify-center"
                                >−</button>
                                <span className="font-black text-[#2E2805] w-6 text-center text-sm">
                                    {daysBefore}
                                </span>
                                <button
                                    onClick={() => onDaysChange(Math.min(7, (daysBefore ?? 1) + 1))}
                                    className="w-7 h-7 rounded-full bg-[#ADD3EA] hover:bg-[#92cbee] text-[#163F55] font-black text-sm transition-colors flex items-center justify-center"
                                >+</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function NotificationSettingsPage() {
    const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/login"); return; }
            setUserId(user.id);

            const { data, error } = await supabase
                .from("notification")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (data && !error) {
                setSettings({
                    tasks_enabled: data.tasks_enabled,
                    events_enabled: data.events_enabled,
                    journal_enabled: data.journal_enabled,
                    tasks_send_time: data.tasks_send_time?.substring(0, 5) ?? "08:00",
                    events_send_time: data.events_send_time?.substring(0, 5) ?? "08:00",
                    journal_send_time: data.journal_send_time?.substring(0, 5) ?? "20:00",
                    tasks_days_before: data.tasks_days_before ?? 1,
                    events_days_before: data.events_days_before ?? 1,
                });
            }
            setLoading(false);
        }
        load();
    }, []);

    const update = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const save = async () => {
        if (!userId) return;
        setSaving(true);

        const { error } = await supabase
            .from("notification")
            .upsert({
                user_id: userId,
                ...settings,
                updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });

        setSaving(false);
        if (!error) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F0B6CF] flex items-center justify-center">
                <p className="font-delius text-[#2E2805] text-lg animate-pulse">loading settings...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F0B6CF] py-6 px-6 md:px-12">
            {/* Header */}
            <div className="max-w-2xl mx-auto">
                <h1 className="font-cherry text-5xl md:text-6xl text-center tracking-widest text-[#2E2805] drop-shadow-lg drop-shadow-black/20 py-8">
                    NOTIFICATIONS
                </h1>

                <div className="rounded-3xl shadow-xl shadow-black/20 overflow-hidden font-delius bg-[#CCC38D]">
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-6 py-5">
                        <Link href="/">
                            Back
                        </Link>
                        <p className="text-xs font-extrabold tracking-widest uppercase text-[#2e2805a8]">
                            Notification Settings
                        </p>
                        <div className="w-12" />
                    </div>

                    {/* Content */}
                    <div className="bg-[#FBF5D1] rounded-t-2xl px-6 py-6 space-y-4">



                        {/* Task reminders */}
                        <NotificationCard
                            title="Task Reminders"
                            enabled={settings.tasks_enabled}
                            sendTime={settings.tasks_send_time}
                            daysBefore={settings.tasks_days_before}
                            showDaysBefore
                            accentColor="#ADD3EA"
                            onToggle={v => update("tasks_enabled", v)}
                            onTimeChange={v => update("tasks_send_time", v)}
                            onDaysChange={v => update("tasks_days_before", v)}
                        />

                        {/* Event reminders */}
                        <NotificationCard
                            title="Event Reminders"
                            enabled={settings.events_enabled}
                            sendTime={settings.events_send_time}
                            daysBefore={settings.events_days_before}
                            showDaysBefore
                            accentColor="#F0B6CF"
                            onToggle={v => update("events_enabled", v)}
                            onTimeChange={v => update("events_send_time", v)}
                            onDaysChange={v => update("events_days_before", v)}
                        />

                        {/* Journal reminders */}
                        <NotificationCard
                            title="Journal Reminders"
                            enabled={settings.journal_enabled}
                            sendTime={settings.journal_send_time}
                            accentColor="#CCC38D"
                            onToggle={v => update("journal_enabled", v)}
                            onTimeChange={v => update("journal_send_time", v)}
                        />

                        {/* Save button */}
                        <div className="pt-2 pb-4">
                            <button
                                onClick={save}
                                disabled={saving}
                                className={`w-full font-black tracking-widest uppercase py-3 rounded-full text-sm transition-all duration-300 shadow-md ${saved
                                    ? "bg-[#CCC38D] text-[#2E2805] shadow-none"
                                    : "bg-[#F0B6CF] hover:bg-pink-300 text-[#2E2805] border-2 border-[#d790af]"
                                    }`}
                            >
                                {saving ? "saving..." : saved ? "✓ saved!" : "save changes"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}