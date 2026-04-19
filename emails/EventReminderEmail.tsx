// emails/EventRemainderEmail.tsx
import {
    Html, Head, Body, Container, Heading,
    Text, Button, Hr, Section
} from '@react-email/components';

interface Event {
    event_name: string;
    event_date: string;
    event_time: string;
}

interface EventReminderEmailProps {
    userName: string;
    events: Event[];
}

export default function EventReminderEmail({ userName, events }: EventReminderEmailProps) {
    return (
        <Html>
            <Head />
            <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f5' }}>
                <Container style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}>
                    <Heading>Hi {userName}, you have upcoming events </Heading>
                    {events.map((event, i) => (
                        <Section key={i} style={{
                            background: '#fff',
                            borderRadius: 8,
                            padding: 16,
                            marginBottom: 12,
                            borderTop: '4px solid #2563eb'
                        }}>
                            <Text style={{ fontWeight: 'bold', margin: 0 }}>{event.event_name}</Text>
                            <Text style={{ color: '#6b7280', margin: '4px 0 0' }}>Due: {event.event_date}</Text>
                            <Text style={{ color: '#6b7280', margin: '4px 0 0' }}>Due: {event.event_time}</Text>
                        </Section>
                    ))}
                    <Hr />
                    <Button href="http://localhost:3000/calendar" style={{
                        background: '#2563eb', color: '#fff',
                        padding: '12px 24px', borderRadius: 6, textDecoration: 'none'
                    }}>
                        View All Events
                    </Button>
                </Container>
            </Body>
        </Html>
    );
}