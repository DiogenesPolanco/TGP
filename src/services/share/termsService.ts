const TERMS_KEY = 'tgp-terms-accepted-v1'

export function isTermsAccepted(): boolean {
  return localStorage.getItem(TERMS_KEY) === 'true'
}

export function acceptTerms(): void {
  localStorage.setItem(TERMS_KEY, 'true')
}

export function resetTermsAcceptance(): void {
  localStorage.removeItem(TERMS_KEY)
}
