const { chromium } = require('playwright');

async function runTests() {
  console.log('🚀 启动浏览器...');
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  try {
    // ===== 测试1: 登录 =====
    console.log('\n📍 测试1: 登录功能');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/01-login-page.png', fullPage: true });
    console.log('  📸 截图: tests/screenshots/01-login-page.png');

    // 检查是否已有登录用户
    const token = await page.evaluate(() => localStorage.getItem('token'));
    if (!token) {
      console.log('  - 执行登录...');
      await page.fill('input[type="text"]', 'test');
      await page.fill('input[type="password"]', 'test123456');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      console.log('  ✅ 登录完成');
    } else {
      console.log('  ✅ 已登录状态');
    }
    await page.screenshot({ path: 'tests/screenshots/01-logged-in.png', fullPage: true });

    // ===== 测试2: 进入项目管理 =====
    console.log('\n📍 测试2: 项目管理页面');
    await page.goto('http://localhost:5173/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/02-projects-page.png', fullPage: true });
    console.log('  📸 截图: tests/screenshots/02-projects-page.png');

    // 检查项目列表是否加载
    const projectCount = await page.locator('.project-card').count();
    console.log(`  - 项目数量: ${projectCount}`);

    // ===== 测试3: 新建项目 - 3种模式选择 =====
    console.log('\n📍 测试3: 新建项目 - 3种模式选择');
    await page.click('button:has-text("新建项目")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/03-mode-dialog.png', fullPage: true });
    console.log('  📸 截图: tests/screenshots/03-mode-dialog.png');

    // 检查3种模式卡片
    const modeCards = await page.locator('.mode-card').count();
    console.log(`  - 找到 ${modeCards} 种模式卡片`);
    console.log(`  ${modeCards === 3 ? '✅' : '❌'} 3种模式卡片显示 ${modeCards === 3 ? '正常' : '异常'}`);

    // 填写并创建项目
    console.log('  - 填写项目表单...');
    await page.click('.mode-card:has-text("精准定制")');
    await page.waitForTimeout(300);

    // 找到项目名称输入框
    const nameInput = page.locator('.mode-form input').first();
    await nameInput.fill('Playwright测试项目');
    await page.screenshot({ path: 'tests/screenshots/03-mode-form-filled.png', fullPage: true });
    console.log('  📸 截图: tests/screenshots/03-mode-form-filled.png');

    // 创建项目
    console.log('  - 点击创建项目...');
    await page.click('button:has-text("创建项目")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/03-project-created.png', fullPage: true });
    console.log('  📸 截图: tests/screenshots/03-project-created.png');

    // 检查URL是否变化（可能进入了项目详情）
    const currentUrl = page.url();
    console.log(`  - 当前URL: ${currentUrl}`);

    // 如果还在项目列表页面，点击刚创建的项目
    if (currentUrl.includes('/projects')) {
      await page.goto('http://localhost:5173/projects');
      await page.waitForTimeout(2000);
      const newProjectCount = await page.locator('.project-card').count();
      console.log(`  - 更新后项目数量: ${newProjectCount}`);
      if (newProjectCount > 0) {
        await page.locator('.project-card').first().click();
        await page.waitForTimeout(2000);
      }
    }

    await page.screenshot({ path: 'tests/screenshots/04-project-detail.png', fullPage: true });
    console.log('  📸 截图: tests/screenshots/04-project-detail.png');

    // ===== 测试4: 检查项目详情tabs =====
    console.log('\n📍 测试4: 项目详情页面Tabs');
    const tabCount = await page.locator('.el-tabs__item').count();
    console.log(`  - Tab数量: ${tabCount}`);
    for (let i = 0; i < tabCount; i++) {
      const tabText = await page.locator('.el-tabs__item').nth(i).textContent();
      console.log(`    Tab ${i + 1}: ${tabText}`);
    }

    // ===== 测试5: 点击扩展工具tab =====
    console.log('\n📍 测试5: 扩展工具Tab');
    const extensionTab = page.locator('.el-tabs__item').filter({ hasText: '扩展工具' });
    if (await extensionTab.isVisible()) {
      await extensionTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'tests/screenshots/05-extensions-tab.png', fullPage: true });
      console.log('  ✅ 扩展工具Tab点击成功');
      console.log('  📸 截图: tests/screenshots/05-extensions-tab.png');

      // 检查左侧tab列表
      const leftTabs = await page.locator('.el-tab-pane').count();
      console.log(`  - 左侧Tab数量: ${leftTabs}`);
    } else {
      console.log('  ❌ 扩展工具Tab未找到');
      await page.screenshot({ path: 'tests/screenshots/05-extensions-tab-fail.png', fullPage: true });
    }

    // ===== 测试6: 用研问卷生成器 =====
    console.log('\n📍 测试6: 用研问卷生成器');
    const surveyGenVisible = await page.locator('.survey-generator').isVisible();
    console.log(`  ${surveyGenVisible ? '✅' : '❌'} 问卷生成器: ${surveyGenVisible ? '显示' : '未显示'}`);

    if (surveyGenVisible) {
      // 填写问卷名称
      const surveyInput = page.locator('.survey-generator input').first();
      if (await surveyInput.isVisible()) {
        await surveyInput.fill('手游用户需求调研');
        await page.screenshot({ path: 'tests/screenshots/06-survey-filled.png', fullPage: true });
        console.log('  ✅ 问卷表单填写成功');
      }
    }
    await page.screenshot({ path: 'tests/screenshots/06-survey-generator.png', fullPage: true });

    // ===== 测试7: 营销脚本生成器 =====
    console.log('\n📍 测试7: 营销脚本生成器');
    const scriptGenVisible = await page.locator('.marketing-script-generator').isVisible();
    console.log(`  ${scriptGenVisible ? '✅' : '❌'} 营销脚本: ${scriptGenVisible ? '显示' : '未显示'}`);
    await page.screenshot({ path: 'tests/screenshots/07-marketing-script.png', fullPage: true });

    // ===== 测试8: 产品建议生成器 =====
    console.log('\n📍 测试8: 产品功能建议生成器');
    const productGenVisible = await page.locator('.product-suggestion-generator').isVisible();
    console.log(`  ${productGenVisible ? '✅' : '❌'} 产品建议: ${productGenVisible ? '显示' : '未显示'}`);
    await page.screenshot({ path: 'tests/screenshots/08-product-suggestion.png', fullPage: true });

    // ===== 测试9: 团队协作 =====
    console.log('\n📍 测试9: 团队协作');
    const teamCollabVisible = await page.locator('.team-collaboration').isVisible();
    console.log(`  ${teamCollabVisible ? '✅' : '❌'} 团队协作: ${teamCollabVisible ? '显示' : '未显示'}`);
    await page.screenshot({ path: 'tests/screenshots/09-team-collaboration.png', fullPage: true });

    // ===== 检查控制台错误 =====
    console.log('\n📍 控制台错误检查');
    if (errors.length > 0) {
      console.log(`  ⚠️ 发现 ${errors.length} 个错误:`);
      errors.slice(0, 5).forEach(e => console.log(`     - ${e.substring(0, 100)}`));
    } else {
      console.log('  ✅ 无控制台错误');
    }

    // ===== 最终截图 =====
    console.log('\n📍 最终状态');
    await page.screenshot({ path: 'tests/screenshots/99-final-state.png', fullPage: true });

    // ===== 测试总结 =====
    console.log('\n========== 测试完成 ==========');
    console.log('✅ 所有功能测试截图已保存');
    console.log('\n📋 截图清单:');
    console.log('  01-login-page.png       - 登录页面');
    console.log('  01-logged-in.png        - 登录后状态');
    console.log('  02-projects-page.png    - 项目列表');
    console.log('  03-mode-dialog.png     - 3种模式选择');
    console.log('  03-mode-form-filled.png - 表单填写');
    console.log('  03-project-created.png - 项目创建');
    console.log('  04-project-detail.png  - 项目详情');
    console.log('  05-extensions-tab.png   - 扩展工具Tab');
    console.log('  06-survey-generator.png - 用研问卷');
    console.log('  07-marketing-script.png - 营销脚本');
    console.log('  08-product-suggestion.png - 产品建议');
    console.log('  09-team-collaboration.png - 团队协作');
    console.log('  99-final-state.png      - 最终状态');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    await page.screenshot({ path: 'tests/screenshots/99-error-state.png', fullPage: true });
    console.log('  📸 错误截图已保存');
  } finally {
    console.log('\n⏳ 浏览器保持打开，按Ctrl+C结束...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

runTests();
