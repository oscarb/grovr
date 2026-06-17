import { test, expect } from '../fixtures/tauri'

test.describe('GitLab Settings @settings @critical', () => {
  test('can navigate to GitLab settings and display form fields', async ({ mockedPage }) => {
    // Navigate to settings
    const settingsBtn = mockedPage.locator('[title="Settings"]')
    await expect(settingsBtn).toBeVisible()
    await settingsBtn.click()

    // Click GitLab tab
    const gitlabTab = mockedPage.locator('.settings-nav-item').filter({ hasText: 'GitLab' })
    await expect(gitlabTab).toBeVisible()
    await gitlabTab.click()

    // Title should be GitLab
    const gitlabTitle = mockedPage.locator('.settings-content-title')
    await expect(gitlabTitle).toHaveText('GitLab')

    // Account Type selector should be visible and have "personal" as default
    const typeSelect = mockedPage.locator('.settings-select').first()
    await expect(typeSelect).toBeVisible()
    await expect(typeSelect).toHaveValue('personal')

    // Host URL input should NOT be visible initially (since personal type is default)
    const hostInput = mockedPage.locator('input[placeholder="gitlab.company.com"]')
    await expect(hostInput).not.toBeVisible()

    // Personal Access Token input should be visible
    const tokenInput = mockedPage.locator('input[placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"]')
    await expect(tokenInput).toBeVisible()

    // Change account type to enterprise
    await typeSelect.selectOption('enterprise')

    // Host URL input should now be visible
    await expect(hostInput).toBeVisible()
  })

  test('can validate, save, and remove GitLab configuration', async ({ mockedPage }) => {
    // Navigate to settings
    const settingsBtn = mockedPage.locator('[title="Settings"]')
    await settingsBtn.click()

    // Click GitLab tab
    const gitlabTab = mockedPage.locator('.settings-nav-item').filter({ hasText: 'GitLab' })
    await gitlabTab.click()

    const tokenInput = mockedPage.locator('input[placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"]')
    const testBtn = mockedPage.locator('button', { hasText: 'Test' })
    const saveBtn = mockedPage.locator('button', { hasText: 'Save' })

    // Test with invalid token
    await tokenInput.fill('invalid-token')
    await testBtn.click()
    const errorMsg = mockedPage.locator('.text-red-500').first()
    await expect(errorMsg).toBeVisible()
    await expect(errorMsg).toHaveText('Invalid token')

    // Test with valid token
    await tokenInput.fill('glpat-validtoken')
    await testBtn.click()
    const successMsg = mockedPage.locator('.text-green-500').first()
    await expect(successMsg).toBeVisible()
    await expect(successMsg).toContainText('Connected as mocked-gitlab-user')

    // Save configuration
    await saveBtn.click()

    // It should close the form and display the connected integration card
    const card = mockedPage.locator('.integration-card')
    await expect(card).toBeVisible()
    await expect(card.locator('.integration-name')).toHaveText('mocked-gitlab-user')
    await expect(card.locator('.integration-token')).toHaveText('gitlab.com')

    // Remove configuration
    const removeBtn = mockedPage.locator('button', { hasText: 'Remove' })
    await expect(removeBtn).toBeVisible()
    await removeBtn.click()

    // Form should be visible again after removing config
    await expect(card).not.toBeVisible()
    await expect(tokenInput).toBeVisible()
  })
})
