import { describe, expect, it } from 'vitest'
import { authMessage, passwordProblem } from './authMessages.js'

describe('authMessage', () => {
  it('explains a wrong email or password', () => {
    expect(authMessage({ message: 'Invalid login credentials' })).toMatch(/don’t match/)
    expect(authMessage({ code: 'invalid_credentials', message: 'x' })).toMatch(/don’t match/)
  })

  it('explains an unconfirmed email', () => {
    expect(authMessage({ message: 'Email not confirmed' })).toMatch(/Confirm your email/)
  })

  it('explains an email that already has an account', () => {
    expect(authMessage({ message: 'User already registered' })).toMatch(/Sign in instead/)
  })

  it('explains rate limits and network trouble', () => {
    expect(authMessage({ message: 'email rate limit exceeded' })).toMatch(/Too many emails/)
    expect(authMessage(new TypeError('Failed to fetch'))).toMatch(/connection/)
  })

  it('passes anything else through, with a fallback', () => {
    expect(authMessage({ message: 'Something odd' })).toBe('Something odd')
    expect(authMessage(null)).toMatch(/Something went wrong/)
  })
})

describe('passwordProblem', () => {
  it('asks for at least 8 characters', () => {
    expect(passwordProblem('short')).toMatch(/8 characters/)
    expect(passwordProblem('long enough')).toBeNull()
  })
})
