<div align="center">

# WarmShare

### Share Warmth. Build Community.

**A Secure Clothing Donation and Distribution Management Platform**

[![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Language-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_Hosting-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel&logoColor=white)](https://vercel.com/)
![Tests](https://img.shields.io/badge/Tests-92_Passed-brightgreen)

[Live Application](https://2311080-warmshare.vercel.app/) ·
[API Documentation](https://2311080-warmshare.vercel.app/api/docs) ·
[API Health](https://2311080-warmshare.vercel.app/api/health) ·
[Repository](https://github.com/shaikaislamarpita/2311080-Warmshare)

**CSE309 | Autumn 2026 | Independent University, Bangladesh**

</div>

---

## Table of Contents

- [About WarmShare](#about-warmshare)
- [Project Information](#project-information)
- [Live Deployment](#live-deployment)
- [Key Features](#key-features)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Authentication and Security](#authentication-and-security)
- [Group Collaboration](#group-collaboration)
- [Application Dashboards](#application-dashboards)
- [Instructor Demo Accounts](#instructor-demo-accounts)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Database Design](#database-design)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Automated Testing](#automated-testing)
- [Production Deployment](#production-deployment)
- [Project Documentation](#project-documentation)
- [Author](#author)

---

## About WarmShare

WarmShare is a full-stack web application designed to simplify clothing donation management through a secure and collaborative digital platform.

The application enables individuals to publish clothing donations, discover available items, manage personal donation records, and collaborate through shared donation groups.

WarmShare combines secure authentication, role-based access control, ownership-based authorization, fine-grained group permissions, content moderation, and administrative management within a single platform.

### Project Objectives

- Make clothing donation management accessible and organized.
- Provide secure authentication and account management.
- Protect user resources through backend authorization.
- Enable controlled collaboration through shared groups.
- Maintain appropriate donation content through moderation.
- Provide administrative tools for user and security management.
- Deliver a responsive, publicly accessible web application.

---

## Project Information

| Field | Details |
| :--- | :--- |
| Project Name | WarmShare |
| Course | CSE309 |
| Semester | Autumn 2026 |
| Student ID | 2311080 |
| University | Independent University, Bangladesh |
| Project Type | Full-Stack Web Application |
| Architecture | React + FastAPI + PostgreSQL |
| Hosting Platform | Vercel |

---

## Live Deployment

The application is publicly deployed on Vercel with a persistent PostgreSQL database hosted on Supabase.

| Resource | Access Link |
| :--- | :--- |
| Live Application | [Open WarmShare](https://2311080-warmshare.vercel.app/) |
| API Health Check | [Check API Status](https://2311080-warmshare.vercel.app/api/health) |
| Swagger Documentation | [Explore REST API](https://2311080-warmshare.vercel.app/api/docs) |
| ReDoc Documentation | [View API Reference](https://2311080-warmshare.vercel.app/api/redoc) |
| OpenAPI Specification | [View OpenAPI JSON](https://2311080-warmshare.vercel.app/api/openapi.json) |
| Source Code | [GitHub Repository](https://github.com/shaikaislamarpita/2311080-Warmshare) |

> This application is intended for academic demonstration. Use fictional donation information and avoid publishing real residential addresses or sensitive personal information.

---

## Key Features

### Authentication and Account Management

- User registration and login.
- Secure logout and session invalidation.
- Argon2 password hashing with server-side pepper.
- JWT-based authentication.
- Automatic access token refresh.
- Refresh token rotation.
- Profile information updates.
- Secure password changes.
- Personal session management.
- Login rate limiting and account lockout protection.

### Donation Management

- Browse publicly available clothing donations.
- View individual donation details.
- Create, edit, and delete owned donation listings.
- Organize donations using clothing information and categories.
- Manage personal and group donation listings.
- Report inappropriate donation content.

### Group Collaboration

- Create shared donation groups.
- Manage group names and membership.
- Assign individual member permissions.
- Create and manage group donations.
- Enforce group ownership and membership authorization.

### Content Moderation

- Review pending donation reports.
- Resolve or dismiss reports.
- Record resolution notes.
- Hide and restore donation listings.
- View reviewed report history.
- Filter report history by status.

### Administrative Management

- Interactive application statistics.
- Paginated user management.
- Individual user detail views.
- User role management.
- Account banning and unbanning.
- Bulk account management.
- Administrative session revocation.
- Failed login monitoring.
- Administrative audit logs.
- Audit log CSV export.

---

## User Roles and Permissions

WarmShare implements three application-level roles.

| Role | Responsibilities |
| :--- | :--- |
| **User** | Personal donations, group collaboration, profile and session management |
| **Moderator** | Standard user capabilities and additional content moderation permissions |
| **Admin** | Administrative management, user authorization, security monitoring and application statistics |

### Permission Matrix

| Permission | User | Moderator | Admin |
| :--- | :---: | :---: | :---: |
| Browse public donations | ✓ | ✓ | ✓ |
| Create personal donations | ✓ | ✓ | ✓ |
| Edit owned donations | ✓ | ✓ | ✓ |
| Delete owned donations | ✓ | ✓ | ✓ |
| Manage personal profile | ✓ | ✓ | ✓ |
| Change own password | ✓ | ✓ | ✓ |
| Manage personal sessions | ✓ | ✓ | ✓ |
| Create and join groups | ✓ | ✓ | ✓ |
| Report donation listings | ✓ | ✓ | ✓ |
| Review donation reports | — | ✓ | ✓ |
| Hide and restore listings | — | ✓ | ✓ |
| Access moderation history API | — | ✓ | ✓ |
| Access admin dashboard | — | — | ✓ |
| Manage user roles | — | — | ✓ |
| Ban and unban users | — | — | ✓ |
| Bulk ban and unban | — | — | ✓ |
| Revoke other users' sessions | — | — | ✓ |
| Access administrative audit logs | — | — | ✓ |
| Export audit logs | — | — | ✓ |

> Application-level roles and group-level permissions are evaluated independently.

### Backend Authorization

Authorization is enforced through reusable backend dependencies and resource-level permission checks.

| Module | Responsibility |
| :--- | :--- |
| `permissions.py` | Role definitions and permission mappings |
| `rbac.py` | Reusable permission-checking dependencies |
| `dependencies.py` | User authentication, account and session validation |
| `security.py` | Password security and JWT operations |
| `group_service.py` | Group ownership and member permission checks |
| `listing_service.py` | Donation ownership and resource authorization |

Frontend role-based rendering improves usability, while the backend remains responsible for enforcing access restrictions.

---

## Authentication and Security

WarmShare implements multiple security layers to protect user accounts, authenticated sessions, and application resources.

### Security Overview

| Security Mechanism | Implementation |
| :--- | :--- |
| Password Hashing | Argon2 |
| Password Salt | Automatically generated by Argon2 |
| Password Pepper | Server-side HMAC-SHA256 |
| Access Token | Signed JWT |
| JWT Algorithm | HS256 |
| Access Token Lifetime | 15 minutes |
| Refresh Token Storage | Hashed server-side records |
| Refresh Token Delivery | HttpOnly cookie |
| Refresh Token Management | Rotation and revocation |
| Authorization | Backend RBAC |
| Resource Protection | Ownership and group permission checks |
| Login Protection | Rate limiting and temporary account lockout |
| Input Validation | Pydantic schemas |
| Secret Management | Environment variables |

### Password Security

Passwords are processed using a server-side pepper before being hashed with Argon2.

The password pepper is stored separately from the database using an environment variable. Argon2 automatically generates a salt during password hashing.

```mermaid
flowchart LR
    A[User Password] --> B[HMAC-SHA256]
    P[Server Pepper] --> B
    B --> C[Argon2]
    S[Random Salt] --> C
    C --> D[Stored Password Hash]
```

### JWT Authentication

After successful login, the backend generates a signed JWT access token containing:

| Claim | Purpose |
| :--- | :--- |
| `sub` | Authenticated user ID |
| `role` | User role |
| `sid` | Associated session identifier |
| `iat` | Token creation timestamp |
| `exp` | Token expiration timestamp |
| `jti` | Unique token identifier |

Protected API requests include the access token in the Authorization header.

```http
Authorization: Bearer <access_token>
```

The backend validates the token signature, expiration, account status, current user role, and associated session.

### Authentication Flow

```mermaid
sequenceDiagram
    actor U as User
    participant F as React Frontend
    participant B as FastAPI Backend
    participant D as PostgreSQL

    U->>F: Enter login credentials
    F->>B: POST /api/auth/login
    B->>D: Retrieve user account
    D-->>B: User information
    B->>B: Verify password and account status
    B->>D: Create session and refresh token record
    B-->>F: Access JWT and HttpOnly refresh cookie
    F->>B: GET /api/auth/me
    B-->>F: Authenticated user information
    F-->>U: Display authenticated interface
```

### Automatic Token Refresh

Access tokens expire after 15 minutes. The frontend can automatically request a replacement access token using the refresh cookie.

```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    participant D as Database

    F->>B: Protected request
    B-->>F: 401 Unauthorized
    F->>B: POST /api/auth/refresh
    B->>D: Validate refresh token and session
    B->>D: Rotate refresh token
    B-->>F: New access token and refresh cookie
    F->>B: Retry original request
    B-->>F: Protected response
```

The frontend coordinates concurrent refresh requests to avoid unnecessary simultaneous token refresh operations.

### Session Management

Authenticated logins are associated with server-side sessions.

Users can view and revoke their personal sessions. The administrator can revoke sessions belonging to other users through authorized administrative operations.

Logout invalidates the associated server-side session. Revoked and expired sessions are rejected during subsequent protected requests.

### Additional Security Controls

- Current password verification before password changes.
- Validation of new passwords.
- Account-based failed login tracking.
- Temporary account lockout.
- Protection against unauthorized role modification.
- Prevention of administrative self-role modification.
- Protection of administrator accounts from banning.
- Rejection of banned users on protected requests.
- Server-side ownership and membership validation.

---

## Group Collaboration

Groups allow multiple users to collaborate on clothing donation activities while maintaining controlled access to shared resources.

### Group Owner

The group owner can:

- Rename and delete the group.
- Add and remove members.
- Configure member permissions.
- Create, edit, and assign group donations.
- Manage group donation activities.

### Group Member Permissions

| Permission | Description |
| :--- | :--- |
| Create | Allows the member to create group donations |
| Edit | Allows the member to modify group donations |
| Assign | Allows the member to assign group donations |

Group member permissions are stored in the database and validated by the backend.

### Group Authorization Flow

```mermaid
flowchart TD
    A[Group Operation Request] --> B[Authenticate User]
    B --> C{Is Group Owner?}
    C -->|Yes| D[Allow Authorized Operation]
    C -->|No| E{Owner-Only Operation?}
    E -->|Yes| H[403 Forbidden]
    E -->|No| F{Is Group Member?}
    F -->|No| H
    F -->|Yes| G{Required Permission Granted?}
    G -->|Yes| D
    G -->|No| H
```

Group renaming, deletion, and membership management are reserved for the group owner.

---

## Application Dashboards

### User Dashboard

The User Dashboard provides personal donation, group, profile, and session management functionality.

| Section | Functionality |
| :--- | :--- |
| My Donations | View, create, edit and delete owned donations |
| Groups | Create groups and participate in shared donation activities |
| Group Members | Manage membership and permissions for owned groups |
| Profile | View and update account information |
| Password | Change account password |
| Sessions | View and revoke personal login sessions |

### Moderator Dashboard

The Moderator Dashboard provides tools for maintaining appropriate donation content.

| Section | Functionality |
| :--- | :--- |
| Pending Reports | Review submitted donation reports |
| Report Review | Resolve or dismiss reports with resolution notes |
| Listing Moderation | Hide and restore donation listings |
| Report History | View previously resolved and dismissed reports |
| History Filters | Filter reviewed reports by status |

Reviewed reports include relevant report information, resolution notes, reviewer information, and review timestamps.

### Admin Dashboard

The Admin Dashboard provides centralized application management and security monitoring.

#### Overview Statistics

The dashboard contains nine interactive statistics cards.

| Statistic | Description |
| :--- | :--- |
| Total Users | Total registered accounts |
| Donors | Accounts assigned the normal user role |
| Moderators | Accounts assigned the moderator role |
| Banned Users | Accounts currently marked as banned |
| Total Listings | Total donation listings |
| Visible Listings | Listings available for public viewing |
| Hidden Listings | Listings hidden through moderation |
| Pending Reports | Reports awaiting moderation |
| Active Sessions | Sessions that are not expired or revoked |

Each statistics card displays corresponding detailed records when selected.

#### User Management

- Paginated user listing.
- Search and filtering within the displayed user page.
- Individual user detail views.
- User role modification.
- Account ban and unban operations.
- Bulk ban and unban operations.
- Administrative session revocation.

#### User Detail View

The administrator can inspect account information, assigned roles, account status, donation listings, group ownership, group memberships, login sessions, and recent recorded activity.

#### Security Monitoring

The security monitoring section displays protected account identifier references, failed login counts, account lockout status, lockout expiration information, and update timestamps.

#### Administrative Audit Logs

Recorded activities include:

| Activity Category | Recorded Events |
| :--- | :--- |
| Role Management | User role changes |
| Account Management | Ban and unban operations |
| Session Management | Session revocation |
| Profile Management | Profile updates |
| Password Security | Password changes and failed password change attempts |
| Content Moderation | Listing moderation and report reviews |

Audit records include actor information, action, target, relevant details, and timestamps.

#### CSV Export

The administrator can download administrative audit logs as a CSV file through a permission-protected export endpoint.

---

## Instructor Demo Accounts

The following accounts are provided for evaluating the deployed application's authentication, authorization, administration, moderation, and collaboration features.

| User ID | Name | Login Email | Role |
| :---: | :--- | :--- | :--- |
| 15 | shaika | `aa@gmail.com` | **Admin** |
| 22 | rita islam | `12@iub.edu.bd` | **Moderator** |
| 23 | test | `test@gmail.com` | **User** |
| 21 | rupa | `123@iub.edu.bd` | **User** |
| 8 | arpita | `arpita@gmail.com` | **User** |

> Demo account passwords are provided separately through the final submission form and PDF report. Passwords are not published in this repository.

### Recommended Demonstration Scenarios

| Account | Demonstration |
| :--- | :--- |
| Admin | Statistics, user management, role changes, account restrictions, sessions, audit logs and CSV export |
| Moderator | Donation reports, listing moderation and report history |
| Normal User | Authentication, personal donations, profile, sessions and ownership-based authorization |
| Group Owner | Group management and member permission configuration |
| Group Member | Allowed and restricted group donation operations |

### Shared Group Demo

| Information | Details |
| :--- | :--- |
| Group Name | `test` |
| Group Owner | test |
| Owner Email | `test@gmail.com` |
| Owner User ID | 23 |

#### Group Membership and Permissions

| User ID | Group Role | Create | Edit | Assign |
| :---: | :--- | :---: | :---: | :---: |
| 23 | Owner | ✓ | ✓ | ✓ |
| 12 | Member | ✓ | — | ✓ |
| 22 | Member | ✓ | — | ✓ |
| 2 | Member | ✓ | — | ✓ |

#### Group Permission Testing

1. Log in using User ID 23 to demonstrate group owner privileges.
2. Log in using User ID 22 to demonstrate restricted member privileges.
3. Create a group donation using the member account.
4. Demonstrate an allowed assignment operation.
5. Attempt to edit a group donation without the edit permission.
6. Demonstrate that group settings and membership management are owner-controlled.

These scenarios demonstrate backend-enforced group permissions independently of application-level roles.

---

## Technology Stack

### Frontend

| Technology | Purpose |
| :--- | :--- |
| React | Component-based user interface |
| TypeScript | Type-safe frontend development |
| Vite | Development server and production build |
| CSS | Application styling and responsive layouts |

### Backend

| Technology | Purpose |
| :--- | :--- |
| Python | Backend programming language |
| FastAPI | REST API development |
| SQLAlchemy | Object-relational mapping |
| Pydantic | Request and response validation |
| JWT | Access token authentication |
| Argon2 | Secure password hashing |

### Database, Testing and Deployment

| Technology | Purpose |
| :--- | :--- |
| PostgreSQL | Relational database |
| Supabase | Hosted PostgreSQL database |
| Pytest | Automated backend testing |
| Vercel | Frontend and backend deployment |
| Git | Version control |
| GitHub | Repository and development history |
| Swagger / OpenAPI | Interactive API documentation |

---

## System Architecture

WarmShare follows a layered architecture that separates presentation, API communication, authentication, authorization, business logic, and database operations.

```mermaid
flowchart TD
    U[User Browser]

    subgraph Frontend
        UI[React Components]
        TS[TypeScript Application Logic]
        API[Frontend API Services]
        UI --> TS --> API
    end

    subgraph Backend
        R[FastAPI Routers]
        A[Authentication Dependencies]
        P[RBAC and Resource Authorization]
        S[Business Logic Services]
        O[SQLAlchemy ORM]
        R --> A --> P --> S --> O
    end

    subgraph Database
        DB[(Supabase PostgreSQL)]
    end

    U --> UI
    API <-->|HTTP and JSON| R
    O <--> DB
```

### Architecture Responsibilities

| Layer | Responsibility |
| :--- | :--- |
| Presentation | React components, dashboards, forms and application state |
| API Communication | HTTP requests, token handling and response processing |
| API Routing | REST endpoint definitions and request handling |
| Authentication | JWT, user account and session validation |
| Authorization | Role, ownership and group permission checks |
| Business Logic | Authentication, donation, group, moderation and administrative operations |
| Data Access | SQLAlchemy database queries and transactions |
| Persistence | PostgreSQL data storage |

Public endpoints, such as public donation browsing, do not require authentication. Protected endpoints apply the relevant authentication and authorization checks.

---

## Database Design

WarmShare uses a relational PostgreSQL database for persistent application storage.

### Database Entities

| Entity | Responsibility |
| :--- | :--- |
| User | Account information, password hashes, roles and account status |
| Listing | Clothing donation information and moderation status |
| Group | Shared donation groups and ownership |
| GroupMember | Group membership and individual permissions |
| UserSession | Authenticated login sessions |
| RefreshToken | Hashed refresh token records |
| ListingReport | Donation reports and review information |
| AuditLog | Recorded administrative and security activities |
| LoginRateLimit | Failed login tracking and account lockout information |

### Conceptual Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ LISTING : owns
    USER ||--o{ GROUP : owns
    USER ||--o{ GROUP_MEMBER : participates
    GROUP ||--o{ GROUP_MEMBER : contains
    GROUP o|--o{ LISTING : organizes
    USER ||--o{ USER_SESSION : establishes
    USER_SESSION ||--o{ REFRESH_TOKEN : uses
    USER ||--o{ LISTING_REPORT : submits
    LISTING ||--o{ LISTING_REPORT : receives
    USER o|--o{ AUDIT_LOG : performs
```

The database structure supports account management, donation ownership, collaborative groups, session validation, refresh token rotation, moderation, and administrative activity tracking.

---

## API Reference

WarmShare exposes REST API endpoints through FastAPI.

The complete API specification, request schemas, response schemas, and endpoint authentication requirements are available through the deployed API documentation.

- [Swagger UI](https://2311080-warmshare.vercel.app/api/docs)
- [ReDoc](https://2311080-warmshare.vercel.app/api/redoc)
- [OpenAPI JSON](https://2311080-warmshare.vercel.app/api/openapi.json)

<details>
<summary><strong>Authentication and Account Endpoints</strong></summary>

<br>

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Authenticate a user |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate authenticated session |
| GET | `/api/auth/me` | Retrieve current user |
| PATCH | `/api/auth/me` | Update profile information |
| POST | `/api/auth/change-password` | Change account password |
| GET | `/api/auth/sessions` | Retrieve personal sessions |
| DELETE | `/api/auth/sessions/{session_id}` | Revoke personal session |

</details>

<details>
<summary><strong>Donation Endpoints</strong></summary>

<br>

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/listings` | Retrieve public donations |
| POST | `/api/listings` | Create donation |
| GET | `/api/listings/{listing_id}` | Retrieve donation details |
| PUT | `/api/listings/{listing_id}` | Update authorized donation |
| DELETE | `/api/listings/{listing_id}` | Delete authorized donation |
| POST | `/api/listings/{listing_id}/reports` | Submit donation report |

</details>

<details>
<summary><strong>Group API</strong></summary>

<br>

**Base path:** `/api/groups`

The group API supports:

- Group creation and retrieval.
- Group renaming and deletion.
- Group membership management.
- Member permission configuration.
- Group donation retrieval.

Complete group endpoint definitions are available in Swagger UI.

</details>

<details>
<summary><strong>Moderation Endpoints</strong></summary>

<br>

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/listings/moderation/listings` | Retrieve moderation listings |
| GET | `/api/listings/moderation/reports` | Retrieve pending reports |
| GET | `/api/listings/moderation/reports/history` | Retrieve reviewed reports |
| PATCH | `/api/listings/{listing_id}/moderation` | Hide or restore listing |
| PATCH | `/api/listings/moderation/reports/{report_id}` | Resolve or dismiss report |

</details>

<details>
<summary><strong>Administrative Endpoints</strong></summary>

<br>

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/admin/dashboard/stats` | Retrieve dashboard statistics |
| GET | `/api/admin/dashboard/active-sessions` | Retrieve active sessions |
| GET | `/api/admin/users` | Retrieve registered users |
| GET | `/api/admin/users/paginated` | Retrieve paginated users |
| GET | `/api/admin/users/{user_id}` | Retrieve user details |
| PATCH | `/api/admin/users/{user_id}/role` | Update user role |
| PATCH | `/api/admin/users/{user_id}/ban` | Ban or unban user |
| PATCH | `/api/admin/users/bulk-ban` | Bulk ban or unban |
| DELETE | `/api/admin/users/{user_id}/sessions` | Revoke user sessions |
| GET | `/api/admin/audit-logs` | Retrieve audit logs |
| GET | `/api/admin/security/failed-logins` | Retrieve failed login information |
| GET | `/api/admin/export/audit-logs` | Export audit logs as CSV |

</details>

### Authorization Responses

| HTTP Status | Meaning |
| :---: | :--- |
| 401 | Missing, invalid or expired authentication |
| 403 | Insufficient permission or restricted account |
| 404 | Requested resource not found |
| 422 | Request validation failed |
| 429 | Request rate limit exceeded |

---

## Project Structure

```text
2311080-Warmshare/
│
├── backend/
│   ├── migrations/
│   │
│   ├── routers/
│   │   ├── admin.py
│   │   ├── auth.py
│   │   ├── groups.py
│   │   └── listings.py
│   │
│   ├── services/
│   │   ├── admin_dashboard_service.py
│   │   ├── admin_service.py
│   │   ├── audit_service.py
│   │   ├── auth_service.py
│   │   ├── export_service.py
│   │   ├── group_service.py
│   │   ├── listing_service.py
│   │   ├── moderation_service.py
│   │   └── security_monitoring_service.py
│   │
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_admin_rbac.py
│   │   ├── test_admin_user_details.py
│   │   ├── test_auth.py
│   │   ├── test_auth_security.py
│   │   ├── test_group_permissions.py
│   │   ├── test_listing_rbac.py
│   │   └── test_moderation.py
│   │
│   ├── create_tables.py
│   ├── database.py
│   ├── dependencies.py
│   ├── main.py
│   ├── models.py
│   ├── permissions.py
│   ├── provision_admin.py
│   ├── rbac.py
│   ├── schemas.py
│   ├── security.py
│   ├── requirements.txt
│   └── requirements-dev.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   │
│   ├── index.html
│   ├── package.json
│   └── package-lock.json
│
├── docs/
│   ├── 01-prd.md
│   ├── 02-srs.md
│   └── 03-tdd.md
│
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
└── vercel.json
```

### Backend Organization

| Directory / File | Purpose |
| :--- | :--- |
| `routers/` | REST API endpoint definitions |
| `services/` | Application business logic |
| `migrations/` | Database schema migration scripts |
| `tests/` | Automated backend tests |
| `models.py` | SQLAlchemy database models |
| `schemas.py` | Pydantic validation schemas |
| `security.py` | Password and token security |
| `dependencies.py` | Authentication dependencies |
| `permissions.py` | Role and permission definitions |
| `rbac.py` | Permission enforcement |
| `database.py` | Database configuration |
| `main.py` | FastAPI application entry point |

---

## Getting Started

### Prerequisites

Ensure the following tools are installed:

- Python 3.11 or a compatible version.
- Node.js compatible with the project's Vite version.
- npm.
- Git.
- PostgreSQL or a Supabase database connection.

### 1. Clone the Repository

```bash
git clone https://github.com/shaikaislamarpita/2311080-Warmshare.git
cd 2311080-Warmshare
```

### 2. Create a Python Virtual Environment

```bash
python -m venv .venv
```

**Windows PowerShell**

```powershell
.\.venv\Scripts\Activate.ps1
```

**Linux / macOS**

```bash
source .venv/bin/activate
```

### 3. Install Backend Dependencies

```bash
python -m pip install -r backend/requirements.txt
```

For development and automated testing:

```bash
python -m pip install -r backend/requirements-dev.txt
```

### 4. Configure Environment Variables

Create the following file in the project root:

```text
.env.development.local
```

Use `.env.example` and the environment configuration section below as references.

Configure a dedicated development database and the required server-side secrets.

### 5. Initialize the Database

For a new development database, load the environment configuration and create the application tables.

```bash
python -c "from dotenv import load_dotenv; load_dotenv('.env.development.local'); from backend.database import Base, engine; import backend.models; Base.metadata.create_all(bind=engine)"
```

For existing databases, review the relevant migration scripts before applying schema changes.

> Do not perform development database initialization or migration operations against an unintended production database.

### 6. Start the Backend

From the project root:

```bash
python -m uvicorn backend.main:app --reload --env-file .env.development.local
```

### 7. Start the Frontend

Open a separate terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

### Local Development URLs

| Service | URL |
| :--- | :--- |
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| API Health | http://localhost:8000/api/health |
| Swagger UI | http://localhost:8000/api/docs |

### Production Frontend Build

From the project root:

```bash
cd frontend
npm run build
```

The generated frontend build is located in:

```text
frontend/dist/
```

---

## Environment Configuration

WarmShare uses environment variables to separate sensitive configuration from application source code.

### Required Environment Variables

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL database connection string |
| `JWT_SECRET_KEY` | Secret used for JWT signing and verification |
| `PASSWORD_PEPPER` | Server-side password pepper |
| `LOGIN_RATE_LIMIT_SECRET` | Secret used to protect login rate-limit identifiers |
| `ENVIRONMENT` | Application environment configuration |

### Example Configuration

```env
DATABASE_URL=postgresql://username:password@host:5432/database

JWT_SECRET_KEY=replace-with-a-long-random-secret

PASSWORD_PEPPER=replace-with-a-long-random-password-pepper

LOGIN_RATE_LIMIT_SECRET=replace-with-another-long-random-secret

ENVIRONMENT=development
```

The values above are placeholders.

Use independently generated, sufficiently long random secrets for each security-related variable.

### Environment Security

- Never commit actual environment credentials.
- Keep database credentials and security secrets server-side.
- Store the password pepper separately from the database.
- Preserve the existing pepper when maintaining compatibility with stored password hashes.
- Configure production secrets through Vercel environment settings.

---

## Automated Testing

WarmShare includes automated backend tests using Pytest to validate authentication, authorization, resource ownership, group permissions, administrative operations, and content moderation.

### Latest Local Test Results

| Metric | Result |
| :--- | :--- |
| Passed Tests | **92** |
| Failed Tests | **0** |
| Warnings | 2 |
| Execution Time | 39.60 seconds |
| Test Pass Rate | 100% |

```text
92 passed, 2 warnings in 39.60s
```

### Test Coverage

| Test File | Coverage Area |
| :--- | :--- |
| `test_auth.py` | Registration and authentication |
| `test_auth_security.py` | Password, token and session security |
| `test_admin_rbac.py` | Administrative authorization |
| `test_admin_user_details.py` | Administrative user detail operations |
| `test_group_permissions.py` | Group ownership and member permissions |
| `test_listing_rbac.py` | Donation ownership and access control |
| `test_moderation.py` | Donation reporting and content moderation |

### Running the Tests

Activate the Python virtual environment and execute the following command from the project root:

```bash
python -c "from dotenv import load_dotenv; load_dotenv('.env.development.local'); import pytest; raise SystemExit(pytest.main(['-q']))"
```

The required environment variables must be available before the backend modules are imported.

The automated test configuration uses an isolated SQLite database for test execution.

---

## Production Deployment

WarmShare is deployed using Vercel for the frontend and backend, with Supabase providing persistent PostgreSQL database storage.

```mermaid
flowchart LR
    U[User Browser]

    subgraph Vercel
        F[React Frontend]
        B[FastAPI Backend]
        F <-->|REST API| B
    end

    subgraph Supabase
        D[(PostgreSQL)]
    end

    U --> F
    B <--> D
```

### Deployment Configuration

| Component | Configuration |
| :--- | :--- |
| Frontend Hosting | Vercel |
| Backend Hosting | Vercel |
| Database Hosting | Supabase |
| Database Engine | PostgreSQL |
| API Communication | Same-origin REST API |
| Production Configuration | Vercel environment variables |
| Deployment File | `vercel.json` |
| Production Branch | `main` |

The hosted PostgreSQL database maintains persistent application records independently of individual Vercel function executions.

---

## Project Documentation

Supporting project documentation is maintained in the `docs/` directory.

| Document | Description |
| :--- | :--- |
| [Product Requirements Document](docs/01-prd.md) | Product objectives, scope and requirements |
| [Software Requirements Specification](docs/02-srs.md) | Functional and non-functional requirements |
| [Technical Design Document](docs/03-tdd.md) | System architecture and technical design |
| [API Documentation](https://2311080-warmshare.vercel.app/api/docs) | Interactive API specification |
| [GitHub Repository](https://github.com/shaikaislamarpita/2311080-Warmshare) | Source code and development history |
| [GitHub Issues](https://github.com/shaikaislamarpita/2311080-Warmshare/issues) | Development tasks and issue tracking |
| [Pull Requests](https://github.com/shaikaislamarpita/2311080-Warmshare/pulls) | Feature integration and development changes |

---

## Author

| Information | Details |
| :--- | :--- |
| Student ID | 2311080 |
| Course | CSE309 |
| Semester | Autumn 2026 |
| University | Independent University, Bangladesh |
| GitHub | [shaikaislamarpita](https://github.com/shaikaislamarpita) |

Developed as an academic full-stack web application project focusing on secure authentication, role-based authorization, collaborative resource management, content moderation, and administrative management.

---

<div align="center">

### WarmShare

**Share Warmth. Build Community.**

[Live Application](https://2311080-warmshare.vercel.app/) ·
[API Documentation](https://2311080-warmshare.vercel.app/api/docs) ·
[Source Code](https://github.com/shaikaislamarpita/2311080-Warmshare)

CSE309 · Autumn 2026 · Independent University, Bangladesh

</div>
