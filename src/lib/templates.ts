/**
 * Diagram Templates
 * 
 * Pre-built examples for all major Mermaid diagram types.
 * All templates are stored locally - no network requests.
 */

export interface DiagramTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
}

export const diagramTemplates: DiagramTemplate[] = [
  // Flowcharts
  {
    id: 'flowchart-basic',
    name: 'Basic Flowchart',
    category: 'Flowchart',
    description: 'Simple top-to-bottom flowchart',
    code: `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]`,
  },
  {
    id: 'flowchart-subgraph',
    name: 'Flowchart with Subgraphs',
    category: 'Flowchart',
    description: 'Flowchart with grouped sections',
    code: `flowchart TB
    subgraph Frontend
        A[React App] --> B[Components]
        B --> C[State Management]
    end
    
    subgraph Backend
        D[API Server] --> E[Database]
        D --> F[Cache]
    end
    
    A -->|HTTP| D
    C -->|WebSocket| D`,
  },
  {
    id: 'flowchart-shapes',
    name: 'Node Shapes',
    category: 'Flowchart',
    description: 'Different node shapes available',
    code: `flowchart LR
    A[Rectangle] --> B(Rounded)
    B --> C([Stadium])
    C --> D[[Subroutine]]
    D --> E[(Database)]
    E --> F((Circle))
    F --> G>Asymmetric]
    G --> H{Diamond}
    H --> I{{Hexagon}}
    I --> J[/Parallelogram/]
    J --> K[\\Parallelogram Alt\\]`,
  },

  // Sequence Diagrams
  {
    id: 'sequence-basic',
    name: 'Basic Sequence',
    category: 'Sequence',
    description: 'Simple sequence diagram',
    code: `sequenceDiagram
    participant U as User
    participant S as Server
    participant D as Database
    
    U->>S: HTTP Request
    activate S
    S->>D: Query
    activate D
    D-->>S: Results
    deactivate D
    S-->>U: Response
    deactivate S`,
  },
  {
    id: 'sequence-auth',
    name: 'Authentication Flow',
    category: 'Sequence',
    description: 'OAuth authentication sequence',
    code: `sequenceDiagram
    autonumber
    actor User
    participant App
    participant Auth as Auth Server
    participant API
    
    User->>App: Click Login
    App->>Auth: Redirect to login
    Auth->>User: Show login form
    User->>Auth: Enter credentials
    Auth->>Auth: Validate
    Auth->>App: Return token
    App->>API: Request with token
    API->>App: Protected data
    App->>User: Display data`,
  },
  {
    id: 'sequence-loops',
    name: 'Loops and Alternatives',
    category: 'Sequence',
    description: 'Advanced sequence patterns',
    code: `sequenceDiagram
    participant C as Client
    participant S as Server
    
    C->>S: Connect
    
    loop Every 30 seconds
        C->>S: Heartbeat
        S-->>C: Ack
    end
    
    alt Success
        S->>C: Data
    else Error
        S->>C: Error message
    end
    
    opt If needed
        C->>S: Retry
    end`,
  },

  // Class Diagrams
  {
    id: 'class-basic',
    name: 'Basic Class Diagram',
    category: 'Class',
    description: 'Simple class structure',
    code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
        +move() void
    }
    
    class Dog {
        +String breed
        +bark() void
        +fetch() void
    }
    
    class Cat {
        +bool isIndoor
        +meow() void
        +scratch() void
    }
    
    Animal <|-- Dog
    Animal <|-- Cat`,
  },
  {
    id: 'class-relationships',
    name: 'Class Relationships',
    category: 'Class',
    description: 'Different relationship types',
    code: `classDiagram
    classA --|> classB : Inheritance
    classC --* classD : Composition
    classE --o classF : Aggregation
    classG --> classH : Association
    classI -- classJ : Link(Solid)
    classK ..> classL : Dependency
    classM ..|> classN : Realization
    classO .. classP : Link(Dashed)`,
  },

  // State Diagrams
  {
    id: 'state-basic',
    name: 'Basic State Diagram',
    category: 'State',
    description: 'Simple state machine',
    code: `stateDiagram-v2
    [*] --> Idle
    
    Idle --> Processing: Start
    Processing --> Success: Complete
    Processing --> Failed: Error
    
    Success --> [*]
    Failed --> Idle: Retry
    Failed --> [*]: Abort`,
  },
  {
    id: 'state-nested',
    name: 'Nested States',
    category: 'State',
    description: 'State diagram with composite states',
    code: `stateDiagram-v2
    [*] --> Active
    
    state Active {
        [*] --> Idle
        Idle --> Running: start
        Running --> Idle: stop
        Running --> Running: process
    }
    
    Active --> Suspended: suspend
    Suspended --> Active: resume
    Active --> [*]: terminate`,
  },

  // Entity Relationship
  {
    id: 'er-basic',
    name: 'ER Diagram',
    category: 'ER Diagram',
    description: 'Database entity relationships',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        string name
        string email
        int id PK
    }
    ORDER ||--|{ LINE_ITEM : contains
    ORDER {
        int id PK
        date created
        string status
        int customer_id FK
    }
    PRODUCT ||--o{ LINE_ITEM : "ordered in"
    PRODUCT {
        int id PK
        string name
        float price
    }
    LINE_ITEM {
        int quantity
        int order_id FK
        int product_id FK
    }`,
  },

  // Gantt Charts
  {
    id: 'gantt-basic',
    name: 'Project Timeline',
    category: 'Gantt',
    description: 'Basic Gantt chart',
    code: `gantt
    title Project Development Timeline
    dateFormat YYYY-MM-DD
    
    section Planning
    Requirements    :a1, 2024-01-01, 7d
    Design         :a2, after a1, 14d
    
    section Development
    Backend        :b1, after a2, 21d
    Frontend       :b2, after a2, 28d
    Integration    :b3, after b1, 7d
    
    section Testing
    QA Testing     :c1, after b3, 14d
    Bug Fixes      :c2, after c1, 7d
    
    section Deployment
    Release        :milestone, after c2, 0d`,
  },

  // Pie Charts
  {
    id: 'pie-basic',
    name: 'Pie Chart',
    category: 'Pie',
    description: 'Simple pie chart',
    code: `pie showData
    title Browser Market Share
    "Chrome" : 65
    "Safari" : 19
    "Firefox" : 4
    "Edge" : 4
    "Other" : 8`,
  },

  // Git Graphs
  {
    id: 'git-basic',
    name: 'Git Graph',
    category: 'Git',
    description: 'Git branching visualization',
    code: `gitGraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Feature A"
    commit id: "Feature B"
    checkout main
    merge develop id: "Merge develop"
    branch hotfix
    commit id: "Fix bug"
    checkout main
    merge hotfix id: "Hotfix merge"`,
  },

  // Journey
  {
    id: 'journey-basic',
    name: 'User Journey',
    category: 'Journey',
    description: 'User experience journey map',
    code: `journey
    title Customer Shopping Journey
    
    section Discovery
      Visit website: 5: Customer
      Browse products: 4: Customer
      Read reviews: 4: Customer
    
    section Purchase
      Add to cart: 5: Customer
      Checkout: 3: Customer
      Payment: 4: Customer
    
    section Post-Purchase
      Receive order: 5: Customer
      Use product: 5: Customer
      Write review: 3: Customer`,
  },

  // Mindmap
  {
    id: 'mindmap-basic',
    name: 'Mind Map',
    category: 'Mindmap',
    description: 'Hierarchical mind map',
    code: `mindmap
  root((Mermaid))
    Diagrams
      Flowcharts
      Sequence
      Class
      State
    Features
      Offline
      Secure
      Fast
    Export
      SVG
      PNG
      PDF`,
  },

  // Timeline
  {
    id: 'timeline-basic',
    name: 'Timeline',
    category: 'Timeline',
    description: 'Historical timeline',
    code: `timeline
    title History of Web Development
    
    1991 : HTML invented by Tim Berners-Lee
    1995 : JavaScript created
         : CSS introduced
    1996 : Flash released
    2004 : Web 2.0 era begins
    2008 : HTML5 draft published
    2010 : Responsive design coined
    2015 : ES6 released
    2020 : Jamstack popularity rises`,
  },

  // Quadrant Chart
  {
    id: 'quadrant-basic',
    name: 'Quadrant Chart',
    category: 'Quadrant',
    description: 'Priority matrix',
    code: `quadrantChart
    title Priority Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Do First
    quadrant-2 Schedule
    quadrant-3 Delegate
    quadrant-4 Eliminate
    
    Feature A: [0.8, 0.9]
    Feature B: [0.3, 0.8]
    Feature C: [0.7, 0.3]
    Feature D: [0.2, 0.2]
    Feature E: [0.5, 0.6]`,
  },

  // ============================================
  // MongoDB Architecture Patterns
  // For use in customer architecture reviews. These are reference
  // starting points, not prescriptive recommendations - always confirm
  // sizing, region, and compliance requirements with the customer.
  // ============================================
  {
    id: 'mongo-replica-set',
    name: 'Replica Set (Single Region HA)',
    category: 'MongoDB Architecture',
    description: 'Baseline 3-node replica set for high availability within a region',
    code: `flowchart TD
    subgraph App["Application Tier"]
        A1[App Server 1]
        A2[App Server 2]
    end

    subgraph RS["MongoDB Replica Set - Region A"]
        P[(Primary)]
        S1[(Secondary 1)]
        S2[(Secondary 2 / Analytics)]
        P <-->|replication| S1
        P <-->|replication| S2
    end

    A1 -->|read/write| P
    A2 -->|read/write| P
    A1 -.->|secondary reads optional| S1

    P -->|oplog| S1
    P -->|oplog| S2

    style P fill:#10b981,stroke:#059669,color:#fff
    style S1 fill:#6366f1,stroke:#4f46e5,color:#fff
    style S2 fill:#6366f1,stroke:#4f46e5,color:#fff`,
  },
  {
    id: 'mongo-sharded-cluster',
    name: 'Sharded Cluster (Horizontal Scale)',
    category: 'MongoDB Architecture',
    description: 'Sharded cluster with config servers and mongos routers for horizontal scale',
    code: `flowchart TD
    App[Application Tier] --> M1[mongos Router 1]
    App --> M2[mongos Router 2]

    subgraph Config["Config Server Replica Set"]
        C1[(Config 1)]
        C2[(Config 2)]
        C3[(Config 3)]
    end

    M1 --> Config
    M2 --> Config

    subgraph Shard1["Shard 1 - Replica Set"]
        S1P[(Primary)]
        S1S[(Secondary)]
    end
    subgraph Shard2["Shard 2 - Replica Set"]
        S2P[(Primary)]
        S2S[(Secondary)]
    end
    subgraph Shard3["Shard 3 - Replica Set"]
        S3P[(Primary)]
        S3S[(Secondary)]
    end

    M1 --> S1P
    M1 --> S2P
    M1 --> S3P
    M2 --> S1P
    M2 --> S2P
    M2 --> S3P

    style M1 fill:#6366f1,stroke:#4f46e5,color:#fff
    style M2 fill:#6366f1,stroke:#4f46e5,color:#fff`,
  },
  {
    id: 'mongo-multi-region',
    name: 'Multi-Region Global Cluster',
    category: 'MongoDB Architecture',
    description: 'Active-active multi-region deployment for low-latency global reads/writes and DR',
    code: `flowchart TB
    subgraph NA["Region: North America"]
        NA_P[(Primary Shard - us-east)]
        NA_S[(Secondary)]
    end
    subgraph EU["Region: Europe"]
        EU_P[(Primary Shard - eu-west)]
        EU_S[(Secondary)]
    end
    subgraph APAC["Region: Asia Pacific"]
        APAC_P[(Primary Shard - ap-southeast)]
        APAC_S[(Secondary)]
    end

    Users_NA[Users - Americas] --> NA_P
    Users_EU[Users - Europe] --> EU_P
    Users_APAC[Users - APAC] --> APAC_P

    NA_P <-.->|zone-aware sharding + replication| EU_P
    EU_P <-.->|zone-aware sharding + replication| APAC_P
    NA_P <-.->|zone-aware sharding + replication| APAC_P

    style NA_P fill:#10b981,stroke:#059669,color:#fff
    style EU_P fill:#10b981,stroke:#059669,color:#fff
    style APAC_P fill:#10b981,stroke:#059669,color:#fff`,
  },
  {
    id: 'mongo-search-rag',
    name: 'Atlas Search + Vector Search (RAG)',
    category: 'MongoDB Architecture',
    description: 'Retrieval-augmented generation pipeline using Atlas Vector Search alongside operational data',
    code: `flowchart LR
    User[User Query] --> App[Application / API]
    App --> Embed[Embedding Model]
    Embed --> VS[(Atlas Vector Search Index)]
    App --> FTS[(Atlas Search - Full Text Index)]
    VS --> App
    FTS --> App
    App --> LLM[LLM / Generation Service]
    LLM --> User

    subgraph Atlas["MongoDB Atlas - Single Cluster"]
        VS
        FTS
        OP[(Operational Collections)]
    end

    Ingest[Document Ingestion Pipeline] --> Embed
    Ingest --> OP
    OP --> App

    style VS fill:#10b981,stroke:#059669,color:#fff
    style FTS fill:#10b981,stroke:#059669,color:#fff`,
  },
  {
    id: 'mongo-tiered-storage',
    name: 'Tiered Storage (Online Archive + Data Federation)',
    category: 'MongoDB Architecture',
    description: 'Cost-optimized tiered storage moving cold data to cheaper storage while keeping it queryable',
    code: `flowchart TD
    App[Application] --> Cluster[(Atlas Cluster - Hot Data)]
    Cluster -->|automated aging rule| Archive[(Online Archive - Cold Data / Object Storage)]
    App -->|federated queries across tiers| DF{Atlas Data Federation}
    DF --> Cluster
    DF --> Archive
    DF --> S3[(External S3 / Blob Storage)]

    style Cluster fill:#10b981,stroke:#059669,color:#fff
    style Archive fill:#f59e0b,stroke:#d97706,color:#fff
    style DF fill:#6366f1,stroke:#4f46e5,color:#fff`,
  },
  {
    id: 'mongo-cdc-kafka',
    name: 'Change Streams → Kafka (Event-Driven)',
    category: 'MongoDB Architecture',
    description: 'Event-driven architecture using Change Streams to publish data changes to downstream consumers',
    code: `flowchart LR
    App[Application] -->|writes| Cluster[(MongoDB Atlas Cluster)]
    Cluster -->|Change Streams| Connector[Kafka Connector / MongoDB Connector]
    Connector --> Kafka[[Kafka Topic]]
    Kafka --> Search[Search Index Service]
    Kafka --> Analytics[Analytics / Data Warehouse]
    Kafka --> Notify[Notification Service]

    style Cluster fill:#10b981,stroke:#059669,color:#fff
    style Kafka fill:#1e293b,stroke:#334155,color:#fff`,
  },
  {
    id: 'mongo-multi-tenant-db',
    name: 'Multi-Tenancy: Database-per-Tenant',
    category: 'MongoDB Architecture',
    description: 'Strong isolation model - each tenant gets a dedicated database, useful for strict data-boundary requirements',
    code: `flowchart TD
    App[Application - Tenant Router] --> Cluster[(Shared Atlas Cluster)]

    subgraph Cluster
        DB1[(Tenant A Database)]
        DB2[(Tenant B Database)]
        DB3[(Tenant C Database)]
    end

    App -->|resolves tenant, connects to| DB1
    App -->|resolves tenant, connects to| DB2
    App -->|resolves tenant, connects to| DB3

    Note["Trade-off: strongest isolation and per-tenant backup/restore,<br/>but higher connection and index overhead at scale"]
    Cluster -.-> Note`,
  },
  {
    id: 'mongo-multi-tenant-collection',
    name: 'Multi-Tenancy: Shared Collection + tenantId',
    category: 'MongoDB Architecture',
    description: 'Efficient multi-tenant pattern using a shared collection with a tenantId field and matching shard key',
    code: `flowchart TD
    App[Application] -->|attaches tenantId to every query| Cluster[(Atlas Cluster)]

    subgraph Cluster
        Coll[(Shared Collection - shard key: tenantId + _id)]
    end

    App --> Coll
    Coll -->|compound index on tenantId| Idx[Index: tenantId_1_field_1]

    Note["Trade-off: efficient resource usage and simpler ops,<br/>requires disciplined query/index design to avoid noisy-neighbor issues"]
    Coll -.-> Note`,
  },
  {
    id: 'mongo-migration-cutover',
    name: 'Live Migration to Atlas',
    category: 'MongoDB Architecture',
    description: 'Cutover pattern for migrating an existing MongoDB or relational workload into Atlas with minimal downtime',
    code: `flowchart LR
    Source[(Source Database - Self-Managed / Other Provider)] -->|initial sync| Migrator[Cluster-to-Cluster Sync / mongomirror]
    Migrator -->|continuous replication| Target[(MongoDB Atlas Cluster)]

    App[Application] -->|1. reads/writes during migration| Source
    App -.->|2. cutover after sync lag = 0| Target

    Migrator -->|validation| Verify{Data Verification}
    Verify -->|pass| Cutover[Cutover Window]
    Cutover --> App

    style Target fill:#10b981,stroke:#059669,color:#fff
    style Cutover fill:#f59e0b,stroke:#d97706,color:#fff`,
  },
  {
    id: 'mongo-security-network',
    name: 'Network Security & Isolation',
    category: 'MongoDB Architecture',
    description: 'Private connectivity pattern using PrivateLink/VPC Peering, network access lists, and encryption',
    code: `flowchart TD
    subgraph VPC["Customer VPC"]
        App[Application Tier]
    end

    subgraph AtlasNet["Atlas Network Boundary"]
        PL{PrivateLink / VPC Peering}
        Cluster[(Atlas Cluster - Encryption at Rest + TLS in Transit)]
    end

    App -->|private connectivity, no public internet| PL
    PL --> Cluster

    IAM[Database Users + SCRAM/X.509] --> Cluster
    Audit[Atlas Audit Logs] --> Cluster
    NetAccess[IP Access List / Private Endpoints Only] --> PL

    style Cluster fill:#10b981,stroke:#059669,color:#fff
    style PL fill:#6366f1,stroke:#4f46e5,color:#fff`,
  },
  {
    id: 'mongo-backup-dr',
    name: 'Backup & Disaster Recovery',
    category: 'MongoDB Architecture',
    description: 'Continuous backup with point-in-time recovery and cross-region DR strategy',
    code: `flowchart TD
    Cluster[(Primary Region Cluster)] -->|continuous cloud backup| Snapshots[(Snapshot Store)]
    Snapshots -->|point-in-time recovery| PITR{Restore to any point within retention window}

    Cluster -.->|async replication for DR| DR[(DR Region - Secondary/Analytics Nodes)]

    PITR --> NewCluster[(Restored Cluster)]
    DR -->|manual or automated failover| NewCluster

    Note["Define RPO/RTO targets with the customer before<br/>selecting backup frequency and DR topology"]
    Snapshots -.-> Note

    style Cluster fill:#10b981,stroke:#059669,color:#fff
    style DR fill:#f59e0b,stroke:#d97706,color:#fff`,
  },
];


// Group templates by category
export function getTemplatesByCategory(): Map<string, DiagramTemplate[]> {
  const grouped = new Map<string, DiagramTemplate[]>();
  
  for (const template of diagramTemplates) {
    const existing = grouped.get(template.category) || [];
    existing.push(template);
    grouped.set(template.category, existing);
  }
  
  return grouped;
}

// Get all unique categories
export function getCategories(): string[] {
  return [...new Set(diagramTemplates.map((t) => t.category))];
}

// Default starting diagram
export const defaultDiagram = `flowchart TD
    A[🎨 Mermaid Editor] --> B{Create Diagrams}
    B --> C[📊 Flowcharts]
    B --> D[📈 Sequence Diagrams]
    B --> E[🏗️ Class Diagrams]
    B --> F[📋 And More...]
    
    C --> G[✨ Beautiful Output]
    D --> G
    E --> G
    F --> G
    
    G --> H[📤 Export]
    H --> I[SVG]
    H --> J[PNG]
    H --> K[Source]
    
    style A fill:#6366f1,stroke:#4f46e5,color:#fff
    style G fill:#10b981,stroke:#059669,color:#fff
    style H fill:#f59e0b,stroke:#d97706,color:#fff`;
