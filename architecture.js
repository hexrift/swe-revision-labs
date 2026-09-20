export const ARCHITECTURE_SOURCES = {
  azureStyles: { label:'Microsoft Azure Architecture Center · Architecture styles', url:'https://learn.microsoft.com/en-gb/azure/architecture/guide/architecture-styles/' },
  azureMicro: { label:'Microsoft Azure Architecture Center · Microservices architecture', url:'https://learn.microsoft.com/en-us/azure/architecture/microservices/' },
  azureCqrs: { label:'Microsoft Azure Architecture Center · CQRS pattern', url:'https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs' },
  azureEventSourcing: { label:'Microsoft Azure Architecture Center · Event Sourcing pattern', url:'https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing' },
  azureCaching: { label:'Microsoft Azure Architecture Center · Caching guidance', url:'https://learn.microsoft.com/en-us/azure/architecture/best-practices/caching' },
  awsCompute: { label:'AWS Well-Architected · Compute and hardware', url:'https://docs.aws.amazon.com/wellarchitected/2024-06-27/framework/perf-compute.html' },
  awsServerless: { label:'AWS Well-Architected · Serverless applications lens', url:'https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/' },
  awsServerlessPrinciples: { label:'AWS Well-Architected · Serverless design principles', url:'https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/general-design-principles.html' },
  awsEventBridge: { label:'AWS Prescriptive Guidance · EventBridge and EDA', url:'https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/eventbridge.html' },
  fowlerEvent: { label:'Martin Fowler · What do you mean by Event-Driven?', url:'https://martinfowler.com/articles/201701-event-driven.html' },
  kafkaIntro: { label:'Apache Kafka · Event streaming introduction', url:'https://kafka.apache.org/intro/' },
  k8sArch: { label:'Kubernetes · Cluster architecture', url:'https://kubernetes.io/docs/concepts/architecture/' },
  k8sWorkloads: { label:'Kubernetes · Workloads', url:'https://kubernetes.io/docs/concepts/workloads/' },
  k8sStateful: { label:'Kubernetes · StatefulSets', url:'https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/' }
};

const allLangs = (bad, good) => ({
  javascript:{bad,good}, typescript:{bad,good}, python:{bad,good}
});

const A = (id,title,source,viz,bad,good,note,extra={}) => ({
  id, category:'architecture', title, source, viz,
  code: allLangs(bad,good), languageAgnostic:true, note,
  ...extra
});

