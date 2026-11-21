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


class SyllabusTopic(BaseModel):
    number: str
    title: str
    projects: List[str] = []


class SyllabusSection(BaseModel):
    number: str
    title: str
    topics: List[SyllabusTopic]


class PlanRow(BaseModel):
    days: str
    topic: str
    learn: str
    practice: str
    mock: str


class InterviewPlan(BaseModel):
    title: str = "Interview plan"
    intro: List[str]
    rows: List[PlanRow]
    note: str
    rules: List[str]


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
    syllabus: List[SyllabusSection] = []
    interview_plan: Optional[InterviewPlan] = None


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
        ],
        includes=["Live sessions", "Labs", "Projects", "Mentorship"],
        syllabus=[
            SyllabusSection(
                number="01",
                title="AWS",
                topics=[
                    SyllabusTopic(number="01", title="AWS DevOps Overview"),
                    SyllabusTopic(number="02", title="What is Cloud (types: AWS, Azure, GCP)"),
                    SyllabusTopic(number="03", title="AWS Account creation"),
                    SyllabusTopic(
                        number="04",
                        title="VPC",
                        projects=["VPC project — complete networking"],
                    ),
                    SyllabusTopic(
                        number="05",
                        title="EC2",
                        projects=["Application deployment on EC2"],
                    ),
                    SyllabusTopic(number="06", title="Linux"),
                    SyllabusTopic(
                        number="07",
                        title="Load Balancer (ALB / NLB)",
                        projects=["Using ELB"],
                    ),
                    SyllabusTopic(
                        number="08",
                        title="RDS",
                        projects=["2-Tier infra — EC2 (public) + RDS (private) · VPC"],
                    ),
                    SyllabusTopic(number="09", title="IAM"),
                    SyllabusTopic(
                        number="10",
                        title="S3",
                        projects=["Static website hosting on S3"],
                    ),
                    SyllabusTopic(number="11", title="Lambda"),
                ],
            ),
            SyllabusSection(
                number="02",
                title="DevOps",
                topics=[
                    SyllabusTopic(
                        number="01",
                        title="Jira / ADO — Learning and tasks are tracked live in Jira or Azure DevOps. A ticket is assigned to you, so the class feels like real project work.",
                    ),
                    SyllabusTopic(number="02", title="Git"),
                    SyllabusTopic(number="03", title="GitHub"),
                    SyllabusTopic(
                        number="04",
                        title="Ansible",
                        projects=["Ansible project one", "Ansible project two"],
                    ),
                    SyllabusTopic(
                        number="05",
                        title="Terraform",
                        projects=[
                            "VPC project (complete networking) — using Terraform",
                            "2-Tier infra (EC2 + VPC + ALB) — using Terraform",
                        ],
                    ),
                    SyllabusTopic(
                        number="06",
                        title="CI/CD (GitHub Actions)",
                        projects=["Complete CI/CD pipeline — Dev → QA → Prod setup"],
                    ),
                    SyllabusTopic(number="07", title="Docker"),
                    SyllabusTopic(number="08", title="ECR"),
                    SyllabusTopic(
                        number="09",
                        title="Kubernetes — EKS / ECS",
                        projects=[
                            "Application deployment end-to-end on EC2",
                            "Application deployment end-to-end on Docker",
                            "Application deployment end-to-end on Kubernetes — EKS / ECS",
                        ],
                    ),
                ],
            ),
            SyllabusSection(
                number="03",
                title="Career help",
                topics=[
                    SyllabusTopic(number="01", title="Resume building"),
                    SyllabusTopic(number="02", title="Mock interviews"),
                    SyllabusTopic(number="03", title="Naukri profile handling"),
                    SyllabusTopic(number="04", title="LinkedIn optimization"),
                    SyllabusTopic(number="05", title="1:1 doubt clearance"),
                    SyllabusTopic(
                        number="06",
                        title="Beyond Interview Question and Answers will be shared. You can expect 80–90% in the interviews",
                    ),
                    SyllabusTopic(
                        number="07",
                        title="Class Recording will be shared (Lifetime Access)",
                    ),
                ],
            ),
        ],
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
        ],
        includes=["1:1 calls", "Chat support", "Review notes", "Priority help"],
    ),
    Course(
        id="c-website-building",
        slug="website-building",
        title="Website Building + Maintenance",
        subtitle="Build and maintain real web applications — 2-tier, 3-tier, shop apps, school portals, and other business sites — with hosting, updates, and ongoing care.",
        price_inr=0,
        level="Delivery track",
        duration="Flexible",
        mode="Build + maintain",
        badge="Web apps",
        category="Training",
        highlights=[
            "2-tier and 3-tier web application architecture",
            "Shop, school, and business-style application builds",
            "Hosting, updates, fixes, and ongoing maintenance",
            "From idea to live site with clear handoff",
        ],
        includes=["Requirement walkthrough", "Build sprints", "Hosting setup", "Maintenance support"],
        syllabus=[
            SyllabusSection(
                number="01",
                title="Foundations",
                topics=[
                    SyllabusTopic(number="01", title="What is a web application (pages, API, database)"),
                    SyllabusTopic(number="02", title="2-tier vs 3-tier — when to use each"),
                    SyllabusTopic(number="03", title="UI, backend, and data flow in plain language"),
                ],
            ),
            SyllabusSection(
                number="02",
                title="Build projects",
                topics=[
                    SyllabusTopic(
                        number="01",
                        title="2-tier application",
                        projects=["Simple site + database (forms, listings, admin basics)"],
                    ),
                    SyllabusTopic(
                        number="02",
                        title="3-tier application",
                        projects=["Frontend + API + database with clear layers"],
                    ),
                    SyllabusTopic(
                        number="03",
                        title="Shop / school / business apps",
                        projects=[
                            "Shop-style app (catalog, cart, orders)",
                            "School / institute style portal",
                            "Any custom business application you need",
                        ],
                    ),
                ],
            ),
            SyllabusSection(
                number="03",
                title="Go-live and maintenance",
                topics=[
                    SyllabusTopic(number="01", title="Hosting and domain basics"),
                    SyllabusTopic(number="02", title="Updates, bug fixes, and content changes"),
                    SyllabusTopic(number="03", title="Ongoing maintenance and small feature work"),
                ],
            ),
        ],
    ),
    Course(
        id="c-interview-support",
        slug="interview-support",
        title="Interview Support",
        subtitle="45-day hard drill for DevOps and cloud interviews — 15 modules, project storytelling, behavioral rounds, and mocks until you can articulate with confidence.",
        price_inr=0,
        level="Career support",
        duration="45 days",
        mode="1:1 + hard drills",
        badge="Interview",
        category="Career",
        highlights=[
            "15 modules across 45 days with effective mock drives on every topic",
            "Project explanation for modules 11–15 — how you built it, why, and what broke",
            "Behavioral interview practice until answers feel natural and clear",
            "Repeat mocks on a topic until you are confident, then move forward",
        ],
        includes=["Question sets", "Hard drill mocks", "Project storytelling", "Behavioral coaching"],
        interview_plan=InterviewPlan(
            title="45-days interview plan",
            intro=[
                "A 45-day hard drill across 15 modules — technical topics, project explanation (modules 11–15), and behavioral rounds.",
                "Each topic gets learn, practice, and mock drives until you can articulate clearly and make changes with confidence.",
            ],
            rows=[],
            note="Any missing topic, tool, or service is added based on your target role. You do not leave a module until the mock drive shows confidence.",
            rules=[
                "Study 2–3 hours daily. Finish that day's learn / practice / mock work the same day.",
                "Evening update required: what you learned, what you practiced, and open doubts. No update means the day is incomplete.",
                "If a mock is weak or missed, that module is repeated before the next one starts — hard drill until you can articulate and adapt.",
            ],
        ),
    ),
    Course(
        id="c-interview-qa-offline",
        slug="interview-qa-offline",
        title="Real DevOps & Cloud Interview Questions",
        subtitle=(
            "Offline download of real interview Q&A across DevOps tools, cloud (AWS / Azure / GCP), "
            "and behavioral & projects. These questions were asked in 151 real interviews at 85 companies. "
            "Most answers have a diagram."
        ),
        price_inr=99,
        level="Career prep",
        duration="Offline",
        mode="UPI + download",
        badge="Offline pack",
        category="Career",
        highlights=[
            "Asked in 151 real interviews at 85 companies",
            "Most answers include a diagram",
            "Everyday DevOps tools: Linux, Git, Docker, K8s, Terraform, CI/CD, Ansible, and more",
            "Cloud: AWS, Azure, GCP",
            "Managerial: behavioral & project storytelling",
        ],
        includes=[
            "Offline Q&A dump (ZIP after admin approval)",
            "Diagram-backed answers",
            "Tools + Cloud + Behavioral coverage",
            "Pay via UPI, share screenshot on WhatsApp",
        ],
        syllabus=[
            SyllabusSection(
                number="01",
                title="DevOps tools (everyday stack)",
                topics=[
                    SyllabusTopic(number="01", title="Linux"),
                    SyllabusTopic(number="02", title="Scripting"),
                    SyllabusTopic(number="03", title="Networking"),
                    SyllabusTopic(number="04", title="Git & GitHub"),
                    SyllabusTopic(number="05", title="Docker"),
                    SyllabusTopic(number="06", title="Kubernetes"),
                    SyllabusTopic(number="07", title="Terraform & IaC"),
                    SyllabusTopic(number="08", title="CI/CD"),
                    SyllabusTopic(number="09", title="Observability & SRE"),
                    SyllabusTopic(number="10", title="Security"),
                    SyllabusTopic(number="11", title="Ansible"),
                    SyllabusTopic(number="12", title="Databases"),
                ],
            ),
            SyllabusSection(
                number="02",
                title="Cloud",
                topics=[
                    SyllabusTopic(number="01", title="AWS"),
                    SyllabusTopic(number="02", title="Azure"),
                    SyllabusTopic(number="03", title="GCP"),
                ],
            ),
            SyllabusSection(
                number="03",
                title="Managerial",
                topics=[
                    SyllabusTopic(number="01", title="Behavioral & projects"),
                ],
            ),
        ],
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
