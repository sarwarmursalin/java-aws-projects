# Java Learning Resources — curated & sequenced

**Your starting point:** basic syntax + OOP. So you don't need a "hello world" course — you need to fill the gap from *"I can read Java"* to *"I can build with collections, streams, concurrency, and Spring."* This guide maps **free** resources to exactly the concepts each project milestone needs.

## How to actually use this (the learn→build loop)
For every milestone in a project README:
1. **Learn (≈30–40% of the time):** watch/read the resource listed for that concept below. Once. Take notes by typing the examples, not copy-paste.
2. **Build (≈60–70%):** do the project milestone using what you just learned. Struggling here *is* the learning — don't go back to more videos, push through with docs + the reference.
3. **Reps (small):** if a concept didn't click, do 2–3 short exercises on a practice site (below) before moving on.

> Rule of thumb: if you've watched more than ~1 hour of video without writing code, stop and go build. Tutorials are a trap when overused.

---

## 1. Pick ONE "fill the gaps" foundation course
You already know basics, so use a course that's **exercise-heavy** to push past them. Pick one and do it *alongside* Projects 0–1 (not before — in parallel):

- **⭐ MOOC.fi — "Java Programming" (University of Helsinki)** — *free, the best choice for you.* Hundreds of auto-graded exercises, builds real fluency in collections/OOP/streams. Skip Part 1 sections you already know; start where it gets unfamiliar. https://java-programming.mooc.fi
- **freeCodeCamp — "Java Full Course" (YouTube)** — one long video to skim the parts you're shaky on. Good as a reference, not a sit-through.
- **Hyperskill — Java topics (free tier)** — individual topics + problems are accessible for free without a subscription; use it topic-by-topic as a supplement. The full track cert requires paid — skip it, you don't need it.

Don't do all three. MOOC.fi for exercises + this guide's per-topic videos is plenty.

---

## 2. Per-concept resources (mapped to the project milestones)

### Core Java — needed for Projects 0 & 1
| Concept (when you'll need it) | Watch / read | Practice |
|---|---|---|
| `==` vs `.equals()`, **equals/hashCode** (P0 M2, P1 W2) | **Coding with John** — "equals() and hashCode()" | CodingBat Java |
| Collections: List/Set/Map, generics (P1 W2) | **Coding with John** — "Java Collections"; Oracle Collections Trail | Exercism Java track |
| Records & immutability (P1 W2) | Baeldung — "Java Record Keyword" | — |
| **Streams & lambdas** (P1 W3) | **Coding with John** — "Java Streams"; Oracle "Aggregate Operations" | CodingBat + Exercism |
| `Optional` (P1 W3) | Coding with John — "Optional" | — |
| Exceptions: checked vs unchecked, try-with-resources (P1 W3–W4) | Coding with John — "Exceptions"; Baeldung exceptions series | — |
| File I/O (`java.nio.Files`), Jackson for JSON (P1 W4) | Baeldung — "Reading a File", "Jackson Intro" | — |
| **Concurrency:** threads, `ExecutorService`, `CompletableFuture` (P1 W5) | **Java Brains** concurrency playlist; Baeldung — "ExecutorService", "CompletableFuture" | — |

### Spring & web — needed for Project 2
| Concept | Watch / read |
|---|---|
| Spring Boot + **DI/IoC** | **Amigoscode** — Spring Boot; Java Brains — "Spring Boot Quick Start" |
| REST controllers, DTOs, validation, error handling | **Dan Vega** Spring REST; Spring.io guide "Building a RESTful Web Service" |
| JPA / Hibernate / PostgreSQL | **Amigoscode** — "Spring Data JPA"; Spring.io guide "Accessing Data with JPA"; Baeldung JPA series |
| Testing: JUnit 5, Mockito, Testcontainers | Amigoscode testing; Baeldung "JUnit 5" + "Mockito"; Testcontainers Java docs |

### Microservices & AWS — needed for Project 3
| Concept | Watch / read |
|---|---|
| Dockerizing Spring Boot | Spring.io "Spring Boot with Docker" guide |
| Spring on AWS, SQS, ECS | **Java Techie** "Spring Boot AWS" playlist; Spring Cloud AWS docs |
| (AWS architecture/IAM) | see `../aws/course.md` |

---

## 3. Practice platforms (for reps, free)
- **MOOC.fi exercises** — your main driver of fluency.
- **Exercism — Java track** — small problems with free mentor feedback. Great for idiomatic Java.
- **CodingBat — Java** — tiny warm-up drills (logic, strings, arrays).
- **HackerRank — Java track** — for interview-style problems later.
- **LeetCode (in Java)** — start in Week 12+; the point is writing Java fluently under time pressure.

## 4. Written reference (keep open while building)
- **Baeldung** (baeldung.com) — the deepest free written Java/Spring reference. Google "baeldung <topic>".
- **Oracle Dev.java / Java Tutorials** — official, authoritative.
- **Spring.io Guides** (spring.io/guides) — short official hands-on guides; the best Spring starting point.

## 5. YouTube channels worth subscribing to
- **Coding with John** — single-concept Core Java, exceptionally clear (your go-to for fundamentals).
- **Amigoscode** — Java + Spring Boot full tutorials.
- **Java Brains** — Spring & concurrency concepts.
- **Dan Vega** / **Marco Codes** — modern Spring.
- **Java Techie** — Spring microservices + AWS.
- **Telusko** — broad Java coverage.

---

## Your first two weeks, concretely
**Week 1 (Project 0):**
- Watch: Coding with John "equals() and hashCode()".
- Start MOOC.fi from wherever it stops feeling familiar; do ~1–2 hrs of exercises.
- Build: BankAccount CLI (Project 0 README).
- AWS (1 hr): account hardening — root MFA, IAM admin user, Budgets $5 alert.

**Week 2 (Project 1, collections milestone):**
- Watch: Coding with John "Java Collections".
- MOOC.fi: the collections/data-structures sections.
- Build: the `Cheque` model + duplicate detection (Project 1 README, Week 2).
- AWS (1 hr): read through `aws/course.md` Project 0 — understand VPC + Security Groups conceptually.

That's the rhythm for all 16 weeks: one focused resource → build the milestone → AWS block (1–2 hrs).
