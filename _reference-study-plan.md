# Realistic Combined Study Plan (Java + AWS)

**Designed for someone with a job / course load.** Sustainable, not crammed.

## Ground rules (read first)
- **Budget assumption:** ~**8–10 hrs/week** (e.g., 1 hr on 4–5 weekdays + a 3–4 hr weekend block). If you can only do 5–6 hrs some weeks, that's fine — this plan has slack built in.
- **Priority order when life gets busy** (do the top one, drop from the bottom):
  1. **Java + Spring** (this is what the job actually tests)
  2. **AWS capstone project** (your portfolio + interview centerpiece)
  3. **SAA-C03 cert** ← *stretch goal, not required for the job.* Push it past week 16 if needed.
- **Pace change vs the aggressive plan:** Java stretched from 12 → **16 weeks**; AWS reduced from 5 projects to **3 essential ones** during the core period (the other two are optional/after). Two built-in **catch-up weeks** so a busy week doesn't derail you.
- **The "minimum viable week":** if you're slammed, just do the *Java checkpoint*. Skip AWS that week. Never skip two Java weeks in a row.

---

## The 16-week calendar

> Each week: **Java focus** (priority) + **AWS focus** (lighter / weekend) + the one thing that means "this week counted."

### Phase 1 — Core Java + AWS foundations (Weeks 1–5)

**Week 1 — Java syntax & OOP · AWS account setup**
- Java: JVM/JDK basics, classes, types, `==` vs `.equals()`, set up **Maven**. Port a couple of small Python scripts to Java.
- AWS (light, ~1.5 hr): **Project 0** — root MFA, IAM admin user/group, **Budgets $5 alert**, CloudTrail on.
- ✅ Done if: a small Java class compiles & runs via Maven, and your AWS account is hardened with a billing alert.

**Week 2 — Collections & generics**
- Java: `List`/`Set`/`Map`, Big-O, generics, the **equals()/hashCode() contract**. Build a word-frequency counter.
- AWS: rest / reading only. Skim S3 + EC2 concepts (no build).
- ✅ Done if: a custom class works correctly as a `HashMap` key.

**Week 3 — Streams, lambdas, exceptions**
- Java: Stream API (`map/filter/collect/groupingBy`), `Optional`, exceptions, file/CSV I/O. Rewrite Week 2 loops as streams.
- AWS: rest / reading.
- ✅ Done if: a stream pipeline ingests a CSV, groups/aggregates, handles bad rows.

**Week 4 — Deploy Spring Boot on EC2 (AWS Project 1)**
- AWS focus this week: **Project 1** — build a tiny Spring Boot app (`/health` + one endpoint), deploy to a **t3.micro EC2**, systemd service, SG locked to your IP, instance role, Elastic IP. *Tear it down after.*
- Java (light): just enough Spring Boot to produce the fat JAR.
- ✅ Done if: your Java app is reachable in a browser on EC2, then cleanly torn down.

**Week 5 — Concurrency + 🛠 Mini-Project A (CLI cheque tool)**
- Java: threads, `ExecutorService`, `CompletableFuture`, thread-safety basics.
- 🛠 **Mini-Project A — CLI cheque processing tool**: validate mock cheque records, parallel file processing, fraud-flag rules (financial services domain). Package as runnable JAR.
- AWS: rest.
- ✅ Done if: `java -jar cheque-tool.jar ./inbox` processes files concurrently and prints a flag report.

### 🟢 Week 6 — CATCH-UP / BUFFER
- No new material. Finish anything unfinished from Weeks 1–5, polish Mini-Project A, push it to GitHub with a README. If you're fully caught up, start a SAA-C03 practice-question set or rest.

### Phase 2 — Spring Boot & web (Weeks 7–11)

**Week 7 — Spring core & Boot fundamentals**
- Java: **IoC / Dependency Injection**, beans, stereotypes, `application.yml`, profiles, Actuator. Spin up a Boot app from start.spring.io.
- AWS: rest.
- ✅ Done if: a Boot app runs with constructor injection and `/actuator/health` is UP.

**Week 8 — REST APIs + start 🛠 Mini-Project B**
- Java: `@RestController`, request mapping, DTOs vs entities, validation (`@Valid`), `@ControllerAdvice` error handling, status codes, pagination.
- 🛠 **Mini-Project B — Document-metadata REST API** (begin): CRUD over "documents".
- AWS: rest.
- ✅ Done if: endpoints return correct codes; bad input → clean 400.

