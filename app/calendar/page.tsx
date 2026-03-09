"use client"
import React from "react";
import dynamic from 'next/dynamic';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });

export default function CalendarView() {
    return (
        <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
            initialView={"dayGridMonth"}
            headerToolbar={{
                start: "today prev,next",
                center: "title",
                end: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            dateClick={(info) => {
                console.log("clicked:", info.dateStr)
            }}
            events={[
                { title: "Meeting", date: "2026-02-15" }
            ]}
        />
    )
}