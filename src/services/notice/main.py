from __future__ import annotations

from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="DevOpsMate Notice Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Notice(BaseModel):
    id: str
    message: str
    link_text: Optional[str] = None
    link_href: Optional[str] = None
    active: bool = True


# A small, editable list of notices. The first active one is shown to visitors.
NOTICES: List[Notice] = [
    Notice(
        id="batch-2026-11",
        message="Enrollment open: AWS + DevOps + AI, Website Building, Job Support, Interview Support, and Offline Interview Q&A pack.",
        link_text="Reserve a seat",
        link_href="https://wa.me/918088929670",
        active=True,
    ),
]


@app.get("/health")
def health():
    return {"status": "ok", "service": "notice"}


@app.get("/api/notice/active", response_model=Optional[Notice])
def active_notice():
    for n in NOTICES:
        if n.active:
            return n
    return None
