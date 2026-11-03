import { expect, mockCorrect, SAMPLE, signIn, test } from './fixtures'

test.describe('AI correction', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await signIn(context, baseURL!)
  })

  test('shows skeleton then correction, explanations and tone alternatives', async ({ page }) => {
    const calls = await mockCorrect(page, { delay: 900 })
    await page.goto('/')
    await expect(page.getByTestId('avatar')).toBeVisible()

    await page.getByTestId('composer-input').fill('I am living in Tokyo since three years.')
    await page.getByTestId('submit-btn').click()

    await expect(page.getByTestId('correction-skeleton')).toBeVisible()
    await expect(page.getByTestId('correction-result')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('correction-skeleton')).toHaveCount(0)
    expect(calls[0]).toMatchObject({ text: 'I am living in Tokyo since three years.' })

    await expect(page.getByTestId('corrected-text')).toHaveText(SAMPLE.corrected)
    await expect(page.getByTestId('score')).toContainText('62')
    await expect(page.getByTestId('changes')).toContainText('have lived')
    await expect(page.getByTestId('changes')).toContainText('期間には for')

    await expect(page.getByTestId('alt-text')).toHaveText(SAMPLE.alternatives[0].text)
    await page.getByTestId('alt-tab-casual').click()
    await expect(page.getByTestId('alt-tab-casual')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('alt-text')).toHaveText(SAMPLE.alternatives[1].text)
    await page.getByTestId('alt-tab-concise').click()
    await expect(page.getByTestId('alt-text')).toHaveText(SAMPLE.alternatives[3].text)
  })

  test('sends the selected study task as context', async ({ page }) => {
    const calls = await mockCorrect(page, { delay: 100 })
    await page.goto('/')
    await page.getByTestId('today-task').click()
    await expect(page.getByTestId('task-context')).toBeVisible()
    await page.getByTestId('composer-input').fill('I take my family for granted.')
    await page.getByTestId('submit-btn').click()
    await expect(page.getByTestId('correction-result')).toBeVisible()
    expect((calls[0] as { context?: string }).context).toBeTruthy()
  })

  test('shows a retry control when the AI request fails', async ({ page }) => {
    await mockCorrect(page, { delay: 100, status: 502, body: { error: 'bad_model_output' } as never })
    await page.goto('/')
    await page.getByTestId('composer-input').fill('Hello world')
    await page.getByTestId('submit-btn').click()
    await expect(page.getByTestId('correction-error')).toBeVisible()
  })

  test('expired session on submit reopens Google login', async ({ page }) => {
    await mockCorrect(page, { delay: 50, status: 401, body: { error: 'unauthorized' } as never })
    await page.goto('/')
    await expect(page.getByTestId('avatar')).toBeVisible()
    await page.getByTestId('composer-input').fill('Hello world')
    await page.getByTestId('submit-btn').click()
    await expect(page.getByTestId('login-sheet')).toBeVisible()
  })
})
