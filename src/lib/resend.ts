import { Resend } from 'resend';

export function createResend(apiKey: string): Resend {
  return new Resend(apiKey);
}