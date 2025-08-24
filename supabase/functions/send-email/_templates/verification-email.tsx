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

interface VerificationEmailProps {
  confirmationUrl: string;
  userEmail: string;
}

export const VerificationEmail = ({ confirmationUrl, userEmail }: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email address for Fleet Manager</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Verify Your Email Address</Heading>
        <Text style={text}>
          Hello,
        </Text>
        <Text style={text}>
          Thank you for signing up for Fleet Manager! Please verify your email address by clicking the button below:
        </Text>
        <Link
          href={confirmationUrl}
          target="_blank"
          style={button}
        >
          Verify Email Address
        </Link>
        <Text style={text}>
          Or copy and paste this link into your browser:
        </Text>
        <Text style={link}>
          {confirmationUrl}
        </Text>
        <Text style={text}>
          This verification link will expire in 24 hours.
        </Text>
        <Text style={text}>
          If you didn't create an account with us, please ignore this email.
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
  maxWidth: '360px',
  margin: '0 auto',
  padding: '68px 0 130px',
};

const h1 = {
  color: '#333',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '15px',
  padding: '0 40px',
};

const text = {
  color: '#333',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  fontSize: '14px',
  margin: '0 40px',
  marginBottom: '15px',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '4px',
  color: '#fff',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '210px',
  padding: '14px 7px',
  margin: '16px auto',
};

const link = {
  color: '#007bff',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  fontSize: '14px',
  textDecoration: 'underline',
  margin: '0 40px',
  marginBottom: '15px',
  wordBreak: 'break-all' as const,
};

const footer = {
  color: '#898989',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  fontSize: '12px',
  margin: '0 40px',
  marginTop: '20px',
};