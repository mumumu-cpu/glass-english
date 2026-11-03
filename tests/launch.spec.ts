import { expect, test } from './fixtures'

test.describe('launch', () => {
  test('opens straight into the English composer with focus', async ({ page }) => {
    await page.goto('/')
    const input = page.getByTestId('composer-input')
    await expect(input).toBeVisible()
    await expect(input).toBeFocused()
    await expect(page.getByTestId('tab-write')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('today-task')).toBeVisible()
  })

  test('fits the iPhone 14 viewport without horizontal scroll', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('composer-input')).toBeVisible()
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    expect(innerWidth).toBe(390)
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth)
  })

  test('uses liquid-glass surfaces with backdrop blur', async ({ page }) => {
    await page.goto('/')
    const form = page.locator('form.glass-strong')
    await expect(form).toBeVisible()
    const style = await form.evaluate((el) => {
      const s = getComputedStyle(el)
      return { blur: s.backdropFilter || (s as unknown as Record<string, string>).webkitBackdropFilter, border: s.borderTopWidth }
    })
    expect(style.blur).toContain('blur')
    expect(style.border).toBe('1px')
  })

  test('switches screens with animated tab transitions', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('tab-cards').click()
    await expect(page.getByTestId('swipe-card')).toBeVisible()
    await page.getByTestId('tab-log').click()
    await expect(page.getByTestId('status-list')).toBeVisible()
    await page.getByTestId('tab-write').click()
    await expect(page.getByTestId('composer-input')).toBeVisible()
  })
})
