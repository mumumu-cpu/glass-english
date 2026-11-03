import { expect, swipe, test } from './fixtures'

test.describe('flick cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('tab-cards').click()
    await expect(page.getByTestId('swipe-card')).toBeVisible()
  })

  const cases = [
    { name: 'right → 完了', dx: 260, dy: 0, key: 'done' },
    { name: 'left → スキップ', dx: -260, dy: 0, key: 'skip' },
    { name: 'up → 復習', dx: 0, dy: -260, key: 'review' },
  ] as const

  for (const c of cases) {
    test(`flick ${c.name}`, async ({ page }) => {
      const first = await page.getByTestId('swipe-card').getAttribute('data-task-id')
      await swipe(page, c.dx, c.dy)
      await expect(page.getByTestId(`count-${c.key}`)).toHaveText('1')
      await expect(page.getByTestId('swipe-card')).not.toHaveAttribute('data-task-id', first!)
    })
  }

  test('a short drag snaps back without changing status', async ({ page }) => {
    const first = await page.getByTestId('swipe-card').getAttribute('data-task-id')
    await swipe(page, 40, 0)
    await page.waitForTimeout(500)
    await expect(page.getByTestId('swipe-card')).toHaveAttribute('data-task-id', first!)
    await expect(page.getByTestId('count-done')).toHaveText('0')
  })

  test('statuses persist and appear in the log; empty deck after all flicks', async ({ page }) => {
    const total = await page.getByTestId('tab-cards').locator('span').last().innerText()
    for (let i = 0; i < Number(total); i++) {
      await expect(page.getByTestId('swipe-card')).toBeVisible()
      await swipe(page, i % 2 ? -260 : 260, 0)
      await expect(page.getByTestId(i % 2 ? 'count-skip' : 'count-done')).toHaveText(String(Math.floor(i / 2) + 1))
    }
    await expect(page.getByTestId('deck-empty')).toBeVisible()

    await page.reload()
    await page.getByTestId('tab-log').click()
    await expect(page.locator('[data-status="done"]')).toHaveCount(Math.ceil(Number(total) / 2))
    await expect(page.locator('[data-status="skip"]')).toHaveCount(Math.floor(Number(total) / 2))
  })

  test('buttons mirror the flick gestures', async ({ page }) => {
    await page.getByTestId('btn-review').click()
    await expect(page.getByTestId('count-review')).toHaveText('1')
  })

  test('write button jumps to composer with the task as context', async ({ page }) => {
    await page.getByTestId('card-write').click()
    await expect(page.getByTestId('task-context')).toBeVisible()
    await expect(page.getByTestId('composer-input')).toBeFocused()
  })
})
