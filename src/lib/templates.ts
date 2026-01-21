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
