# Build Distributed System (build-dist-sys)

A distributed system project demonstrating microservices architecture using NestJS, gRPC, REST APIs, and RabbitMQ for inter-service communication. The system is fully containerized with Docker.

## 📋 Project Overview

This project demonstrates asynchronous microservices communication:
- **gRPC Service**: Producer that exposes computation logic via gRPC protocol and publishes results to RabbitMQ
- **REST Service**: Consumer that processes messages from RabbitMQ queues and exposes REST endpoints

Both services are designed to run in Docker containers with proper orchestration, communicating asynchronously through RabbitMQ.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│   REST Service (Consumer)                                                   │
│   HTTP: Port 3000                                                           │
│   ◀─────────────────── Consumes messages from sum_queue ────────────────────┤
└─────────────────────────────────────────────────────────────────────────────┘
                                         ▲
                                         │
                                         │ Consume
                                         │
┌─────────────────────────────────┐   ┌──▼─────────────────────────────────────┐
│   gRPC Service (Producer)       │   │   RabbitMQ Message Broker              │
│   gRPC: Port 50051              │   │   Port 5672 (AMQP)                     │
│   ├─ Receives gRPC calls        │   │   ├─ sum_queue: Durable Queue          │
│   └─ Publishes to sum_queue ────┼──▶│   │   └─ Stores calculation results    │
└─────────────────────────────────┘   │                                        │
       ▲                              └────────────────────────────────────────┘
       │
       │ gRPC Calls
       │
   gRPC Clients
```

---

## 📦 Services

### 1. gRPC Service (`/grpc-service`)

**Purpose**: Provides gRPC-based microservice for mathematical operations and RabbitMQ integration.

**Technology Stack**:
- NestJS 11.0.1 (framework)
- gRPC (transport protocol)
- RabbitMQ (message broker)
- TypeScript

**Key Components**:

#### Main Entry Point (`src/main.ts`)
- Bootstraps a NestJS microservice using gRPC transport
- Listens on `0.0.0.0:50051`
- Loads protocol buffer definitions from `src/proto/sum.proto`

#### Protocol Buffers (`src/proto/sum.proto`)
Defines the gRPC service contract:
```protobuf
service SumService {
  rpc Add (AddRequest) returns (AddResponse) {}
}

message AddRequest {
  int32 a = 1;
  int32 b = 2;
}

message AddResponse {
  int32 result = 1;
}
```

#### SumModule (`src/grpc/sum.module.ts`)
- Aggregates SumController and RmqModule
- Provides dependency injection for RabbitMQ integration

#### SumController (`src/grpc/sum.controller.ts`)
Implements the gRPC service with the following operation:

**Add Operation**:
- **Endpoint**: `SumService.Add`
- **Input**: Two integers (a, b)
- **Output**: Sum of the two integers
- **Side Effect**: Publishes the result to RabbitMQ queue `sum_queue`
- **Flow**:
  1. Receives AddRequest with two numbers
  2. Calculates the sum
  3. Publishes result to `sum_queue` in RabbitMQ
  4. Returns the result to the caller

```typescript
@GrpcMethod('SumService', 'Add')
async add(data: AddRequest): Promise<AddResponse> {
  const { a, b } = data;
  const result = a + b;
  
  await this.rmq.publish('sum_queue', result.toString());
  
  return { result };
}
```

#### RabbitMQ Integration (`src/rmq/rmq.service.ts`)
**RmqService**: Manages RabbitMQ connection and messaging

**Lifecycle**:
- **onModuleInit**: Establishes connection to RabbitMQ at `amqp://guest:guest@localhost:5672`
- **onModuleDestroy**: Gracefully closes channel and connection

**Key Methods**:
- `publish(queue: string, message: string)`: Sends a message to a queue
  - Asserts queue existence with durable flag
  - Buffers the message and sends it
  - Logs publication for debugging

