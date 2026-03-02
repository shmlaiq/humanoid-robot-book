# PLAN
## Technical Implementation Plan
### AI Humanoid Robotics Book — Digital Infrastructure

> **Version:** 1.0 | **Date:** 2026-03-01
> **Author:** Muhammad Faisal Laiq Siddiqui · Pakistan
> **Stack:** Docusaurus · Qdrant Cloud · FastAPI · OpenAI Chatkit

---

## Overview

This plan defines the full technical infrastructure for the book's digital companion. Readers can browse the book online via Docusaurus, and interact with an AI-powered chatbot that uses Retrieval-Augmented Generation (RAG) to answer questions grounded in the book's exact content — not hallucinated knowledge.

```
┌─────────────────────────────────────────────────────────────┐
│                    READER EXPERIENCE                         │
│                                                             │
│  Docusaurus Site ←──────── reads ──────────→ Book Content  │
│       │                                                     │
│       └── "Ask the Book" Button                            │
│                    │                                        │
│                    ▼                                        │
│         OpenAI Chatkit UI (Agentic Interface)              │
│                    │                                        │
│                    ▼                                        │
│            FastAPI Backend                                  │
│           /api/v1/chat/query                               │
│                    │                                        │
│          ┌─────────┴──────────┐                            │
│          ▼                    ▼                            │
│    Qdrant Cloud          OpenAI GPT-4o                     │
│  (Vector Search)      (Answer Generation)                  │
│  Book embeddings       Grounded in retrieved               │
│  semantic retrieval    book passages                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Docusaurus Documentation Site

### Purpose
Host the book as a searchable, navigable documentation website. Each chapter becomes a Docusaurus page. The site serves as the primary reading and reference interface.

### Stack
- **Framework:** Docusaurus 3.x (React-based static site)
- **Hosting:** Vercel or GitHub Pages (free tier)
- **Search:** Docusaurus built-in Algolia DocSearch (free for open-source/educational)
- **MDX:** All book content written in MDX (Markdown + React components)

### Setup Steps

#### 1.1 Initialize Docusaurus Project
```bash
npx create-docusaurus@latest humanoid-robot-book-site classic --typescript
cd humanoid-robot-book-site
npm install
```

#### 1.2 Project Structure
```
humanoid-robot-book-site/
├── docs/
│   ├── intro.md                    # Book introduction
│   ├── constitution.md             # Constitutional principles
│   ├── part-1-humanoid-revolution/
│   │   ├── chapter-01-physical-ai.mdx
│   │   └── chapter-02-embodied-intelligence.mdx
│   ├── part-2-ros2/
│   │   ├── chapter-03-ros2-architecture.mdx
│   │   ├── chapter-04-rclpy-control.mdx
│   │   └── chapter-05-sros2-security.mdx
│   ├── part-3-simulation/
│   │   ├── chapter-06-gazebo.mdx
│   │   ├── chapter-07-unity-hri.mdx
│   │   └── chapter-08-isaac-sim.mdx
│   ├── part-4-isaac/
│   │   ├── chapter-09-isaac-ros.mdx
│   │   └── chapter-10-jetson-deployment.mdx
│   ├── part-5-vla/
│   │   ├── chapter-11-vla-systems.mdx
│   │   └── chapter-12-voice-to-action.mdx
│   ├── part-6-pros/
│   │   └── chapter-13-benefits.mdx
│   ├── part-7-cons/
│   │   └── chapter-14-risks-threats.mdx
│   ├── part-8-future/
│   │   └── chapter-15-ethics-policy.mdx
│   └── appendices/
│       ├── glossary.md
│       ├── bibliography.md
│       └── hardware-guide.md
├── static/
│   ├── img/                        # All book images
│   └── diagrams/                   # Architecture diagrams
├── src/
│   └── components/
│       └── ChatWidget/             # "Ask the Book" button + modal
├── docusaurus.config.ts
└── sidebars.ts
```

#### 1.3 docusaurus.config.ts (Key Settings)
```typescript
import type { Config } from '@docusaurus/types';

const config: Config = {
  title: 'Pros and Cons of AI Humanoid Robots',
  tagline: 'From Digital Intelligence to Embodied Autonomy',
  url: 'https://humanoid-robot-book.vercel.app',
  baseUrl: '/',
  organizationName: 'your-org',
  projectName: 'humanoid-robot-book',

  themeConfig: {
    navbar: {
      title: 'Humanoid Robotics Book',
      items: [
        { type: 'docSidebar', sidebarId: 'bookSidebar', label: 'Book' },
        { href: '/chat', label: 'Ask the Book 🤖' },
      ],
    },
    algolia: {
      appId: 'YOUR_ALGOLIA_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'humanoid-robot-book',
    },
    prism: {
      additionalLanguages: ['python', 'bash', 'yaml', 'docker'],
    },
  },

  plugins: [
    ['@docusaurus/plugin-google-analytics', { trackingID: 'G-XXXX' }],
  ],
};

