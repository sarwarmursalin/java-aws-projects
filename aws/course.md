# Project-Based AWS Course (with SAA-C03 mapping)

**Target:** Full-time Java backend role. Language for projects: **Java (Spring Boot)**.
**Cert track:** Run SAA-C03 study in parallel — each project maps to exam domains below.
**Cost rule:** AWS Free Tier first; tear down billable resources the moment a project is done. Set a **Billing Budget alert at $5** before you start anything.

> SAA-C03 domains: **D1 Secure Architectures (30%)**, **D2 Resilient Architectures (26%)**, **D3 High-Performing Architectures (24%)**, **D4 Cost-Optimized Architectures (20%)**.

---

## Project 0 (½ day) — Account hardening & cost guardrails

Do this once, before Project 1. It is also the most-tested SAA-C03 material.

- Enable **MFA on the root user**; then stop using root.
- Create an **IAM admin user** + an **IAM group**; attach policies to the group, not the user.
- Create an **IAM role** you'll assume for daily work (practice for cross-account/role assumption).
- Turn on **AWS Budgets** ($5 alert) and **Cost Explorer**.
- Enable **CloudTrail** (one region is fine for now) so every API call is logged.
- Set **IAM password policy** + access-key rotation reminder.

**SAA-C03:** D1 (IAM users/groups/roles/policies, MFA, CloudTrail), D4 (Budgets, Cost Explorer).

---

## Project 1 (1–2 days) — Deploy a Spring Boot app on EC2

**Goal:** Get a Java web app live on a single server and understand the network plumbing.

**AWS services:** EC2, VPC (default), Security Groups, EBS, IAM instance role, Elastic IP, CloudWatch (basic metrics).

**Architecture (describe-as-diagram):**
```
Internet → Elastic IP → [ Security Group :8080/:443 ]
                          → EC2 (Amazon Linux 2023, t2.micro/t3.micro Free Tier)
                              ├─ Spring Boot fat JAR (systemd service)
                              ├─ EBS root volume (gp3)
                              └─ IAM Instance Role (no static keys on box)
CloudWatch ← instance + app logs (CloudWatch Agent)
```

**Step-by-step:**
1. Build a minimal Spring Boot REST app locally: `GET /health` → `200 {"status":"UP"}`, plus one real endpoint. Produce a fat JAR (`mvn clean package`).
2. Launch a **t3.micro** EC2 (Amazon Linux 2023). Create a **new key pair**; store the `.pem` securely (`chmod 400`).
3. **Security Group:** allow SSH (22) **only from your IP**, and 8080 (or 80/443) from anywhere. Never 0.0.0.0/0 on SSH.
4. Attach an **IAM instance role** (start empty / CloudWatchAgentServerPolicy) — practice the "no long-lived keys on the instance" pattern.
5. `scp` the JAR up (or pull from S3). Install **Amazon Corretto 21** (`sudo dnf install java-21-amazon-corretto`).
6. Create a **systemd unit** so the app restarts on boot/crash. Verify `systemctl status`.
7. Allocate an **Elastic IP**, associate it, hit the endpoint from your browser.
8. Install the **CloudWatch Agent**; ship app logs + memory metrics.
9. **Tear down** or stop the instance when done (Elastic IP costs money when unassociated).

**IAM best practices:** instance role instead of access keys; least-privilege SG (SSH locked to your IP); separate key pair per environment; no root usage.

**Nasdaq interviewer would ask:**
- "Walk me through what happens when a request hits your EC2 instance." (SG → ENI → app)
- "How does the app get AWS permissions without storing credentials?" (instance role → STS → temp creds)
- "Your instance dies at 2am. What happens to availability? How would you fix it?" (single point of failure → motivates Project 2)
- "Why a security group and not a NACL here? Difference?" (stateful vs stateless)

**SAA-C03:** D2 (EC2, EBS, single-AZ failure modes), D1 (SG, instance roles), D3 (instance types), D4 (Free Tier sizing, stop vs terminate).