**Configuration**:
- Connection: `amqp://guest:guest@localhost:5672` (default credentials)
- Queues: Dynamically created with `durable: true` flag

**Build Scripts**:
```bash
npm run build      # Compiles TypeScript and copies proto files to dist/
npm run start:dev  # Watches for changes and restarts
npm run start:prod # Runs compiled version
npm run lint       # Lints TypeScript with ESLint
npm run test       # Runs Jest tests
```

---

### 2. REST Service (`/rest-service`)

**Purpose**: REST API consumer service that processes messages from RabbitMQ queues published by the gRPC service.

**Technology Stack**:
- NestJS 11.0.1 (framework)
- Express.js (HTTP server)
- RabbitMQ (message broker - consumer)
- TypeScript

**Current State**:
- Basic NestJS application module initialized
- Framework setup complete, ready for:
  - RabbitMQ consumer implementation
  - REST endpoints to expose processing results
  - Queue message handlers

**Main Entry Point** (`src/main.ts`):
- Currently configured as gRPC microservice (needs to be updated)
- Should be configured as HTTP server for REST endpoints
- Will need to integrate RabbitMQ consumer patterns

**App Module** (`src/app.module.ts`):
- Currently empty, ready for:
  - RabbitMQ consumer module
  - Controllers for REST endpoints
  - Services for message processing

**Expected Implementation**:
- Listen to `sum_queue` from RabbitMQ
- Process calculation results published by gRPC service
- Expose REST endpoints (e.g., `/results`, `/history`)
- Store or aggregate results from messages

**Build Scripts**:
```bash
npm run build      # Compiles TypeScript
npm run start:dev  # Watches for changes and restarts
npm run start:prod # Runs compiled version
npm run lint       # Lints TypeScript with ESLint
npm run test       # Runs Jest tests
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (recommended v22.10.7)
- Docker & Docker Compose
- RabbitMQ (either locally or in a container)
- pnpm (package manager)

### Local Development

#### 1. Start RabbitMQ
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:4-management-alpine
```
- RabbitMQ will be available at `amqp://localhost:5672`
- Management UI: `http://localhost:15672` (default: guest/guest)

#### 2. Install Dependencies
```bash
# gRPC Service
cd grpc-service
pnpm install

# REST Service
cd ../rest-service
pnpm install
```

#### 3. Run Services

**Terminal 1 - gRPC Service** (Producer):
```bash
cd grpc-service
pnpm run start:dev
# Service listens on 0.0.0.0:50051
# Publishes calculation results to RabbitMQ sum_queue
```

**Terminal 2 - REST Service** (Consumer):
```bash
cd rest-service
pnpm run start:dev
# Service listens on 0.0.0.0:3000 (when configured)
# Consumes messages from RabbitMQ sum_queue
```

### Testing the System

#### 1. Test gRPC Service (Producer)

Use a gRPC client like **grpcurl**:

```bash
# Install grpcurl
brew install grpcurl  # macOS
# or apt-get install grpcurl  # Linux

# Test Add operation
grpcurl -plaintext \
  -d '{"a": 5, "b": 3}' \
  localhost:50051 sum.SumService/Add
```

Expected Response:
```json
{
  "result": 8
}
```

#### 2. Verify Message in RabbitMQ

```bash
# Access RabbitMQ Management UI
open http://localhost:15672
# Login with guest/guest
# Navigate to Queues tab and find 'sum_queue'
# Should show 1 message in the queue
```

#### 3. Consume Messages (REST Service)

Once REST service is implemented:
```bash
# REST Service will automatically consume from sum_queue
# Messages will be processed and exposed via REST endpoints
echo "Example: GET /results will show consumed messages"
```

---

## 🐳 Docker Containerization

### Structure
- Each service has its own `package.json` and build configuration
- Services can be built independently or as part of a compose stack

