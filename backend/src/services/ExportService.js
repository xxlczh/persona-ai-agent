const PDFDocument = require('pdfkit');
const { Persona } = require('../models');

/**
 * 导出服务
 */
class ExportService {
  /**
   * 获取画像数据
   * @param {number} id - 画像 ID
   */
  async getPersonaData(id) {
    const persona = await Persona.findByPk(id, {
      include: [
        { model: require('../models/Project'), as: 'project', attributes: ['id', 'name'] }
      ]
    });

    if (!persona) {
      throw new Error('画像不存在');
    }

    return persona;
  }

  /**
   * 导出为 JSON
   * @param {number} id - 画像 ID
   * @param {string[]} content - 导出内容选项
   */
  async exportJson(id, content = []) {
    const persona = await this.getPersonaData(id);
    const data = this.filterPersonaData(persona, content);
    return JSON.stringify(data, null, 2);
  }

  /**
   * 导出为 Markdown
   * @param {number} id - 画像 ID
   * @param {string[]} content - 导出内容选项
   */
  async exportMarkdown(id, content = []) {
    const persona = await this.getPersonaData(id);
    return this.generateMarkdown(persona, content);
  }

  /**
   * 导出为 PDF
   * @param {number} id - 画像 ID
   * @param {string[]} content - 导出内容选项
   */
  async exportPdf(id, content = []) {
    const persona = await this.getPersonaData(id);
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: persona.name || '用户画像',
            Author: 'Persona AI Agent',
            Subject: '用户画像报告'
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const result = Buffer.concat(chunks);
          resolve(result);
        });
        doc.on('error', reject);

        // 标题
        doc.fontSize(24).font('Helvetica-Bold').text(persona.name || '用户画像', {
          align: 'center'
        });
        doc.moveDown();

        // 摘要
        if (content.includes('summary') && persona.summary) {
          doc.fontSize(16).font('Helvetica-Bold').text('摘要');
          doc.fontSize(12).font('Helvetica').text(persona.summary);
          doc.moveDown();
        }

        // 人口统计特征
        if (content.includes('demographic') && persona.demographic) {
          doc.fontSize(16).font('Helvetica-Bold').text('人口统计特征');
          doc.fontSize(12).font('Helvetica');
          const d = persona.demographic;
          if (d.age) doc.text(`年龄: ${d.age}`);
          if (d.gender) doc.text(`性别: ${d.gender}`);
          if (d.occupation) doc.text(`职业: ${d.occupation}`);
          if (d.income) doc.text(`收入: ${d.income}`);
          if (d.education) doc.text(`学历: ${d.education}`);
          if (d.location) doc.text(`地区: ${d.location}`);
          if (d.description) doc.text(`\n${d.description}`);
          doc.moveDown();
        }

        // 行为特征
        if (content.includes('behavioral') && persona.behavioral) {
          doc.fontSize(16).font('Helvetica-Bold').text('行为特征');
          doc.fontSize(12).font('Helvetica');
          const b = persona.behavioral;
          if (b.usage_frequency) doc.text(`使用频率: ${b.usage_frequency}`);
          if (b.usage_time) doc.text(`使用时段: ${b.usage_time}`);
          if (b.usage_scenario) doc.text(`使用场景: ${b.usage_scenario}`);
          if (b.core_behavior) doc.text(`核心行为: ${b.core_behavior}`);
          if (b.consumption_habit) doc.text(`消费习惯: ${b.consumption_habit}`);
          if (b.description) doc.text(`\n${b.description}`);
          doc.moveDown();
        }

        // 心理特征
        if (content.includes('psychological') && persona.psychological) {
          doc.fontSize(16).font('Helvetica-Bold').text('心理特征');
          doc.fontSize(12).font('Helvetica');
          const p = persona.psychological;
          if (p.values) doc.text(`价值观: ${p.values}`);
          if (p.attitude) doc.text(`态度: ${p.attitude}`);
          if (p.motivation) doc.text(`动机: ${p.motivation}`);
          if (p.pain_points) doc.text(`痛点: ${p.pain_points}`);
          if (p.interests) doc.text(`兴趣: ${p.interests}`);
          if (p.description) doc.text(`\n${p.description}`);
          doc.moveDown();
        }

        // 用户需求
        if (content.includes('needs') && persona.needs?.length) {
          doc.fontSize(16).font('Helvetica-Bold').text('用户需求');
          doc.fontSize(12).font('Helvetica');
          persona.needs.forEach(need => {
            doc.text(`- ${need}`);
          });
          doc.moveDown();
        }

        // 人格标签
        if (content.includes('personality') && persona.personality_tags?.length) {
          doc.fontSize(16).font('Helvetica-Bold').text('人格标签');
          doc.fontSize(12).font('Helvetica');
          persona.personality_tags.forEach(tag => {
            doc.text(`- ${tag}`);
          });
          doc.moveDown();
        }

        // 营销建议
        if (content.includes('marketing') && persona.marketing_suggestions) {
          doc.fontSize(16).font('Helvetica-Bold').text('营销建议');
          doc.fontSize(12).font('Helvetica');
          const m = persona.marketing_suggestions;
          if (m.channel) doc.text(`推荐渠道: ${m.channel}`);
          if (m.content_type) doc.text(`内容形式: ${m.content_type}`);
          if (m.key_message) doc.text(`核心信息: ${m.key_message}`);
          if (m.promotion_strategy) doc.text(`推广策略: ${m.promotion_strategy}`);
          if (m.description) doc.text(`\n${m.description}`);
        }

        // 页脚
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(10).font('Helvetica')
            .text(`页 ${i + 1} / ${pageCount}`, 50, doc.page.height - 50, {
              align: 'center'
            });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 过滤数据
   * @param {Object} persona - 画像数据
   * @param {string[]} content - 导出内容选项
   */
  filterPersonaData(persona, content) {
    const result = {};
    const defaultContent = ['summary', 'demographic', 'behavioral', 'psychological', 'needs', 'personality', 'marketing'];
    const selectedContent = content.length > 0 ? content : defaultContent;

    if (selectedContent.includes('summary')) {
      result.name = persona.name;
      result.summary = persona.summary;
    }
    if (selectedContent.includes('demographic')) {
      result.demographic = persona.demographic;
    }
    if (selectedContent.includes('behavioral')) {
      result.behavioral = persona.behavioral;
    }
    if (selectedContent.includes('psychological')) {
      result.psychological = persona.psychological;
    }
    if (selectedContent.includes('needs')) {
      result.needs = persona.needs;
    }
    if (selectedContent.includes('personality')) {
      result.personality_tags = persona.personality_tags;
    }
    if (selectedContent.includes('marketing')) {
      result.marketing_suggestions = persona.marketing_suggestions;
    }

    return result;
  }

  /**
   * 生成 Markdown
   * @param {Object} persona - 画像数据
   * @param {string[]} content - 导出内容选项
   */
  generateMarkdown(persona, content) {
    const defaultContent = ['summary', 'demographic', 'behavioral', 'psychological', 'needs', 'personality', 'marketing'];
    const selectedContent = content.length > 0 ? content : defaultContent;

    let md = `# ${persona.name || '用户画像'}\n\n`;

    if (selectedContent.includes('summary') && persona.summary) {
      md += `## 摘要\n\n${persona.summary}\n\n`;
    }

    if (selectedContent.includes('demographic') && persona.demographic) {
      md += '## 人口统计特征\n\n';
      const d = persona.demographic;
      if (d.age) md += `- **年龄**: ${d.age}\n`;
      if (d.gender) md += `- **性别**: ${d.gender}\n`;
      if (d.occupation) md += `- **职业**: ${d.occupation}\n`;
      if (d.income) md += `- **收入**: ${d.income}\n`;
      if (d.education) md += `- **学历**: ${d.education}\n`;
      if (d.location) md += `- **地区**: ${d.location}\n`;
      if (d.description) md += `\n${d.description}\n`;
      md += '\n';
    }

    if (selectedContent.includes('behavioral') && persona.behavioral) {
      md += '## 行为特征\n\n';
      const b = persona.behavioral;
      if (b.usage_frequency) md += `- **使用频率**: ${b.usage_frequency}\n`;
      if (b.usage_time) md += `- **使用时段**: ${b.usage_time}\n`;
      if (b.usage_scenario) md += `- **使用场景**: ${b.usage_scenario}\n`;
      if (b.core_behavior) md += `- **核心行为**: ${b.core_behavior}\n`;
      if (b.consumption_habit) md += `- **消费习惯**: ${b.consumption_habit}\n`;
      if (b.description) md += `\n${b.description}\n`;
      md += '\n';
    }

    if (selectedContent.includes('psychological') && persona.psychological) {
      md += '## 心理特征\n\n';
      const p = persona.psychological;
      if (p.values) md += `- **价值观**: ${p.values}\n`;
      if (p.attitude) md += `- **态度**: ${p.attitude}\n`;
      if (p.motivation) md += `- **动机**: ${p.motivation}\n`;
      if (p.pain_points) md += `- **痛点**: ${p.pain_points}\n`;
      if (p.interests) md += `- **兴趣**: ${p.interests}\n`;
      if (p.description) md += `\n${p.description}\n`;
      md += '\n';
    }

    if (selectedContent.includes('needs') && persona.needs?.length) {
      md += '## 用户需求\n\n';
      persona.needs.forEach(need => {
        md += `- ${need}\n`;
      });
      md += '\n';
    }

    if (selectedContent.includes('personality') && persona.personality_tags?.length) {
      md += '## 人格标签\n\n';
      persona.personality_tags.forEach(tag => {
        md += `- ${tag}\n`;
      });
      md += '\n';
    }

    if (selectedContent.includes('marketing') && persona.marketing_suggestions) {
      md += '## 营销建议\n\n';
      const m = persona.marketing_suggestions;
      if (m.channel) md += `- **推荐渠道**: ${m.channel}\n`;
      if (m.content_type) md += `- **内容形式**: ${m.content_type}\n`;
      if (m.key_message) md += `- **核心信息**: ${m.key_message}\n`;
      if (m.promotion_strategy) md += `- **推广策略**: ${m.promotion_strategy}\n`;
      if (m.description) md += `\n${m.description}\n`;
    }

    return md;
  }
}

module.exports = new ExportService();
