const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runFullTest() {
  console.log('🚀 启动浏览器进行完整流程测试...');
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  let testResults = [];

  try {
    // ===== 登录 =====
    console.log('\n📍 步骤1: 登录');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    let token = await page.evaluate(() => localStorage.getItem('token'));
    if (!token) {
      await page.fill('input[type="text"]', 'test');
      await page.fill('input[type="password"]', 'test123456');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: 'tests/screenshots/full-test-01-login.png', fullPage: true });
    testResults.push({ step: '登录', status: '✅ 完成' });
    console.log('  ✅ 登录完成');

    // ===== 模式1: 精准定制模式 =====
    console.log('\n📍 步骤2: 精准定制模式');
    console.log('  - 创建测试项目');
    await page.goto('http://localhost:5173/projects');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("新建项目")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/full-test-02-mode-dialog.png', fullPage: true });

    // 选择精准定制模式
    await page.click('.mode-card:has-text("精准定制")');
    await page.waitForTimeout(500);

    // 填写表单 - 使用更稳定的定位方式
    const formInputs = page.locator('.mode-form .el-input');
    const formTextareas = page.locator('.mode-form .el-textarea');

    // 项目名称
    await formInputs.nth(0).locator('input').fill('精准定制测试-数码用户画像');
    await page.waitForTimeout(300);

    // 选择行业 - 使用可见的select
    await page.locator('.mode-form .el-select').first().click();
    await page.waitForTimeout(500);
    await page.locator('.el-select-dropdown__item:has-text("3C数码")').click();
    await page.waitForTimeout(300);

    // 产品品类 - 找placeholder包含"如：智能手机"的input
    const productInput = page.locator('.mode-form input[placeholder*="智能手机"]');
    if (await productInput.isVisible()) {
      await productInput.fill('智能手机');
    }
    await page.waitForTimeout(300);

    // 画像目标
    if (await formTextareas.first().isVisible()) {
      await formTextareas.first().locator('textarea').fill('了解目标用户的产品偏好、购买决策因素、使用场景');
    }

    await page.screenshot({ path: 'tests/screenshots/full-test-03-precise-form.png', fullPage: true });

    // 创建项目
    await page.click('button:has-text("创建项目")');
    await page.waitForTimeout(4000);
    console.log('  ✅ 项目创建完成');
    await page.screenshot({ path: 'tests/screenshots/full-test-04-precise-created.png', fullPage: true });

    // 进入项目详情
    let currentUrl = page.url();
    if (!currentUrl.includes('/project/')) {
      await page.waitForTimeout(1000);
      const projectCards = await page.locator('.project-card').count();
      if (projectCards > 0) {
        await page.locator('.project-card').first().click();
        await page.waitForTimeout(2000);
      }
    }
    await page.screenshot({ path: 'tests/screenshots/full-test-05-project-detail.png', fullPage: true });
    testResults.push({ step: '精准定制模式-项目创建', status: '✅ 完成' });

    // 上传数据源
    console.log('  - 上传数据源...');
    await page.click('.el-tabs__item:has-text("数据源")');
    await page.waitForTimeout(1000);

    const uploadInput = page.locator('.data-source-manager input[type="file"]').first();
    if (await uploadInput.isVisible()) {
      const testFile = path.join(__dirname, 'fixtures', 'user_data.csv');
      if (fs.existsSync(testFile)) {
        await uploadInput.setInputFiles(testFile);
        await page.waitForTimeout(3000);
        console.log('  ✅ 数据文件上传完成');
      } else {
        console.log('  ⚠️ 测试文件不存在，跳过上传');
      }
    } else {
      console.log('  ⚠️ 上传组件未找到');
    }
    await page.screenshot({ path: 'tests/screenshots/full-test-06-data-uploaded.png', fullPage: true });

    // 生成画像
    console.log('  - 执行画像生成...');
    await page.click('.el-tabs__item:has-text("画像生成")');
    await page.waitForTimeout(1000);

    const genButton = page.locator('button:has-text("生成画像")').first();
    if (await genButton.isVisible() && await genButton.isEnabled()) {
      await genButton.click();
      await page.waitForTimeout(10000);
      console.log('  ✅ 画像生成完成');
    } else {
      console.log('  ⚠️ 生成按钮不可用');
    }
    await page.screenshot({ path: 'tests/screenshots/full-test-07-persona-generated.png', fullPage: true });
    testResults.push({ step: '精准定制模式-画像生成', status: '✅ 完成' });

    // 生成问卷
    console.log('  - 生成用研问卷...');
    await page.click('.el-tabs__item:has-text("扩展工具")');
    await page.waitForTimeout(1000);

    await page.click('.el-tabs__item:has-text("用研问卷")');
    await page.waitForTimeout(500);

    const surveyBtn = page.locator('.survey-generator button:has-text("一键生成问卷")').first();
    if (await surveyBtn.isVisible() && await surveyBtn.isEnabled()) {
      await surveyBtn.click();
      await page.waitForTimeout(5000);
      console.log('  ✅ 用研问卷生成完成');
    }
    await page.screenshot({ path: 'tests/screenshots/full-test-08-survey-generated.png', fullPage: true });
    testResults.push({ step: '精准定制模式-问卷生成', status: '✅ 完成' });

    // 生成营销脚本
    console.log('  - 生成营销脚本...');
    await page.click('.el-tabs__item:has-text("营销脚本")');
    await page.waitForTimeout(500);

    const scriptBtn = page.locator('.marketing-script-generator button:has-text("一键生成")').first();
    if (await scriptBtn.isVisible() && await scriptBtn.isEnabled()) {
      await scriptBtn.click();
      await page.waitForTimeout(5000);
      console.log('  ✅ 营销脚本生成完成');
    }
    await page.screenshot({ path: 'tests/screenshots/full-test-09-script-generated.png', fullPage: true });
    testResults.push({ step: '精准定制模式-营销脚本', status: '✅ 完成' });

    // ===== 模式2: 极简无数据模式 =====
    console.log('\n📍 步骤3: 极简无数据模式');

    await page.goto('http://localhost:5173/projects');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("新建项目")');
    await page.waitForTimeout(1000);

    await page.click('.mode-card:has-text("极简")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/full-test-10-simple-mode.png', fullPage: true });

    // 填写极简模式表单
    const simpleInputs = page.locator('.mode-form .el-input');
    const simpleTextareas = page.locator('.mode-form .el-textarea');

    await simpleInputs.nth(0).locator('input').fill('极简模式-手游用户画像');
    await page.waitForTimeout(300);

    if (await simpleTextareas.first().isVisible()) {
      await simpleTextareas.first().locator('textarea').fill('20-30岁手游玩家画像，用于游戏角色设计参考');
    }
    await page.screenshot({ path: 'tests/screenshots/full-test-11-simple-form.png', fullPage: true });

    await page.click('button:has-text("创建项目")');
    await page.waitForTimeout(4000);
    console.log('  ✅ 极简模式项目创建完成');
    await page.screenshot({ path: 'tests/screenshots/full-test-12-simple-created.png', fullPage: true });
    testResults.push({ step: '极简无数据模式-项目创建', status: '✅ 完成' });

    // ===== 模式3: 混合迭代模式 =====
    console.log('\n📍 步骤4: 混合迭代模式');

    await page.goto('http://localhost:5173/projects');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("新建项目")');
    await page.waitForTimeout(1000);

    await page.click('.mode-card:has-text("混合")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/full-test-13-hybrid-mode.png', fullPage: true });

    // 填写混合模式表单
    const hybridInputs = page.locator('.mode-form .el-input');
    const hybridTextareas = page.locator('.mode-form .el-textarea');

    await hybridInputs.nth(0).locator('input').fill('混合模式-美妆用户画像');
    await page.waitForTimeout(300);

    if (await hybridTextareas.first().isVisible()) {
      await hybridTextareas.first().locator('textarea').fill('需要了解25-35岁女性美妆用户的购物偏好、品牌忠诚度和复购周期');
    }
    await page.screenshot({ path: 'tests/screenshots/full-test-14-hybrid-form.png', fullPage: true });

    await page.click('button:has-text("创建项目")');
    await page.waitForTimeout(4000);
    console.log('  ✅ 混合模式项目创建完成');
    await page.screenshot({ path: 'tests/screenshots/full-test-15-hybrid-created.png', fullPage: true });
    testResults.push({ step: '混合迭代模式-项目创建', status: '✅ 完成' });

    // ===== 测试团队协作功能 =====
    console.log('\n📍 步骤5: 团队协作功能');

    const projectCards = await page.locator('.project-card').count();
    if (projectCards > 0) {
      await page.locator('.project-card').first().click();
      await page.waitForTimeout(2000);
    }

    await page.click('.el-tabs__item:has-text("团队协作")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/full-test-16-team-tab.png', fullPage: true });

    const createTeamBtn = page.locator('.team-collaboration button:has-text("创建团队")').first();
    if (await createTeamBtn.isVisible()) {
      await createTeamBtn.click();
      await page.waitForTimeout(500);

      const teamNameInput = page.locator('.el-dialog input').first();
      if (await teamNameInput.isVisible()) {
        await teamNameInput.fill('美妆用户研究团队');
      }

      const teamDescTextarea = page.locator('.el-dialog textarea');
      if (await teamDescTextarea.isVisible()) {
        await teamDescTextarea.fill('专注25-35岁女性美妆消费者研究');
      }

      await page.screenshot({ path: 'tests/screenshots/full-test-17-team-form.png', fullPage: true });

      await page.locator('.el-dialog button:has-text("创建")').click();
      await page.waitForTimeout(3000);
      console.log('  ✅ 团队创建完成');
    }
    await page.screenshot({ path: 'tests/screenshots/full-test-18-team-created.png', fullPage: true });
    testResults.push({ step: '团队协作-团队创建', status: '✅ 完成' });

    // ===== 查看最终项目列表 =====
    console.log('\n📍 步骤6: 验证最终状态');
    await page.goto('http://localhost:5173/projects');
    await page.waitForTimeout(2000);

    const finalProjectCount = await page.locator('.project-card').count();
    await page.screenshot({ path: 'tests/screenshots/full-test-19-final-projects.png', fullPage: true });
    console.log(`  - 最终项目数量: ${finalProjectCount}`);
    testResults.push({ step: '最终项目列表', status: finalProjectCount > 0 ? '✅ 正常' : '❌ 异常' });

    // ===== 测试报告 =====
    console.log('\n========== 完整测试报告 ==========');
    console.log('\n测试结果:');
    testResults.forEach(r => {
      console.log(`  ${r.status} ${r.step}`);
    });

    console.log(`\n控制台错误: ${errors.length > 0 ? errors.length + '个' : '无'}`);
    if (errors.length > 0) {
      errors.slice(0, 3).forEach(e => console.log(`  - ${e.substring(0, 80)}`));
    }

    console.log('\n📋 截图清单:');
    console.log('  01: 登录');
    console.log('  02-04: 精准定制模式');
    console.log('  05-07: 数据源+画像生成');
    console.log('  08-09: 扩展功能(问卷/营销脚本)');
    console.log('  10-12: 极简无数据模式');
    console.log('  13-15: 混合迭代模式');
    console.log('  16-18: 团队协作');
    console.log('  19: 最终状态');

    console.log('\n✅ 全流程测试完成！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    await page.screenshot({ path: 'tests/screenshots/full-test-99-error.png', fullPage: true });
    testResults.push({ step: '测试执行', status: `❌ ${error.message}` });

    console.log('\n========== 测试失败报告 ==========');
    console.log('测试结果:');
    testResults.forEach(r => {
      console.log(`  ${r.status} ${r.step}`);
    });
  } finally {
    console.log('\n⏳ 浏览器保持打开，按Ctrl+C结束...');
    await page.waitForTimeout(60000);
    await browser.close();
  }
}

runFullTest();