export default config;
```

#### 1.4 Custom ChatWidget Component
```typescript
// src/components/ChatWidget/index.tsx
import React, { useState } from 'react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="chat-button"
        onClick={() => setIsOpen(true)}
        style={{ position: 'fixed', bottom: 24, right: 24 }}
      >
        Ask the Book 🤖
      </button>
      {isOpen && (
        <div className="chat-modal">
          {/* OpenAI Chatkit iframe or embedded component */}
          <iframe
            src="https://your-chatkit-url.com/embed"
            width="400"
            height="600"
          />
        </div>
      )}
    </>
  );
}
```

#### 1.5 Deployment
```bash
# Build static site
npm run build

# Deploy to Vercel
vercel --prod

# Or GitHub Pages
npm run deploy  # with GH_TOKEN set
```

---

## Phase 2: Qdrant Cloud — RAG Vector Store

### Purpose
Store embeddings of every book chapter/section so the FastAPI chatbot can retrieve the most relevant passages before calling GPT-4o. This ensures answers are **grounded in the book content** — not hallucinated.

### Stack
- **Vector DB:** Qdrant Cloud (managed, free tier: 1 cluster, 1GB)
- **Embedding model:** `text-embedding-3-large` (OpenAI) — 3072 dimensions
- **Chunking strategy:** 512-token chunks with 50-token overlap

### Setup Steps

#### 2.1 Qdrant Cloud Configuration
```bash
# Install Qdrant client
pip install qdrant-client openai python-dotenv
```

```python
# config/qdrant_setup.py
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

COLLECTION_NAME = "humanoid_robot_book"
VECTOR_DIM = 3072  # text-embedding-3-large

client = QdrantClient(
    url="https://your-cluster.qdrant.io",
    api_key="your-qdrant-api-key",
)

# Create collection
client.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=VectorParams(
        size=VECTOR_DIM,
        distance=Distance.COSINE,
    ),
)
```

#### 2.2 Book Content Ingestion Pipeline
```python
# scripts/ingest_book.py
import os
import glob
from pathlib import Path
from typing import List
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
import uuid

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
qdrant_client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

def chunk_text(text: str, chunk_size: int = 512, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks by word count."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks

def embed_text(text: str) -> List[float]:
    """Get OpenAI embedding for a text chunk."""
    response = openai_client.embeddings.create(
        model="text-embedding-3-large",
        input=text,
    )
    return response.data[0].embedding

def ingest_chapter(filepath: str, chapter_id: str):
    """Ingest a single chapter into Qdrant."""
    with open(filepath, "r") as f:
        content = f.read()

    chunks = chunk_text(content)
    points = []

    for i, chunk in enumerate(chunks):
        vector = embed_text(chunk)
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "chapter_id": chapter_id,
                "chunk_index": i,
                "text": chunk,
                "source_file": filepath,
            }
        ))

    qdrant_client.upsert(
        collection_name="humanoid_robot_book",
        points=points,
    )
    print(f"Ingested {len(points)} chunks from {chapter_id}")

def ingest_all_chapters():
    """Ingest all book MDX files."""
    docs_path = Path("humanoid-robot-book-site/docs")
    for mdx_file in docs_path.rglob("*.mdx"):
        chapter_id = mdx_file.stem
        ingest_chapter(str(mdx_file), chapter_id)

    # Also ingest SPECIFICATION.md and CONSTITUTION.md
    for md_file in ["CONSTITUTION.md", "SPECIFICATION.md"]:
        ingest_chapter(md_file, md_file.replace(".md", ""))

if __name__ == "__main__":
    ingest_all_chapters()
    print("Book ingestion complete!")
```

#### 2.3 Semantic Search Query
```python
# core/retrieval.py
def search_book(query: str, top_k: int = 5) -> List[dict]:
    """Retrieve relevant book passages for a query."""
    query_vector = embed_text(query)

    results = qdrant_client.search(
        collection_name="humanoid_robot_book",
        query_vector=query_vector,
        limit=top_k,
        with_payload=True,
    )

    return [
        {
            "text": hit.payload["text"],
            "chapter": hit.payload["chapter_id"],
            "score": hit.score,
        }
        for hit in results
    ]
