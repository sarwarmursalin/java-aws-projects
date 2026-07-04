# Project 2 — Document Metadata REST API (Weeks 7–10)

**Your core job-skill project.** A Spring Boot REST service managing document metadata, backed by PostgreSQL, with a real test suite. This is the closest thing to day-one backend work.

> Full milestone breakdown is in [`../../00-study-plan.md`](../../00-study-plan.md) (Weeks 7–10). Detailed concept reference: [`../_reference-roadmap.md`](../_reference-roadmap.md) (Weeks 5–8, 10).

## What you'll build
CRUD API over "documents" (id, filename, type, status, uploadedAt, tags), with DTO validation, centralized error handling, pagination/filtering, PostgreSQL persistence via Spring Data JPA, and JUnit 5 + Mockito + Testcontainers tests.

## Milestones
- **Week 7 — Spring Boot + DI:** scaffold from start.spring.io, constructor injection, Actuator health.
- **Week 8 — REST:** controllers, DTOs vs entities, `@Valid`, `@ControllerAdvice`, status codes, pagination.
- **Week 9 — JPA/Hibernate:** PostgreSQL, Document↔Tag relationship, fix N+1, Flyway migrations, `@Transactional`.
- **Week 10 — Testing:** unit (Mockito), slice (`@WebMvcTest`+MockMvc), integration (`@DataJpaTest`+Testcontainers).

## ✅ Cleared when
- [ ] Documented endpoints with correct status codes; bad input → clean 400.
- [ ] Persists to Postgres with no N+1 on the list endpoint.
- [ ] Meaningful green test suite; you can explain what you mock vs use a real DB for.
- [ ] Pushed to GitHub + STAR story written.

## Interview seeds
DI/IoC, constructor vs field injection, `@Transactional` semantics, N+1 problem, DTO vs entity, REST design (idempotency, status codes, pagination), testing strategy (unit vs integration, what to mock).

⬅️ Prev: [Project 1](../project-1-cheque-cli/README.md) ・ ➡️ Next: [Project 3 — Microservice on AWS](../project-3-document-microservice/README.md)
