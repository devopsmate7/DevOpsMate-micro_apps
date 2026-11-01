from __future__ import annotations

from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="DevOpsMate Catalog Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Course(BaseModel):
    id: str
    slug: str
    title: str
    subtitle: str
    price_inr: int = 0
    compare_at_inr: Optional[int] = None
    level: str
    duration: str
    mode: str
    badge: Optional[str] = None
    highlights: List[str]
    includes: List[str]
    category: str


COURSES: List[Course] = [
    Course(
        id="c-aws-devops-ai",
        slug="aws-devops-ai",
        title="AWS + DevOps + AI",
        subtitle="A single program covering AWS cloud, DevOps delivery, and AI tooling for modern engineering roles.",
        price_inr=0,
        level="Career track",
        duration="Flexible",
        mode="Live + labs",
        badge="Core program",
        category="Training",
        highlights=[
            "AWS services for DevOps engineers",
            "CI/CD, containers, and IaC foundations",
            "AI tools for coding, automation, and reviews",
            "Project work carried through from design to delivery",
        ],
        includes=["Live sessions", "Labs", "Projects", "Mentorship"],
    ),
    Course(
        id="c-job-support",
        slug="job-support",
        title="Job Support",
        subtitle="Guided support for day-to-day DevOps work, including tickets, pipelines, cloud issues, and delivery.",
        price_inr=0,
        level="Career support",
        duration="Ongoing",
        mode="1:1 support",
        badge="Support",
        category="Career",
        highlights=[
            "Guidance on day-to-day tickets and tasks",
            "Troubleshooting for pipelines, cloud, and infrastructure",
            "Practice reviews before a change goes to production",
            "A support schedule that fits your workload",
        ],
        includes=["1:1 calls", "Chat support", "Review notes", "Priority help"],
    ),
    Course(
        id="c-interview-support",
        slug="interview-support",
        title="Interview Support",
        subtitle="Interview preparation for DevOps and cloud roles, including mock interviews, resume review, and scenario practice.",
        price_inr=0,
        level="Career support",
        duration="Ongoing",
        mode="1:1 + mocks",
        badge="Interview",
        category="Career",
        highlights=[
            "Structured mock interviews",
            "Resume and LinkedIn review",
            "Scenario and troubleshooting practice",
            "Guidance on offers and negotiation",
        ],
        includes=["Mocks", "Feedback notes", "Question bank", "Career calls"],
    ),
]


@app.get("/health")
def health():
    return {"status": "ok", "service": "catalog"}


@app.get("/api/catalog/courses", response_model=List[Course])
def list_courses(category: Optional[str] = None):
    if category:
        return [c for c in COURSES if c.category.lower() == category.lower()]
    return COURSES


@app.get("/api/catalog/courses/{slug}", response_model=Course)
def get_course(slug: str):
    for c in COURSES:
        if c.slug == slug or c.id == slug:
            return c
    raise HTTPException(status_code=404, detail="Course not found")