export const ARCHITECTURE_PATTERNS = [
  A('modular-monolith','Start with a modular monolith','azureStyles','arch-monolith',
`orders -> payments -> inventory
all modules share internals
and one giant dependency graph`,
`app
├─ orders      // explicit module boundary
├─ payments    // owns its domain API
└─ inventory   // communicates through contracts`,
'One deployable unit can still have strong internal boundaries. Distribution is not a prerequisite for modularity.',{
    mentalModel:'Keep the network out of the design until independent deployment, scaling or ownership genuinely justify it.',
    useWhen:['One team or a small number of teams','Domain boundaries are still evolving','You want simple deployment and transactions'],
    avoidWhen:['A subsystem must scale or deploy independently for clear reasons','Regulatory or ownership boundaries require isolation'],
    tradeoffs:['Simpler operations and local transactions','Less independent scaling/deployment than microservices','Poor module discipline can still create a big ball of mud'],
    tips:['Enforce module APIs in code and tests','Keep data ownership explicit even with one database','Measure coupling before extracting a service']
  }),
  A('microservices','Microservices: independence costs coordination','azureMicro','arch-microservices',
`client -> service A -> service B -> service C
shared database
shared release train`,
`gateway
  -> orders service -> orders DB
  -> payments service -> payments DB
services deploy independently`,
'Microservices buy independent change and scaling by accepting distributed-systems and operational complexity.',{
    mentalModel:'A service boundary is an organizational, deployment and data-ownership boundary—not merely a folder.',
    useWhen:['Domain is complex and changes frequently','Teams need independent deployment','Different components need materially different scaling'],
    avoidWhen:['Small product/team','Boundaries are unclear','Operations, tracing and deployment maturity are weak'],
    tradeoffs:['Independent deployment and scaling','Network failures, eventual consistency and service discovery','More observability, CI/CD and platform overhead'],
    tips:['Split by business capability, not technical layer','Avoid a shared database as the hidden coupling point','Design failure and tracing before adding more services'],
    video:{id:'RdemnsW6sOQ',title:'Microservices on GCP Dramatically Simplified',channel:'Google Cloud Tech',year:'2019',note:'Foundational session; pair with the current architecture guidance above.'}
  }),
  A('event-driven','Event-driven architecture: producers do not call every consumer','azureStyles','arch-event',
`orderService -> emailService
orderService -> analyticsService
orderService -> loyaltyService`,
`orderService -> event broker
                  ├-> email consumer
                  ├-> analytics consumer
                  └-> loyalty consumer`,
'Events decouple producers from downstream consumers, but delivery, ordering, schemas and consistency become part of the design.',{
    mentalModel:'Publish a fact that happened; consumers decide what that fact means to them.',
    useWhen:['Many consumers react independently','High-volume asynchronous workflows','Near-real-time integration without direct coupling'],
    avoidWhen:['Caller requires an immediate authoritative response','Ordering/transaction requirements are easier synchronously','The team cannot operate asynchronous failure modes'],
    tradeoffs:['Loose coupling and fan-out','Eventual consistency','Duplicates, ordering, replay and schema evolution'],
    tips:['Design consumers to be idempotent','Version events as contracts','Know whether you need a queue, pub/sub broker, or durable log'],
    video:{id:'-oXkuy_21BI',title:'Building event-driven architectures using ECS with Fargate',channel:'AWS Events',year:'2024'}
  }),
  A('event-notification-vs-carried-state','Event notification vs event-carried state','fowlerEvent','arch-event',
`OrderChanged { orderId: "42" }
// every consumer calls Orders API`,
`OrderChanged {
  orderId: "42",
  status: "PAID",
  total: 120
}`,
'Event-driven is not one pattern. Notification reduces payload coupling but can create callback traffic; carried state increases event contract responsibility.',{
    mentalModel:'Decide whether the event says “something changed” or carries enough state for consumers to act locally.',
    useWhen:['You have consciously chosen consistency and coupling characteristics'],
    avoidWhen:['The event payload becomes an uncontrolled database dump'],
    tradeoffs:['Small notifications can cause synchronous callback storms','Carried state reduces callbacks but duplicates data','Schema evolution matters more as events carry more state'],
    tips:['Name events in domain language','Do not publish internal persistence schemas as public events','Document consumer expectations']
  }),
  A('web-queue-worker','Web → queue → worker','azureStyles','arch-queue',
`request -> web process
          -> resize image
          -> send email
          -> call partner
          -> response after all work`,
`request -> web -> enqueue job -> fast response
                    |
                    v
                  worker -> retries / DLQ`,
'Move slow or bursty work behind a queue when the request does not need to wait for completion.',{
    mentalModel:'The queue is a shock absorber between request rate and worker capacity.',
    useWhen:['Background or long-running work','Traffic is bursty','Retries should not hold open client requests'],
    avoidWhen:['The user must know the operation succeeded before response','The workload is tiny and queue operations add unnecessary complexity'],
    tradeoffs:['Better burst handling and isolation','More asynchronous state and user-facing status handling','Duplicate delivery and poison-message handling'],
    tips:['Make jobs idempotent','Expose job status when users care','Use DLQs as an operational signal, not a graveyard']
  }),
  A('sync-vs-async','Synchronous vs asynchronous service boundaries','azureMicro','arch-sync-async',
`checkout -> inventory -> payments -> shipping -> email
(one long blocking chain)`,
`checkout -> inventory + payments
commit order
publish OrderPlaced
shipping/email continue asynchronously`,
'Use synchronous calls for immediate decisions; use asynchronous messaging where the caller can continue without the result.',{
    mentalModel:'Every synchronous hop adds latency and a failure dependency to the request path.',
    useWhen:['Synchronous: caller needs the answer now','Asynchronous: work can continue independently'],
    avoidWhen:['Turning everything into events hides simple request/response logic'],
    tradeoffs:['Sync is easier to reason about locally','Async isolates failures and smooths load','Async adds state machines, status and eventual consistency'],
    tips:['Draw the critical request path','Count synchronous hops','Move side effects off the critical path where business semantics allow']
  }),
  A('compute-choice','Choose compute: instances, containers or functions','awsCompute','arch-compute',
`"We use Kubernetes for everything."
or
"We use serverless for everything."`,
`choose by workload:
VMs        -> control + long-lived hosts
containers -> portable long-running services
functions  -> event/request-driven short units`,
'Cloud compute is a workload decision. AWS Well-Architected explicitly frames instances, containers and functions as different compute forms.',{
    mentalModel:'Choose the smallest operational abstraction that still gives the control, runtime and scaling model the workload needs.',
    useWhen:['Always—compute selection should follow workload characteristics'],
    avoidWhen:['Standardizing on one platform becomes more important than workload fit'],
    tradeoffs:['VMs: maximum host control, maximum host responsibility','Containers: portability/control with orchestration overhead','Functions: low infrastructure management with runtime/concurrency constraints'],
    tips:['Compare cold-start tolerance, runtime duration, networking, state and cost shape','Account for team operational skill','Revisit the choice as workload shape changes']
  }),
  A('serverless','Serverless: event-driven, stateless compute','awsServerlessPrinciples','arch-serverless',
`function A calls function B
which calls function C
and keeps workflow state in local memory`,
`event -> function
       -> durable state / queue / state machine
       -> next function`,
'Serverless works best when functions are short-lived, share little local state, and external services own durable state and orchestration.',{
    mentalModel:'Think in concurrent requests and events, not in a permanently running server process.',
    useWhen:['Spiky or event-driven workloads','You want managed scaling and reduced server operations','Short, stateless units of work'],
    avoidWhen:['Long-running compute with predictable high utilization','Special hardware/runtime affinity','Low-latency paths where startup characteristics are unacceptable'],
    tradeoffs:['Operational simplicity and elastic scaling','Platform/runtime constraints and provider coupling','Cost can be excellent for bursty use and poor for some sustained workloads'],
    tips:['Design for duplicate events','Externalize durable state','Use orchestration/state machines for multi-step workflows'],
    video:{id:'vj3vaqnbgbI',title:'Evolving serverless architectures',channel:'AWS Events',year:'2024'}
  }),
  A('kubernetes-workloads','Kubernetes workload types are different contracts','k8sWorkloads','arch-k8s',
`Deployment for everything:
database
node agent
scheduled backup
API`,
`Deployment  -> stateless API
StatefulSet -> stable identity/storage
DaemonSet   -> one-per-node agent
Job/CronJob -> run-to-completion work`,
'Kubernetes workload objects encode different lifecycle and identity semantics.',{
    mentalModel:'Pick the controller whose reconciliation contract matches the workload.',
    useWhen:['You already operate Kubernetes and need explicit workload lifecycle control'],
    avoidWhen:['Kubernetes adds more platform than the product requires'],
    tradeoffs:['Powerful declarative reconciliation','Significant platform and operational surface area','Stateful workloads need storage/identity design beyond “run a container”'],
    tips:['Prefer managed Kubernetes if the control plane itself is not your product','Use Deployments for interchangeable stateless replicas','Understand requests/limits, disruption and rollout behavior'],
    video:{id:'g9USwIPr7Xs',title:'Building production-grade resilient architectures with Amazon EKS',channel:'AWS Events',year:'2024'}
  }),
  A('stateful-vs-stateless','Stateful vs stateless compute','k8sStateful','arch-state',
`request -> instance A
session lives only in A memory
next request -> instance B -> "not logged in"`,
`request -> any replica
session/state -> durable shared store
replicas remain replaceable`,
'Stateless compute is easier to replace and scale horizontally; stateful compute requires identity, persistence and recovery semantics.',{
    mentalModel:'Ask whether any replica can serve the next request after another replica disappears.',
    useWhen:['Stateless by default for scalable service tiers','Stateful when identity or locality is intrinsic to the workload'],
    avoidWhen:['Pretending state does not exist by hiding it in local disk/memory'],
    tradeoffs:['Stateless replicas simplify scaling/failover','External state stores add network hops and dependencies','Stateful placement can improve locality but complicates recovery'],
    tips:['Separate durable state from cacheable local state','Make recovery semantics explicit','Know whether sticky identity is a requirement or accidental coupling']
  }),
  A('cqrs','CQRS: separate read and write models when they truly differ','azureCqrs','arch-cqrs',
`one model handles:
complex writes
complex joins
search
reporting
authorization
all at once`,
`commands -> write model -> write store
events/replication -> read model
queries -> read store optimized for reads`,
'CQRS can optimize read and write concerns independently, but introduces synchronization and consistency complexity.',{
    mentalModel:'Commands change state; queries return state. Separate models only when their needs diverge enough to justify it.',
    useWhen:['Read and write shapes/scaling are materially different','Domain write rules are complex','Independent read models create clear value'],
    avoidWhen:['Basic CRUD is sufficient','Team would be maintaining two models for no measurable benefit'],
    tradeoffs:['Independent optimization and scaling','More moving parts and eventual consistency','Projection rebuilds and synchronization become operational concerns'],
    tips:['CQRS does not require event sourcing','Start with logical separation before separate stores','Define freshness expectations for read models']
  }),
  A('event-sourcing','Event sourcing: events become the source of truth','azureEventSourcing','arch-event-source',
`orders table stores only current state:
status = "SHIPPED"`,
`OrderCreated
PaymentCaptured
OrderPacked
OrderShipped
=> current state is a projection of the event stream`,
'Event sourcing provides history and reconstruction but is a major persistence choice with significant schema, replay and concurrency trade-offs.',{
    mentalModel:'Persist what happened, then derive what is true now.',
    useWhen:['Audit/history is central to the domain','You need reconstruction or temporal queries','Events are already natural domain facts'],
    avoidWhen:['Most CRUD systems','The team does not need event history','Schema/replay complexity outweighs value'],
    tradeoffs:['Excellent auditability and temporal reconstruction','Projection and replay complexity','Event schema evolution becomes permanent history'],
    tips:['Treat events as immutable contracts','Use snapshots/materialized views when replay is expensive','Do not adopt it because “events are modern”']
  }),
  A('api-gateway-bff','API gateway / BFF at the system edge','azureMicro','arch-gateway',
`mobile client -> service A
             -> service B
             -> service C
             -> internal auth details everywhere`,
`mobile -> mobile BFF/gateway
web    -> web BFF/gateway
gateway -> internal services`,
'An edge gateway can centralize routing, policy and client-specific composition, but can also become a bottleneck or a new monolith.',{
    mentalModel:'Keep internal service topology from leaking directly into every client.',
    useWhen:['Many internal services','Cross-cutting edge policy','Clients need different aggregation shapes'],
    avoidWhen:['A simple application has one backend','Gateway accumulates domain logic from every service'],
    tradeoffs:['Simpler clients and centralized edge policy','Extra hop and operational dependency','Risk of a “god gateway”'],
    tips:['Keep business ownership in domain services','Measure gateway latency','Use BFFs when client needs materially differ']
  }),
  A('batch-vs-stream','Batch vs stream processing','kafkaIntro','arch-batch-stream',
`collect events all day
run one huge job
discover problems tomorrow`,
`stream events for low-latency reactions
batch historical data where latency does not matter`,
'Streaming reduces time-to-action; batch simplifies processing when freshness is not required. Many systems use both.',{
    mentalModel:'Choose by the freshness requirement, not by fashion.',
    useWhen:['Streaming: low-latency reaction and continuous pipelines','Batch: large historical jobs and relaxed freshness'],
    avoidWhen:['Streaming infrastructure for data that is only needed daily'],
    tradeoffs:['Streaming has continuous operational state and ordering/watermark concerns','Batch has higher latency but simpler recomputation','Hybrid designs can share durable event logs/data lakes'],
    tips:['State the freshness SLA','Plan for late/out-of-order events','Prefer replayable inputs when correctness matters']
  }),
  A('cache-aside','Cache-aside: faster reads, harder freshness','azureCaching','arch-cache',
`read database on every request`,
`read cache
  hit  -> return
  miss -> read database -> populate cache -> return
writes invalidate/update according to freshness policy`,
'Caching shifts work away from the origin at the cost of invalidation, stale data and operational complexity.',{
    mentalModel:'A cache is a second copy of data with a freshness policy.',
    useWhen:['Read-heavy hot data','Origin latency/cost matters','Some staleness is acceptable or manageable'],
    avoidWhen:['Data changes constantly and freshness is strict','Hit rate will be low'],
    tradeoffs:['Lower latency and origin load','Stale data and invalidation complexity','Stampedes and hot-key behavior need protection'],
    tips:['Measure hit rate','Use TTLs as a safety net, not the only invalidation strategy','Protect hot misses with request coalescing/locking']
  }),
  A('big-compute','Big compute: parallelize work that can actually be parallelized','azureStyles','arch-big-compute',
`one large machine
single serial loop
add more cores but algorithm cannot use them`,
`partition independent work
schedule across workers/cores/GPUs
reduce/aggregate results
measure speedup and communication cost`,
'Big compute can use many cores or accelerators for simulation, ML and parallel workloads, but parallel resources do not fix serial dependencies.',{
    mentalModel:'Scale compute only after identifying parallel work and the cost of moving data between workers.',
    useWhen:['Simulation, rendering, ML, scientific or embarrassingly parallel workloads'],
    avoidWhen:['Work is mostly serial or I/O-bound','Communication overhead dominates computation'],
    tradeoffs:['Massive throughput for parallel work','Scheduling/data-transfer cost','Accelerators require suitable algorithms and tooling'],
    tips:['Profile before choosing hardware','Separate compute time from data movement','Use Amdahl’s law as a sanity check on expected speedup']
  }),
  A('horizontal-vs-vertical','Horizontal vs vertical scaling','awsCompute','arch-scale',
`one server
keep increasing CPU/RAM forever`,
`stateless tier -> add replicas horizontally
stateful components -> scale vertically or shard when justified`,
'Vertical scaling makes one machine larger; horizontal scaling adds machines and usually requires stronger distribution semantics.',{
    mentalModel:'Scaling out changes the architecture; scaling up changes the size of one failure domain.',
    useWhen:['Vertical: simpler path within machine limits','Horizontal: high availability or growth beyond one machine'],
    avoidWhen:['Horizontal scaling without a plan for state, coordination and load distribution'],
    tradeoffs:['Vertical is simpler but has hard limits and larger single-node impact','Horizontal improves capacity/fault isolation but requires distribution','Costs depend on utilization and operational overhead'],
    tips:['Scale the actual bottleneck, not every tier','Keep request handlers stateless when possible','Load test before and after architectural changes']
  })
];
