# Project 1 — Cheque Processing CLI (Weeks 2–5)

**Your first portfolio piece.** A command-line tool that ingests a folder of cheque records, validates them, flags suspicious ones with fraud rules, and emits a report — built concurrently so it scales to thousands of files. This mirrors a real financial services domain (fraud detection on financial documents) and gives you a real STAR story.

**Why this project:** it forces every Core Java pillar — collections, streams, exceptions, file I/O, concurrency — in service of something interview-worthy, instead of disconnected tutorials.

---

## Final spec (what "done" looks like)
```
$ java -jar cheque-tool.jar ./inbox --report report.txt --threads 4
Processed 1,284 cheques from 312 files in 0.8s (4 threads)
  ✓ 1,201 valid
  ⚠  71 flagged (see report.txt)
  ✗ 12 rejected (malformed)
```
A `Cheque` has: id, payer, payee, amount, routingNumber, date. The tool:
- reads CSV and/or JSON files from a folder,
- validates each field (amount > 0, routing number format, date not in future, required fields present),
- applies **fraud-flag rules** (e.g. amount just under a reporting threshold like $9,900–$9,999 — "structuring"; duplicate cheque id; payee on a watchlist),
- processes files **in parallel**, and
- writes a human-readable report with counts and the reason each cheque was flagged/rejected.

## Milestones (build in order — each unlocks a Core Java pillar)

### Week 2 — Model & collections
- [ ] Create a `Cheque` class (immutable: `final` fields, constructor, getters). Consider a Java **record** and learn what it gives you.
- [ ] Parse a hardcoded list of sample records into `List<Cheque>`.
- [ ] Detect duplicate cheque ids using a `Map<String, List<Cheque>>` or a `Set`.
- **Teaches:** `List`/`Set`/`Map`, generics, records, equals/hashCode (duplicate detection makes you *need* it).

### Week 3 — Validation & streams
- [ ] A `Validator` that returns the list of problems for a cheque (empty list = valid).
- [ ] A `FraudRules` component applying the flag rules.
- [ ] Use the **Stream API** to partition cheques into valid / flagged / rejected and to `groupingBy` reason.
- **Teaches:** streams (`map/filter/collect/partitioningBy/groupingBy`), lambdas, `Optional`, custom exceptions.

### Week 4 — File I/O & robustness
- [ ] Read real CSV and JSON files from a folder path (use `java.nio.file.Files`; for JSON add **Jackson** via Maven).
- [ ] Handle malformed files/rows gracefully — one bad row must not crash the run; collect it as "rejected" with a reason.
- [ ] Write the report to a file with try-with-resources.
- **Teaches:** file I/O, `try`-with-resources, checked vs unchecked exceptions, dependency management in Maven.

### Week 5 — Concurrency
- [ ] Process files in parallel with an `ExecutorService` (one task per file), collect results with `Future`/`CompletableFuture`.
- [ ] Make shared counters/collections thread-safe (e.g. `ConcurrentHashMap`, `AtomicInteger`, or merge per-thread results at the end — the cleaner pattern).
- [ ] Add a `--threads N` flag; measure speedup vs single-threaded.
- **Teaches:** threads, `ExecutorService`, `Callable`/`Future`, `CompletableFuture`, thread-safety, immutability as a concurrency strategy.

## ✅ Project 1 cleared when
- [ ] Runnable fat JAR processes a folder concurrently and writes a report.
- [ ] One malformed file does not crash the run.
- [ ] You can explain your concurrency model (why it's thread-safe).
- [ ] Pushed to GitHub with a README (problem → design → how to run → what you'd improve).
- [ ] Written up as a **STAR story** in `../../interview-prep/`.

## Interview questions this sets you up to answer
- "How does a `HashMap` find duplicates — what's `hashCode`/`equals` doing under the hood?"
- "When would you use a stream vs a loop? When does a stream hurt?"
- "How did you make the parallel processing thread-safe without locks everywhere?" (immutable results + merge, or concurrent collections)
- "Checked vs unchecked exceptions — how did you decide which to use for a bad row?"
- "How would this scale to millions of cheques?" (bounded thread pool, streaming reads, backpressure → segues into your AWS SQS work)

## Architecture (describe-as-diagram)
```
./inbox/*.{csv,json}
   → FileScanner (lists files)
       → ExecutorService (N threads)
           → per file: Parser → List<Cheque>
                         → Validator → problems?
                         → FraudRules → flags?
           → ChequeResult (valid | flagged | rejected, with reasons)
   → ResultAggregator (thread-safe merge)
       → ReportWriter → report.txt
```

## Resources
- Coding with John — Streams, equals/hashCode.
- Baeldung — `ExecutorService`, `CompletableFuture`, Jackson basics.
- Java Brains — concurrency primers.

⬅️ Prev: [Project 0](../project-0-setup-warmup/README.md) ・ ➡️ Next: [Project 2 — Document Metadata API](../project-2-document-api/README.md)
