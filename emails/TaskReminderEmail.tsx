// emails/TaskReminderEmail.tsx
import {
    Html, Head, Body, Container, Heading,
    Text, Button, Hr, Section
} from '@react-email/components';

interface Task {
    task_title: string;
    task_deadline: string;
    task_difficulty: 'easy' | 'medium' | 'hard';
}

interface TaskReminderEmailProps {
    userName: string;
    tasks: Task[];
}

export default function TaskReminderEmail({ userName, tasks }: TaskReminderEmailProps) {
    return (
        <Html>
            <Head />
            <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f5' }}>
                <Container style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}>
                    <Heading>Hi {userName}, you have upcoming task deadlines </Heading>
                    {tasks.map((task, i) => (
                        <Section key={i} style={{
                            background: '#fff',
                            borderRadius: 8,
                            padding: 16,
                            marginBottom: 12,
                            borderLeft: `4px solid ${task.task_difficulty === 'hard' ? '#ef4444' : task.task_difficulty === 'medium' ? '#f59e0b' : '#22c55e'}`
                        }}>
                            <Text style={{ fontWeight: 'bold', margin: 0 }}>{task.task_title}</Text>
                            <Text style={{ color: '#6b7280', margin: '4px 0 0' }}>Due: {task.task_deadline}</Text>
                        </Section>
                    ))}
                    <Hr />
                    {/* Replace with link once deployed */}
                    <Button href="http://localhost:3000/tasks" style={{
                        background: '#2563eb', color: '#fff',
                        padding: '12px 24px', borderRadius: 6, textDecoration: 'none'
                    }}>
                        View All Tasks
                    </Button>
                </Container>
            </Body>
        </Html>
    );
}