---

## Project 2 (2–3 days) — Make it resilient & stateless: ALB + Auto Scaling + S3 + RDS

**Goal:** Remove the single point of failure and externalize state. This is the leap from "a server" to "an architecture."

**AWS services:** Custom VPC (public/private subnets, 2 AZs), Application Load Balancer, Auto Scaling Group, Launch Template, RDS (PostgreSQL, Multi-AZ optional), S3, Secrets Manager, NAT Gateway (or VPC endpoints), CloudWatch alarms.

**Architecture:**
```
Internet → ALB (public subnets, 2 AZs)
              → Target Group → ASG [EC2 x2..N] (private subnets)
                                   ├─ Spring Boot app (stateless)
                                   ├─ reads creds ← Secrets Manager
                                   ├─ stores files → S3 (bucket, SSE-KMS)
                                   └─ DB calls → RDS PostgreSQL (private subnet)
RDS Multi-AZ standby in 2nd AZ (failover)
CloudWatch alarms → ASG scaling policies
```

**Step-by-step:**
1. Create a **custom VPC**: 2 public + 2 private subnets across 2 AZs; IGW; one NAT Gateway (or, to save cost, **VPC interface endpoints** for S3/Secrets Manager and skip NAT).
2. Refactor the app to be **stateless** — no local session/file state. Files go to **S3**; config/secrets come from **Secrets Manager**.
3. Stand up **RDS PostgreSQL** (db.t3.micro, Free Tier) in private subnets. SG: allow 5432 **only** from the app SG (SG-to-SG reference, not CIDR).
4. Store DB credentials in **Secrets Manager**; grant the instance role `secretsmanager:GetSecretValue` on that one secret ARN.
5. Build a **Launch Template** (AMI + user-data that installs Corretto, pulls JAR from S3, starts systemd).
6. Create an **ALB** in public subnets, target group with `/health` health check, listener on 443 (ACM cert) or 80 for the lab.
7. Create the **ASG** (min 2, max 4) across both AZs behind the target group.
8. Add a **target-tracking scaling policy** (e.g., CPU 50%). Load-test with `hey`/`ab` and watch it scale.
9. Test resilience: terminate an instance → ALB routes around it, ASG replaces it. Trigger **RDS failover** and observe reconnection.
10. **Tear down** NAT GW, RDS, ALB when done — these bill hourly.

**IAM best practices:** SG-to-SG references (no broad CIDRs); secrets in Secrets Manager scoped to a single ARN; S3 bucket **Block Public Access ON** + SSE-KMS; instance role least-privilege; RDS not publicly accessible.

**Nasdaq interviewer would ask:**
- "Why must the app be stateless behind an ALB?" (any instance serves any request; scaling/replacement)
- "How do instances reach the DB but the DB isn't on the internet?" (private subnets, SG refs, no public IP)
- "Public vs private subnet — what literally makes a subnet 'public'?" (route to IGW)
- "How do you handle DB credentials so they're not in code or AMIs?" (Secrets Manager + role)
- "RDS Multi-AZ vs read replica — when each?" (HA/failover vs read scaling)

**SAA-C03:** D2 (multi-AZ, ALB, ASG, RDS Multi-AZ — heavily tested), D1 (VPC, SG, Secrets Manager, S3 BPA/KMS), D3 (scaling policies, ALB), D4 (NAT vs endpoints cost trade-off).

---

## Project 3 (2–3 days) — Serverless event processing: API Gateway + Lambda + S3 + Textract + SQS

**Goal:** Build a cloud-native, event-driven OCR routing service. Directly echoes your internship (SageMaker/Textract/S3/Lambda) and shows you can talk about it at depth.

**AWS services:** API Gateway (REST/HTTP), Lambda (Java 21, Corretto), S3 (event notifications), SQS (+ DLQ), Textract, DynamoDB, IAM roles per function, CloudWatch Logs, X-Ray.

