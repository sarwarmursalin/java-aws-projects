# Java Backend Roadmap

**You:** Strong Python (Django/Flask, ML/AI). Java listed but never used in anger.
**Target:** Java/Spring Boot backend role.
**Split:** ~80% hands-on coding, ~20% theory. Cut anything not on the direct path.

**Mindset shift from Python:** static typing & the compiler are your friend; everything lives in a class; the JVM/build tool (Maven/Gradle) matters; verbosity buys you tooling and refactor safety. Lean on your Python instincts for *design*, not *syntax*.

**What I deliberately cut** (low ROI for this timeline): Swing/JavaFX, applets, deep JVM internals/GC tuning, reflection wizardry, AWT, RMI, JSP/Servlets-by-hand, Java EE app servers. Touch only if interviewed.

---

## Phase 1 — Core Java fast (Weeks 1–4)

### Week 1 — Syntax, types, OOP foundations
- **Theory (20%):** JVM/JDK/JRE, `javac`/`java`, primitives vs objects, `==` vs `.equals()`, autoboxing, `String` immutability, packages, `static` vs instance.
- **Code (80%):** Re-implement small Python scripts you already know in Java. Classes, constructors, `this`, enums, interfaces vs abstract classes, access modifiers.
- **Build tool:** Set up **Maven** day one (you'll need it for Spring). Understand `pom.xml`, dependencies, `mvn package`.
- **Resources:** Oracle **Java Explorer / Dev.java tutorials**; *Amigoscode* "Java Tutorial for Beginners" (YouTube); **freeCodeCamp** "Java Full Course".
- **Checkpoint:** A `Bank`/`Account` class set with proper encapsulation, compiled & run via Maven.

### Week 2 — Collections, generics, equals/hashCode
- **Theory:** `List`/`Set`/`Map` interfaces vs impls (`ArrayList`, `LinkedList`, `HashMap`, `HashSet`, `TreeMap`), Big-O of each; generics & wildcards; the **`equals()`/`hashCode()` contract**.
- **Code:** Port a Python `dict`/`list`-heavy script to Java collections. Write a custom class used as a `HashMap` key (forces correct equals/hashCode).
- **Resources:** Oracle Collections Trail; *Telusko* / *Coding with John* (excellent on equals/hashCode & collections).
- **Checkpoint:** Word-frequency counter + a `Map<CustomKey, List<...>>` that behaves correctly.

### Week 3 — Streams, lambdas, Optional, exceptions, I/O
- **Theory:** Functional interfaces, lambdas, method references, the **Stream API** (`map/filter/collect/reduce/groupingBy`), `Optional`, checked vs unchecked exceptions, try-with-resources.
- **Code:** Rewrite Week 2's loops as streams. This is where Python comprehensions map onto Java — lean in. File reading/writing, parsing CSV.
- **Resources:** *Coding with John* "Java Streams"; Oracle "Aggregate Operations"; Baeldung Streams articles (free).
- **Checkpoint:** Stream pipeline that ingests a CSV, groups & aggregates, handles bad rows via exceptions/Optional.

### Week 4 — Concurrency + Mini-Project A (CLI cheque processing tool)
- **Theory (keep practical):** `Thread`/`Runnable`, `ExecutorService`/thread pools, `Callable`/`Future`, `synchronized`, `volatile`, `ConcurrentHashMap`, `CompletableFuture`, race conditions/deadlock at a conceptual level. (Concurrency is asked in backend interviews — but you need *working* understanding, not JMM minutiae.)
- **🛠 Mini-Project A — CLI Cheque Processing Tool:**
  - Reads a folder of mock cheque records (CSV/JSON), validates fields (amount, routing, date), flags suspicious entries with simple rules (mirrors a real financial services domain).
  - Use **collections + streams** for processing, **ExecutorService** to process files in parallel, proper **exception handling**, and clean **OOP** (a `Cheque` model, a `Validator`, a `Processor`).
  - Package as a runnable JAR via Maven.
- **Resources:** *Java Brains* concurrency; Baeldung `ExecutorService`/`CompletableFuture`.
- **Checkpoint:** `java -jar cheque-tool.jar ./inbox` processes N files concurrently and prints a fraud-flag report.

---

## Phase 2 — Spring Boot & web (Weeks 5–8)

### Week 5 — Spring core & Spring Boot fundamentals
- **Theory:** **IoC / Dependency Injection** (the central Spring idea — contrast with how you wired things in Flask), beans, `@Component/@Service/@Repository/@Configuration`, application context, `application.yml`, profiles, auto-configuration, starters.
- **Code:** Spin up a Boot app via **start.spring.io**. Build a couple of services wired by constructor injection. Read config from `application.yml`.
- **Resources:** *Amigoscode* Spring Boot; **Spring's official "Building a RESTful Web Service" guide**; *Java Brains* "Spring Boot Quick Start".
- **Checkpoint:** Running Boot app, `/actuator/health` up, DI working with no `new` in your services.

### Week 6 — REST APIs (this is the core job skill)
- **Theory:** `@RestController`, `@GetMapping`/`@PostMapping`/etc., `@RequestBody`/`@PathVariable`/`@RequestParam`, `ResponseEntity`, status codes, **DTOs vs entities**, bean validation (`@Valid`, `jakarta.validation`), centralized error handling (`@ControllerAdvice`/`@ExceptionHandler`), REST design (idempotency, versioning, pagination).
- **🛠 Mini-Project B — REST API for Document Metadata** *(start here, finish W7):*
  - CRUD over "documents" (id, filename, type, status, uploadedAt, tags). DTOs, validation, proper status codes, error handling, pagination + filtering.
- **Resources:** Spring Guides "Consuming/Building REST"; *Dan Vega* (YouTube) Spring REST; Baeldung `@ControllerAdvice`.
- **Checkpoint:** Documented endpoints returning correct codes; bad input → 400 with a clean error body.

### Week 7 — JPA / Hibernate + finish Mini-Project B
- **Theory:** ORM concepts (you'll recognize Django ORM analogies), `@Entity`/`@Id`/`@GeneratedValue`, relationships (`@OneToMany`/`@ManyToOne`), `JpaRepository`, derived queries, **JPQL** & `@Query`, transactions (`@Transactional`), the **N+1 problem**, `LAZY` vs `EAGER`, **Flyway/Liquibase** migrations.
- **Code:** Back Mini-Project B with **PostgreSQL** via Spring Data JPA. Add a related entity (e.g., `Document` ↔ `Tag`). Add a migration tool.
- **Resources:** *Amigoscode* "Spring Data JPA"; Baeldung JPA/Hibernate; Spring "Accessing Data with JPA".
- **Checkpoint:** Mini-Project B persists to Postgres, relationships query correctly, no N+1 on the list endpoint.

### Week 8 — Testing (JUnit 5 + Mockito) — high priority
- **Theory:** **JUnit 5** (`@Test`, lifecycle, assertions, parameterized tests), **Mockito** (`@Mock`/`@InjectMocks`, `when/thenReturn`, `verify`, argument captors), unit vs integration, `@SpringBootTest`, `@WebMvcTest` + **MockMvc**, `@DataJpaTest`, **Testcontainers** for real Postgres in tests, test coverage mindset (TDD basics).
- **Code:** Retro-fit tests onto Mini-Projects A & B: unit-test the validator/service with Mockito, slice-test controllers with MockMvc, integration-test the repo with Testcontainers.
- **Resources:** *Amigoscode* testing; Baeldung JUnit5 & Mockito; Testcontainers Java docs.
- **Checkpoint:** Meaningful test suite green; you can explain *why* you mock vs use a real DB.

---

## Phase 3 — Production microservice + interview prep (Weeks 9–12)

### Week 9–10 — 🛠 Mini-Project C: Spring Boot microservice + PostgreSQL on AWS
- Evolve Mini-Project B into a **deployable microservice**:
  - Dockerize the Boot app (multi-stage build, Corretto 21 base).
  - **PostgreSQL on RDS**; secrets via **Secrets Manager** (ties into your AWS course Project 2/4).
  - Deploy on AWS — start on **EC2** (AWS Project 1), then **ECS Fargate** (AWS Project 4) for the real thing.
  - Add **Actuator** health/metrics, structured logging, externalized config, a `/health` the load balancer can probe.
  - Add **async messaging with SQS** (`spring-cloud-aws` or the AWS SDK) to mirror a production event-driven backend.
- **Theory (light):** 12-factor app, statelessness, config externalization, graceful shutdown, observability.
- **Resources:** Spring Boot Docker guide; *Dan Vega* / *Java Techie* "Spring Boot on AWS"; Spring Cloud AWS docs.
- **Checkpoint:** A containerized Java microservice live on AWS, persisting to RDS, processing an SQS message end-to-end. **This is your portfolio centerpiece** and overlaps your AWS capstone.

### Week 11 — Hardening, idioms & code quality
- Refactor all three projects to "review-ready": consistent layering (controller → service → repository), DTO mapping (MapStruct optional), input validation, exception handling, logging, README with architecture notes.
- Read real Spring code; learn idioms (immutability, `final`, builder pattern, `Optional` usage, no field injection).
- **Theory top-ups for backend interviews:** Java memory model basics (heap/stack, GC at a high level), `final/finally/finalize`, immutability & thread-safety, `String` pool, generics erasure, functional vs imperative trade-offs.

### Week 12 — Interview drilling + system design
- **Daily:** Java/Spring Q&A (below) + 1–2 DSA problems in Java (LeetCode easy/medium — get fluent writing Java under time pressure, since you'll instinctively reach for Python).
- **System design:** be able to whiteboard your Mini-Project C (microservice + SQS + RDS + API Gateway) and your AWS OCR/39% story.
- **Mock interviews:** explain DI, transactions, equals/hashCode, concurrency, testing strategy out loud.

---

## Common Java/Spring interview topics
**Core Java**
- `==` vs `.equals()`; the `equals()`/`hashCode()` contract and why it matters for `HashMap`/`HashSet`.
- `String` immutability & the string pool; `String` vs `StringBuilder`.
- `ArrayList` vs `LinkedList`; `HashMap` internals (buckets, collisions, load factor, treeify).
- Checked vs unchecked exceptions; `final`/`finally`/`finalize`.
- Streams vs loops; when streams hurt readability/perf.
- Generics & type erasure; wildcards (`? extends` / `? super`).

**Concurrency** (high-volume transaction processing — expect this)
- `synchronized` vs `volatile`; what a race condition/deadlock is and how to avoid it.
- `ExecutorService`/thread pools vs raw threads; `Callable`/`Future`/`CompletableFuture`.
- Thread-safe collections (`ConcurrentHashMap`) vs `Collections.synchronizedMap`.
- Immutability as a concurrency strategy.

**Spring / Backend**
- What DI/IoC is and why it beats manual wiring; constructor vs field injection.
- Bean scopes & lifecycle; what auto-configuration does.
- `@Transactional` semantics, propagation, rollback rules; the N+1 problem and fixes.
- DTO vs entity; validation; centralized exception handling.
- REST design: idempotency, status codes, versioning, pagination.
- Testing strategy: unit vs integration, what to mock, MockMvc, Testcontainers.

**Practical / behavioral**
- "Coming from Python, what surprised you about Java?" (typing, JVM, verbosity-for-tooling — have a crisp answer).
- Walk through Mini-Project C architecture and trade-offs.
- How you'd debug a production latency/memory issue (logs, metrics, profiling, GC at a high level).

---

## Free resource index (by section)
- **Core Java:** Oracle **Dev.java / Java Explorer** tutorials & Trails; *freeCodeCamp* Java Full Course; *Amigoscode*; *Telusko*; *Coding with John* (equals/hashCode, streams — superb).
- **Concurrency:** *Java Brains*; Baeldung concurrency series.
- **Spring Boot / REST / JPA:** **Spring.io official Guides** (best, free, hands-on); *Amigoscode* Spring playlists; *Dan Vega*; *Java Techie*; **Baeldung** (deepest free written reference).
- **Testing:** Baeldung JUnit5 + Mockito; Testcontainers Java docs.
- **Interview:** Baeldung interview-questions articles; LeetCode (Java); your own project write-ups.

## Weekly rhythm that hits the 80/20
- Mon: read/watch the week's concept (theory, ~20%).
- Tue–Fri: build the checkpoint deliverable (coding, ~80%).
- Weekend: refactor + write a short README + one mock-explanation out loud.

> **Throughline:** every Java deliverable feeds the AWS capstone, and both feed your your narrative (cheque/fraud domain + cloud cost story). Keep the projects in one GitHub profile so the story is obvious to a recruiter.
