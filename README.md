# Java Backend Prep — Project-Driven Plan

**Goal:** Full-time Java backend role (Spring Boot stack).
**Method:** Learn by building. Every concept is introduced *because a project needs it* — no theory for its own sake.
**Priority order:** **Java (build the projects)** → AWS (one capstone + keep the OCR/39% story sharp) → SAA-C03 cert (stretch goal, after the projects).

## How to use this folder
1. Read **[`00-study-plan.md`](00-study-plan.md)** — the week-by-week project-driven calendar.
2. Keep **[`java/LEARNING-RESOURCES.md`](java/LEARNING-RESOURCES.md)** open — curated free resources mapped to each milestone. **Project-driven ≠ no learning**: the loop is *learn the concept → immediately build with it*. This file tells you what to watch/read before each build.
3. Work the **Java project ladder** in order. Each project folder has its own `README.md` with the spec, milestones, the concepts each milestone teaches, and the interview questions it sets you up to answer.
4. Touch **AWS** only on the lighter weeks the plan calls out.

## The project ladder (this is the plan)
| # | Project | You'll build | Teaches | Weeks |
|---|---------|--------------|---------|-------|
| 0 | **Setup & Warmup** ([folder](java/project-0-setup-warmup)) | Tiny `BankAccount` CLI | Toolchain, syntax, OOP, Maven, running Java | 1 |
| 1 | **Cheque Processing CLI** ([folder](java/project-1-cheque-cli)) | Fraud-flagging batch tool | Collections, streams, exceptions, files, concurrency | 2–5 |
| 2 | **Document Metadata API** ([folder](java/project-2-document-api)) | Spring Boot REST + Postgres | Spring, DI, REST, JPA/Hibernate, JUnit/Mockito | 6–10 |
| 3 | **Document Microservice on AWS** ([folder](java/project-3-document-microservice)) | Containerized service + SQS + RDS | Docker, ECS/Fargate, SQS async, microservices on AWS | 11–16 |

Each Java project builds on the cheque/fraud domain. By Project 3, your Java work *is* your AWS capstone.

## Folders
- `java/` — the project ladder (do these in order). `_reference-roadmap.md` is the detailed concept reference.
- `aws/course.md` — full AWS course w/ SAA-C03 mapping (for the capstone + cert later).
- `interview-prep/` — question banks & talking points (fills up as you go).
- `_reference-study-plan.md` — the earlier non-aggressive calendar (background reference).

## Start now
Open **[`java/project-0-setup-warmup/README.md`](java/project-0-setup-warmup/README.md)** and do Milestone 0 (install the toolchain). You'll be running Java within the hour.
