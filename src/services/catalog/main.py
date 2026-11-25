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
    price_display: Optional[str] = None
    pricing_note: Optional[str] = None
    support_plans: List[str] = []
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
        price_inr=20000,
        price_display="₹20,000",
        pricing_note="Full program fee · Live + labs",
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
        price_inr=20000,
        price_display="₹20,000 – ₹30,000",
        pricing_note="Choose a plan based on how you want support",
        support_plans=["Weekly support", "Monthly support", "Task-based support"],
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
        id="c-interview-support",
        slug="interview-support",
        title="Interview Support",
        subtitle=(
            "45-day hard drill across 15 modules — learn, practice, mock, review. "
            "2045 Q/A · 33 unique company asked questions."
        ),
        price_inr=9999,
        price_display="₹9,999",
        pricing_note="UPI · confirm after WhatsApp proof",
        level="Career support",
        duration="45 days",
        mode="1:1 + hard drills",
        badge="Interview",
        category="Career",
        highlights=[
            "2045 Q/A · 33 unique company asked questions",
            "15 modules · 3 days each · 2–3 hours daily",
            "Two mock interviews weekly · evening progress updates required",
            "Project storytelling + behavioral rounds at the end",
            "Repeat a module until the mock shows confidence",
        ],
        includes=["Question sets", "Hard drill mocks", "Project storytelling", "Behavioral coaching"],
        interview_plan=InterviewPlan(
            title="45-Day Interview Support · Hard Drill Plan",
            intro=[
                "2045 Q/A · 33 unique company asked questions.",
                "Build interview confidence through a strict learn → practice → mock → review cycle across 15 modules.",
                "2–3 hours daily (same day), minimum 2 mocks per week, and an evening update on what you learned / practiced / open doubts.",
            ],
            rows=[
                PlanRow(days="1–3", topic="AWS Cloud & DevSecOps", learn="Core services & when to use them", practice="Architecture + scenario", mock="Timed AWS/security mock"),
                PlanRow(days="4–6", topic="Linux Administration", learn="Commands, services, permissions", practice="Diagnose disk/process/network", mock="Timed Linux mock"),
                PlanRow(days="7–9", topic="Bash Scripting", learn="Syntax, loops, exit codes", practice="Safe ops script", mock="Explain/debug script"),
                PlanRow(days="10–12", topic="Git & GitHub", learn="Branches, PRs, tags", practice="Conflict + workflow", mock="Collaboration mock"),
                PlanRow(days="13–15", topic="Docker", learn="Images, networking, volumes", practice="Runtime debug", mock="Container mock"),
                PlanRow(days="16–18", topic="Kubernetes", learn="Workloads, probes, scaling", practice="Cluster troubleshooting", mock="K8s mock"),
                PlanRow(days="19–21", topic="Jenkins CI/CD", learn="Pipeline as code", practice="Failed builds", mock="CI/CD mock"),
                PlanRow(days="22–24", topic="GitHub Actions", learn="Triggers, secrets, gates", practice="Reusable workflows", mock="Actions mock"),
                PlanRow(days="25–27", topic="Terraform & IaC", learn="State, modules, drift", practice="Safe plan/apply", mock="IaC mock"),
                PlanRow(days="28–30", topic="Ansible Automation", learn="Playbooks, roles, Vault", practice="Idempotent automation", mock="Ansible mock"),
                PlanRow(days="31–33", topic="Helm Charts", learn="Values, templating, releases", practice="Rollback story", mock="Helm mock"),
                PlanRow(days="34–36", topic="Argo CD & GitOps", learn="Desired state, sync, drift", practice="GitOps delivery story", mock="GitOps mock"),
                PlanRow(days="37–39", topic="Prometheus & Grafana", learn="PromQL, dashboards, alerts", practice="Incident story", mock="Observability mock"),
                PlanRow(days="40–42", topic="Real-Time Project Explanation", learn="Design choices & outcomes", practice="What broke / recovered", mock="Project storytelling"),
                PlanRow(days="43–45", topic="Behavioral Rounds", learn="Ownership, conflict, failure", practice="STAR with real examples", mock="Behavioral mock"),
            ],
            note="Any missing topic for your target role is added. You do not leave a module until the mock shows confidence.",
            rules=[
                "Study 2–3 focused hours daily. Finish that day's learn / practice / mock work the same day.",
                "Evening update required: what you learned, practiced, mock result/confidence, and open doubts.",
                "Weak or missed mock → repeat that module before the next one starts.",
            ],
        ),
    ),
    Course(
        id="c-interview-qa-offline",
        slug="interview-qa-offline",
        title="Real DevOps & Cloud Interview Questions",
        subtitle=(
            "Offline ZIP of real interview vaults across Linux, Docker, K8s, Terraform, CI/CD, AWS, and more. "
            "2045 Q/A · 33 unique company asked questions."
        ),
        price_inr=1999,
        price_display="₹1,999",
        pricing_note="UPI · ZIP after approval",
        level="Career prep",
        duration="Offline",
        mode="UPI + download",
        badge="Offline pack",
        category="Career",
        highlights=[
            "2045 Q/A · 33 unique company asked questions",
            "15 topic vaults in one ZIP (after admin approval)",
            "Diagram-backed answers across tools, cloud, and projects",
            "Pay via UPI, share screenshot on WhatsApp",
        ],
        includes=[
            "Offline Q&A dump (ZIP after admin approval)",
            "15 HTML interview vaults",
            "Diagram-backed answers",
            "Pay via UPI, share screenshot on WhatsApp",
        ],
        syllabus=[
            SyllabusSection(
                number="01",
                title="Interview vaults (ZIP contents)",
                topics=[
                    SyllabusTopic(number="01", title="Linux"),
                    SyllabusTopic(number="02", title="Bash Scripting"),
                    SyllabusTopic(number="03", title="Git & GitHub"),
                    SyllabusTopic(number="04", title="Docker"),
                    SyllabusTopic(number="05", title="Kubernetes"),
                    SyllabusTopic(number="06", title="Helm Charts"),
                    SyllabusTopic(number="07", title="Terraform"),
                    SyllabusTopic(number="08", title="Ansible"),
                    SyllabusTopic(number="09", title="Jenkins & CI/CD"),
                    SyllabusTopic(number="10", title="GitHub Actions"),
                    SyllabusTopic(number="11", title="Argo CD & GitOps"),
                    SyllabusTopic(number="12", title="Prometheus & Grafana"),
                    SyllabusTopic(number="13", title="AWS Cloud & DevOps"),
                    SyllabusTopic(number="14", title="Behavioral"),
                    SyllabusTopic(number="15", title="Real-Time DevOps Project"),
                ],
            ),
        ],
    ),
    Course(
        id="c-1on1-connect",
        slug="1on1-connect",
        title="1:1 Connect",
        subtitle="Book a live 1:1 call — pick 15 or 40 minutes, normal or priority, choose date and time, and get a Zoom link by email.",
        price_inr=99,
        price_display="From ₹99",
        pricing_note="15 min ₹99 / ₹199 priority · 40 min ₹199 / ₹299 priority",
        support_plans=["15 min · ₹99", "15 min priority · ₹199", "40 min · ₹199", "40 min priority · ₹299"],
        level="1:1 call",
        duration="15 or 40 min",
        mode="Zoom booking",
        badge="1:1",
        category="Career",
        highlights=[
            "Choose date and time that works for you",
            "Normal or priority slots",
            "Zoom link emailed as soon as you book",
            "Shown in the admin bookings list for follow-up",
        ],
        includes=["Zoom meeting link", "Calendar slot", "Email confirmation"],
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
