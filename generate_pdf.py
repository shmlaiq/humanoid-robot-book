#!/usr/bin/env python3
"""
PDF Generator for "Pros and Cons of AI Humanoid Robots in Human Life"
Uses reportlab to convert MDX chapters to a formatted PDF.
"""

import re
import os
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    HRFlowable, Preformatted
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

BOOK_DIR = Path(__file__).parent
CHAPTERS_DIR = BOOK_DIR / "chapters"
OUTPUT_PDF = BOOK_DIR / "humanoid-robots-ai-book.pdf"

CHAPTERS = [
    "chapter-01-physical-ai.mdx",
    "chapter-02-embodied-intelligence.mdx",
    "chapter-03-ros2-architecture.mdx",
    "chapter-04-rclpy-control.mdx",
    "chapter-05-sros2-security.mdx",
    "chapter-06-gazebo.mdx",
    "chapter-07-unity-hri.mdx",
    "chapter-08-isaac-sim.mdx",
    "chapter-09-isaac-ros.mdx",
    "chapter-10-jetson-deployment.mdx",
    "chapter-11-vla-systems.mdx",
    "chapter-12-voice-to-action.mdx",
    "chapter-13-benefits.mdx",
    "chapter-14-risks-threats.mdx",
    "chapter-15-ethics-policy.mdx",
]


def clean_mdx(text: str) -> str:
    """Strip MDX/JSX-specific syntax, leaving clean markdown."""
    # Remove import/export statements
    text = re.sub(r'^(import|export)\s+.*$', '', text, flags=re.MULTILINE)
    # Remove JSX components like <Component ... />
    text = re.sub(r'<[A-Z][A-Za-z0-9]*[^>]*/>', '', text)
    # Remove JSX opening/closing tags
    text = re.sub(r'<[A-Z][A-Za-z0-9]*[^>]*>.*?</[A-Z][A-Za-z0-9]*>', '', text, flags=re.DOTALL)
    # Remove frontmatter
    text = re.sub(r'^---\n.*?\n---\n', '', text, flags=re.DOTALL)
    # Collapse multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def escape_xml(text: str) -> str:
    """Escape characters that break reportlab XML parsing."""
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    return text


def build_styles():
    styles = getSampleStyleSheet()

    custom = {
        'BookTitle': ParagraphStyle(
            'BookTitle',
            fontSize=28, leading=34, alignment=TA_CENTER,
            textColor=colors.HexColor('#1a1a2e'), spaceAfter=20,
            fontName='Helvetica-Bold',
        ),
        'BookSubtitle': ParagraphStyle(
            'BookSubtitle',
            fontSize=16, leading=20, alignment=TA_CENTER,
            textColor=colors.HexColor('#16213e'), spaceAfter=12,
            fontName='Helvetica',
        ),
        'BookAuthor': ParagraphStyle(
            'BookAuthor',
            fontSize=13, leading=16, alignment=TA_CENTER,
            textColor=colors.HexColor('#0f3460'), spaceAfter=8,
            fontName='Helvetica-Oblique',
        ),
        'ChapterTitle': ParagraphStyle(
            'ChapterTitle',
            fontSize=20, leading=26, alignment=TA_LEFT,
            textColor=colors.HexColor('#1a1a2e'), spaceBefore=20, spaceAfter=16,
            fontName='Helvetica-Bold',
        ),
        'Heading2': ParagraphStyle(
            'Heading2',
            fontSize=14, leading=18, alignment=TA_LEFT,
            textColor=colors.HexColor('#16213e'), spaceBefore=14, spaceAfter=8,
            fontName='Helvetica-Bold',
        ),
        'Heading3': ParagraphStyle(
            'Heading3',
            fontSize=12, leading=16, alignment=TA_LEFT,
            textColor=colors.HexColor('#0f3460'), spaceBefore=10, spaceAfter=6,
            fontName='Helvetica-Bold',
        ),
        'Heading4': ParagraphStyle(
            'Heading4',
            fontSize=11, leading=14, alignment=TA_LEFT,
            textColor=colors.HexColor('#533483'), spaceBefore=8, spaceAfter=4,
            fontName='Helvetica-BoldOblique',
        ),
        'BodyText': ParagraphStyle(
            'BodyText',
            fontSize=10.5, leading=15, alignment=TA_JUSTIFY,
            textColor=colors.HexColor('#1a1a1a'), spaceBefore=4, spaceAfter=6,
            fontName='Times-Roman',
        ),
        'BlockQuote': ParagraphStyle(
            'BlockQuote',
            fontSize=10, leading=14, alignment=TA_LEFT,
            textColor=colors.HexColor('#444444'), spaceBefore=6, spaceAfter=6,
            leftIndent=24, rightIndent=12,
            fontName='Times-Italic',
            borderPad=6,
        ),
        'CodeBlock': ParagraphStyle(
            'CodeBlock',
            fontSize=8.5, leading=12, alignment=TA_LEFT,
            textColor=colors.HexColor('#1a1a1a'),
            backColor=colors.HexColor('#f4f4f4'),
            spaceBefore=6, spaceAfter=6,
            leftIndent=12, fontName='Courier',
        ),
        'BulletItem': ParagraphStyle(
            'BulletItem',
            fontSize=10.5, leading=14, alignment=TA_LEFT,
            textColor=colors.HexColor('#1a1a1a'), spaceBefore=2, spaceAfter=2,
            leftIndent=18, firstLineIndent=-12,
            fontName='Times-Roman',
        ),
    }
    return {**{k: v for k, v in styles.byName.items()}, **custom}


