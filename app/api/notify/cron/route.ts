// app/api/notify/cron/route.ts
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { render } from '@react-email/render';
import TaskReminderEmail from '@/emails/TaskReminderEmail';
import EventReminderEmail from '@/emails/EventReminderEmail';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    // Protect the cron route
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString();
    const todayDate = new Date().toISOString().split('T')[0];

    // Fetch all incomplete upcoming tasks with user info 
    const { data: tasks, error: taskDbError } = await supabase
        .from('task')
        .select('task_title, task_deadline, task_difficulty, user_id')
        .eq('is_complete', false)
        .gte('task_deadline', today)
        .order('task_deadline', { ascending: true });

    // Fetch all upcoming events with user info 
    const { data: events, error: eventDbError } = await supabase
        .from('events')
        .select('event_name, event_date, event_time, user_id')
        .gte('event_date', todayDate)
        .order('event_date', { ascending: true });

    if (taskDbError) return Response.json({ error: taskDbError.message }, { status: 500 });
    if (eventDbError) return Response.json({ error: eventDbError.message }, { status: 500 });

    // Get all unique user IDs 
    const userIds = [...new Set([
        ...(tasks ?? []).map(t => t.user_id),
        ...(events ?? []).map(e => e.user_id),
    ])];

    if (userIds.length === 0) return Response.json({ message: 'No users to notify' });

    // Fetch user emails from auth.users via service role 
    const userMap: Record<string, string> = {};
    await Promise.all(
        userIds.map(async (id) => {
            const { data } = await supabase.auth.admin.getUserById(id);
            if (data?.user?.email) {
                userMap[id] = data.user.email;
            }
        })
    );

    // Group tasks and events by user 
    const tasksByUser: Record<string, typeof tasks> = {};
    for (const task of tasks ?? []) {
        if (!tasksByUser[task.user_id]) tasksByUser[task.user_id] = [];
        tasksByUser[task.user_id]!.push(task);
    }

    const eventsByUser: Record<string, typeof events> = {};
    for (const event of events ?? []) {
        if (!eventsByUser[event.user_id]) eventsByUser[event.user_id] = [];
        eventsByUser[event.user_id]!.push(event);
    }

    // Send emails 
    const taskResults = await Promise.allSettled(
        Object.entries(tasksByUser).map(async ([userId, userTasks]) => {
            const email = userMap[userId];
            if (!email || !userTasks) return;

            const emailTasks = userTasks.map(t => ({
                task_title: t.task_title,
                task_deadline: new Date(t.task_deadline).toLocaleDateString('en-PH', {
                    month: 'long', day: 'numeric', year: 'numeric'
                }),
                task_difficulty: t.task_difficulty as 'hard' | 'medium' | 'easy',
            }));

            const html = await render(
                TaskReminderEmail({ userName: email, tasks: emailTasks })
            );

            return resend.emails.send({
                from: 'Plume <plume@codedbymay.com>',
                to: [email],
                subject: `You have ${emailTasks.length} upcoming task(s)`,
                html,
            });
        })
    );

    const eventResults = await Promise.allSettled(
        Object.entries(eventsByUser).map(async ([userId, userEvents]) => {
            const email = userMap[userId];
            if (!email || !userEvents) return;

            const emailEvents = userEvents.map(e => ({
                event_name: e.event_name,
                event_date: new Date(e.event_date).toLocaleDateString('en-PH', {
                    month: 'long', day: 'numeric', year: 'numeric'
                }),
                event_time: new Date(`1970-01-01T${e.event_time}`).toLocaleTimeString('en-PH', {
                    hour: '2-digit', minute: '2-digit'
                }),
            }));

            const html = await render(
                EventReminderEmail({ userName: email, events: emailEvents })
            );

            return resend.emails.send({
                from: 'Plume <plume@codedbymay.com>',
                to: [email],
                subject: `You have ${emailEvents.length} upcoming event(s)`,
                html,
            });
        })
    );

    return Response.json({
        tasksSent: taskResults.filter(r => r.status === 'fulfilled').length,
        eventsSent: eventResults.filter(r => r.status === 'fulfilled').length,
        tasksTotal: tasks?.length ?? 0,
        eventsTotal: events?.length ?? 0,
        usersNotified: userIds.length,
    });
}