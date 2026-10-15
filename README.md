# Vutto Auctions

Production-ready real-time auction marketplace for certified pre-owned two-wheelers.

[Live Demo](https://vutto-github-io.vercel.app/) · [API Health](https://vutto-github-io.onrender.com/api/v1/health) · [GitHub Repo](https://github.com/bhavyanjain3004/vutto.github.io)

---

## 🏗 System Architecture

```
┌────────────────────────────────────────────────────────┐
│               REACT 19 SPA (Vercel)                    │
│      TanStack Query (REST)  +  Socket.IO (WS)          │
└───────────────────┬────────────────┬───────────────────┘
                    │                │
            HTTP REST (/api/v1)      │ WebSocket duplex
                    │                │
┌───────────────────▼────────────────▼───────────────────┐
│               EXPRESS API & WEBSOCKETS (Render)        │
│   • Auth (Argon2 / JWT)       • Bid Engine             │
│   • Admin Routes              • Anti-Sniping Guard     │
│   • Middleware & CORS         • Socket.IO Rooms        │
└───────────────────────────┬────────────────────────────┘
                            │ Prisma ORM
                            ▼
┌────────────────────────────────────────────────────────┐
│               POSTGRESQL 16 (Neon)                     │
│   ACID Transactions · Row Versioning · Relational Data │
│   [Users]   [Bikes]   [Auctions]   [Bids]   [Tokens]   │
└────────────────────────────────────────────────────────┘
```

---

## ⚙️ Key Engineering Decisions

* **Atomic Bids via Prisma Transactions**: Bid creation, price validation, version counter increments, and auction price updates are wrapped in `prisma.$transaction`. This prevents race conditions and ensures zero price drift under simultaneous bids.
* **Socket.IO over SSE**: Real-time bidding requires room partitioning (`join:auction`). Socket.IO provides bi-directional events, room isolation, and instant outbid notifications out-of-the-box.
* **Dynamic Anti-Sniping Engine**: Bids placed in the final 120 seconds automatically extend the auction clock by +2 minutes, preventing bot sniping and giving human buyers a fair chance.
* **Argon2id + Single-Use Token Rotation**: Passwords use GPU-resistant Argon2id hashing. Access tokens expire in 15 minutes, while refresh tokens are hashed in PostgreSQL and rotated on every refresh to prevent replay attacks.

---

## ✨ Features

* **Live Bidding Engine**: Bid updates stream in real-time via Socket.IO rooms (`auction:<id>`) with zero polling.
* **Anti-Sniping Protection**: Real-time clock extension synchronized across all watching clients.
* **200-Point Inspection Badges**: Transparent condition scores (e.g. 9.2/10), verified odometer, and checkpoint tallies.
* **Checkout & Payment Simulation**: Won auction settlement flow supporting UPI QR, Cards, Net Banking, and transaction receipts.
* **Admin Telemetry**: Live KPI cards, hourly volume trends (Recharts), and system-wide bid logs.
* **Role-Based Access Control**: Strict route guarding for `BUYER` and `ADMIN` operations.

---

## 💻 Quickstart (Local Setup)

```bash
# 1. Clone repository
git clone https://github.com/bhavyanjain3004/vutto.github.io.git
cd vutto.github.io

# 2. Start PostgreSQL container
docker compose up -d postgres

# 3. Apply schema & seed demo data
npm run seed

# 4. Start backend & frontend (two terminals)
npm run backend       # Backend on http://localhost:3000/api/v1
npm run dev           # Frontend on http://localhost:5173
```

---

## 🔑 Test Credentials

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Buyer** | `buyer@vutto.test` | `vutto123` | Live bidding, garage tabs (Active / Won / Lost), checkout |
| **Admin** | `admin@vutto.test` | `vutto123` | Dashboard telemetry, bike creation, auction management |

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, TanStack Query v5, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js, Prisma ORM v6 |
| **Database** | PostgreSQL 16 (Local Docker / Cloud Neon Serverless) |
| **Real-time** | Socket.IO (WebSockets with bi-directional rooms) |
| **Security** | JWT, Argon2id, Refresh Token Rotation, Dynamic CORS |
| **Testing** | Jest, Supertest |
| **Hosting** | Vercel (Frontend), Render (Backend), Neon (Database) |

---

## 🗄 Database Schema

Defined declaratively in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma):

* **`User`**: `id`, `email`, `passwordHash` (Argon2), `name`, `role` (`BUYER` / `ADMIN`), `city`, `phone`.
* **`Bike`**: `id`, `brand`, `model`, `variant`, `year`, `kilometers`, `inspectionScore`, `checkpointsPassed`, `specs`.
* **`Auction`**: `id`, `bikeId`, `startingPrice`, `currentPrice`, `minIncrement`, `endsAt`, `status`, `version`.
* **`Bid`**: `id`, `auctionId`, `userId`, `amount`, `idempotencyKey`, `createdAt`.
* **`RefreshToken`**: `id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt`.

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new buyer account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate & issue tokens |
| `POST` | `/api/v1/auth/refresh` | Public | Rotate refresh token |
| `GET` | `/api/v1/auth/me` | User | Get current user profile |
| `GET` | `/api/v1/auctions` | Public | Catalog query (`?status=LIVE`) |
| `GET` | `/api/v1/auctions/:id` | Public | Auction detail & bike specs |
| `POST` | `/api/v1/auctions/:id/bids` | User | Place atomic bid with idempotency |
| `GET` | `/api/v1/bikes` | Public | Motorcycle inventory |
| `GET` | `/api/v1/bids` | Public | Recent bid telemetry |
| `GET` | `/api/v1/admin/stats` | Admin | Real-time platform metrics |
| `GET` | `/api/v1/health` | Public | Health probe & database ping |

---

## 🧪 Testing

Comprehensive integration test suites verifying bid concurrency, validation, and role protection:

```bash
npm test
```

```text
PASS test/auction-flow.test.js
PASS test/admin-protection.test.js
Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total (100% pass)
```

---

## 📁 Repository Layout

```text
vutto/
├── package.json              # Root scripts (npm run dev, backend, seed, test)
├── docker-compose.yml        # PostgreSQL container configuration
│
├── backend/                  # Node.js + Express + Prisma API
│   ├── prisma/schema.prisma  # Database models & relationships
│   ├── prisma/seed.js        # Seed script (10 bikes, 9 auctions, demo users)
│   ├── src/realtime/socket.js# Socket.IO room manager & live broadcast
│   ├── src/routes/           # auth, auctions, bikes, bids, admin, health
│   └── test/                 # Jest integration tests
│
└── frontend/                 # React 19 + Vite Application
    ├── src/pages/            # Home, Auctions, AuctionDetail, MyBids, Payment, Admin
    ├── src/components/       # AuctionCard, Countdown, Header, ProtectedRoute
    ├── src/lib/api.js        # REST client with automatic token refreshing
    ├── src/lib/realtime.js   # Socket.IO client hooks
    └── vercel.json           # SPA rewrite rules
```


>  This is a demo assignment project 