**Architecture:**
```
Client → API Gateway → Lambda "Upload" → presigned S3 PUT
S3 (ObjectCreated) → SQS queue ──► Lambda "Processor" (Java)
                                      ├─ Textract (analyze document)
                                      ├─ routing logic (cheap vs expensive path)
                                      └─ results → DynamoDB
SQS DLQ ← poison messages (after N retries)
X-Ray traces across the chain
```

**Step-by-step:**
1. **Upload Lambda** (Java) behind API Gateway returns an **S3 presigned URL** so large files never pass through Lambda.
2. Configure **S3 → SQS** event notification on `ObjectCreated`. SQS decouples spikes from processing (your cost-reduction story).
3. **Processor Lambda** is triggered by SQS (batch). It calls **Textract**, applies your **routing logic** (e.g., simple docs → cheap synchronous text detection; complex → `AnalyzeDocument`), writes to **DynamoDB**.
4. Configure a **Dead-Letter Queue** + redrive policy (maxReceiveCount). Force a failure and watch a message land in the DLQ.
5. Give **each Lambda its own IAM execution role**, scoped to exactly the actions/resources it needs (one S3 prefix, one queue, Textract, one Dynamo table).
6. Enable **X-Ray** tracing end-to-end; read the service map.
7. Add **idempotency** (DynamoDB conditional write on object key) so retries don't double-process.
8. Note the **39% cost framing**: model it as routing N% of docs to the cheaper Textract path + SQS smoothing peak concurrency.

**IAM best practices:** one execution role per function, least-privilege to specific ARNs; presigned URLs over public buckets; resource policies on API Gateway; no `*` actions.

**Nasdaq interviewer would ask:**
- "Why SQS between S3 and processing instead of S3 → Lambda directly?" (buffering, retries, backpressure, DLQ, cost smoothing)
- "How do you stop one bad document from blocking the queue forever?" (visibility timeout, maxReceiveCount, DLQ)
- "How did you actually get 39%?" — be ready with the routing logic + measurement.
- "How do you make the processor idempotent?" (conditional writes / dedup key)
- "Lambda cold starts in Java — how do you mitigate?" (provisioned concurrency, SnapStart, smaller deps)

**SAA-C03:** D3 (Lambda, API Gateway, SQS, DynamoDB, decoupling — core exam material), D2 (SQS DLQ/retries, decoupled resilience), D1 (per-function roles, presigned URLs), D4 (serverless pay-per-use, presigned offload).

---

## Project 4 (4–6 days) — Capstone: Microservices on ECS Fargate

**Goal:** The interview centerpiece. Containerized Java microservices, async messaging, managed SQL, fronted by API Gateway — a production microservices architecture.

**AWS services:** ECR, ECS on **Fargate**, ALB, API Gateway (HTTP API → VPC Link → ALB), SQS, RDS PostgreSQL (Multi-AZ), Secrets Manager, Service Discovery (Cloud Map), CloudWatch + Container Insights, X-Ray, IAM task roles.

**Architecture:**
```
Client → API Gateway (HTTP API, JWT authorizer)
            → VPC Link → internal ALB
                 ├─ ECS Service: "document-svc"  (Fargate, 2 tasks, 2 AZs)
                 │     └─ writes job → SQS
                 ├─ ECS Service: "processor-svc" (Fargate, scales on SQS depth)
                 │     └─ Textract + writes → RDS
                 └─ ECS Service: "query-svc"     (reads RDS)
RDS PostgreSQL (Multi-AZ, private)
SQS (+ DLQ) decouples document-svc → processor-svc
Secrets Manager → task definitions (DB creds)
CloudWatch Container Insights + X-Ray across services
```

