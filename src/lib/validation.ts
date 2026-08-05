export const PASSWORD_PATTERN = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'

export function passwordIssue(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long'
  if (!new RegExp(PASSWORD_PATTERN).test(password)) {
    return 'Password must include at least one uppercase letter, one lowercase letter, and one number'
  }
  return null
}

export function friendlyValidationMessage(error: { path?: string; message?: string }): string {
  const parts = (error.path ?? '').split('/').filter(Boolean)
  if (/^\d+$/.test(parts[parts.length - 1] ?? '')) parts.pop()
  const rawField = parts[parts.length - 1]
  const field = rawField
    ? rawField.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').toLowerCase()
    : 'request'
  const label = field[0]!.toUpperCase() + field.slice(1)
  const message = error.message ?? ''
  const value = message.match(/(?:greater|less) or equal to (\d+(?:\.\d+)?)/)?.[1]

  const rule =
    message.includes("match 'email' format") ? 'must be a valid email address' :
    message.includes('string length greater or equal to') ? `must be at least ${value} characters` :
    message.includes('string length less or equal to') ? `must be at most ${value} characters` :
    message.includes('number to be greater or equal to') ? `must be at least ${value}` :
    message.includes('number to be less or equal to') ? `must be at most ${value}` :
    message === 'Expected number' ? 'must be a number' :
    message === 'Expected integer' ? 'must be a whole number' :
    message === 'Expected string' ? 'must be text' :
    message === 'Expected boolean' ? 'must be true or false' :
    message === 'Expected array' ? 'must be a list' :
    message === 'Expected union value' ? 'is not one of the allowed values' :
    'is invalid'

  return `${label} ${rule}.`
}

export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024
