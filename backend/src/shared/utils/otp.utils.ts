// src/common/utils/otp.util.ts
export class OtpUtil {
    static generate(email: string) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 10 * 60 * 1000;

        const data = `${email}.${otp}.${expires}`;
        const verificationToken = Buffer.from(data).toString('base64');

        return { otp, verificationToken };
    }

    static verify(email: string, otp: string, token: string) {
        try {
            const decoded = Buffer.from(token, 'base64').toString('ascii');
            const [tokenEmail, tokenOtp, expires] = decoded.split('.');

            if (tokenEmail !== email) throw new Error('Invalid email');
            if (tokenOtp !== otp) throw new Error('Invalid OTP');
            if (Date.now() > Number(expires)) throw new Error('OTP expired');

            return true;
        } catch {
            throw new Error('OTP verification failed');
        }
    }
}