```

---

## Phase 3: FastAPI Backend — Chatbot API

### Purpose
A REST API backend that:
1. Receives user questions from the OpenAI Chatkit frontend
2. Retrieves relevant book passages from Qdrant
3. Constructs a grounded prompt for GPT-4o
4. Returns a cited, accurate answer

### Stack
- **Framework:** FastAPI (Python 3.11+)
- **Package manager:** UV (fast, modern pip replacement)
- **LLM:** GPT-4o via OpenAI SDK
- **Vector store client:** `qdrant-client`
- **Deployment:** Docker + Railway / Fly.io / AWS App Runner

### Project Structure
```
fastapi-chatbot/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── api/
│   │   └── v1/
│   │       ├── chat.py      # /api/v1/chat/query endpoint
│   │       └── health.py    # /health endpoint
│   ├── core/
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   ├── retrieval.py     # Qdrant search logic
│   │   └── generation.py    # GPT-4o generation logic
│   └── models/
│       └── schemas.py       # Pydantic request/response models
├── pyproject.toml
├── Dockerfile
└── .env.example
```

### Implementation

#### 3.1 Dependencies (pyproject.toml)
```toml
[project]
name = "humanoid-book-chatbot"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "openai>=1.50.0",
    "qdrant-client>=1.12.0",
    "pydantic-settings>=2.6.0",
    "python-dotenv>=1.0.0",
]
```

#### 3.2 Pydantic Models
```python
# app/models/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)
    conversation_history: Optional[List[dict]] = []
    top_k: int = Field(default=5, ge=1, le=10)

class SourcePassage(BaseModel):
    chapter: str
    text: str
    relevance_score: float

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourcePassage]
    model_used: str = "gpt-4o"
```

#### 3.3 Core Generation Logic
```python
# app/core/generation.py
from openai import AsyncOpenAI
from .retrieval import search_book
from ..models.schemas import ChatRequest, ChatResponse, SourcePassage

client = AsyncOpenAI()

SYSTEM_PROMPT = """You are an AI assistant for the book
"Pros and Cons of AI Humanoid Robots in Human Life."

RULES:
1. Answer ONLY from the provided book passages
2. If the answer is not in the passages, say: "This topic is not covered in the retrieved sections. Please check the full book."
3. Always cite the chapter source using [Chapter Name] notation
4. Never hallucinate technical specifications or claims
5. Maintain technical accuracy for ROS 2, Gazebo, Isaac Sim, and VLA topics
"""

async def generate_answer(request: ChatRequest) -> ChatResponse:
    # Step 1: Retrieve relevant passages from Qdrant
    passages = search_book(request.question, top_k=request.top_k)

    # Step 2: Build grounded context
    context = "\n\n".join([
        f"[{p['chapter']}]:\n{p['text']}"
        for p in passages
    ])

    # Step 3: Build messages
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": f"BOOK CONTEXT:\n{context}"},
        *request.conversation_history,
        {"role": "user", "content": request.question},
    ]

    # Step 4: Call GPT-4o
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.1,  # Low temp for factual accuracy
        max_tokens=1500,
    )

    answer = response.choices[0].message.content

    sources = [
        SourcePassage(
            chapter=p["chapter"],
            text=p["text"][:200] + "...",
            relevance_score=p["score"],
        )
        for p in passages
    ]

    return ChatResponse(answer=answer, sources=sources)
```

#### 3.4 FastAPI Endpoints
```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import chat, health

