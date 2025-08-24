import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface WelcomeEmailProps {
  userName: string;
  userEmail: string;
  companyName: string;
}

export const WelcomeEmail = ({ userName, userEmail, companyName }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Fleet Manager - Let's get started!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to Fleet Manager!</Heading>
        <Text style={text}>
          Hello {userName},
        </Text>
        <Text style={text}>
          Welcome to Fleet Manager! We're excited to have you on board.
        </Text>
        <Text style={text}>
          Your account has been successfully created for <strong>{companyName}</strong>.
        </Text>
        <Text style={text}>
          Here's what you can do with Fleet Manager:
        </Text>
        <ul style={list}>
          <li style={listItem}>Manage your vehicle fleet</li>
          <li style={listItem}>Track drivers and assignments</li>
          <li style={listItem}>Monitor trips and performance</li>
          <li style={listItem}>Schedule maintenance</li>
          <li style={listItem}>Generate reports and analytics</li>
        </ul>
        <Link
          href={`${process.env.SITE_URL || 'https://your-domain.com'}/dashboard`}
          target="_blank"
          style={button}
        >
          Get Started
        </Link>
        <Text style={text}>
          If you have any questions or need help getting started, feel free to reach out to our support team.
        </Text>
        <Text style={footer}>
          Best regards,<br />
          The Fleet Manager Team
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #eee',
  borderRadius: '5px',
  boxShadow: '0 5px 10px rgba(20,50,70,.2)',
  marginTop: '20px',
  maxWidth: '500px',
  margin: '0 auto',
  padding: '68px 0 130px',
};

const h1 = {
  color: '#333',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '15px',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  fontSize: '14px',
  margin: '0 40px',
  marginBottom: '15px',
  lineHeight: '1.4',
};

const button = {
  backgroundColor: '#28a745',
  borderRadius: '4px',
  color: '#fff',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '210px',
  padding: '14px 7px',
  margin: '24px auto',
};

const list = {
  margin: '0 40px',
  marginBottom: '15px',
  paddingLeft: '20px',
};

const listItem = {
  color: '#333',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  fontSize: '14px',
  marginBottom: '8px',
  lineHeight: '1.4',
};

const footer = {
  color: '#898989',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  fontSize: '12px',
  margin: '0 40px',
  marginTop: '20px',
};