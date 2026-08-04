import { Resend } from 'resend';
import { getConfig } from '../config';

let instance: Resend | null = null;

export function getResend(): Resend {
  return (instance ??= new Resend(getConfig().resendApiKey));
}
