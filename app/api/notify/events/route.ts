// app/api/notify/events/route.ts
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { render } from '@react-email/render';
import EventReminderEmail from '@/emails/EventReminderEmail';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        console.log('Events route hit');

        const authHeader = req.headers.get('authorization');
        if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        // console.log('User:', user?.email, '| Auth error:', authError?.message);

        if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const today = new Date().toISOString();
        const { data: events, error: dbError } = await supabase
            .from('events')
            .select('event_name, event_date, event_time')
            .eq('user_id', user.id)
            .gte('event_date', today)
            .order('event_date', { ascending: true });

        // console.log('Events found:', events?.length, '| DB error:', dbError?.message);

        if (dbError) return Response.json({ error: dbError.message }, { status: 500 });
        if (!events || events.length === 0) return Response.json({ message: 'No upcoming events' });

        const emailEvents = events.map(e => ({
            event_name: e.event_name,
            event_date: new Date(e.event_date).toLocaleDateString('en-PH', {
                month: 'long', day: 'numeric', year: 'numeric'
            }),
            event_time: new Date(`1970-01-01T${e.event_time}`).toLocaleTimeString('en-PH', {
                hour: '2-digit', minute: '2-digit'
            }),
        }));

        // Rendering the email using the template 
        const html = await render(
            EventReminderEmail({
                userName: user.user_metadata?.name ?? user.email,
                events: emailEvents
            })
        );

        // Sending email using resend
        const { data, error } = await resend.emails.send({
            from: 'Plume <plume@codedbymay.com>',
            to: [user.email!],
            subject: `You have ${emailEvents.length} upcoming event(s)`,
            html,
        });

        // Error handlers 
        if (error) return Response.json({ error }, { status: 500 });
        return Response.json({ data });

    } catch (err) {
        // This will catch any unhandled crash and return JSON instead of HTML
        // console.error(' Route crashed:', err);
        return Response.json({ error: String(err) }, { status: 500 });
    }
}