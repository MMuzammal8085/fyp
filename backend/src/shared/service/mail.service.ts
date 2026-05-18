import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = (() => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (user && pass) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }

    // Dev fallback: don't fail API calls just because SMTP isn't configured.
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    } as any);
  })();

  private async safeSend(options: nodemailer.SendMailOptions) {
    try {
      const info = await this.transporter.sendMail(options);

      // If we're using stream transport, log the output so devs can see the email.
      const anyInfo: any = info as any;
      if (anyInfo?.message) {
        // eslint-disable-next-line no-console
        console.log('[MailService] Email output (dev):\n' + anyInfo.message);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(
        '[MailService] Failed to send email:',
        (e as any)?.message ?? e,
      );
    }
  }

  async sendOtp(email: string, otp: string) {
    await this.safeSend({
      from: `"Intelli-Hire" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification OTP',
      html: `
                <h2>Verify Your Email</h2>
                <p>Your OTP is:</p>
                <h1>${otp}</h1>
                <p>This OTP will expire in 10 minutes.</p>
            `,
    });
  }

  async sendInterviewInvite(email: string, inviteLink: string) {
    await this.safeSend({
      from: `"Intelli-Hire" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Interview Invitation',
      html: `
        <h2>Interview Invitation</h2>
        <p>You have been invited to an interview.</p>
        <p>To begin, open the link below, enter your username, and upload your resume (PDF).</p>
        <p>
          Open your interview link:
          <a href="${inviteLink}">${inviteLink}</a>
        </p>
      `,
    });
  }
}
