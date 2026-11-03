import { expect, signIn, test, USER } from './fixtures'

test.describe('Google OAuth', () => {
  test('login button opens sheet that leads to Google consent screen', async ({ page }) => {
    let googleUrl: URL | null = null
    await page.route('https://accounts.google.com/**', async (route) => {
      googleUrl = new URL(route.request().url())
      await route.fulfill({ contentType: 'text/html', body: '<h1 data-testid="google">Sign in with Google</h1>' })
    })

    await page.goto('/')
    await page.getByTestId('login-btn').click()
    const sheet = page.getByTestId('login-sheet')
    await expect(sheet).toBeVisible()
    await expect(sheet.getByTestId('google-login')).toHaveAttribute('href', '/api/auth/login')

    await sheet.getByTestId('google-login').click()
    await expect(page.getByTestId('google')).toBeVisible()

    const url = googleUrl as URL | null
    expect(url?.pathname).toBe('/o/oauth2/v2/auth')
    expect(url?.searchParams.get('client_id')).toBe('e2e-client.apps.googleusercontent.com')
    expect(url?.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:8788/api/auth/callback')
    expect(url?.searchParams.get('scope')).toBe('openid email profile')
    expect(url?.searchParams.get('state')).toBeTruthy()
  })

  test('login endpoint sets a CSRF state cookie', async ({ request }) => {
    const res = await request.get('/api/auth/login', { maxRedirects: 0 })
    expect(res.status()).toBe(302)
    const state = new URL(res.headers()['location']).searchParams.get('state')
    expect(res.headers()['set-cookie']).toContain(`ge_oauth_state=${state}`)
  })

  test('callback rejects a mismatched state', async ({ request }) => {
    const res = await request.get('/api/auth/callback?code=x&state=forged', { maxRedirects: 0 })
    expect(res.status()).toBe(400)
  })

  test('submitting while signed out prompts Google login and keeps the draft', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('composer-input').fill('I am living in Tokyo since three years.')
    await page.getByTestId('submit-btn').click()
    await expect(page.getByTestId('login-sheet')).toBeVisible()
    await page.reload()
    await expect(page.getByTestId('composer-input')).toHaveValue('I am living in Tokyo since three years.')
  })

  test('valid session cookie shows the account and AI endpoint requires it', async ({ page, context, baseURL, request }) => {
    expect((await request.post('/api/correct', { data: { text: 'hi' } })).status()).toBe(401)

    await signIn(context, baseURL!)
    await page.goto('/')
    await expect(page.getByTestId('avatar')).toBeVisible()
    await page.getByTestId('avatar').click()
    await expect(page.getByTestId('account-sheet')).toContainText(USER.email)
    await page.getByTestId('logout').click()
    await expect(page.getByTestId('login-btn')).toBeVisible()
  })

  test('tampered session cookie is rejected', async ({ request }) => {
    const res = await request.get('/api/auth/me', { headers: { cookie: 'ge_session=eyJzdWIiOiJ4In0.bad' } })
    expect(res.status()).toBe(401)
  })
})