app = FastAPI(
    title="Humanoid Robot Book Chatbot API",
    description="RAG-powered chatbot grounded in book content",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://humanoid-robot-book.vercel.app"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/v1/chat")
app.include_router(health.router)
```

```python
# app/api/v1/chat.py
from fastapi import APIRouter
from app.models.schemas import ChatRequest, ChatResponse
from app.core.generation import generate_answer

router = APIRouter()

@router.post("/query", response_model=ChatResponse)
async def query_book(request: ChatRequest) -> ChatResponse:
    """Query the book using RAG + GPT-4o."""
    return await generate_answer(request)
```

#### 3.5 Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml .
RUN uv sync --no-dev

COPY app/ app/

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Phase 4: OpenAI Chatkit — Agentic AI Interface

### Purpose
Provide a polished, agentic chat UI embedded in the Docusaurus site. Readers can ask natural language questions about the book and get answers with source citations.

### Stack
- **UI Framework:** OpenAI Chatkit (official React component library)
- **Integration:** Embedded in Docusaurus as a React component
- **Backend:** FastAPI `/api/v1/chat/query` endpoint
- **Agent Tools:**
  - `search_book_index` — semantic search via Qdrant
  - `get_chapter_summary` — retrieve structured chapter synopsis
  - `find_ros2_code_example` — extract code listings by topic

### Implementation

#### 4.1 Install OpenAI Chatkit
```bash
npm install @openai/chatkit
```

#### 4.2 Chatkit Component in Docusaurus
```typescript
// src/components/BookChatbot/index.tsx
import React from 'react';
import { ChatInterface, useChat } from '@openai/chatkit';

const TOOLS = [
  {
    name: "search_book_index",
    description: "Search the book for relevant passages about a topic",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        chapter_filter: {
          type: "string",
          description: "Optional: limit search to specific chapter"
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_chapter_summary",
    description: "Get a structured summary of a specific chapter",
    parameters: {
      type: "object",
      properties: {
        chapter_id: {
          type: "string",
          enum: [
            "chapter-01-physical-ai",
            "chapter-02-embodied-intelligence",
            "chapter-03-ros2-architecture",
            "chapter-04-rclpy-control",
            "chapter-05-sros2-security",
            "chapter-06-gazebo",
            "chapter-07-unity-hri",
            "chapter-08-isaac-sim",
            "chapter-09-isaac-ros",
            "chapter-10-jetson-deployment",
            "chapter-11-vla-systems",
            "chapter-12-voice-to-action",
            "chapter-13-benefits",
            "chapter-14-risks-threats",
            "chapter-15-ethics-policy",
          ],
        },
      },
      required: ["chapter_id"],
    },
  },
];

async function handleToolCall(toolName: string, args: any): Promise<string> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://your-api.railway.app';

  const response = await fetch(`${apiBase}/api/v1/tools/${toolName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });

  const data = await response.json();
  return JSON.stringify(data);
}

export default function BookChatbot() {
  return (
    <ChatInterface
      apiEndpoint="/api/v1/chat/query"
      systemPrompt={`You are the AI companion for the book
        "Pros and Cons of AI Humanoid Robots in Human Life."
        Always ground your answers in the book content.
        Use the provided tools to search for relevant passages.`}
      tools={TOOLS}
      onToolCall={handleToolCall}
      initialMessage="Hello! I'm your AI guide through the book. Ask me anything about humanoid robots, ROS 2, NVIDIA Isaac, VLA systems, or the pros and cons of AI robotics!"
      placeholder="Ask about ROS 2, Gazebo, NVIDIA Isaac, humanoid robots..."
      theme="dark"
      className="book-chatbot"
    />
  );
}
```

#### 4.3 Agent Tools — FastAPI Endpoints
```python
# app/api/v1/tools.py
from fastapi import APIRouter

router = APIRouter()

@router.post("/search_book_index")
async def search_book_index(query: str, chapter_filter: str = None):
    results = search_book(query, top_k=5)
    if chapter_filter:
        results = [r for r in results if chapter_filter in r["chapter"]]
    return {"passages": results}

@router.post("/get_chapter_summary")
async def get_chapter_summary(chapter_id: str):
    # Return pre-computed chapter summaries stored in Qdrant metadata
    results = qdrant_client.scroll(
        collection_name="chapter_summaries",
        scroll_filter=Filter(
            must=[FieldCondition(key="chapter_id", match=MatchValue(value=chapter_id))]
        ),
        limit=1,
    )
    return results[0][0].payload if results[0] else {"error": "Chapter not found"}
```

---

## Phase 5: Infrastructure & DevOps

### Environment Variables
```bash
# .env.example
OPENAI_API_KEY=sk-...
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
CORS_ORIGINS=https://humanoid-robot-book.vercel.app
```

### Deployment Architecture
```
GitHub Repository
       │
       ├── /humanoid-robot-book-site/  → Vercel (Docusaurus static)
       ├── /fastapi-chatbot/           → Railway (Docker container)
       └── /scripts/                   → GitHub Actions (CI/CD)
```

### GitHub Actions — CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy Book Infrastructure

on:
  push:
    branches: [main]

jobs:
  deploy-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd humanoid-robot-book-site && npm ci && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: humanoid-book-api

  re-ingest-qdrant:
    runs-on: ubuntu-latest
    needs: [deploy-docs]
    if: contains(github.event.head_commit.message, '[re-ingest]')
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
      - run: uv run python scripts/ingest_book.py
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          QDRANT_URL: ${{ secrets.QDRANT_URL }}
          QDRANT_API_KEY: ${{ secrets.QDRANT_API_KEY }}
```

---

## Phase 6: Cost Estimation

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Qdrant Cloud | Free (1 cluster, 1GB) | $0 |
| Vercel | Hobby (static site) | $0 |
| Railway | Starter ($5 credit/month) | ~$5 |
| OpenAI API (embeddings) | One-time ingestion ~$2 | $2 one-time |
| OpenAI API (GPT-4o queries) | ~100 queries/day × 1000 tokens | ~$15/month |
| GitHub Actions | Free tier | $0 |
| **Total** | | **~$20/month** |
