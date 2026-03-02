#!/bin/bash
# Pandoc PDF generation for "Pros and Cons of AI Humanoid Robots in Human Life"
# Prerequisites: pandoc + xelatex (TeX Live or MiKTeX)
#
# Install pandoc: https://pandoc.org/installing.html
# Install TeX:    sudo apt-get install texlive-xetex texlive-fonts-recommended
#
# Usage:
#   chmod +x generate-pdf-pandoc.sh
#   ./generate-pdf-pandoc.sh

set -e

BOOK_DIR="/mnt/d/code/claude-code-skills-lab-main/humanoid-robot-book"
CHAPTERS_DIR="${BOOK_DIR}/chapters"
OUTPUT_PDF="${BOOK_DIR}/book-humanoid-robots-ai.pdf"

echo "=== Humanoid Robot Book — Pandoc PDF Generator ==="
echo "Source: ${CHAPTERS_DIR}"
echo "Output: ${OUTPUT_PDF}"
echo ""

# Verify prerequisites
if ! command -v pandoc &> /dev/null; then
  echo "ERROR: pandoc not found. Install from https://pandoc.org/installing.html"
  exit 1
fi

if ! command -v xelatex &> /dev/null; then
  echo "ERROR: xelatex not found. Install TeX Live: sudo apt-get install texlive-xetex"
  exit 1
fi

echo "Running pandoc..."

pandoc \
  "${CHAPTERS_DIR}/chapter-01-physical-ai.md" \
  "${CHAPTERS_DIR}/chapter-02-embodied-intelligence.md" \
  "${CHAPTERS_DIR}/chapter-03-ros2-architecture.md" \
  "${CHAPTERS_DIR}/chapter-04-rclpy-control.md" \
  "${CHAPTERS_DIR}/chapter-05-sros2-security.md" \
  "${CHAPTERS_DIR}/chapter-06-gazebo.md" \
  "${CHAPTERS_DIR}/chapter-07-unity-hri.md" \
  "${CHAPTERS_DIR}/chapter-08-isaac-sim.md" \
  "${CHAPTERS_DIR}/chapter-09-multimodal-perception.md" \
  "${CHAPTERS_DIR}/chapter-10-jetson-deployment.md" \
  "${CHAPTERS_DIR}/chapter-11-vla-systems.md" \
  "${CHAPTERS_DIR}/chapter-12-voice-to-action.md" \
  "${CHAPTERS_DIR}/chapter-13-benefits.md" \
  "${CHAPTERS_DIR}/chapter-14-risks-threats.md" \
  "${CHAPTERS_DIR}/chapter-15-ethics-policy.md" \
  --from=markdown \
  --to=pdf \
  --pdf-engine=xelatex \
  --output="${OUTPUT_PDF}" \
  --toc \
  --toc-depth=2 \
  --number-sections \
  --metadata title="Pros and Cons of AI Humanoid Robots in Human Life" \
  --metadata author="Muhammad Faisal Laiq Siddiqui" \
  --metadata date="2025" \
  --metadata lang="en-US" \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  -V mainfont="DejaVu Serif" \
  -V monofont="DejaVu Sans Mono" \
  -V linestretch=1.25 \
  -V colorlinks=true \
  -V linkcolor=blue \
  -V urlcolor=blue \
  -V toccolor=black \
  --highlight-style=tango

echo ""
echo "=== PDF generation complete ==="
echo "Output saved to: ${OUTPUT_PDF}"
ls -lh "${OUTPUT_PDF}"
