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
            "Project work carried through from design to delivery",
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
        duration="30 days",
        mode="1:1 + mocks",
        badge="Interview",
        category="Career",
        highlights=[
            "A question set for every topic, studied the same day it is shared",
            "Real-time and deep interview questions, past the usual set",
            "A timed mock every third day, with feedback",
        ],
        includes=["Question sets", "Practice labs", "Mock drills", "Feedback"],
        interview_plan=InterviewPlan(
            intro=[
                "Every topic takes three days. On day 1 the questions are shared and you learn them the same day. Day 2 is practice. Day 3 is a timed mock.",
                "Real-time project questions and deeper questions, past the usual interview set, are included for every topic.",
            ],
            rows=[
                PlanRow(days="1–3", topic="Linux and shell", learn="Questions shared. Study them the same day.", practice="Answer them out loud and do the lab.", mock="Mock 1"),
                PlanRow(days="4–6", topic="Git and GitHub", learn="Questions shared. Study them the same day.", practice="Practice the commands and explain a pull request.", mock="Mock 2"),
                PlanRow(days="7–9", topic="AWS: IAM, EC2, S3", learn="Questions shared. Study them the same day.", practice="Walk through each service on a scenario.", mock="Mock 3"),
                PlanRow(days="10–12", topic="VPC, subnets, security groups, load balancer", learn="Questions shared. Study them the same day.", practice="Draw the network and explain the traffic path.", mock="Mock 4"),
                PlanRow(days="13–15", topic="RDS, Lambda, CloudWatch", learn="Questions shared. Study them the same day.", practice="Explain a 2-tier failure and how you would find it.", mock="Mock 5"),
                PlanRow(days="16–18", topic="Terraform", learn="Questions shared. Study them the same day.", practice="Explain state, plan, and apply on a real change.", mock="Mock 6"),
                PlanRow(days="19–21", topic="Ansible and GitHub Actions", learn="Questions shared. Study them the same day.", practice="Walk a pipeline from commit to deploy.", mock="Mock 7"),
                PlanRow(days="22–24", topic="Docker and ECR", learn="Questions shared. Study them the same day.", practice="Explain image, container, and a failed pull.", mock="Mock 8"),
                PlanRow(days="25–27", topic="Kubernetes, EKS / ECS", learn="Questions shared. Study them the same day.", practice="Explain pod, service, and a deployment rollout.", mock="Mock 9"),
                PlanRow(days="28–30", topic="Real-time scenarios, troubleshooting, your project", learn="Deep questions shared. Study them the same day.", practice="Tell your project the way you would in an interview.", mock="Final mock"),
            ],
            note="Any topic, tool, or service that is missing from this plan is added based on your personal interest and the role you are preparing for.",
            rules=[
                "Study 2–3 hours. Finish that day's work the same day.",
                "In the evening, send what you learned, what you practiced, and your doubts. A day with no update is incomplete.",
                "A missed mock means that topic is repeated before the next one starts.",
            ],
        ),
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