**Step-by-step:**
1. Split into **3 Spring Boot services** (document, processor, query), each its own repo/Dockerfile. Build images, push to **ECR** (one repo each, scan-on-push enabled).
2. Create an **ECS cluster** (Fargate). Write a **task definition** per service: CPU/mem, **task role** (app perms) vs **execution role** (pull image + read secrets) — know the difference cold.
3. Inject DB creds from **Secrets Manager** via the task definition `secrets` block (never env-var plaintext).
4. Put services in **private subnets**; front the synchronous ones with an **internal ALB**; expose publicly only through **API Gateway + VPC Link**.
5. **document-svc** publishes a job to **SQS**; **processor-svc** consumes it. Scale processor-svc with an **ASG/Service Auto Scaling target-tracking policy on `ApproximateNumberOfMessagesVisible`**.
6. Add **DLQ**, retries, and idempotency as in Project 3.
7. Add a **JWT authorizer** (Cognito or your IdP) on API Gateway.
8. Turn on **Container Insights** + **X-Ray**; demonstrate a trace crossing all three services.
9. Do a **rolling deploy** (push new image, update service) with zero downtime via ALB draining; mention **blue/green via CodeDeploy** as the next step.
10. **IaC bonus:** define the whole thing in **CloudFormation/CDK (Java CDK)** so you can stand it up / tear it down repeatably — huge interview signal.
11. **Tear down** the stack (Fargate, RDS Multi-AZ, NAT, ALB all bill).

**IAM best practices:** distinct **task role per service** (least privilege to its queue/table/secret); execution role limited to ECR pull + Secrets read; secrets via task def, not env; private subnets + SG-to-SG; API Gateway as the only public surface; image scanning in ECR.

**Nasdaq interviewer would ask:**
- "Task role vs execution role — what's the difference?" (app permissions vs the agent pulling image/secrets)
- "Why Fargate over EC2 launch type or EKS here?" (no node management; right-sized; trade-offs)
- "How does processor-svc scale with load?" (Service Auto Scaling on SQS queue depth)
- "How do services find/talk to each other privately?" (Cloud Map / internal ALB, private subnets)
- "Walk me through a zero-downtime deploy." (rolling/blue-green, health checks, connection draining)
- "Where could this fail, and how do you observe it?" (DLQ, Container Insights, X-Ray, alarms)
- "How would you do this across two accounts (dev/prod) safely?" (role assumption, separate accounts, IaC)

**SAA-C03:** D2 (ECS multi-AZ, SQS decoupling, RDS Multi-AZ, DLQ), D3 (Fargate, queue-depth scaling, API Gateway, Container Insights), D1 (task/execution roles, Secrets Manager, private networking, API GW authorizers), D4 (Fargate right-sizing, serverless ingress).

---

## Suggested pace (fits alongside the 12-week Java plan)
- **Week 1:** Project 0 + Project 1.
- **Weeks 2–3:** Project 2.
- **Weeks 4–5:** Project 3.
- **Weeks 7–10:** Project 4 (the capstone; overlaps Java Spring/JPA weeks nicely).
- **Weeks 11–12:** Polish capstone, write it up, sit a SAA-C03 practice exam.

## Cross-cutting habits (and what they signal)
- **Tear-down discipline + Budgets** → you think about cost (D4).
- **Least-privilege IAM in every project** → security-first (D1); security matters most in financial services.
- **Write each project up** (problem → architecture → trade-offs → what you'd change) — these become your STAR interview stories.
- **Tie everything back to the OCR/39% story** so your internship and your projects reinforce one narrative.

## SAA-C03 coverage check
- **D1 Security (30%):** Projects 0,1,2,3,4 — fully covered.
- **D2 Resilient (26%):** Projects 2,3,4 — Multi-AZ, ASG, SQS/DLQ.
- **D3 High-Performing (24%):** Projects 3,4 — serverless, scaling, caching opportunities.
- **D4 Cost-Optimized (20%):** Projects 0,2,3,4 — Free Tier, NAT-vs-endpoint, serverless, right-sizing.
> Gap to close with book/practice tests only: **S3 storage classes & lifecycle, EFS/FSx, CloudFront/edge, Route 53 routing policies, Direct Connect/VPN, Kinesis, encryption/KMS depth.** Add a short reading week (11) for these.
