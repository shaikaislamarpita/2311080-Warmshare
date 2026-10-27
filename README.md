
<div align="center">

# WarmShare

### Share Warmth. Build Community.

**A Clothing Donation and Distribution Management Platform**

A community-driven platform connecting people who want to donate clothing with people and organizations who need it.

[Live Website](https://2311080-warmshare.vercel.app) | [GitHub Repository](https://github.com/shaikaislamarpita/2311080-Warmshare) | [API Health Check](https://2311080-warmshare.vercel.app/api/health)

</div>

---

## 1. Project Overview

WarmShare is a full-stack web application designed to make clothing donation easier, more organized, transparent, and accessible.

Many people have usable clothing that they no longer need, while others struggle to access essential clothing. Traditional donation methods can be unorganized, making it difficult for donors to find recipients and for recipients to locate available donations.

WarmShare aims to solve this problem by providing a centralized platform where individuals can donate clothing, request available items, and coordinate the donation process.

The complete platform is designed to support individual users, NGOs, volunteers, and administrators.

### Project Objectives

- Make clothing donation simple and accessible.
- Connect donors and recipients through one platform.
- Reduce clothing waste by encouraging reuse.
- Help NGOs coordinate clothing distribution.
- Provide transparent donation tracking.
- Protect users' personal information.
- Support secure donation claiming and collection.
- Build a reliable community-based donation network.

---

## 2. The Problem

Clothing donation currently faces several challenges:

1. Donors may not know where to donate usable clothing.
2. People in need may struggle to find available clothing.
3. Donation information is scattered across different platforms.
4. NGOs may face difficulties managing donation campaigns.
5. Donation requests and availability may not be tracked properly.
6. Personal information can be exposed during pickup coordination.
7. There may be limited transparency regarding donation status.

WarmShare is designed to address these challenges through a structured donation management system.

---

## 3. Proposed Solution

WarmShare provides a centralized platform where users can:

- Create clothing donation listings.
- Browse available clothing.
- Search and filter donations.
- Request or claim clothing.
- Track donation status.
- Coordinate collection.
- Participate in NGO donation campaigns.
- Volunteer for distribution activities.
- Manage their personal information.

The platform is designed around privacy, security, and accessibility.

---

## 4. User Account System

WarmShare uses a unified account system.

A person does not need separate accounts to donate clothing and receive donations.

A single general user account supports both activities.

### User Types and Responsibilities

| Account Type | Responsibilities |
|---|---|
| General User | Donate clothing, claim items, manage listings, track donations |
| Verified NGO | Manage organizational donation campaigns and distribution |
| Approved Volunteer | Assist with assigned collection and distribution tasks |
| Administrator | Verify accounts, manage reports, moderate platform activity |

NGO and volunteer permissions are additional verified responsibilities.

A general user may apply to become an approved volunteer or represent a verified NGO without creating a second personal account.

---

## 5. Main Features

### 5.1 User Registration and Authentication

- User registration
- Secure login and logout
- Password hashing
- Authentication tokens
- Account profile management
- Duplicate email prevention
- Role-based authorization
- Account recovery
- Account deletion requests

### 5.2 Clothing Donation Management

- Create donation listings
- View available donations
- View individual donation details
- Update personal donation listings
- Delete or withdraw personal listings
- Search and filter clothing
- Select clothing categories
- Specify clothing size
- Specify age group
- Specify clothing condition
- Specify quantity
- Track listing availability

### 5.3 Donation Claiming System

- Browse available clothing
- Request clothing donations
- Specify requested quantity
- Prevent claims exceeding available quantity
- Track claim status
- Cancel claims
- Release reserved quantities
- View claim history

### 5.4 Donation Collection and Tracking

The planned donation lifecycle includes:

**Available → Claimed → Collected**

Additional workflows support:

- Claim cancellation
- Donation withdrawal
- Quantity reservation
- Collection confirmation
- Donation history
- Authorized pickup coordination

### 5.5 NGO Management

- NGO registration
- Organization verification
- NGO profiles
- Donation campaigns
- Campaign requirements
- Donation pledges
- Campaign progress tracking
- Distribution records

### 5.6 Volunteer Management

- Volunteer applications
- Volunteer verification
- Collection assignments
- Distribution assignments
- Task status updates
- Volunteer activity history

### 5.7 Administrative Management

- User management
- NGO verification
- Volunteer approval
- Donation moderation
- Report management
- Suspicious activity review
- Platform activity monitoring

### 5.8 Dashboard and User Experience

- Responsive interface
- Donation dashboard
- Personal donation history
- Claim history
- Search and filtering
- Donation statistics
- Clear validation messages
- User-friendly navigation

---

## 6. Privacy and Data Protection

Protecting user information is a major design requirement of WarmShare.

The platform is being designed to follow privacy-by-design principles.

### 6.1 Personal Information Protection

The platform should collect only information necessary for donation coordination.

Personal information such as email addresses, phone numbers, and private addresses must not be publicly accessible.

### 6.2 Pickup Address Privacy

Public donation listings should display an approximate pickup area rather than an exact private address.

Exact pickup information should only be accessible to authorized participants when required for collection.

### 6.3 Authentication Security

The authentication system is designed to use:

- Secure password hashing
- Authentication token validation
- Protected API endpoints
- Secure account sessions
- Server-side permission verification

### 6.4 Role-Based Access Control

Users should only access functionality permitted by their responsibilities.

For example:

- General users manage their own listings.
- Verified NGOs manage authorized campaigns.
- Volunteers access assigned tasks.
- Administrators access authorized management functions.

### 6.5 Listing Ownership

Users should not be able to modify or delete donation listings belonging to another user.

Listing ownership must be verified by the backend.

### 6.6 Data Security

The platform's security requirements include:

- HTTPS communication
- Secure environment variables
- Restricted database access
- Backend input validation
- Protection against unauthorized requests
- Appropriate rate limiting
- Safe error handling
- Audit logging for sensitive actions

### 6.7 User Privacy Rights

The complete system is intended to support:

- Profile information updates
- Privacy preferences
- Personal data access requests
- Account deletion requests
- Appropriate data retention policies

### Current Security Status

The current deployed version is a development MVP.

It supports donation listing CRUD operations, but authentication, authorization, and public/private address separation are still being implemented.

**The current public demo should only be used with fictional test data. Do not submit real home addresses, private contact information, or other sensitive personal information.**

The application must undergo security testing before being used for real-world donation coordination.

---

## 7. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Programming Language | TypeScript |
| Frontend Build Tool | Vite |
| Backend | FastAPI |
| Backend Language | Python |
| Database | PostgreSQL |
| Database Platform | Supabase |
| ORM | SQLAlchemy |
| Data Validation | Pydantic |
| Deployment | Vercel |
| Version Control | Git |
| Repository Management | GitHub |

---

## 8. System Architecture

WarmShare follows a frontend-backend architecture.

```text
                  USER
                    |
                    v
          React + TypeScript
              Frontend
                    |
                    | HTTP Requests
                    v
              FastAPI
               Backend
                    |
                    v
              SQLAlchemy
                    |
                    v
          Supabase PostgreSQL
               Database
```

### How It Works

1. The user interacts with the React frontend.
2. React sends an HTTP request to the FastAPI backend.
3. FastAPI validates the request.
4. SQLAlchemy communicates with PostgreSQL.
5. PostgreSQL stores or retrieves the requested data.
6. FastAPI returns a response.
7. React updates the interface.

---

## 9. Current Database Model

The implemented MVP uses a donation listing model.

### Listings Table

| Field | Description |
|---|---|
| id | Unique listing identifier |
| title | Donation title |
| category | Clothing category |
| size | Clothing size |
| age_group | Intended age group |
| gender | Gender category |
| condition | Clothing condition |
| quantity | Number of items |
| pickup_address | Pickup address |
| created_at | Listing creation timestamp |

### Planned Database Extensions

The complete system is designed to include:

- Users
- User permissions
- Donation listings
- Donation claims
- Pickup assignments
- NGO profiles
- Donation campaigns
- Volunteer assignments
- Reports
- Audit logs

These additional entities will be introduced during further development.

---

## 10. REST API Documentation

The current backend provides the following API endpoints.

**Base URL:**

```text
https://2311080-warmshare.vercel.app/api
```

### API Endpoints

| Method | Endpoint | Description | Success Status |
|---|---|---|---|
| GET | /health | Check backend status | 200 |
| GET | /hello | Test API response | 200 |
| POST | /listings | Create a listing | 201 |
| GET | /listings | Retrieve all listings | 200 |
| GET | /listings/{id} | Retrieve one listing | 200 |
| PUT | /listings/{id} | Update a listing | 200 |
| DELETE | /listings/{id} | Delete a listing | 204 |

### CRUD Operations

**Create**

Adds a new clothing donation listing.

**Read Single**

Retrieves one donation listing using its ID.

**Read List**

Retrieves all available listing records.

**Update**

Updates an existing donation listing.

**Delete**

Removes a donation listing.

### Example JSON Request

```json
{
  "title": "Winter Sweater",
  "category": "Sweater",
  "size": "M",
  "age_group": "Adult",
  "gender": "Unisex",
  "condition": "Good",
  "quantity": 2,
  "pickup_address": "Demo Location"
}
```

The example uses fictional pickup information.

---

## 11. Project Folder Structure

```text
2311080-Warmshare/
|
|-- backend/
|   |-- main.py
|   |-- database.py
|   |-- models.py
|   |-- schemas.py
|   |-- requirements.txt
|
|-- frontend/
|   |-- src/
|   |   |-- App.tsx
|   |   |-- index.css
|   |
|   |-- index.html
|   |-- vite.config.ts
|
|-- vercel.json
|-- README.md
```

---

## 12. Installation and Local Setup

### Prerequisites

Install:

- Python 3.10 or newer
- Node.js 22 or newer
- Git
- VS Code

A PostgreSQL database connection is required.

### Step 1: Clone the Repository

```bash
git clone https://github.com/shaikaislamarpita/2311080-Warmshare.git
```

```bash
cd 2311080-Warmshare
```

### Step 2: Install Backend Dependencies

From the project root:

```bash
pip install -r backend/requirements.txt
```

### Step 3: Configure the Database

Create a local environment file:

```text
.env.development.local
```

Configure the database connection using the environment variable expected by `backend/database.py`.

Do not upload database credentials or environment files to GitHub.

### Step 4: Start the Backend

From the project root:

```bash
python -m uvicorn backend.main:app --reload --env-file .env.development.local
```

Backend URL:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

### Step 5: Install Frontend Dependencies

Open another terminal.

```bash
cd frontend
```

```bash
npm install
```

### Step 6: Start the Frontend

```bash
npm run dev
```

Open the local URL displayed by Vite.

Usually:

```text
http://localhost:5173
```

---

## 13. Deployment

WarmShare is deployed using Vercel.

The application uses:

- Vercel for frontend and backend deployment
- Supabase PostgreSQL for persistent data storage
- GitHub for source code management

### Live Application

https://2311080-warmshare.vercel.app

### GitHub Repository

https://github.com/shaikaislamarpita/2311080-Warmshare

### API Health Check

https://2311080-warmshare.vercel.app/api/health

The Vercel configuration routes frontend requests to React and API requests to FastAPI.

---

## 14. Testing

### Functional Testing

The MVP supports testing of:

- Create listing
- Read all listings
- Read single listing
- Update listing
- Delete listing
- Input validation
- Database persistence
- Frontend-backend integration

### Testing Tools

- Browser Developer Tools
- Network tab
- Postman
- FastAPI Swagger documentation
- GitHub deployment checks

### Planned Security Testing

- Unauthorized API access
- Listing ownership verification
- Authentication validation
- Role permission verification
- Pickup address privacy
- Invalid token handling
- Concurrent donation claims
- Sensitive data exposure prevention

---

## 15. Development Roadmap

| Phase | Features | Status |
|---|---|---|
| Phase 1 | Donation CRUD, React, FastAPI, PostgreSQL, deployment | Completed |
| Phase 2 | Registration, login, authentication, permissions | Planned |
| Phase 3 | Listing ownership and pickup address protection | Planned |
| Phase 4 | Donation claiming and quantity reservation | Planned |
| Phase 5 | NGO campaigns and volunteer management | Planned |
| Phase 6 | Moderation, privacy management, and security hardening | Planned |

The roadmap describes the intended complete platform.

Implementation progress will be updated as development continues.

---

## 16. GitHub Development Workflow

WarmShare follows a structured GitHub workflow.

1. Create a GitHub issue.
2. Create a dedicated development branch.
3. Implement the feature.
4. Test locally.
5. Commit the changes.
6. Push the branch to GitHub.
7. Create a pull request.
8. Review and merge into the main branch.
9. Verify deployment.

This workflow supports organized development and makes project changes traceable.

---

## 17. Future Scope

WarmShare is designed to evolve into a complete clothing donation and distribution ecosystem.

Future development may include:

- Location-based donation discovery
- Automated donation notifications
- Donation recommendation features
- NGO campaign analytics
- Volunteer scheduling
- Distribution impact reports
- Multilingual accessibility
- Mobile application support
- Community participation statistics

---

## 18. Project Status

**WarmShare is under active development.**

The current MVP includes:

- Working React frontend
- FastAPI backend
- Supabase PostgreSQL integration
- Donation listing CRUD operations
- Successful Vercel deployment
- GitHub-based development workflow

The complete system is being developed with an emphasis on secure accounts, privacy protection, reliable donation coordination, and community participation.

---

<div align="center">

### WarmShare

**Share Warmth. Build Community.**

Built with React, TypeScript, FastAPI, and PostgreSQL.

</div>
