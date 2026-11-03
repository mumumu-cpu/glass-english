import { expect, test } from './fixtures'

const hold = (ms: number) => new Promise((r) => setTimeout(r, ms))

test.describe('skeleton loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/tasks', async (route) => {
      await hold(3000)
      await route.continue()
    })
    await page.route('**/api/auth/me', async (route) => {
      await hold(3000)
      await route.continue()
    })
  })

  test('header, task chip, deck and list show skeletons until data arrives', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('header .skeleton').first()).toBeVisible()
    await expect(page.locator('form').locator('..').locator('.skeleton').first()).toBeVisible()

    await page.getByTestId('tab-cards').click()
    await expect(page.getByTestId('deck-skeleton')).toBeVisible()
    await expect(page.getByTestId('swipe-card')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('deck-skeleton')).toHaveCount(0)
    await expect(page.getByTestId('login-btn')).toBeVisible()
  })

  test('log screen shows list skeleton first', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('tab-log').click()
    await expect(page.getByTestId('list-skeleton')).toBeVisible()
    await expect(page.getByTestId('status-list')).toBeVisible({ timeout: 5000 })
  })
})
