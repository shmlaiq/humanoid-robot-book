#!/bin/bash
# PDF Generation for "Pros and Cons of AI Humanoid Robots in Human Life"
# Method: docusaurus-prince-pdf (requires Prince XML or prince CLI)
#
# Prerequisites:
#   npm install -g docusaurus-prince-pdf
#   Install Prince XML: https://www.princexml.com/download/
#
# Run this after `npm run build` succeeds in the website/ folder

set -e

BOOK_DIR="/mnt/d/code/claude-code-skills-lab-main/humanoid-robot-book"
OUTPUT_PDF="${BOOK_DIR}/book-humanoid-robots-ai.pdf"

echo "=== Humanoid Robot Book — PDF Generator ==="
echo "Output: ${OUTPUT_PDF}"
echo ""

# Check if website is built
if [ ! -d "${BOOK_DIR}/website/build" ]; then
  echo "Build directory not found. Running npm run build first..."
  cd "${BOOK_DIR}/website"
  npm run build
fi

echo "Starting Docusaurus static server..."
cd "${BOOK_DIR}/website"
npm run serve &
SERVER_PID=$!

echo "Waiting for server to start on port 3000..."
sleep 6

# Verify server is up
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "ERROR: Server did not start on port 3000."
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

echo "Server running (PID ${SERVER_PID}). Generating PDF..."

npx docusaurus-prince-pdf \
  --url http://localhost:3000/docs/cover \
  --output "${OUTPUT_PDF}" \
  --include-index \
  --prince-args="--page-size=letter --margin=1in --pdf-title='Pros and Cons of AI Humanoid Robots in Human Life' --pdf-author='Muhammad Faisal Laiq Siddiqui'"

kill $SERVER_PID 2>/dev/null

echo ""
echo "=== PDF generation complete ==="
echo "Output saved to: ${OUTPUT_PDF}"
