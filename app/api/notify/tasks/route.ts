// app/api/notify/tasks/route.ts
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { render } from '@react-email/render';
import TaskReminderEmail from '@/emails/TaskReminderEmail';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // route checker
    console.log('Tasks route hit');

    const authHeader = req.headers.get('authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date().toISOString();
    const { data: tasks, error: dbError } = await supabase
      .from('task')
      .select('task_title, task_deadline, task_difficulty')
      .eq('user_id', user.id)
      .eq('is_complete', false)
      .gte('task_deadline', today)
      .order('task_deadline', { ascending: true });

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 });
    if (!tasks || tasks.length === 0) return Response.json({ message: 'No upcoming tasks' });

    const emailTasks = tasks.map(t => ({
      task_title: t.task_title,
      task_deadline: new Date(t.task_deadline).toLocaleDateString('en-PH', {
        month: 'long', day: 'numeric', year: 'numeric'
      }),
      task_difficulty: t.task_difficulty as 'hard' | 'medium' | 'easy',
    }));

    const html = await render(
      TaskReminderEmail({
        userName: user.user_metadata?.name ?? user.email,
        tasks: emailTasks
      })
    );

    const { data, error } = await resend.emails.send({
      from: 'Plume <plume@codedbymay.com>',
      to: [user.email!],
      subject: `You have ${emailTasks.length} upcoming task(s)`,
      html,
    });

    if (error) return Response.json({ error }, { status: 500 });
    return Response.json({ data });

  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}