def inline_format(text: str) -> str:
    """Convert inline markdown to reportlab XML."""
    # Bold+italic
    text = re.sub(r'\*\*\*(.*?)\*\*\*', r'<b><i>\1</i></b>', text)
    # Bold
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    # Italic
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    # Inline code
    text = re.sub(r'`([^`]+)`', r'<font name="Courier" size="9">\1</font>', text)
    # Links — show text only
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    # Images — remove
    text = re.sub(r'!\[([^\]]*)\]\([^\)]+\)', '', text)
    return text


def parse_chapter(filepath: Path, styles: dict) -> list:
    """Parse a single MDX chapter file into reportlab flowables."""
    raw = filepath.read_text(encoding='utf-8')
    text = clean_mdx(raw)
    lines = text.split('\n')
    flowables = []

    in_code_block = False
    code_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Code block start/end
        if line.strip().startswith('```'):
            if in_code_block:
                # End code block
                code_text = '\n'.join(code_lines)
                code_text = escape_xml(code_text)
                flowables.append(Preformatted(code_text, styles['CodeBlock']))
                flowables.append(Spacer(1, 4))
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        # Horizontal rule
        if re.match(r'^---+$', line.strip()):
            flowables.append(Spacer(1, 6))
            flowables.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#cccccc')))
            flowables.append(Spacer(1, 6))
            i += 1
            continue

        # Headings
        heading_match = re.match(r'^(#{1,4})\s+(.*)', line)
        if heading_match:
            level = len(heading_match.group(1))
            title_text = escape_xml(heading_match.group(2))
            title_text = inline_format(title_text)
            style_map = {1: 'ChapterTitle', 2: 'Heading2', 3: 'Heading3', 4: 'Heading4'}
            style_name = style_map.get(level, 'Heading3')
            flowables.append(Paragraph(title_text, styles[style_name]))
            i += 1
            continue

        # Blockquote
        if line.startswith('>'):
            quote_text = re.sub(r'^>\s*', '', line)
            quote_text = escape_xml(quote_text)
            quote_text = inline_format(quote_text)
            if quote_text.strip():
                flowables.append(Paragraph(quote_text, styles['BlockQuote']))
            i += 1
            continue

        # Bullet list
        bullet_match = re.match(r'^(\s*[-*+])\s+(.*)', line)
        if bullet_match:
            bullet_text = bullet_match.group(2)
            bullet_text = escape_xml(bullet_text)
            bullet_text = inline_format(bullet_text)
            indent = len(bullet_match.group(1)) - 1
            style = styles['BulletItem']
            flowables.append(Paragraph(f'• {bullet_text}', style))
            i += 1
            continue

        # Numbered list
        num_match = re.match(r'^\d+\.\s+(.*)', line)
        if num_match:
            item_text = num_match.group(1)
            item_text = escape_xml(item_text)
            item_text = inline_format(item_text)
            flowables.append(Paragraph(f'• {item_text}', styles['BulletItem']))
            i += 1
            continue

        # Blank line
        if not line.strip():
            flowables.append(Spacer(1, 4))
            i += 1
            continue

        # Normal paragraph
        para_text = escape_xml(line.strip())
        para_text = inline_format(para_text)
        if para_text:
            flowables.append(Paragraph(para_text, styles['BodyText']))
        i += 1

    return flowables


def add_page_number(canvas, doc):
    """Footer with page number."""
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#888888'))
    page_num = canvas.getPageNumber()
    canvas.drawCentredString(A4[0] / 2, 0.5 * inch, f"— {page_num} —")
    canvas.restoreState()


def main():
    print("=== Humanoid Robot Book — PDF Generator ===")
    print(f"Output: {OUTPUT_PDF}\n")

    styles = build_styles()
    story = []

    # --- Cover Page ---
    story.append(Spacer(1, 2 * inch))
    story.append(Paragraph("Pros and Cons of AI Humanoid Robots in Human Life", styles['BookTitle']))
    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph("From Digital Intelligence to Embodied Autonomy", styles['BookSubtitle']))
    story.append(Spacer(1, 0.5 * inch))
    story.append(HRFlowable(width='60%', thickness=1.5, color=colors.HexColor('#0f3460'), hAlign='CENTER'))
    story.append(Spacer(1, 0.5 * inch))
    story.append(Paragraph("Muhammad Faisal Laiq Siddiqui", styles['BookAuthor']))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("First Edition — 2026", styles['BookAuthor']))
    story.append(PageBreak())

    # --- Chapters ---
    for idx, chapter_file in enumerate(CHAPTERS, 1):
        filepath = CHAPTERS_DIR / chapter_file
        if not filepath.exists():
            print(f"  [SKIP] {chapter_file} — not found")
            continue

        print(f"  [{idx:02d}/15] Processing {chapter_file}...")
        chapter_flowables = parse_chapter(filepath, styles)
        story.extend(chapter_flowables)
        story.append(PageBreak())

    # --- Build PDF ---
    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=A4,
        leftMargin=1.2 * inch,
        rightMargin=1.0 * inch,
        topMargin=1.0 * inch,
        bottomMargin=0.9 * inch,
        title="Pros and Cons of AI Humanoid Robots in Human Life",
        author="Muhammad Faisal Laiq Siddiqui",
        subject="AI Humanoid Robotics",
    )

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)

    size_mb = OUTPUT_PDF.stat().st_size / (1024 * 1024)
    print(f"\n=== Done! ===")
    print(f"PDF saved: {OUTPUT_PDF}")
    print(f"Size: {size_mb:.2f} MB")


if __name__ == "__main__":
    main()
