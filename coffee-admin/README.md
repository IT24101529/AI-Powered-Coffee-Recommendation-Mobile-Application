# ☕ Coffee Admin Dashboard
### IT2021 AIML Project — Feature 5: Trend Analysis & Popular Recommendations
**Student:** IT24100497 (Ishaak M.I.M)

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [PostgreSQL Setup](#postgresql-setup)
4. [IntelliJ IDEA Setup](#intellij-idea-setup)
5. [Running the Application](#running-the-application)
6. [Running Tests](#running-tests)
7. [Application Features](#application-features)
8. [API Endpoints](#api-endpoints)
9. [Project Structure](#project-structure)
10. [Troubleshooting](#troubleshooting)

---

## 📌 Project Overview

This is the **Admin Dashboard** component of the Coffee Recommendation System. It provides:

- 🔐 **Secure admin login** (Spring Security)
- 📊 **Sales analytics dashboard** with Chart.js visualisations
- 📈 **Trend Analysis engine** implementing the FR5 scoring formula
- 🤖 **Analytics Chatbot** for natural-language sales Q&A
- 🛍️ **Product catalogue** browser
- 🔄 **REST API** endpoints for trend and recommendation data

### Tech Stack
| Layer | Technology |
|---|---|
| Framework | Spring Boot 3.2.3 |
| Language | Java 17 |
| Database | PostgreSQL 16 |
| ORM | Spring Data JPA / Hibernate |
| Templates | Thymeleaf |
| Security | Spring Security 6 |
| Charts | Chart.js 4 |
| Build | Maven |
| IDE | IntelliJ IDEA |

---

## ✅ Prerequisites

Before you begin, install the following:

### 1. Java 17 (JDK)
- Download: https://adoptium.net/temurin/releases/?version=17
- After install, verify:
  ```bash
  java -version
  # Expected: openjdk version "17.x.x"
  ```

### 2. Maven 3.8+
- Download: https://maven.apache.org/download.cgi
- Or install via your package manager
- Verify:
  ```bash
  mvn -version
  ```
- **Note:** IntelliJ IDEA bundles Maven — you can skip this if using IntelliJ's built-in Maven.

### 3. PostgreSQL 16
- Download: https://www.postgresql.org/download/
- During installation, set:
  - **Username:** `postgres`
  - **Password:** `postgres`
  - **Port:** `5432` (default)
- Verify after install:
  ```bash
  psql --version
  # Expected: psql (PostgreSQL) 16.x
  ```

### 4. IntelliJ IDEA
- Download Community (free) or Ultimate: https://www.jetbrains.com/idea/download/
- Install the **Lombok plugin** (usually pre-installed in recent versions)

---

## 🐘 PostgreSQL Setup

### Step 1 – Create the database

Open **pgAdmin** (installed with PostgreSQL) or use the terminal:

**Option A – pgAdmin GUI:**
1. Open pgAdmin → right-click **Databases** → **Create → Database**
2. Name: `coffee_admin_db`
3. Click **Save**

**Option B – Terminal / psql:**
```bash
# Windows: open "SQL Shell (psql)" from Start menu
# Mac/Linux: open terminal

psql -U postgres
# Enter password: postgres

CREATE DATABASE coffee_admin_db;
\q
```

### Step 2 – Verify connection

```bash
psql -U postgres -d coffee_admin_db
# Should connect without error
\q
```

> **Tables are created automatically** by Spring Boot on first run (`ddl-auto=update`).  
> **Data is imported automatically** from the CSV files on first startup.

---

## 💡 IntelliJ IDEA Setup

### Step 1 – Open the project

1. Launch IntelliJ IDEA
2. Click **File → Open**
3. Navigate to and select the `coffee-admin` folder
4. Click **OK** → select **Open as Project**

### Step 2 – Enable Lombok annotation processing

1. Go to **File → Settings** (Windows/Linux) or **IntelliJ IDEA → Settings** (Mac)
2. Navigate to **Build, Execution, Deployment → Compiler → Annotation Processors**
3. ✅ Check **Enable annotation processing**
4. Click **OK**

### Step 3 – Verify Java SDK

1. Go to **File → Project Structure** (`Ctrl+Alt+Shift+S`)
2. Under **Project SDK**, select **Java 17**
3. Under **Project language level**, select **17**
4. Click **OK**

### Step 4 – Load Maven dependencies

In the right panel, click the **Maven** tab → click the **Reload All Maven Projects** button (circular arrow ♻️).

Wait for IntelliJ to download all dependencies (first time may take 2-5 minutes).

### Step 5 – Configure database credentials (if different)

Open `src/main/resources/application.properties` and update if needed:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/coffee_admin_db
spring.datasource.username=postgres
spring.datasource.password=postgres
```

---

## ▶️ Running the Application

### Option A – From IntelliJ IDEA (Recommended)

1. Open `src/main/java/com/coffee/admin/CoffeeAdminApplication.java`
2. Click the **green ▶ Play button** next to the `main` method
3. Or right-click the file → **Run 'CoffeeAdminApplication'**

### Option B – From Terminal

```bash
# Navigate to project root
cd coffee-admin

# Build and run
mvn spring-boot:run
```

### First-time startup

On **first run**, the application will:
1. Create all database tables automatically
2. Import all CSV data (~49,894 sales records, 88 products, 3 outlets)
3. Start the web server

This may take **30-60 seconds** on first startup. Watch the IntelliJ console for:
```
INFO  DataImportService - Imported 88 products
INFO  DataImportService - Imported 3 outlets
INFO  DataImportService - Imported 49894 sales receipts
INFO  DataImportService - CSV import complete.
```

Subsequent startups skip the import (data is already in PostgreSQL) and start in **~3 seconds**.

### Access the dashboard

Open your browser and go to:
```
http://localhost:8080
```

**Login credentials:**
| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

> Credentials can be changed in `application.properties` under `app.admin.username` and `app.admin.password`.

---

## 🧪 Running Tests

### From IntelliJ IDEA

1. Right-click `src/test/java/com/coffee/admin/CoffeeAdminTests.java`
2. Click **Run 'CoffeeAdminTests'**

Or run all tests:
- Right-click the `test` folder → **Run All Tests**

### From Terminal

```bash
mvn test
```

### Test coverage

| Test Class | Tests | What is Tested |
|---|---|---|
| `TrendServiceTest` | 4 | Trend recalculation, tier classification, DTO mapping |
| `ChatbotServiceTest` | 6 | Intent routing, response content, message persistence |
| `TrendDTOTest` | 2 | Badge class mapping, label formatting |

**Total: 12 unit tests**

---

## 🎯 Application Features

### 1. 📊 Dashboard (`/admin/dashboard`)
- KPI cards: Total Revenue, Transactions, Items Sold, Unique Customers
- Daily revenue trend line chart
- Revenue by outlet bar chart
- Hourly sales distribution bar chart
- Sales by product category doughnut chart
- In-store vs online pie chart
- Top 10 products table with visual progress bars

### 2. 📈 Trend Analysis (`/admin/trends`)

Implements **FR5.2 – FR5.4** from the project specification.

**Trend Score Formula (FR5):**
```
trend_score = (recent_sales × 0.5) + (growth_rate × 0.3) + (rating × 0.2)
```

**Product Tiers (FR5.3):**
| Tier | Criteria | Badge |
|---|---|---|
| ⭐ Bestseller | Top 10% by 30-day sales volume | Yellow |
| 📈 Trending Up | ≥30% week-over-week growth | Green |
| 💎 Hidden Gem | Below median volume but high trend score | Purple |
| 🌸 Seasonal | High performance in specific periods | Pink |

**Features:**
- Filter products by tier
- Top 10 horizontal bar chart
- Week-over-week growth rates
- Manual recalculation trigger
- Scheduled nightly recalculation (2 AM)

### 3. 🤖 Analytics Chatbot (`/admin/chatbot`)

Implements **FR5.7** – natural language sales Q&A.

**Supported queries:**
| Intent | Example |
|---|---|
| Revenue | "What is the total revenue?" |
| Top products | "What are the best-selling products?" |
| Trending | "What is trending this week?" |
| Hidden gems | "Show me hidden gems" |
| Peak hours | "When is the busiest time?" |
| Outlets | "Which outlet performs best?" |
| Customers | "How many unique customers?" |
| Categories | "Which category sells the most?" |
| Date range | "What is the data period?" |

**Chat features:**
- Quick-prompt buttons
- Typing indicator animation
- Bold/italic markdown rendering
- Session-based history
- Clear chat button
- Persistent history in PostgreSQL

### 4. 🛍️ Products (`/admin/products`)
- Full product catalogue (88 items)
- Live search/filter
- Promo and New product badges
- Category, pricing, and description display

---

## 🔌 API Endpoints

| Method | URL | Description |
|---|---|---|
| `POST` | `/api/chat` | Send chatbot message |
| `DELETE` | `/api/chat/{sessionId}` | Clear chat history |
| `POST` | `/api/trends/recalculate` | Trigger trend recalculation |
| `GET` | `/api/trends/popular` | Get bestseller products |
| `GET` | `/api/trends/growing` | Get trending-up products |
| `GET` | `/api/recommendations/trending` | Get top 10 trending |
| `GET` | `/api/stats` | Get dashboard statistics (JSON) |
| `GET` | `/api/products` | Get all products (JSON) |
| `GET` | `/api/products/{id}` | Get product by ID |
| `GET` | `/api/products/category/{cat}` | Get products by category |

### Example – Chat API
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the total revenue?", "sessionId": "test-session"}'
```

### Example – Trend Recalculation
```bash
curl -X POST http://localhost:8080/api/trends/recalculate \
  -H "X-XSRF-TOKEN: <token>"
```

---

## 📁 Project Structure

```
coffee-admin/
├── src/
│   ├── main/
│   │   ├── java/com/coffee/admin/
│   │   │   ├── CoffeeAdminApplication.java      # Entry point
│   │   │   ├── config/
│   │   │   │   └── SecurityConfig.java          # Spring Security
│   │   │   ├── controller/
│   │   │   │   ├── Controllers.java             # Auth, Dashboard, API
│   │   │   │   └── ProductApiController.java    # Products REST API
│   │   │   ├── dto/
│   │   │   │   ├── DashboardStats.java          # Dashboard data DTO
│   │   │   │   ├── TrendDTO.java                # Trend data DTO
│   │   │   │   ├── ChatRequest.java             # Chat input DTO
│   │   │   │   └── ChatResponse.java            # Chat output DTO
│   │   │   ├── model/
│   │   │   │   ├── Product.java                 # Product entity
│   │   │   │   ├── SalesReceipt.java            # Sales transaction entity
│   │   │   │   ├── TrendScore.java              # Computed trend scores
│   │   │   │   ├── ChatMessage.java             # Chat history entity
│   │   │   │   └── SalesOutlet.java             # Store/outlet entity
│   │   │   ├── repository/
│   │   │   │   ├── ProductRepo.java             # Product queries
│   │   │   │   ├── SalesReceiptRepo.java        # Sales analytics queries
│   │   │   │   ├── TrendScoreRepo.java          # Trend score queries
│   │   │   │   ├── ChatMessageRepo.java         # Chat history queries
│   │   │   │   └── SalesOutletRepo.java         # Outlet queries
│   │   │   └── service/
│   │   │       ├── DataImportService.java       # CSV → PostgreSQL import
│   │   │       ├── AnalyticsService.java        # Dashboard KPIs & charts
│   │   │       ├── TrendService.java            # FR5 trend scoring engine
│   │   │       └── ChatbotService.java          # NL chatbot Q&A engine
│   │   └── resources/
│   │       ├── application.properties           # Config (DB, credentials)
│   │       ├── data/                            # CSV source files
│   │       │   ├── 201904_sales_reciepts.csv
│   │       │   ├── product.csv
│   │       │   ├── sales_outlet.csv
│   │       │   └── ...
│   │       ├── static/css/
│   │       │   └── style.css                   # Coffee brown & white theme
│   │       └── templates/
│   │           ├── auth/login.html             # Login page
│   │           └── admin/
│   │               ├── dashboard.html          # Main dashboard
│   │               ├── trends.html             # Trend analysis
│   │               ├── chatbot.html            # Analytics chatbot
│   │               └── products.html           # Product catalogue
│   └── test/java/com/coffee/admin/
│       └── CoffeeAdminTests.java               # 12 unit tests
└── pom.xml                                     # Maven dependencies
```

---

## 🛠️ Troubleshooting

### ❌ "Connection refused" on startup
**Cause:** PostgreSQL is not running.  
**Fix:**
- Windows: Open **Services** → find **postgresql-x64-16** → click **Start**
- Mac: `brew services start postgresql@16`
- Linux: `sudo systemctl start postgresql`

### ❌ "password authentication failed for user postgres"
**Cause:** Wrong database password.  
**Fix:** Update `spring.datasource.password` in `application.properties` to match your PostgreSQL password.

### ❌ "Database coffee_admin_db does not exist"
**Fix:** Run this in psql or pgAdmin:
```sql
CREATE DATABASE coffee_admin_db;
```

### ❌ Lombok errors ("cannot find symbol")
**Fix:** 
1. Go to **File → Settings → Build → Compiler → Annotation Processors**
2. Enable annotation processing → OK
3. **Build → Rebuild Project**

### ❌ Port 8080 already in use
**Fix:** Change the port in `application.properties`:
```properties
server.port=9090
```
Then access at `http://localhost:9090`

### ❌ Trend table is empty
**Cause:** Trends haven't been calculated yet.  
**Fix:** Log in → go to **Trend Analysis** → click **🔄 Recalculate Trends**

### ❌ CSV import fails / no data on dashboard
**Cause:** CSV files not found at the configured path.  
**Fix:** Ensure CSVs are in `src/main/resources/data/`. The application reads them relative to the project working directory. In IntelliJ, the working directory is the project root by default.

---

## 📚 Assignment Alignment

| Assignment Criterion | How This Project Meets It |
|---|---|
| **FR5.1** – Track real-time sales data | `SalesReceiptRepo` queries with timestamps |
| **FR5.2** – Trend scoring formula | `TrendService.recalculateAll()` |
| **FR5.3** – Product tier classification | Bestseller / Trending Up / Hidden Gem / Seasonal |
| **FR5.4** – Inject trending into recommendations | `/api/recommendations/trending` endpoint |
| **FR5.5** – Social proof display | Trend Analysis table shows 7d/30d sales |
| **FR5.7** – Daily/weekly trend reports | Trend dashboard + `/api/trends/*` endpoints |
| **PP2: 75% implementation** | All 4 pages + API + ML scoring implemented |
| **PP2: Input validation** | Spring Security CSRF, null checks, error handling |
| **PP2: Unit testing** | 12 unit tests across TrendService & ChatbotService |
| **PP2: UI consistency** | Consistent coffee brown theme across all pages |
| **Final: AI/ML feature** | Trend scoring algorithm (collaborative filtering via scoring) |
| **Final: System integration** | REST API endpoints for other team members to consume |

---

## 🔐 Security Notes

- CSRF protection enabled on all POST requests
- Session-based authentication (Spring Security defaults)
- Admin credentials stored in `application.properties` — **change before deployment**
- SQL injection prevented by Spring Data JPA parameterised queries
- XSS prevention via Thymeleaf auto-escaping

---

*IT2021 AIML Project · 2nd Year Semester 2 · 2026 · SLIIT*
