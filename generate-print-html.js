#!/usr/bin/env node
/**
 * Generates a single print-ready HTML file from all 15 chapter MDX files.
 * Output: website/static/print-book.html
 * Usage: node generate-print-html.js
 * Then open http://localhost:3000/print-book.html in Chrome and Ctrl+P → Save as PDF
 */

const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'website', 'docs');
const outputFile = path.join(__dirname, 'website', 'static', 'print-book.html');

// All 15 chapters in order — read from website/docs/ (published versions with ASCII diagrams)
const chapterFiles = [
  'part1/chapter-01-physical-ai.mdx',
  'part1/chapter-02-embodied-intelligence.mdx',
  'part2/chapter-03-ros2-architecture.mdx',
  'part2/chapter-04-rclpy-control.mdx',
  'part2/chapter-05-sros2-security.mdx',
  'part3/chapter-06-gazebo.mdx',
  'part3/chapter-07-unity-hri.mdx',
  'part3/chapter-08-isaac-sim.mdx',
  'part4/chapter-09-isaac-ros.mdx',
  'part4/chapter-10-jetson-deployment.mdx',
  'part5/chapter-11-vla-systems.mdx',
  'part5/chapter-12-voice-to-action.mdx',
  'part6/chapter-13-benefits.mdx',
  'part7/chapter-14-risks-threats.mdx',
  'part8/chapter-15-ethics-policy.mdx',
];

