import type { AutomationStatusResponse } from '@/lib/api';

export const OURA_OTP_VALID_MINUTES = 15;

export function otpExpiryHint(
    data: Pick<
        AutomationStatusResponse,
        'otp_expired' | 'otp_requested_at' | 'otp_minutes_remaining'
    >,
): string | null {
    if (data.otp_expired === true) {
        return `This code was sent more than ${OURA_OTP_VALID_MINUTES} minutes ago and has likely expired.`;
    }
    if (data.otp_requested_at == null) {
        return `Oura codes expire after ${OURA_OTP_VALID_MINUTES} minutes. If you requested one earlier, send a new code.`;
    }
    if (data.otp_minutes_remaining != null && data.otp_minutes_remaining > 0) {
        return `Code expires in about ${data.otp_minutes_remaining} minute(s).`;
    }
    return null;
}