**Week 9 — JPA / Hibernate + finish Mini-Project B**
- Java: `@Entity`, relationships, `JpaRepository`, JPQL, `@Transactional`, **N+1 problem**, Flyway migrations.
- 🛠 Mini-Project B: back it with **PostgreSQL**, add a related entity (Document ↔ Tag).
- AWS: rest.
- ✅ Done if: Mini-Project B persists to Postgres with no N+1 on the list endpoint.

**Week 10 — Testing (JUnit 5 + Mockito)** *(high priority for backend roles)*
- Java: JUnit 5, Mockito (`@Mock`/`@InjectMocks`, `verify`), `@WebMvcTest`+MockMvc, `@DataJpaTest`, **Testcontainers**.
- Code: retro-fit tests onto Mini-Projects A & B.
- AWS: rest.
- ✅ Done if: a meaningful green test suite, and you can explain *why* you mock vs use a real DB.

**Week 11 — Resilient AWS architecture (AWS Project 2)**
- AWS focus: **Project 2** — ALB + Auto Scaling + **RDS** (private subnets) + S3 + **Secrets Manager**, custom VPC. Make the app stateless. *Tear down after.*
- Java (light): refactor the app to be stateless (S3 for files, Secrets Manager for creds).
- ✅ Done if: app runs behind an ALB across 2 AZs, DB private, secrets externalized — then torn down.

### 🟢 Week 12 — CATCH-UP / BUFFER
- Finish Project 2 or Mini-Project B tests. Polish GitHub. Optional: first **SAA-C03 practice exam** to see where you stand.

### Phase 3 — Capstone microservice + interview prep (Weeks 13–16)

**Week 13–14 — 🛠 Mini-Project C / AWS Capstone (the centerpiece)**
- Combine Java + AWS: a **containerized Spring Boot microservice** → **ECR** → **ECS Fargate**, **RDS PostgreSQL**, **SQS** for async, **API Gateway** front, secrets via Secrets Manager, Actuator health, **task role per service**. This is **AWS Project 4** and **Java Mini-Project C** as one deliverable.
- Keep it to **2 services** if time is tight (document-svc + processor-svc via SQS) — that already tells the complete story.
- ✅ Done if: a Java microservice is live on Fargate, processing an SQS message end-to-end into RDS.

**Week 15 — Harden & make review-ready**
- Refactor all three projects: clean layering, DTO mapping, logging, READMEs with architecture notes. Read real Spring code, adopt idioms (constructor injection, immutability, `final`).
- Theory top-ups: Java memory model basics, `final/finally/finalize`, immutability & thread-safety, generics erasure.

**Week 16 — Interview drilling + system design**
- Daily: Java/Spring Q&A + 1–2 LeetCode problems **in Java** (get fluent under time pressure).
- Whiteboard Mini-Project C (microservice + SQS + RDS + API Gateway) and your **OCR/39% story** out loud.
- Mock-explain: DI, `@Transactional`, equals/hashCode, concurrency, testing strategy.

---

## After Week 16 (optional, your pace)
- **SAA-C03 cert:** 2–3 weeks of practice exams (Tutorials Dojo / official) + read the gap topics (S3 storage classes & lifecycle, KMS, Route 53 routing policies, CloudFront, Kinesis). Sit the exam when practice scores are ~80%+.
- **AWS Project 3 (serverless OCR: Lambda + Textract + SQS/DLQ):** great *second* portfolio piece that maps tightly to your internship — build it if you want a second AWS story. Not required before applying.

---

## How this is less aggressive than the first plan
- **Java spread over 16 weeks** instead of 12 — same content, more breathing room.
- **Two dedicated catch-up weeks** (6 & 12) absorb busy work/course weeks.
- **AWS trimmed to 3 must-do projects** in the core period (1, 2, capstone); Projects 3 and full 5-service capstone become optional.
- **Cert demoted to a post-plan stretch goal** so it never competes with job-critical Java skills.
- Clear **"minimum viable week"** and **priority-drop order** so a bad week costs you a little, not the whole plan.

## If your real budget is different
- **Only ~5 hrs/week?** Stretch each phase: do Java only, push all AWS to after Week 16, treat this as a 20-week plan. Keep the priority order.
- **Have 15+ hrs/week some weeks?** Pull AWS Project 3 in during a catch-up week, or start cert practice early.

> Tell me your actual weekly hours and which weeks are blocked by coursework/deadlines, and I'll re-flow the calendar around them.