### Building Docker Images
```bash
# Build gRPC service
docker build -t grpc-service:latest ./grpc-service

# Build REST service
docker build -t rest-service:latest ./rest-service
```

### Running with Docker Compose (Future)
Create a `docker-compose.yml` at the root to orchestrate all services including RabbitMQ.

---

## 📊 Communication Flow

### Current Implementation - Producer (gRPC Service)
```
gRPC Client Request
    │
    ▼ (gRPC Protocol)
SumService.Add() on port 50051
    │
    ├─▶ Calculate sum (a + b)
    │
    ├─▶ Publish result to RabbitMQ 'sum_queue'
    │    └─▶ Message: result value as string
    │
    ▼
Return result to gRPC client
```

### Future: Consumer (REST Service Integration)
```
REST API Client Request
    │
    ▼ (HTTP Protocol)
REST Service (Port 3000)
    │
    ├─▶ Consume messages from 'sum_queue'
    │    └─▶ Processes each published result
    │
    ├─▶ Store/aggregate results
    │
    ├─▶ Expose via REST endpoints
    │    ├─▶ /results - Get all results
    │    └─▶ /results/:id - Get specific result
    │
    ▼
Return JSON response to HTTP client
```

### Complete Flow (When Fully Implemented)
```
1. gRPC Client calls SumService.Add(5, 3)
        ▼
2. gRPC Service calculates 5 + 3 = 8
        ▼
3. gRPC Service publishes "8" to sum_queue
        ▼
4. REST Service (consumer) receives message from sum_queue
        ▼
5. REST Service processes and stores the result
        ▼
6. REST Client calls GET /results
        ▼
7. REST Service returns [{ result: 8, timestamp: ... }, ...]
```

---

## 📝 Development Scripts

Both services share similar npm scripts:

| Script | Purpose |
|--------|---------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Run production build |
| `npm run start:dev` | Run with hot reload (watch mode) |
| `npm run start:debug` | Debug mode with Inspector |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run Jest unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Generate coverage report |
| `npm run test:e2e` | Run end-to-end tests |

---

## 🔧 Configuration

### gRPC Service
- **Port**: 50051
- **Host**: 0.0.0.0 (all interfaces)
- **Proto Package**: sum
- **Proto Path**: `src/proto/sum.proto`

### RabbitMQ
- **URL**: `amqp://guest:guest@localhost:5672`
- **Queues**: 
  - `sum_queue`: Receives calculation results
- **Durable**: Yes (persists across restarts)

---

## 🛠️ Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | 11.0.1 | Framework |
| gRPC | 1.14.1 | Service communication |
| RabbitMQ | - | Message broker |
| TypeScript | - | Type-safe development |
| Jest | 30.0.0 | Testing |
| ESLint | 9.18.0 | Code quality |
| Prettier | 3.4.2 | Code formatting |

---

## 📚 Next Steps

1. **Complete REST Service Consumer**: 
   - Implement RabbitMQ consumer module
   - Add message handlers for `sum_queue`
   - Create REST endpoints to retrieve consumed messages
   - Add data persistence (database/in-memory storage)

2. **Add Error Handling**: 
   - Implement comprehensive error handling in both services
   - Add error queue handling in RabbitMQ
   - Retry logic for failed message processing

3. **Implement Logging**: 
   - Use structured logging library (Winston/Pino)
   - Log all gRPC calls, message publications, and consumption

4. **Add Metrics**: 
   - Prometheus metrics for monitoring
   - Track message throughput, latency

5. **Create Docker Compose**: 
   - Orchestrate gRPC service, REST service, and RabbitMQ
   - Network configuration for service discovery

6. **Add Integration Tests**: 
   - Test gRPC service producing to queue
   - Test REST service consuming from queue
   - End-to-end testing across services

7. **Deploy to Cloud**: 
   - Containerize and deploy to Kubernetes/Azure
   - Service scaling and monitoring

---

## 📄 License

UNLICENSED
