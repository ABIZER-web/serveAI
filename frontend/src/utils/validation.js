// Name: at least 2 alphabetic characters (letters + spaces only).
export function validateName(value) {
  const trimmed = value.trim()
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length
  if (letterCount < 2) {
    return 'Name needs at least 2 letters.'
  }
  if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
    return 'Name can only contain letters.'
  }
  return null
}

// Phone: exactly 10 digits, numbers only.
export function validatePhone(value) {
  const digitsOnly = value.trim()
  if (!/^\d{10}$/.test(digitsOnly)) {
    return 'Enter a valid 10-digit mobile number.'
  }
  return null
}