// Simple MDX → HTML converter (no external deps)
function mdxToHtml(content) {
  // Strip frontmatter
  content = content.replace(/^---[\s\S]*?---\n/, '');

  // Strip JSX/import lines
  content = content.replace(/^import\s+.*$/gm, '');
  content = content.replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, '');
  content = content.replace(/<[A-Z][^/]*\/>/g, '');

  // Strip Constitution Compliance Check sections (internal QA - not for readers)
  content = content.replace(/## Constitution Compliance Check[\s\S]*?(?=\n## |\n---|\n# |$)/g, '');

  // Headings
  content = content.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  content = content.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  content = content.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  content = content.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  content = content.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  content = content.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Code blocks (fenced)
  content = content.replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre><code>${escaped}</code></pre>`;
  });

  // Inline code
  content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold and italic
  content = content.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  content = content.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

  // Blockquotes
  content = content.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Tables - convert markdown tables to HTML
  content = content.replace(/((?:^\|.+\|\n)+)/gm, (tableBlock) => {
    const lines = tableBlock.trim().split('\n');
    if (lines.length < 2) return tableBlock;

    const isHeader = (line) => /^\|[-:| ]+\|$/.test(line.trim());
    let html = '<table>';
    let inBody = false;

    lines.forEach((line, i) => {
      if (isHeader(line)) { inBody = true; return; }
      const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (cells.length === 0) return;
      if (!inBody && i === 0) {
        html += '<thead><tr>' + cells.map(c => `<th>${c.trim()}</th>`).join('') + '</tr></thead><tbody>';
      } else {
        html += '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
      }
    });
    html += '</tbody></table>';
    return html;
  });

  // Unordered lists
  content = content.replace(/((?:^[-*] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^[-*] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  content = content.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Horizontal rules
  content = content.replace(/^---$/gm, '<hr>');

  // Links
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Figure bold labels — make them stand out
  content = content.replace(/\*\*(Figure \d+\.\d+[^*]*)\*\*/g,
    '<p><strong style="color:#1e3a5f;font-size:10pt">$1</strong></p>');

  // Figure captions — italic lines starting with *Figure N.X:
  content = content.replace(/^\*(Figure \d+\.\d+:[^*]+)\*$/gm,
    '<p class="fig-caption">$1</p>');

  // Paragraphs — wrap bare lines
  const lines = content.split('\n');
  const result = [];
  let para = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (para.length) {
        const text = para.join(' ');
        if (!text.startsWith('<')) result.push(`<p>${text}</p>`);
        else result.push(text);
        para = [];
      }
    } else if (trimmed.startsWith('<')) {
      if (para.length) { result.push(`<p>${para.join(' ')}</p>`); para = []; }
      result.push(trimmed);
    } else {
      para.push(trimmed);
    }
  }
  if (para.length) result.push(`<p>${para.join(' ')}</p>`);

  return result.join('\n');
}

// Build HTML
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Georgia:ital,wght@0,400;0,700;1,400&family=Fira+Code:wght@400&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.75;
    color: #1a1a1a;
    background: white;
    max-width: 750px;
    margin: 0 auto;
    padding: 40px 60px;
  }

  /* Cover page */
  .cover {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    page-break-after: always;
    background: linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%);
    color: white;
    margin: -40px -60px 0;
    padding: 80px 60px;
  }
  .cover .robot { font-size: 72pt; margin-bottom: 32px; }
  .cover h1 { font-size: 22pt; font-weight: bold; line-height: 1.3; margin-bottom: 20px; color: #e2e8f0; }
  .cover .subtitle { font-size: 13pt; color: #93c5fd; font-style: italic; margin-bottom: 40px; }
  .cover .divider { border: none; border-top: 2px solid #3b82f6; width: 200px; margin: 24px auto; }
  .cover .author { font-size: 14pt; color: #e2e8f0; font-weight: bold; margin-bottom: 8px; }
  .cover .edition { font-size: 10pt; color: #94a3b8; }

  /* TOC */
  .toc { page-break-after: always; padding-top: 40px; }
  .toc h1 { font-size: 18pt; margin-bottom: 24px; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px; }
  .toc ol { padding-left: 20px; }
  .toc li { margin: 6px 0; font-size: 10.5pt; }
  .toc .part-header { font-weight: bold; color: #1e3a5f; margin-top: 16px; list-style: none; margin-left: -20px; }

  /* Chapters */
  .chapter { page-break-before: always; padding-top: 40px; }
  h1 { font-size: 18pt; color: #0f172a; margin: 32px 0 16px; border-bottom: 3px solid #1e3a5f; padding-bottom: 8px; }
  h2 { font-size: 14pt; color: #1e3a5f; margin: 28px 0 12px; }
  h3 { font-size: 12pt; color: #334155; margin: 20px 0 8px; }
  h4 { font-size: 11pt; color: #475569; margin: 16px 0 6px; }
  p { margin: 10px 0; text-align: justify; }
  pre { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 14px 18px; overflow-x: auto; font-size: 8.5pt; line-height: 1.6; margin: 16px 0; page-break-inside: avoid; white-space: pre; }
  pre.figure-block { background: #f0f4f8; border: 2px solid #94a3b8; border-radius: 6px; padding: 18px 20px; margin: 20px 0; font-size: 8pt; line-height: 1.5; text-align: left; }
  code { font-family: 'Fira Code', 'Courier New', monospace; font-size: 9pt; background: #f1f5f9; padding: 1px 4px; border-radius: 3px; }
  pre code { background: none; padding: 0; font-size: 8.5pt; }
  .fig-caption { font-size: 9pt; color: #475569; font-style: italic; margin: -12px 0 20px; padding: 0 4px; }
  blockquote { border-left: 3px solid #3b82f6; padding: 8px 16px; margin: 16px 0; color: #475569; font-style: italic; background: #f8fafc; }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 9.5pt; page-break-inside: avoid; }
  th { background: #1e3a5f; color: white; padding: 8px 12px; text-align: left; font-size: 9pt; }
  td { border: 1px solid #e2e8f0; padding: 6px 12px; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  ul, ol { margin: 10px 0 10px 24px; }
  li { margin: 4px 0; }
  strong { font-weight: bold; color: #0f172a; }
  em { font-style: italic; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  a { color: #2563eb; text-decoration: none; }

  @media print {
    body { margin: 0; padding: 0; max-width: 100%; }
    .cover { margin: 0; }
    .no-print { display: none; }
    @page { margin: 1in; size: letter; }
    h1, h2, h3 { page-break-after: avoid; }
    pre, table, blockquote { page-break-inside: avoid; }
  }
`;

// Table of Contents
const toc = `
<div class="toc">
  <h1>Table of Contents</h1>
  <ol>
    <li class="part-header">Part I — Foundations — Hardware and Software Architecture</li>
    <li>Chapter 1 — Physical AI and the Humanoid Form Factor</li>
    <li>Chapter 2 — Embodied Intelligence: From Hardware to Cognition</li>
    <li class="part-header">Part II — Software Architecture — ROS 2 and Control Systems</li>
    <li>Chapter 3 — ROS 2 Architecture for Humanoid Robots</li>
    <li>Chapter 4 — Python-Based Robot Control with rclpy</li>
    <li class="part-header">Part III — Security and Simulation — Building Safe Systems</li>
    <li>Chapter 5 — SROS 2 Security for Humanoid Robots</li>
    <li>Chapter 6 — Simulation with Gazebo</li>
    <li class="part-header">Part IV — Advanced Simulation — Digital Twins and HRI</li>
    <li>Chapter 7 — Unity for Human-Robot Interaction</li>
    <li>Chapter 8 — NVIDIA Isaac Sim</li>
    <li class="part-header">Part V — Vision-Language-Action Systems</li>
    <li>Chapter 9 — Isaac ROS and Perception Pipelines</li>
    <li>Chapter 10 — Jetson Deployment</li>
    <li>Chapter 11 — Vision-Language-Action Systems</li>
    <li>Chapter 12 — Voice-to-Action Integration</li>
    <li class="part-header">Part VI — Benefits and Risks</li>
    <li>Chapter 13 — Benefits of AI Humanoid Robots</li>
    <li>Chapter 14 — Risks and Threats</li>
    <li class="part-header">Part VII — Ethics and Policy</li>
    <li>Chapter 15 — Ethics, Policy, and the Road Ahead</li>
  </ol>
</div>
`;

// Process chapters
console.log('Generating print-ready HTML...');
let chaptersHtml = '';
for (const file of chapterFiles) {
  const filePath = path.join(docsDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`  WARNING: ${file} not found, skipping`);
    continue;
  }
  console.log(`  Processing: ${file}`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const html = mdxToHtml(raw);
  chaptersHtml += `<div class="chapter">${html}</div>\n`;
}

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pros and Cons of AI Humanoid Robots in Human Life</title>
  <style>${css}</style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover">
    <div class="robot">🤖</div>
    <h1>Pros and Cons of AI Humanoid Robots in Human Life</h1>
    <p class="subtitle">A Balanced Technical Analysis of Embodied Intelligence</p>
    <hr class="divider">
    <p class="author">Muhammad Faisal Laiq Siddiqui</p>
    <p class="edition">First Edition · 2025</p>
  </div>

  <!-- Table of Contents -->
  ${toc}

  <!-- All Chapters -->
  ${chaptersHtml}

  <!-- Print Button (hidden when printing) -->
  <div class="no-print" style="position:fixed;bottom:24px;right:24px;z-index:999">
    <button onclick="window.print()"
      style="background:#1e3a5f;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3)">
      🖨️ Print / Save as PDF
    </button>
  </div>

</body>
</html>`;

fs.writeFileSync(outputFile, fullHtml, 'utf8');
const size = (fs.statSync(outputFile).size / 1024).toFixed(0);
console.log(`\nDone! Output: ${outputFile} (${size} KB)`);
console.log('\nTo generate PDF:');
console.log('  1. cd website && npm run serve');
console.log('  2. Open http://localhost:3000/print-book.html in Chrome');
console.log('  3. Press Ctrl+P → Destination: Save as PDF → Save');
console.log('  4. Copy the saved PDF to website/static/book-humanoid-robots-ai.pdf');
