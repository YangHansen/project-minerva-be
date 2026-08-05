export const PASSWORD_PATTERN = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'

export function passwordIssue(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long'
  if (!new RegExp(PASSWORD_PATTERN).test(password)) {
    return 'Password must include at least one uppercase letter, one lowercase letter, and one number'
  }
  return null
}

export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024
