// emails/JournalReminderEmail.tsx
import {
    Html, Head, Body, Container, Heading,
    Text, Button, Hr, Section
} from '@react-email/components';

interface JournalReminderEmailProps {
    userName: string;
}

export default function JournalReminderEmail({ userName }: JournalReminderEmailProps) {
    return (
        <Html>
            <Head />
            <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f4' }}>
                <Container style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}>
                    <Heading style={{ color: '#000212' }}>
                        Hi {userName}, time to journal!
                    </Heading>

                    <Section style={{
                        background: '#fff',
                        borderRadius: 8,
                        padding: 20,
                        marginBottom: 12,
                        borderTop: '4px solid #F0B6CF'
                    }}>
                        <Text style={{ color: '#374151', margin: 0 }}>
                            Taking a few minutes to journal each day can help you reflect,
                            stay grounded, and track your growth over time.
                        </Text>
                    </Section>

                    <Hr />
                    <Button href="http://localhost:3000/journal" style={{
                        background: '#F0B6CF', color: '#2E2805',
                        padding: '12px 24px', borderRadius: 6, textDecoration: 'none',
                        fontWeight: 'bold', marginLeft: 'auto', marginRight: 'auto'

                    }}>
                        Write Today's Entry
                    </Button>
                </Container>
            </Body>
        </Html>
    );
}