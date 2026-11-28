![Report figure or screenshot 1](images/figure-01.png)

Independent University, Bangladesh

CSE309 Web Application & Internet

Final Project Submission Report

Submitted by:

Name: Shaika Islam Arpita
Student ID: 2311080
Section: 05
Project Title: WarmShare — Winter Clothing Donation and Distribution Platform
Vercel URL: https://2311080-warmshare.vercel.app/
GitHub Repository: https://github.com/shaikaislamarpita/2311080-Warmshare

Submitted To:

Sayef Reyadh
Adjunct Lecturer
Department of Computer Science & Engineering
Independent University, Bangladesh

Semester: Autumn 2026
Date of Submission: 28 November 2026

# Table of Contents

# 1. Executive Summary

1.1 Project Overview
1.2 What Was Built Since the Mid Assessment
1.3 Live Links

# Part A. Product Requirements (PRD)

A1. Problem Statement
A2. Users and Roles
A3. Goals and Success Measures
A4. Scope and Non-Goals
A5. User Stories

# Part B. Software Requirements (SRS)

B1. Introduction
B2. Functional Requirements
B3. Non-Functional Requirements
B4. Roles and Permission Matrix
B5. Use Cases
B6. Acceptance Criteria
B7. Traceability Matrix

# Part C. Technical Design (TDD)

C1. Technology Stack
C2. System Architecture
C3. Backend and Frontend Structure
C4. Data Model
C5. API Design
C6. JWT Authentication Design
C7. RBAC Design
C8. Admin Dashboard Design
C9. Security Design and Threats
C10. Deployment on Vercel
C11. Testing

# Part D. Evidence: Screenshots of the Running Application

D1. User Side
D2. Security Behaviour
D3. Admin Dashboard
D4. Deployment
D5. Tests

# Part E. Project Management and Conclusion

E1. How to Run and Test
E2. GitHub Work
E3. Limitations
E4. Future Work
E5. Sources, Libraries and Tools

# Appendix. Test Accounts and Video Demo

Video Demo
Demo Test Accounts
Shared Group

# List of Figures and Screenshots

| No. | Caption |
| --- | --- |
| Figure 1 | Use case diagram of WarmShare |
| Figure 2 | System architecture of WarmShare |
| Figure 3 | Entity-relationship diagram (9 tables) |
| Figure 4 | JWT sequence: login, protected request, expiry, refresh, reuse and logout |
| Figure 5 | Authorisation flow for one request |
| Figure 6 | Admin dashboard pages and the endpoints they call |
| Figure 7 | Deployment layout |
| S1 | Sign up / login modal with a validation error (e.g. weak or short password) |
| S2 | Home page and My Donations of a logged-in user showing only that user's listings |
| S3 | Account Information and Security Settings, with a wrong current password rejected |
| S4 | Login Sessions list with the Revoke action |
| S5 | An action denied by RBAC: the message in the app and the 403 response in the Network tab |
| S6 | Network tab: a protected request carrying the Authorization: Bearer header and the refresh cookie (values hidden) |
| S7 | Application tab: the warmshare refresh token cookie with HttpOnly and Secure ticked, _ _ SameSite=Lax, path /api/auth (value hidden); the access token sits in Session storage |
| S8 | A banned user: /api/auth/refresh returns 401 and the login attempt shows "Your account has been suspended." |
| S9 | Admin Dashboard overview statistics |
| S10 | User Management with search, role and status filters, bulk ban/unban, role selector, per-user actions and pagination (Page 1 of 3, 22 users) |
| S11 | Active Sessions drill-down opened from the overview card (session ID, user, role, created, expires, status) |
| S12 | Moderator Dashboard: pending reported donations with resolve/dismiss and hide/restore (reason required) |
| S13 | Audit Logs with Export CSV: user banned, password change failed, user unbanned, _ _ _ _ listing moderation, user role changed and listing report review events _ _ _ _ _ |
| S14 | Vercel project 2311080-myidea: production deployment Ready from branch main, domain 2311080-warmshare.vercel.app |
| S15 | Vercel environment variables page (names only, values hidden) |
| S16 | Live API documentation at /api/docs |
| S17 | Terminal output of the pytest run: 92 passed, 2 warnings in 39.38 s |
| Figure 8 | GitHub issues: 19 closed, 0 open |
| Figure 9 | GitHub pull requests: 21 merged, 0 open |

# 1. Executive Summary

## 1.1 Project Overview

WarmShare is a full-stack web application that connects people who have unused winter 
clothing (jackets, sweaters, blankets, shawls and socks) with people and volunteer teams who 
collect and distribute it. A donor creates a donation listing with the item category, size, age 
group, gender, condition, quantity and pickup area. Anyone can browse and search the public 
listings without an account. Registered users manage their own donations from a personal 
dashboard, create donation groups (for example, a family or a volunteer team) and give each 
member  fine-grained  permissions  to  create,  edit  or  assign  donations  inside  the  group. 
Moderators review reports from the community and can hide misleading or inappropriate 
listings, while the single Admin manages users, roles, bans, sessions, the audit log and security 
monitoring from a dedicated dashboard.

Stack: React 19 with TypeScript and Vite (frontend), FastAPI with SQLAlchemy 2.0 and 
Pydantic (backend), Supabase PostgreSQL (database), PyJWT and Argon2 (security), pytest 
(testing), deployed as one Vercel project with a frontend and a backend service.

## 1.2 What Was Built Since the Mid Assessment

At the mid assessment WarmShare was an MVP with public listing CRUD only. Since then the 
following major features were added:

• JWT authentication with refresh and logout: 15-minute HS256 access tokens, Argon2

password hashing with an HMAC-SHA256 server-side pepper, 30-day server-side 
sessions, rotating refresh tokens stored only as SHA-256 hashes and sent in an httpOnly 
cookie, refresh-token reuse detection, real server-side logout, a session list with self-
service revoke, profile update and password change.

• Role-based access control (roles, ownership, group permissions): three roles (user,

moderator,  admin)  mapped  to  permission  constants  in  one  module 
(backend/permissions.py) and checked by one reusable dependency (require_permission 
in backend/rbac.py); ownership checks on every personal listing; donation groups with 
owner-only management and per-member can_create, can_edit and can_assign flags.

• Admin dashboard: overview statistics with drill-down, paginated user management

with search, role and status filters, user detail with sessions and recent activity, ban and 
unban  with  a  reason,  role  change,  session  revoke,  bulk  ban  and  unban,  security 
monitoring of failed logins, audit log viewer and CSV export.

• Content moderation: any user can report a listing; moderators (and the admin) review

pending reports, resolve or dismiss them, and hide or restore listings with a written 
reason.

• Audit logging, brute-force protection and deployment: an audit_logs table records

role, ban, session, moderation, profile and password events; login is locked for 15 minutes 
after 5 failed attempts within 15 minutes; 92 automated pytest tests (all passing); 
deployment on Vercel with Supabase PostgreSQL.

## 1.3 Live Links

The demo account user IDs and passwords are written only in the Appendix of this report and 
never in the GitHub repository.

**Table 1: WarmShare live links**

| Resource | URL |
| --- | --- |
| GitHub repository | https://github.com/shaikaislamarpita/2311080-Warmshare |
| Vercel frontend (live site) | https://2311080-warmshare.vercel.app/ |
| API base URL | https://2311080-warmshare.vercel.app/api |
| API health check | https://2311080-warmshare.vercel.app/api/health |
| API documentation (Swagger UI) | https://2311080-warmshare.vercel.app/api/docs |
| API documentation (ReDoc) | https://2311080-warmshare.vercel.app/api/redoc |
| Video demo (5–8 minutes) | https://youtu.be/eD-V9yR sQ0?si=6PyurhTMZeFCh7Z0 _ |

# Part A. Product Requirements (PRD)

## A1. Problem Statement

Every winter many households in Bangladesh keep jackets, sweaters and blankets they no 
longer use, while low-income families, street children and people in the northern districts 
struggle to stay warm. Today these donations are arranged informally through Facebook posts, 
messaging groups and personal contacts. Posts get buried within days, nobody knows which 
items are still available or in what quantity, and volunteers waste trips collecting items that were 
already given away.

Volunteer teams also have no shared, controlled space to coordinate: either everyone in a chat 
can change everything, or one person has to do all the work. Misleading or duplicate posts 
cannot be reported to anyone responsible, and donors have to share personal contact details 
publicly. A central, secure platform with clear ownership, team permissions and moderation is 
needed so that usable clothing reaches people who need it before the cold season ends.

## A2. Users and Roles

**Table 2: Users and roles**

| Role | Who they are | Main tasks | Must never be able to do |
| --- | --- | --- | --- |
| Visitor | Anyone on the site without logging in | Browse and search visible donations, view details, register, log in | Create, edit, delete or report listings; see dashboards; call any protected API |
| User (Donor) | A registered member of the public (default role) | Create and manage own donations, report listings, manage profile, password and sessions, create groups | Edit or delete another user's personal listing, see another user's sessions, moderate content, open the admin dashboard |
| Group member | A user added to a group by its owner | View group details and listings; create, edit or assign listings only if the matching flag is on | Rename or delete the group, add or remove members, change permissions, act without the needed flag |
| Group owner | The user who created the group | Rename and delete the group, add and remove members, set can create, can edit, can assign _ _ _ | Access groups they do not belong to, act as moderator or admin |
| Moderator | A trusted user promoted by the admin | Review the report queue, resolve or dismiss reports, hide or restore listings with a reason; plus all user tasks | Manage users, roles, bans or sessions; view the audit log or export data |
| Admin | The single platform administrator | Statistics, user management, role change, ban and unban (single and bulk), session revoke, audit log, failed-login monitoring, CSV export, moderation | Change their own role, ban or unban themselves or the Admin role, revoke their own sessions from the admin action |

## A3. Goals and Success Measures

**Table 3: Goals and measures**

| ID | Goal | Measure (testable) |
| --- | --- | --- |
| G-01 | Donors can publish and manage winter clothing donations | A logged-in user can create, edit and delete their own listing; the change appears in the public list after a reload (yes/no). |
| G-02 (security) | No user can change another user's data | 100% of update or delete attempts on another user's personal listing return 403 (pytest: test user cannot update/delete another users listin _ _ _ _ _ _ g). |
| G-03 (security) | Sessions are short-lived and revocable | Access tokens expire after 15 minutes; a revoked, logged-out or banned session is rejected on the next request with 401/403 (pytest). |
| G-04 (security) | Brute-force login is blocked | After 5 failed logins in 15 minutes the account identifier receives 429 for 15 minutes (pytest). |
| G-05 | Teams can share work safely | A group member can perform only the actions whose flag is on; all 16 group permission tests pass. |
| G-06 | The platform is accountable and moderated | Every role change, ban/unban, session revoke, moderation decision and password change creates one audit logs row visible to the admin within one _ page refresh. |

## A4. Scope and Non-Goals

In scope

• Registration, login, refresh, logout, profile, password change and session management

with JWT

• RBAC with user, moderator and admin roles, ownership checks and group permissions

• Donation listing CRUD with categories, sizes, age group, gender, condition, quantity and

pickup area; public browse, search and filter

• Donation groups with owner and per-member permissions

• Listing reports and moderation (hide or restore)

• Admin dashboard: statistics, users, user detail, ban, role, sessions, bulk actions, audit log,

security view, CSV export

• Audit logging, login rate limiting and deployment on Vercel with Supabase PostgreSQL

Out of scope (and why)

• Quantity-based claims and NGO verification from the original PRD: postponed so the

course security requirements (JWT, RBAC, admin) could be completed properly in the 
time available

• Payments, delivery or courier tracking, GPS and maps: not needed to coordinate free

donations

• Live chat and real-time notifications: would need websockets, which Vercel serverless

functions do not support well

• Mobile apps and AI recommendations: outside the course scope

• Email verification and password reset by email: no email service configured

Assumptions and constraints

• Users have a modern desktop or mobile browser (Chrome, Edge, Firefox, Safari) with

JavaScript and cookies enabled

• Hosting is on Vercel's free tier (serverless functions, cold starts) and Supabase's free

PostgreSQL tier

• The project is built by one student within one semester

• Physical pickup is arranged outside the application; only demo data is used

## A5. User Stories

**Table 4: User stories**

| ID | Role | User story |
| --- | --- | --- |
| US-01 | Visitor | As a visitor, I want to browse and search available donations so that I can see what clothing is offered before creating an account. |
| US-02 | Visitor | As a visitor, I want to register with my name, email and password so that I can donate clothing. |
| US-03 | User | As a user, I want to log in and stay logged in safely so that I do not have to enter my password on every page. |
| US-04 | User | As a user, I want to see and revoke my active sessions so that I can log out a device I lost. |
| US-05 | User | As a donor, I want to create, edit and delete my own listings so that the information about my clothes stays correct. |
| US-06 | User | As a donor, I want nobody else to be able to change my listings so that my donations cannot be tampered with. |
| US-07 | Group owner | As a group owner, I want to add members and choose what each may do so that my team can share work safely. |
| US-08 | Group member | As a group member with create permission, I want to add a donation to the group so that our team's stock is in one place. |
| US-09 | Group member | As a group member without edit permission, I want the system to stop me from editing so that I cannot make mistakes outside my role. |
| US-10 | User | As a user, I want to report a misleading listing so that moderators can review it. |
| US-11 | Moderator | As a moderator, I want to review reports and hide or restore listings with a reason so that the platform stays trustworthy. |
| US-12 | Admin | As the admin, I want to search, filter and page through users so that I can find an account quickly. |
| US-13 | Admin | As the admin, I want to ban or unban users (one or many) with a reason so that abusive accounts lose access immediately. |
| US-14 | Admin | As the admin, I want to read and export the audit log and see failed logins so that I can investigate suspicious activity. |

# Part B. Software Requirements (SRS)

## B1. Introduction

Purpose. This part specifies exactly what the deployed WarmShare system does. Every 
requirement has a unique ID that is reused in the acceptance criteria, the tests, the traceability 
matrix and the screenshots in Part D.

Intended readers. The course instructor and evaluators, the developer, testers and any future 
maintainer of the project.

**Table 5: Definitions**

| Term | Definition |
| --- | --- |
| JWT | JSON Web Token (RFC 7519): a signed, base64url-encoded set of claims. WarmShare signs it with HS256. |
| Access token | Short-lived (15 min) JWT sent in the Authorization: Bearer header on every protected request. |
| Refresh token | Long random secret (64 bytes, URL-safe) kept in an httpOnly cookie and exchanged at /api/auth/refresh for a new access token; it rotates on each use. |
| Session | A row in user sessions (UUID) created at login; it lives 30 days unless revoked; the _ access token's sid claim points to it. |
| RBAC | Role-Based Access Control: permissions are granted to roles, and users get permissions through their role. |
| Role | user, moderator or admin (stored in users.role with a CHECK constraint). |
| Permission | A constant string such as listing:create or admin:users:ban, defined in backend/permissions.py. |
| Group permission | Per-member boolean flags can create, can edit, can assign in group members. _ _ _ _ |
| Audit log | Append-only table audit logs recording who did what to which target, with JSON _ details and a UTC timestamp. |
| Pepper | A server-side secret (PASSWORD PEPPER) mixed into every password with _ HMAC-SHA256 before Argon2 hashing; never stored in the database. |

References: RFC 7519 (JSON Web Token); OWASP ASVS 4.0 (V2 Authentication, V3 
Session Management, V4 Access Control); OWASP Password Storage Cheat Sheet; FastAPI 
documentation  (Security,  Dependencies);  SQLAlchemy  2.0  documentation;  PyJWT  and 
argon2-cffi documentation; Vercel Services documentation; course template smarter-todo 
FINAL_REPORT.md.

## B2. Functional Requirements

**Table 6: Functional requirements — Authentication (FR-AUTH)**

| ID | Requirement |
| --- | --- |
| FR-AUTH-01 | The system shall let a visitor register with a full name (2–100 characters), a valid email and a password of 8–128 characters, always assign the role user, and reject a duplicate email with 409. |
| FR-AUTH-02 | The system shall store passwords as Argon2 hashes of an HMAC-SHA256 peppered password (prefix pepper$v1$) and upgrade older unpeppered hashes at the next successful |

| ID | Requirement |
| --- | --- |
|  | login. |
| FR-AUTH-03 | The system shall, on valid login, return an HS256 access token with claims sub, role, sid, iat, exp and jti that expires 15 minutes after issue, and return the generic message "Invalid email or password" (401) on failure. |
| FR-AUTH-04 | The system shall create a 30-day session on login and send a random refresh token in an httpOnly, SameSite=Lax cookie (Secure in production, path /api/auth), storing only its SHA-256 hash. |
| FR-AUTH-05 | The system shall rotate the refresh token on every /api/auth/refresh call and, if an already- used refresh token is presented, revoke the whole session and return 401. |
| FR-AUTH-06 | The system shall revoke the current session and clear the refresh cookie on logout. |
| FR-AUTH-07 | The system shall let a user list their active sessions (device, IP, created and last used) and revoke one of their own sessions; another user's session returns 404. |
| FR-AUTH-08 | The system shall block login for 15 minutes (429) after 5 failed attempts for the same email within 15 minutes, keyed by an HMAC of the email, and reset the counter on success. |
| FR-AUTH-09 | The system shall let a user view their profile and update only their full name. |
| FR-AUTH-10 | The system shall let a user change their password only after giving the correct current password (400 otherwise), require the new password to be 8–128 characters, confirmed and different, revoke all their other sessions, and audit the event. |
| FR-AUTH-11 | The system shall reject every request whose token is missing, malformed, tampered, expired, tied to a revoked or expired session, or carries a role that no longer matches the database (401). |

**Table 7: Functional requirements — Access control (FR-RBAC)**

| ID | Requirement |
| --- | --- |
| FR-RBAC-01 | The system shall support exactly three roles (user, moderator, admin), each mapped to a fixed set of permission constants in backend/permissions.py. |
| FR-RBAC-02 | The system shall check every protected permission on the server with the require permission dependency and return 403 when the role lacks it. _ |
| FR-RBAC-03 | The system shall allow only the owner of a personal listing to update or delete it, return 403 otherwise, and never change owner id through an update. _ |
| FR-RBAC-04 | The system shall let any authenticated user create a group and make that user its owner. |
| FR-RBAC-05 | The system shall allow only the group owner to rename or delete the group, add or remove members and change member permissions (403 for others). |
| FR-RBAC-06 | The system shall allow a group member to create a listing in the group only with can create, edit a group listing only with can edit, and move their own listing into or out _ _ of the group only with can assign. _ |
| FR-RBAC-07 | The system shall return 403 to a user who is not the owner or a member when they request a group's details, members or listings. |
| FR-RBAC-08 | The system shall stop the admin from changing their own role (400), changing the Admin role (403), banning or unbanning themselves (400) or an admin (403), and shall allow at most one admin account (unique partial index). |
| FR-RBAC-09 | The system shall reject a banned user's next request with 403 even if their access token has not expired, and block their login and refresh. |

| ID | Requirement |
| --- | --- |
| FR-RBAC-10 | The system shall give a system admin no extra rights inside a group; group actions are decided only by group ownership and member flags. |

**Table 8: Functional requirements — Admin and moderation (FR-ADM)**

| ID | Requirement |
| --- | --- |
| FR-ADM-01 | The system shall show the admin statistics: total users, donors, moderators, banned users, total, visible and hidden listings, pending reports and active sessions. |
| FR-ADM-02 | The system shall list users page by page (page size 1–100) and let the admin search the page by name, email or ID and filter by role and status (active or banned). |
| FR-ADM-03 | The system shall show a user's detail: profile, role, ban information, groups, sessions and the 50 most recent audit events about them. |
| FR-ADM-04 | The system shall let the admin ban a user with a required reason or unban them, and record user banned or user unbanned in the audit log. _ _ |
| FR-ADM-05 | The system shall let the admin change a user's role between user and moderator and record user role changed. _ _ |
| FR-ADM-06 | The system shall let the admin revoke all sessions of another user and record user sessions revoked. _ _ |
| FR-ADM-07 | The system shall ban or unban many users in one transaction, skip admins, missing and already-in-state users, report the updated and skipped counts, revoke the banned users' sessions and audit each change with bulk action = true. _ |
| FR-ADM-08 | The system shall show the admin the list of active sessions across the platform. |
| FR-ADM-09 | The system shall show the most recent audit log entries (limit 1–200) with actor, action, target and details. |
| FR-ADM-10 | The system shall show failed-login records (shortened identifier hash, attempts, blocked- until, blocked state) without revealing raw emails. |
| FR-ADM-11 | The system shall export the audit log as a CSV file (warmshare-audit-logs.csv). |
| FR-ADM-12 | The system shall let any logged-in user report another user's listing with a reason (one pending report per user per listing), and let a moderator or admin view pending and reviewed reports, resolve or dismiss a report once, and hide or restore a listing with a 3– 500 character reason, auditing listing moderation and listing report review. _ _ _ |

**Table 9: Functional requirements — Donation domain (FR-DOM)**

| ID | Requirement |
| --- | --- |
| FR-DOM-01 | The system shall let a logged-in user create a donation listing with title (3–150), category (jacket, sweater, blanket, shawl, socks), size, age group (child, adult), gender (male, female, unisex), condition (like new, good, worn), quantity (> 0) and pickup area (5–255), optionally inside a group. |
| FR-DOM-02 | The system shall show all visible listings publicly, newest first, with search by title or pickup location and filter by category. |
| FR-DOM-03 | The system shall return a single visible listing by ID and 404 for a missing or hidden listing. |
| FR-DOM-04 | The system shall let the authorised user update a listing's editable fields and validate them (422 on invalid data). |

| ID | Requirement |
| --- | --- |
| FR-DOM-05 | The system shall let the owner delete their listing (204). |
| FR-DOM-06 | The system shall show each user a dashboard with their own donations, account information, security settings, sessions and groups. |
| FR-DOM-07 | The system shall exclude hidden listings from public lists and from group detail views. |

## B3. Non-Functional Requirements

**Table 10: Non-functional requirements**

| ID | Category | Requirement and measure |
| --- | --- | --- |
| NFR-01 | Security | All secrets (DATABASE URL, JWT SECRET KEY, _ _ _ PASSWORD PEPPER, LOGIN RATE LIMIT SECRET) come from _ _ _ _ environment variables; none are in the repository (.env files are git-ignored). |
| NFR-02 | Security | Login errors are generic; password hashes, refresh tokens and raw login identifiers are never returned by any API. |
| NFR-03 | Security | All production traffic uses HTTPS (Vercel); the refresh cookie is Secure in production. |
| NFR-04 | Performance | Paginated and limited endpoints cap results (users page size ≤ 100, audit and failed logins ≤ 200); ordinary API calls answer within 2 seconds on a warm function. |
| NFR-05 | Usability | The UI is responsive on desktop and mobile widths and shows loading, success and error messages for every form and action. |
| NFR-06 | Reliability | All data is stored in PostgreSQL and survives redeploys and restarts; multi- step changes (refresh rotation, bulk ban, password change) run in one transaction. |
| NFR-07 | Maintainability | Roles and permissions live in one module (permissions.py) with one reusable check (rbac.py); routers, services, schemas and models are separated. |
| NFR-08 | Testability | Critical authentication, RBAC, group, moderation and admin rules are covered by 92 automated pytest tests that run on an in-memory SQLite database. |
| NFR-09 | Privacy | Public listing pages show only a pickup area, not owner email; failed-login records store an HMAC of the email, never the email itself. |

## B4. Roles and Permission Matrix

The tables below match the implementation in backend/permissions.py, backend/rbac.py, 
backend/services/group_service.py and backend/services/admin_service.py exactly. "Own" 
means only the user's own records.

**Table 11: Endpoint groups by role**

| Endpoint group | Visitor | User | Group member | Group owner | Moderato r | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| GET /api/listings, /api/listings/{id} | Yes | Yes | Yes | Yes | Yes | Yes |
| POST /api/auth/register, /login, /refresh | Yes | Yes | Yes | Yes | Yes | Yes |
| /api/auth/me, /change-password, | No | Own | Own | Own | Own | Own |

| Endpoint group | Visitor | User | Group member | Group owner | Moderato r | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| /sessions |  |  |  |  |  |  |
| POST /api/listings (personal) | No | Yes | Yes | Yes | Yes | Yes |
| PUT, DELETE /api/listings/{id} (personal) | No | Own | Own | Own | Own | Own |
| POST /api/listings/{id}/reports | No | Yes (not own) | Yes | Yes | Yes | Yes |
| POST /api/groups | No | Yes | Yes | Yes | Yes | Yes |
| GET /api/groups/{id}, /members, /listings | No | No | Yes | Yes | Only if member | Only if member |
| PATCH, DELETE /api/groups/{id}; member add/update/remove | No | No | No | Yes | Only if owner | Only if owner |
| /api/listings/moderation/*, PATCH /{id}/moderation | No | No | No | No | Yes | Yes |
| /api/admin/* (stats, users, ban, role, sessions, audit, export) | No | No | No | No | No | Yes |

**Table 12: Group permissions**

| Action | Owner | Member + can create _ | Member + can edit _ | Member + can assign _ | Member, no flag |
| --- | --- | --- | --- | --- | --- |
| View group details, members, listings | Yes | Yes | Yes | Yes | Yes |
| Create a listing inside the group | Yes | Yes | No | No | No |
| Edit any listing in the group | Yes | No | Yes | No | No |
| Move own listing into / out of the group | Yes (own) | No | No | Yes (own) | No |
| Rename or delete the group | Yes | No | No | No | No |
| Add or remove members, change flags | Yes | No | No | No | No |

**Table 13: Admin rules**

| Rule | Behaviour | Status |
| --- | --- | --- |
| Admin changes own role | Rejected: "You cannot change your own role." | 400 |
| Anyone changes the Admin role | Rejected: "The Admin role cannot be changed." | 403 |
| Admin bans or unbans self | Rejected | 400 |
| Admin bans or unbans an admin | Rejected: "An Admin cannot be banned or unbanned." | 403 |
| Admin revokes own sessions from the admin action | Rejected (use the normal session list instead) | 400 |
| Ban without a reason | Rejected: a reason is required | 400 / 422 |
| Second admin account | Blocked by unique partial index | DB error |

| Rule | Behaviour | Status |
| --- | --- | --- |
|  | uq users single admin; admins are only provisioned _ _ _ by script |  |
| Admin inside a group | No extra rights; treated as a normal user (owner/member flags decide) | 403 if not member |

## B5. Use Cases

![Report figure or screenshot 2](images/figure-02.png)

**Figure 1: Use case diagram of WarmShare**

**Table 14: Use case descriptions**

| Use case | Actor and preconditions | Main flow | Alternative / error flows | Postconditions |
| --- | --- | --- | --- | --- |
| UC1 Log in and refresh | Visitor with an account; not banned; not locked | 1. Enter email and password. 2. POST /api/auth/login. 3. Server verifies hash, creates session. 4. Returns access token and sets cookie. 5. After 15 min the next call gets 401; SPA calls /refresh once and retries. | Wrong password → 401 generic. 5 failures → 429. Banned → 403. Reused refresh token → 401 and session revoked. | User is logged in; session row and refresh- token hash stored. |
| UC2 Create a record | Logged-in user; for a group, can create or _ owner | 1. Open Donate form. 2. Fill fields. 3. POST /api/listings. 4. Server validates and saves with owner id = user. _ | Invalid field → 422. No token → 401. No can create → 403. _ Group missing → 404. | Listing visible in the public list and My Donations. |
| UC3 Change a member's | Group owner; member exists | 1. Open Group Management. 2. Toggle can create / _ | Not owner → 403. Member not found → | New flags apply on the |

| Use case | Actor and preconditions | Main flow | Alternative / error flows | Postconditions |
| --- | --- | --- | --- | --- |
| permissions |  | can edit / can assign. 3. _ _ PATCH /api/groups/{id}/members/{u ser id}. 4. Saved. _ | 404. | member's next request. |
| UC4 Denied action | Logged-in user without the right | 1. User tries to edit another user's listing (PUT /api/listings/{id}). 2. Ownership check fails. | Returns 403 "You do not have permission to modify this donation."; UI shows the message. | Listing unchanged. |
| UC5 Ban a user | Admin logged in; target is not an admin or self | 1. Open User Management. 2. Click Ban, enter reason. 3. PATCH /api/admin/users/{id}/ban. 4. User flagged banned; audit user banned. _ | No reason → 400. Target admin → 403. Self → 400. Not admin → 403. | Target's next request → 403; login and refresh blocked. |
| UC6 Read the audit log | Admin logged in | 1. Open Audit Logs. 2. GET /api/admin/audit-logs? limit=50. 3. Optionally Export CSV (GET /api/admin/export/audit-logs). | Non-admin → 403. No token → 401. | Admin sees and downloads the event history. |
| UC7 Report and moderate a listing | User (reporter); moderator | 1. User reports listing with reason. 2. Moderator opens Reported Donations. 3. Hides listing with reason. 4. Resolves report. | Own listing → 400. Duplicate pending report → 409. Already hidden → 400. Report already reviewed → 400. | Listing hidden from public; report moved to history; audit events written. |

## B6. Acceptance Criteria

**Table 15: Acceptance criteria**

| ID | Req. | Given | When | Then |
| --- | --- | --- | --- | --- |
| AC-01 | FR-AUTH- 11 | an access token whose exp is in the past | it is sent to a protected endpoint | the API returns 401 "Invalid or expired token" |
| AC-02 | FR-AUTH- 11 | a valid token with one character of the payload changed | it is sent to /api/auth/me | the signature check fails and the API returns 401 |
| AC-03 | FR-RBAC- 03 | user B owns listing L | user A sends PUT or DELETE /api/listings/L | the API returns 403 and L is unchanged |
| AC-04 | FR-RBAC- 06 | a group member without can edit _ | they PUT a group listing | the API returns 403 |
| AC-05 | FR-RBAC- 09 | a logged-in user who is then banned by the admin | they send their next request with the old token | the API returns 403 "Your account has been suspended." |
| AC-06 | FR-RBAC- 08 | the admin is logged in | they try to ban an admin or themselves | the API returns 403 / 400 and nothing changes |
| AC-07 | FR-AUTH- 05 | a refresh token that was already rotated | it is sent to /api/auth/refresh | the API returns 401 and the whole session is revoked |
| AC-08 | FR-AUTH- | 5 failed logins for one | a 6th login is attempted | the API returns 429 until the |

| ID | Req. | Given | When | Then |
| --- | --- | --- | --- | --- |
|  | 08 | email in 15 minutes |  | cooldown ends |
| AC-09 | FR-AUTH- 11 | the admin changed user X's role | X uses their old access token | the API returns 401 "Your permissions have changed" |
| AC-10 | FR-ADM- 07 | a bulk ban list containing an admin, a missing ID and a normal user | the admin submits it | only the normal user is banned and the response reports updated and skipped counts |
| AC-11 | FR-ADM- 12 | a visible listing reported by a user | a moderator hides it with a reason | it disappears from GET /api/listings and an audit row is written |

## B7. Traceability Matrix

**Table 16: Traceability: requirement, endpoint or screen, test, screenshot**

| Requiremen t | Endpoint / screen | Automated test(s) | Screensh ot |
| --- | --- | --- | --- |
| FR-AUTH- 01 | POST /api/auth/register; Auth modal | test register user _ _ | S1 |
| FR-AUTH- 02 | security.py hash password _ | test login rejects incorrect password _ _ _ _ | S1 |
| FR-AUTH- 03 | POST /api/auth/login | test login creates http only refresh cookie _ _ _ _ _ _ | S1, S6 |
| FR-AUTH- 04 | set refresh cookie _ _ | test login creates http only refresh cookie _ _ _ _ _ _ | S7 |
| FR-AUTH- 05 | POST /api/auth/refresh | test refresh rotates refresh token; _ _ _ _ test refresh token replay revokes session _ _ _ _ _ | S7 |
| FR-AUTH- 06 | POST /api/auth/logout | test logout revokes session and clears co _ _ _ _ _ _ okie | S4 |
| FR-AUTH- 07 | GET, DELETE /api/auth/sessions | test user can revoke own session; _ _ _ _ _ test user cannot revoke another users ses _ _ _ _ _ _ sion | S4 |
| FR-AUTH- 08 | auth service rate limit _ | test login rate limit blocks after five fail _ _ _ _ _ _ _ ed attempts; ... expires after cooldown _ _ _ _ | S10 |
| FR-AUTH- 09 | GET, PATCH /api/auth/me; Account Information | manual (live site) | S3 |
| FR-AUTH- 10 | POST /api/auth/change- password; Security Settings | manual (live site) | S3, S13 |
| FR-AUTH- 11 | dependencies.get current user _ _ | test missing/invalid/tampered/ _ expired access token returns 401; _ _ _ _ test role change invalidates old access to _ _ _ _ _ _ ken | S6, S8 |
| FR-RBAC- 01 | permissions.py | test admin rbac (all) _ _ | S5 |
| FR-RBAC- 02 | rbac.require permission _ | test user cannot access admin users; _ _ _ _ _ test moderator cannot access admin users _ _ _ _ _ | S5 |

| Requiremen t | Endpoint / screen | Automated test(s) | Screensh ot |
| --- | --- | --- | --- |
| FR-RBAC- 03 | PUT, DELETE /api/listings/{id} | test user cannot update/ _ _ _ delete another users listing; _ _ _ test listing owner cannot be changed thro _ _ _ _ _ _ ugh update _ | S5 |
| FR-RBAC- 04 | POST /api/groups | test user can create group; _ _ _ _ test guest cannot create group _ _ _ _ | S5 |
| FR-RBAC- 05 | /api/groups/{id}/members* | test group owner can add member; _ _ _ _ _ test non owner cannot add group membe _ _ _ _ _ _ r; test member cannot rename group _ _ _ _ | S5 |
| FR-RBAC- 06 | listing service + group flags _ | test member with(out) can create/ _ _ _ _ can edit/can assign * _ _ _ | S5 |
| FR-RBAC- 07 | GET /api/groups/{id} | test non member cannot view group detai _ _ _ _ _ _ ls | S5 |
| FR-RBAC- 08 | admin service _ | test admin cannot change own role; _ _ _ _ _ test admin cannot ban self _ _ _ _ | S10 |
| FR-RBAC- 09 | get current user ban check _ _ | test banned user cannot use existing acce _ _ _ _ _ _ ss token; _ test banned user cannot refresh session _ _ _ _ _ | S8 |
| FR-RBAC- 10 | group service (no admin bypass) _ | test non member cannot view group detai _ _ _ _ _ _ ls | S5 |
| FR-ADM-01 | GET /api/admin/dashboard/stats; Overview | test admin can access dashboard stats _ _ _ _ _ | S9 |
| FR-ADM-02 | GET /api/admin/users/paginated; User Management | test admin can view paginated users; ... s _ _ _ _ _ _ econd user page; ... rejects invalid page s _ _ _ _ _ _ ize | S10 |
| FR-ADM-03 | GET /api/admin/users/{id}; User Details | test admin can view user details; _ _ _ _ _ test admin gets 404 for nonexistent user _ _ _ _ _ _ | S10 |
| FR-ADM-04 | PATCH /api/admin/users/{id}/ban | test admin can ban user _ _ _ _ | S8, S13 |
| FR-ADM-05 | PATCH /api/admin/users/{id}/role | test admin can change user role _ _ _ _ _ | S10 |
| FR-ADM-06 | DELETE /api/admin/users/{id}/sessions | manual (live site) | S10 |
| FR-ADM-07 | PATCH /api/admin/users/bulk- ban | test admin can bulk ban/unban users; _ _ _ _ _ test bulk ban skips *; _ _ _ _ test bulk ban revokes user sessions; _ _ _ _ _ test bulk ban creates audit logs _ _ _ _ _ | S10 |
| FR-ADM-08 | GET /api/admin/dashboard/active- sessions | manual (live site) | S9, S11 |
| FR-ADM-09 | GET /api/admin/audit-logs; Audit Logs | test admin can view audit logs _ _ _ _ _ | S13 |
| FR-ADM-10 | GET /api/admin/security/failed- logins | test admin can view failed login monitori _ _ _ _ _ _ ng | S10 |
| FR-ADM-11 | GET /api/admin/export/audit- logs | test admin can export audit logs _ _ _ _ _ | S13 |

| Requiremen t | Endpoint / screen | Automated test(s) | Screensh ot |
| --- | --- | --- | --- |
| FR-ADM-12 | /api/listings/{id}/reports, /moderation/*; Moderator Dashboard | test moderation (12 tests) _ | S12 |
| FR-DOM-01 | POST /api/listings; Donation form | test user can create listing; _ _ _ _ test guest cannot create listing _ _ _ _ | S2 |
| FR-DOM-02 | GET /api/listings; Home page | test listings are publicly readable _ _ _ _ | S2 |
| FR-DOM-03 | GET /api/listings/{id}; Donation details | test listings are publicly readable _ _ _ _ | S2 |
| FR-DOM-04 | PUT /api/listings/{id} | test owner can update own listing _ _ _ _ _ | S2 |
| FR-DOM-05 | DELETE /api/listings/{id} | test owner can delete own listing _ _ _ _ _ | S2 |
| FR-DOM-06 | User Dashboard | manual (live site) | S2, S3, S4 |
| FR-DOM-07 | listing service visible filter _ | test hidden group listing is excluded fro _ _ _ _ _ _ m group details _ _ | S12 |

# Part C. Technical Design (TDD)

## C1. Technology Stack

**Table 17: Technology stack**

| Component | Technology | Version | Reason for choosing it |
| --- | --- | --- | --- |
| Frontend | React + TypeScript | React 19.3, TypeScript 7.0 | Required by the course; components and type safety for API data |
| Build tool | Vite | 8.3 | Fast dev server and production build; supported natively by Vercel |
| UI | Custom CSS (index.css), no UI library | — | Full control over a warm, responsive design without extra bundle size |
| Backend | FastAPI (Python) | ≥ 0.141 (fastapi[standard]) | Required by the course; dependency injection is ideal for auth and RBAC; automatic OpenAPI docs |
| Validation | Pydantic | v2 (with FastAPI) | Request/response schemas, enums and extra="forbid" against over- posting |
| Database | PostgreSQL on Supabase | Supabase managed | Reliable relational storage with constraints and partial indexes; free hosted tier |
| ORM / driver | SQLAlchemy + psycopg | SQLAlchemy 2.x, psycopg 3.2 | Typed models, parameterised queries, SELECT ... FOR UPDATE for refresh rotation |
| Password hashing | argon2-cffi (Argon2id) + HMAC-SHA256 pepper | 23.1–25.x | Memory-hard hash recommended by OWASP; pepper protects against a DB-only leak |
| JWT | PyJWT | 2.10+ | Small, well-maintained library; strict algorithm list and required claims |
| Config | python-dotenv | 1.x | Loads .env.development.local locally; Vercel injects env vars in production |
| Testing | pytest + httpx (FastAPI TestClient) | pytest 8–9, httpx 0.27+ | Fast API tests against an in-memory SQLite database |
| Hosting | Vercel (Services: frontend + backend) | — | One URL for SPA and API, HTTPS, Git-based deploys |

## C2. System Architecture

![Report figure or screenshot 3](images/figure-03.png)

**Figure 2: System architecture of WarmShare**

1. Browser  → Vercel  (HTTPS  request). 
The  user  opens
 https://2311080-
warmshare.vercel.app and every request travels over HTTPS. Vercel terminates TLS, so 
no traffic is ever sent in plain text.

2. Vercel → Frontend service (/(.*)). Any path that is not under /api is rewritten to the

React frontend service by vercel.json. The browser downloads the built single-page 
application, which then renders all pages on the client.

3. Vercel → Backend service (/api/(.*)). API calls are rewritten to the FastAPI backend

service on the same origin, so no CORS configuration is needed. Protected calls carry 
Authorization: Bearer <access token>, and calls under /api/auth also carry the httpOnly 
refresh cookie automatically.

4. Backend → PostgreSQL. FastAPI services use SQLAlchemy 2.0 sessions over psycopg

to read and write Supabase PostgreSQL. All queries are parameterised by the ORM, and 
the database URL comes only from an environment variable.

5. Backend → audit_logs. Sensitive actions (role change, ban, session revoke, moderation,

profile and password changes) insert a row into audit_logs in the same transaction. The 
admin dashboard reads and exports this table.

6. Backend → Browser (response). The API returns JSON with a proper status code and,

on login or refresh, a Set-Cookie header with the rotated refresh token. The SPA stores the 
new access token in sessionStorage and updates the UI.

## C3. Backend and Frontend Structure

Backend folder tree

| backend/ |  |
| --- | --- |
|  | ├── main.py # FastAPI app, routers, /api/docs, /api/health |
|  | ├── database.py # engine + session factory (DATABASE URL) |
|  | _ ├── models.py # SQLAlchemy models (9 tables) |
|  | ├── schemas.py # Pydantic request/response schemas |
|  | ├── security.py # Argon2 + pepper, JWT create/decode |
|  | ├── dependencies.py # get db, get current user (token, user, ban, session) |
|  | _ _ _ ├── permissions.py # roles + permission constants + ROLE PERMISSIONS |
|  | _ ├── rbac.py # require permission() reusable dependency |
|  | _ ├── provision admin.py # one-off script to promote the single admin |
|  | _ ├── create tables.py |
|  | _ ├── routers/ # auth.py, listings.py, groups.py, admin.py |
|  | ├── services/ # auth, listing, group, moderation, admin, admin dashboard, |
|  | _ │ # audit, export, security monitoring |
|  | _ ├── migrations/ # migrate user sessions, refresh tokens, groups, ... |
|  | _ _ _ └── tests/ # conftest.py + 7 test modules (92 tests) |

Frontend folder tree

| frontend/ |  |
| --- | --- |
|  | ├── index.html, vite.config.ts (proxy /api), package.json |
|  | └── src/ |
|  | ├── main.tsx, App.tsx, index.css |
|  | ├── pages/HomePage.tsx # browse, search, role-based dashboards |
|  | ├── components/auth/ # AuthModal.tsx (login + signup) |
|  | ├── components/layout/ # Navbar.tsx, Footer.tsx |
|  | ├── components/listings/ # DonationCard, DonationDetails, |
|  | │ # DonationForm, DeleteConfirmation |
|  | ├── components/dashboard/ # UserDashboard, GroupPermissions, |
|  | │ # ModeratorDashboard, AdminDashboard |
|  | ├── services/ # api.ts (token + refresh), authService, |
|  | │ # listing/group/moderation/adminService |
|  | ├── types/ # auth, listing, group, moderation, admin |
|  | └── constants/, utils/ # listing.ts, formatText.ts, readError.ts |

Where things live. Routes are thin FastAPI routers in backend/routers; business rules are in 
backend/services (there is no separate repository layer: services query through SQLAlchemy 
directly); tables are in models.py. Authentication code is split between security.py (hashing and 
JWT), dependencies.py (get_current_user) and services/auth_service.py (login, refresh, logout, 
lockout, sessions). The RBAC module is permissions.py + rbac.py, and group rules are in 
services/group_service.py.  Admin  code  is  routers/admin.py  with  admin_service, 
admin_dashboard_service, export_service and security_monitoring_service. On the frontend, 
HomePage.tsx  acts  as  the  router:  it  shows  the  public  listing  page  and  switches  to 
UserDashboard, ModeratorDashboard or AdminDashboard based on the logged-in user's role. 
services/api.ts is the API client with the authentication logic (attach the bearer token, refresh 
once on 401). The role-based view switch is a UI convenience only; every rule is enforced again 
on the server.

## C4. Data Model

![Report figure or screenshot 4](images/figure-04.png)

**Figure 3: Entity-relationship diagram (9 tables)**

**Table 18: Table users**

| Column | Type | Keys / constraints / index |
| --- | --- | --- |
| id | INTEGER | PK, indexed |
| full name _ | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, indexed, NOT NULL |
| password hash _ | VARCHAR(255) | NOT NULL (pepper$v1$ + Argon2) |
| role | VARCHAR(20) | default 'user'; CHECK role IN ('user','moderator','admin'); partial UNIQUE index uq users single admin WHERE role='admin' _ _ _ |
| is banned _ | BOOLEAN | default false |
| ban reason _ | VARCHAR(500) | NULL |
| banned at _ | TIMESTAMPTZ | NULL |
| created at, updated at _ _ | TIMESTAMPTZ | NOT NULL, UTC |

**Table 19: Table listings**

| Column | Type | Keys / constraints / index |
| --- | --- | --- |
| id | INTEGER | PK |

| Column | Type | Keys / constraints / index |
| --- | --- | --- |
| title | VARCHAR(150) | NOT NULL |
| category | VARCHAR(30) | jacket \| sweater \| blanket \| shawl \| socks (Pydantic) |
| size | VARCHAR(30) | NOT NULL |
| age group / gender / _ condition | VARCHAR(20) | child\|adult; male\|female\|unisex; like new\|good\|worn _ |
| quantity | INTEGER | NOT NULL, > 0 |
| pickup address _ | VARCHAR(255) | NOT NULL |
| owner id _ | INTEGER | FK users.id ON DELETE SET NULL, indexed |
| group id _ | INTEGER | FK groups.id ON DELETE SET NULL, indexed |
| created at _ | TIMESTAMPTZ | NOT NULL |
| moderation status _ | VARCHAR(20) | default 'visible' (visible \| hidden) |
| moderation reason _ | VARCHAR(500) | NULL |
| moderated at / _ moderated by _ | TIMESTAMPTZ / INTEGER | FK users.id ON DELETE SET NULL |

**Table 20: Table groups and group_members**

| Column | Type | Keys / constraints / index |
| --- | --- | --- |
| groups.id | INTEGER | PK |
| groups.name | VARCHAR(150) | NOT NULL |
| groups.owner id _ | INTEGER | FK users.id ON DELETE CASCADE, indexed |
| group members.group i _ _ d, user id _ | INTEGER | FKs ON DELETE CASCADE, indexed; UNIQUE(group id, user id) _ _ |
| can create, can edit, _ _ can assign _ | BOOLEAN | default false |

**Table 21: Table user_sessions and refresh_tokens**

| Column | Type | Keys / constraints / index |
| --- | --- | --- |
| user sessions.id _ | VARCHAR(36) | PK (UUID); referenced by the JWT sid claim |
| user sessions.user id _ _ | INTEGER | FK users.id CASCADE; index ix user sessions user id _ _ _ _ |
| refresh token hash _ _ | VARCHAR(64) | UNIQUE; SHA-256 of the current refresh token |
| expires at _ | TIMESTAMPTZ | 30 days after login; index |
| last used at, revoked at _ _ _ | TIMESTAMPTZ | revoked at NULL = active _ |
| user agent, ip address _ _ | VARCHAR(500), VARCHAR(45) | shown in the session list |
| refresh tokens.session i _ _ d | VARCHAR(36) | FK user sessions.id CASCADE; index _ |
| refresh tokens.token ha _ _ sh | VARCHAR(64) | UNIQUE |

| Column | Type | Keys / constraints / index |
| --- | --- | --- |
| used at, revoked at _ _ | TIMESTAMPTZ | used at set on rotation; reuse detection _ |

**Table 22: Table listing_reports, audit_logs and login_rate_limits**

| Column | Type | Keys / constraints / index |
| --- | --- | --- |
| listing reports.listing id _ _ / reporter id _ | INTEGER | FKs CASCADE; index on listing id _ |
| reason | VARCHAR(50) | inappropriate \| misleading \| duplicate \| incorrect category \| other _ |
| status | VARCHAR(20) | CHECK IN ('pending','resolved','dismissed'); index (status, created at) _ |
| reviewed by, _ reviewed at, _ resolution note _ | INTEGER, TIMESTAMPTZ, VARCHAR(1000) | FK users.id SET NULL |
| audit logs.actor id _ _ | INTEGER | FK users.id SET NULL; index |
| action / target type / _ target id _ | VARCHAR(80/50/64) | index on action |
| details | JSON | IP, user agent, old/new values, reason |
| created at _ | TIMESTAMPTZ | index |
| login rate limits.identifi _ _ er hash _ | VARCHAR(64) | PK; HMAC-SHA256 of normalised email |
| failed attempts, _ window started at, _ _ blocked until _ | INTEGER, TIMESTAMPTZ | index on blocked until _ |

How security data is stored. Roles are a column on users protected by a CHECK constraint, 
and the single-admin rule is a partial unique index. A ban is three columns on users (is_banned, 
ban_reason, banned_at), checked on every request. Each login creates a user_sessions row; the 
refresh token itself is never stored, only its SHA-256 hash, and every rotation adds a 
refresh_tokens row so that reuse of an old token can be detected. Group membership and its 
three permission flags are rows in group_members. The activity log is the audit_logs table with 
a JSON details column.

## C5. API Design

All endpoints are under the /api prefix (no version segment; the OpenAPI document reports 
version 1.0.0). Errors use FastAPI's standard format {"detail": "message"} (validation errors 
return a list of field errors with 422). Interactive documentation is at /api/docs.

**Table 23: Endpoint list**

| Method and path | Auth | Role / permission | Request body | Succes s | Errors |
| --- | --- | --- | --- | --- | --- |
| POST /api/auth/register | No | — | full name, email, _ password | 201 | 409, 422 |
| POST /api/auth/login | No | — | email, password | 200 | 401, 403, |

| Method and path | Auth | Role / permission | Request body | Succes s | Errors |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  | 429, 422 |
| POST /api/auth/refresh | Cooki e | — | — | 200 | 401, 403 |
| POST /api/auth/logout | Cooki e | — | — | 200 | — |
| GET / PATCH /api/auth/me | Beare r | any role | PATCH: full name _ | 200 | 401, 403, 422 |
| POST /api/auth/change- password | Beare r | any role | current, new, confirm password | 200 | 400, 401, 422 |
| GET /api/auth/sessions | Beare r | own | — | 200 | 401 |
| DELETE /api/auth/sessions/{id} | Beare r | own | — | 200 | 401, 404 |
| GET /api/listings | No | — | — | 200 | — |
| GET /api/listings/{id} | No | — | — | 200 | 404 |
| POST /api/listings | Beare r | listing:create (+ can create for _ group) | listing fields, group id? _ | 201 | 401, 403, 404, 422 |
| PUT /api/listings/{id} | Beare r | listing:update:own; owner or can edit; _ can assign to move _ | editable fields | 200 | 401, 403, 404, 422 |
| DELETE /api/listings/{id} | Beare r | listing:delete:own; owner | — | 204 | 401, 403, 404 |
| POST /api/listings/{id}/reports | Beare r | any role, not own listing | reason, details | 201 | 400, 404, 409 |
| GET /api/listings/moderation/listing s \| /reports \| /reports/history | Beare r | content:moderate | — | 200 | 401, 403 |
| PATCH /api/listings/{id}/moderation | Beare r | content:moderate | status, reason | 200 | 400, 403, 404 |
| PATCH /api/listings/moderation/report s/{id} | Beare r | content:moderate | status, resolution note _ | 200 | 400, 403, 404 |
| POST /api/groups; GET /api/groups | Beare r | any role | name | 201 / 200 | 401, 422 |
| GET /api/groups/{id}, /members, /listings | Beare r | owner or member | — | 200 | 403, 404 |
| PATCH / DELETE /api/groups/{id} | Beare r | group owner | name | 200 | 403, 404 |
| POST /api/groups/{id}/members | Beare r | group owner | user id, _ can create, _ can edit, _ can assign _ | 201 | 400, 403, 404, 409 |
| PATCH / DELETE | Beare | group owner | flags | 200 | 403, 404 |

| Method and path | Auth | Role / permission | Request body | Succes s | Errors |
| --- | --- | --- | --- | --- | --- |
| /api/groups/{id}/members/{us er id} _ | r |  |  |  |  |
| GET /api/admin/dashboard/stats \| /active-sessions | Beare r | admin:dashboard:vi ew | — | 200 | 401, 403 |
| GET /api/admin/users \| /users/paginated? page&page size _ | Beare r | admin:dashboard:vi ew | — | 200 | 403, 422 |
| GET /api/admin/users/{id} | Beare r | admin | — | 200 | 403, 404 |
| PATCH /api/admin/users/{id}/role | Beare r | admin:roles:manag e | role | 200 | 400, 403, 404 |
| PATCH /api/admin/users/{id}/ban | Beare r | admin:users:ban | is banned, reason _ | 200 | 400, 403, 404 |
| PATCH /api/admin/users/bulk- ban | Beare r | admin:users:ban | user ids[1..100], _ is banned, reason _ | 200 | 403, 422 |
| DELETE /api/admin/users/{id}/sessions | Beare r | admin:sessions:rev oke | — | 200 | 400, 403, 404 |
| GET /api/admin/audit-logs? limit | Beare r | admin:audit:view | — | 200 | 403, 422 |
| GET /api/admin/security/failed- logins?limit | Beare r | admin:audit:view | — | 200 | 403 |
| GET /api/admin/export/audit- logs | Beare r | admin:data:export | — | 200 text/cs v | 403 |
| GET /api/health | No | — | — | 200 | — |

## C6. JWT Authentication Design

![Report figure or screenshot 5](images/figure-05.png)

**Figure 4: JWT sequence: login, protected request, expiry, refresh, reuse and logout**

**Table 24: Access token claims**

| Claim | Value | Purpose |
| --- | --- | --- |
| sub | user id as string | Identifies the user; loaded from the DB on every request |
| role | user \| moderator \| admin | Must equal the current DB role, so a role change invalidates old tokens |
| sid | session UUID | Links the token to a user sessions row that can be revoked _ |
| iat | issued-at (UTC) | Audit and debugging |
| exp | iat + 15 minutes | Short lifetime limits the damage of a stolen token |
| jti | random 16-byte hex | Unique token ID |

• Algorithm and secret. Tokens are signed with HS256 using JWT_SECRET_KEY from

the environment. decode_access_token() accepts only HS256 and requires all six claims, 
which blocks the "alg: none" and algorithm-confusion attacks.

• Lifetimes. The access token lives 15 minutes (short enough that a leaked token is quickly

useless, long enough to avoid constant refreshes). The session and refresh cookie live 30 
days so users stay logged in on their own device, but every refresh rotates the token.

• Storage in the browser. The access token is kept in sessionStorage (cleared when the tab

closes, not shared between tabs). The refresh token is in an httpOnly cookie that 
JavaScript cannot read, scoped to path /api/auth, SameSite=Lax and Secure in production. 
Risk: XSS could read the access token for up to 15 minutes, but not the refresh token; 
React escapes all rendered text and no HTML is injected, which reduces XSS risk. CSRF: 
the cookie is only sent to /api/auth, SameSite=Lax blocks it on cross-site POSTs, and 
every other endpoint needs the bearer header, which another site cannot add.

• Server  checks  on  every  request (dependencies.get_current_user):  bearer  scheme

present; signature, expiry and required claims valid; user exists; user not banned (403); 
token role equals DB role; session exists, belongs to the user, is not revoked and not 
expired.

• Refresh. /api/auth/refresh locks the token row (SELECT ... FOR UPDATE), checks that

the session is active, that the token was not used before and matches the session's current 
hash, that the user still exists and is not banned, then marks the token used, stores the new 
hash and returns a new access token with a rotated cookie. Presenting an already-used 
token revokes the whole session (reuse detection).

• Frontend on 401 (services/api.ts authenticatedFetch): it calls /api/auth/refresh once

(concurrent calls share one refresh promise), stores the new token and retries the original 
request once. If refresh fails, the token is cleared and the user is asked to log in again.

## C7. RBAC Design

A request is authorised in this order: token → user → role check → ownership check → group 
permission check → handler. Steps 1–4 are in get_current_user, step 5 is require_permission, 
and steps 6–7 are in the service functions.

![Report figure or screenshot 6](images/figure-06.png)

**Figure 5: Authorisation flow for one request**

**Table 25: Roles and permission constants**

| Permission constant | Value | user | moderator | admin |
| --- | --- | --- | --- | --- |
| PERMISSION CREATE LISTING _ _ | listing:create | Yes | Yes | Yes |
| PERMISSION UPDATE OWN LI _ _ _ STING | listing:update:own | Yes | Yes | Yes |
| PERMISSION DELETE OWN LI _ _ _ STING | listing:delete:own | Yes | Yes | Yes |
| PERMISSION MODERATE CON _ _ TENT | content:moderate | No | Yes | Yes |
| PERMISSION VIEW ADMIN DA _ _ _ SHBOARD | admin:dashboard:view | No | No | Yes |
| PERMISSION MANAGE USERS _ _ | admin:users:manage | No | No | Yes |
| PERMISSION MANAGE ROLES _ _ | admin:roles:manage | No | No | Yes |
| PERMISSION BAN USERS _ _ | admin:users:ban | No | No | Yes |
| PERMISSION REVOKE SESSIO _ _ NS | admin:sessions:revoke | No | No | Yes |
| PERMISSION VIEW AUDIT LO _ _ _ GS | admin:audit:view | No | No | Yes |
| PERMISSION EXPORT DATA _ _ | admin:data:export | No | No | Yes |

The one reusable check (backend/rbac.py) wraps get_current_user, so every endpoint that 
uses it automatically gets all token, ban, role and session checks too:

| def require permission(permission: str): |  |
| --- | --- |
|  | _ def permission checker( |
|  | _ current user: User = Depends(get current user), |
|  | _ _ _ ): |
|  | if not has permission(current user.role, permission): |
|  | _ _ raise HTTPException( |
|  | status code=403, |
|  | _ detail="You do not have permission to perform this action.", |
|  | ) |
|  | return current user |
|  | _ return permission checker |
|  | _ |
|  | # usage in a router |
|  | @router.patch("/users/{user id}/ban", |
|  | _ dependencies=[Depends(require permission(PERMISSION BAN USERS))]) |

• Ownership in queries and writes. New listings always get owner_id = current_user.id

from the token (never from the request body, and the schema has no owner_id field). 
Updates  and  deletes  load  the  listing  and  call  verify_listing_owner()  or 
verify_listing_edit_permission()  before  any  change;  public  queries  filter  WHERE 
moderation_status = 'visible', and the user's dashboard data comes from the token's user 
id. Groups are loaded and checked with verify_group_owner(), verify_group_access() 
and verify_group_permission(flag).

• Adding a new role or permission. Add a constant in permissions.py, add it to the role's

set in ROLE_PERMISSIONS, allow the new role in the users CHECK constraint (and in

decode_access_token's  role  list),  then  protect  the  endpoint  with 
Depends(require_permission(NEW_PERMISSION)) and add a test.

• Special rules. A banned user is rejected inside get_current_user (403) before any

permission check, and banning also revokes their sessions. The admin cannot change their 
own role, cannot ban or unban themselves or any admin, and only one admin can exist. A 
system admin has no extra rights inside a group.

## C8. Admin Dashboard Design

![Report figure or screenshot 7](images/figure-07.png)

**Figure 6: Admin dashboard pages and the endpoints they call**

**Table 26: Admin pages**

| Page | Endpoints | Filters / pagination | Actions | Audit events |
| --- | --- | --- | --- | --- |
| Overview | GET /dashboard/stats, /dashboard/active-sessions, /users, /listings/moderation/report s | Clickable stat cards open drill-down lists (users, banned users, reports, sessions) | View only | — |
| User Management | GET /users/paginated; PATCH /users/{id}/role, /users/{id}/ban, /users/bulk-ban | Server pages (page, page size ≤ 100); _ search by name, email or ID; role filter; status filter (active/banned) | Change role, ban with reason, unban, select many → bulk ban/unban | user role chan _ _ ged, user banned, _ user unbanned _ (bulk action: _ true) |
| User Details | GET /users/{id}; DELETE /users/{id}/sessions | — | Revoke all sessions | user sessions r _ _ evoked |
| Security Monitoring | GET /security/failed- logins?limit | limit 1–200, sorted by attempts | View blocked identifiers | — |

| Page | Endpoints | Filters / pagination | Actions | Audit events |
| --- | --- | --- | --- | --- |
| Audit Logs | GET /audit-logs?limit; GET /export/audit-logs | limit 1–200, newest first | Export CSV | — |
| Moderation (also in Moderator Dashboard) | /listings/moderation/*, PATCH /listings/{id}/moderation | Pending queue and history | Hide/restore listing, resolve/dismiss report | listing moderat _ ion, listing report r _ _ eview |

Bulk actions run in one transaction. The service de-duplicates IDs (duplicates are rejected with 
422), skips admins, users that do not exist and users already in the requested state, and returns 
the number of users updated together with the skipped IDs and reasons, which the UI shows in a 
message. Banned users' sessions and refresh tokens are revoked in the same transaction. CSV 
export currently returns the full audit log ordered by newest first (it does not yet apply the on-
screen limit or filters; see E3).

## C9. Security Design and Threats

**Table 27: Threats and defences**

| Threat | Defence | File / module |
| --- | --- | --- |
| Password database leak | Argon2id hash of HMAC-SHA256(pepper, password); pepper only in env; legacy hashes upgraded at login | security.py |
| Stolen access token | 15-minute lifetime; role and session re-checked on every request; revocable via session | security.py, dependencies.py |
| Stolen refresh token | httpOnly cookie on /api/auth; stored hashed; rotation on every use; reuse revokes the session; logout and session revoke | routers/auth.py, auth service.py _ |
| Brute-force login | 5 failures / 15 min → 429 for 15 min, keyed by HMAC of email; dummy hash to keep timing similar for unknown emails | auth service.py _ (LoginRateLimit) |
| Privilege escalation | Register always sets role=user; role only changed by admin; admin role immutable; single-admin index; token role must match DB | auth service.py, _ admin service.py, _ models.py |
| Access to another user's record | owner id from token; verify listing owner; group _ _ _ checks; sessions filtered by user id (404) | listing service.py, _ group service.py _ |
| Cross-site scripting (XSS) | React escapes output; no dangerouslySetInnerHTML; refresh token not readable by JS; access token short-lived | frontend/src |
| Cross-site request forgery (CSRF) | Cookie only on /api/auth with SameSite=Lax; all other state changes need the bearer header | routers/auth.py |
| CORS misuse | Frontend and API share one origin through Vercel rewrites; no CORS middleware, so other origins cannot read responses | vercel.json, main.py |
| Secrets in the repository | .env files git-ignored; only .env.example with placeholder values; Vercel env vars | .gitignore, .env.example |
| SQL injection | SQLAlchemy ORM with bound parameters only; no raw string SQL from input | services/* |
| Over-posting of fields | Pydantic schemas list allowed fields (no owner id, role, _ is banned in user schemas); extra="forbid" on sensitive _ | schemas.py, listing service.py _ |

| Threat | Defence | File / module |
| --- | --- | --- |
|  | schemas; editable-field allow-list on update |  |

## C10. Deployment on Vercel

![Report figure or screenshot 8](images/figure-08.png)

**Figure 7: Deployment layout**

WarmShare is deployed as one Vercel project (named 2311080-myidea, served at the domain 
2311080-warmshare.vercel.app) using Vercel Services. vercel.json declares two services: 
frontend (root frontend, framework vite, build tsc && vite build) and backend (root backend, 
framework fastapi, entrypoint main:app). Two rewrites route /api/(.*) to the backend service 
and everything else to the frontend, so the SPA calls the API with relative URLs such as 
/api/listings and no API base URL needs to be configured. The database is a Supabase 
PostgreSQL instance reached through DATABASE_URL (or POSTGRES_URL). Every push 
to the main branch triggers an automatic production deployment; a redeploy can also be started 
from the Vercel dashboard (Deployments → Redeploy) after changing environment variables. 
Database migrations in backend/migrations are run once locally against the production 
database when the schema changes, and provision_admin.py promotes the single admin 
account.

**Table 28: Environment variables (names only)**

| Name | Used by | Purpose |
| --- | --- | --- |
| DATABASE URL (or _ POSTGRES URL) _ | database.py | PostgreSQL connection string for Supabase |
| JWT SECRET KEY _ _ | security.py | HS256 signing secret for access tokens |
| PASSWORD PEPPER _ | security.py | Server-side pepper (≥ 32 characters) for password hashing |
| LOGIN RATE LIMIT SECRET _ _ _ | auth service.py _ | HMAC key for hashing login identifiers (different from JWT secret) |
| ENVIRONMENT | routers/auth.py | production → Secure cookie (also set automatically by VERCEL=1) |

## C11. Testing

Strategy. Automated API tests (pytest + FastAPI TestClient) cover authentication, token 
security, RBAC, groups, moderation and the admin rules. Each test runs against a fresh in-
memory SQLite database created by conftest.py, with test secrets injected through environment 
variables, so tests never touch production data. Manual tests on the live Vercel site cover the UI 
flows, which are shown in Part D.

How to run: from the project root, `pip install -r backend/requirements-dev.txt` then `python -
m pytest backend/tests -v`.

**Table 29: Automated test results (92 tests)**

| Test module (count) | Key tests | Requirements | Result |
| --- | --- | --- | --- |
| test auth.py (10) _ | register; login sets httpOnly cookie; wrong password; refresh rotates; logout revokes; revoke own session; cannot revoke another's; lockout after 5; success resets; lockout expires | FR-AUTH-01..08 | Pass |
| test auth security.py _ _ (10) | missing / invalid / tampered / expired token → 401; banned user token and refresh rejected; refresh replay revokes session; role change invalidates token; missing cookie; expired session | FR-AUTH-05, 11; FR-RBAC-09 | Pass |
| test listing rbac.py _ _ (15) | user/moderator/admin can create; guest cannot; public read; owner update/delete; cannot update/delete another's; owner cannot be changed | FR-DOM-01..05; FR-RBAC-03 | Pass |
| test group permissio _ _ ns.py (16) | create group; guest cannot; owner adds member; non-owner cannot; owner updates flags; member cannot rename; with/without can create, can edit, _ _ can assign; non-member cannot view; hidden _ listing excluded | FR-RBAC-04..07, 10; FR-DOM-07 | Pass |
| test moderation.py _ (12) | moderator hide/restore; view, resolve, dismiss reports; user cannot moderate or review; admin can moderate; cannot hide twice; cannot review twice; resolved leaves queue | FR-ADM-12 | Pass |
| test admin rbac.py _ _ (20) | guest/user/moderator denied; admin stats, users, audit, export, failed logins; cannot change own role; cannot ban self; role change; ban; bulk ban/unban; skips; revokes sessions; audit rows; duplicates rejected | FR-ADM-01..11; FR-RBAC-02, 08 | Pass |
| test admin user detai _ _ _ ls.py (9) | paginated users; second page; invalid page size (2 parametrised cases); user detail; 404; guest and user denied | FR-ADM-02, 03 | Pass |

Final run on 27 November 2026: 92 passed, 0 failed (2 harmless deprecation warnings from the 
Starlette test client). See screenshot S17.

# Part D. Evidence: Screenshots of the Running Application

All screenshots were taken on the deployed site https://2311080-warmshare.vercel.app with the 
address bar visible and the logged-in user shown. Passwords and tokens are masked.

## D1. User Side

![Report figure or screenshot 9](images/figure-09.png)

S1: Sign up / login modal with a validation error (e.g. weak or short password)
Requirement: FR-AUTH-01, FR-AUTH-03. Proves: input is validated and a clear error is shown

![Report figure or screenshot 10](images/figure-10.png)

S2: Home page and My Donations of a logged-in user showing only that user's listings
Requirement: FR-DOM-01, FR-DOM-02, FR-DOM-06. Proves: the main feature works and users see only their own

records in the dashboard

![Report figure or screenshot 11](images/figure-11.png)

S3: Account Information and Security Settings, with a wrong current password rejected
Requirement: FR-AUTH-09, FR-AUTH-10. Proves: profile update works and password change requires the correct

current password

![Report figure or screenshot 12](images/figure-12.png)

S4: Login Sessions list with the Revoke action
Requirement: FR-AUTH-06, FR-AUTH-07. Proves: users can see and revoke their own sessions

![Report figure or screenshot 13](images/figure-13.png)

S5: An action denied by RBAC: the message in the app and the 403 response in the Network tab

Requirement: FR-RBAC-02, FR-RBAC-03. Proves: the server enforces permissions, not only the UI

## D2. Security Behaviour

![Report figure or screenshot 14](images/figure-14.png)

S6: Network tab: a protected request carrying the Authorization: Bearer header and the refresh cookie

(values hidden)
Requirement: FR-AUTH-03, FR-AUTH-04. Proves: every protected request carries a bearer token, sent by the SPA,

not read from a cookie

![Report figure or screenshot 15](images/figure-15.png)

S7: Application tab: the warmshare_refresh_token cookie with HttpOnly and Secure ticked,

SameSite=Lax, path /api/auth (value hidden); the access token sits in Session storage
Requirement: FR-AUTH-04. Proves: the refresh token cannot be read by JavaScript and is only sent over HTTPS

![Report figure or screenshot 16](images/figure-16.png)

S8: A banned user: /api/auth/refresh returns 401 and the login attempt shows "Your account has been

suspended."
Requirement: FR-RBAC-09, FR-AUTH-11. Proves: a ban takes effect immediately: the old session can no longer be

refreshed and login is blocked

## D3. Admin Dashboard

![Report figure or screenshot 17](images/figure-17.png)

S9: Admin Dashboard overview statistics
Requirement: FR-ADM-01, FR-ADM-08. Proves: statistics are calculated from real data

![Report figure or screenshot 18](images/figure-18.png)

S10: User Management with search, role and status filters, bulk ban/unban, role selector, per-user actions

and pagination (Page 1 of 3, 22 users)
Requirement: FR-ADM-02, FR-ADM-05, FR-ADM-06. Proves: the admin can find and manage users; the admin's

own row has no role, ban or revoke controls

![Report figure or screenshot 19](images/figure-19.png)

S11: Active Sessions drill-down opened from the overview card (session ID, user, role, created, expires,

status)
Requirement: FR-ADM-08. Proves: the admin can see every active session on the platform

![Report figure or screenshot 20](images/figure-20.png)

S12: Moderator Dashboard: pending reported donations with resolve/dismiss and hide/restore (reason

required)
Requirement: FR-ADM-12. Proves: community reports reach moderators, who decide with a written reason

![Report figure or screenshot 21](images/figure-21.png)

S13: Audit Logs with Export CSV: user_banned, password_change_failed, user_unbanned,

listing_moderation, user_role_changed and listing_report_review events
Requirement: FR-ADM-09, FR-ADM-11, FR-AUTH-10. Proves: sensitive actions from the steps above are recorded

with actor, target and time

## D4. Deployment

![Report figure or screenshot 22](images/figure-22.png)

S14: Vercel project 2311080-myidea: production deployment Ready from branch main, domain 2311080-

warmshare.vercel.app
Requirement: NFR-03. Proves: the application is live on Vercel and redeploys from main

![Report figure or screenshot 23](images/figure-23.png)

S15: Vercel environment variables page (names only, values hidden)

Requirement: NFR-01. Proves: secrets are kept in environment variables

![Report figure or screenshot 24](images/figure-24.png)

S16: Live API documentation at /api/docs
Requirement: C5. Proves: the API is deployed and documented

## D5. Tests

![Report figure or screenshot 25](images/figure-25.png)

S17: Terminal output of the pytest run: 92 passed, 2 warnings in 39.38 s
Requirement: NFR-08. Proves: all automated security, RBAC, moderation and admin tests pass

# Part E. Project Management and Conclusion

## E1. How to Run and Test

Prerequisites

• Python 3.10 or newer, Node.js 22 or newer, npm and Git

• A PostgreSQL database (a free Supabase project works)

Steps

1. Clone  the  repository:  `git  clone  https://github.com/shaikaislamarpita/2311080-

Warmshare.git` and `cd 2311080-Warmshare`.

2. Create `.env.development.local` in the project root (never commit it) with example

values:
 
DATABASE_URL=postgresql://user:password@host:5432/postgres, 
JWT_SECRET_KEY=<long  random  string>,  PASSWORD_PEPPER=<at  least  32 
random characters>, LOGIN_RATE_LIMIT_SECRET=<another long random string>, 
ENVIRONMENT=development.

3. Install backend packages: `pip install -r backend/requirements.txt` (or requirements-

dev.txt for tests).

4. With  the  same  variables  exported  in  your  shell,  create  the  tables:  `python  -m

backend.create_tables` and run the scripts in backend/migrations if upgrading an older 
database.

5. Start  the  API:  `python  -m  uvicorn  backend.main:app  --reload  --env-

file .env.development.local` → http://127.0.0.1:8000/api/docs.

6. In a second terminal: `cd frontend`, `npm install`, `npm run dev` → http://localhost:5173

(Vite proxies /api to the backend).

7. Register a normal account in the UI. To create the single admin, register the account, set

its email in backend/provision_admin.py and run `python -m backend.provision_admin`. 
Promote moderators from the Admin Dashboard.

8. Run the tests: `python -m pytest backend/tests -v`.

9. Log in with the test accounts: one admin, one moderator and normal users. Their user IDs

and passwords are in the Appendix of this PDF report only, never in the repository.

## E2. GitHub Work

This is an individual project, so every issue, branch, commit and pull request in the repository is 
my own work. Each feature followed the same workflow: open an issue, create a feature branch, 
commit, open a pull request that references the issue, merge it into main and check the 
automatic Vercel deployment. In total the repository has 19 issues (all closed) and 21 pull 
requests (all merged), from the planning documents on 10 October to the final dashboard work 
on 26 November 2026.

**Table 30: Issues and pull requests**

| Issue | Pull request | Work delivered | Closed / merged |
| --- | --- | --- | --- |
| #1 | #2 | PRD, SRS and TDD documentation | Oct 10 |
| #3 | #4 | Donation listing CRUD backend (MVP) | Oct 25 |

| Issue | Pull request | Work delivered | Closed / merged |
| --- | --- | --- | --- |
| #5 | #6 | Donation listing CRUD frontend (MVP) | Oct 25 |
| — | #7 | Fix backend imports for Vercel deployment | Oct 27 |
| #8 | #9, #10 | Project README (and revision) | Oct 27 |
| #11 | #12 | User registration and login | Oct 27 |
| #13 | #14 | Donation authorization and ownership | Oct 28 |
| #15 | #16 | Expose FastAPI Swagger docs on Vercel | late Oct |
| #17 | #18 | Refactor frontend into modular architecture | Nov (week 3) |
| #19 | #20 | Refactor backend into modular architecture | Nov (week 3) |
| #21 | #22 | Fix production 500 error / Vercel import paths | Nov (week 3) |
| #23 | #24 | Admin database foundation | Nov (week 3) |
| #25 | #26 | JWT authentication, refresh tokens, sessions and RBAC | Nov (week 3) |
| #27 | #28 | Fix Vercel backend module import error | Nov (week 3) |
| #29 | #30 | Frontend UI: user, admin and moderator dashboards | Nov 23 |
| #31 | #32 | User profile update and secure password change | Nov 24 |
| #33 | #34 | Shared group permissions and admin management | Nov 24 |
| #35 | #36 | Fix moderator and group permission gaps (hidden group listings + tests) | Nov 24 |
| #37 | #38 | Donation reporting and moderator account management (UI/UX audit) | Nov 25 |
| #39 | #40 | Complete admin and moderator dashboards and navigation | Nov 26 |

Work was spread over three phases: planning and the MVP (October), the security work — 
authentication, refresh tokens, sessions, RBAC and the admin foundation — together with 
refactoring and deployment fixes (mid November), and the groups, moderation, profile and 
dashboard features in the final week before submission.

![Report figure or screenshot 26](images/figure-26.png)

**Figure 8: GitHub issues: 19 closed, 0 open**

![Report figure or screenshot 27](images/figure-27.png)

**Figure 9: GitHub pull requests: 21 merged, 0 open**

## E3. Limitations

• The quantity-based claim workflow and NGO verification described in the original PRD

were not built; donors coordinate pickup outside the app.

• Only one admin account can exist (by design), so the template's "two admins" demo setup

is replaced with one admin plus a moderator.

• The admin user search and role/status filters work on the currently loaded page, not across

the whole database.

• The audit log view and CSV export support only a result limit, not filters by actor, action

or date, and the CSV export ignores the on-screen limit.

• Login success and failure events are tracked in login_rate_limits but are not written to

audit_logs, and failed logins are grouped by account identifier only, not by IP address.

• The access token is kept in sessionStorage, so a successful XSS attack could read it for up

to 15 minutes; there is no Content-Security-Policy header yet.

• There is no email verification, password reset by email or email-change flow.

• Pickup addresses are free text; users are told to enter only an approximate area, but this is

not enforced.

• Vercel serverless cold starts can make the first request after a pause take a few seconds.

## E4. Future Work

1. Quantity-based claims — the core donation workflow from the original PRD; lets

volunteers reserve part of a listing.

2. Server-side search and filters for admin users and audit logs — needed once the user

base grows beyond a few pages.

3. Audit login events and failed logins by IP — improves incident investigation.

4. Content-Security-Policy and security headers — reduces the impact of any future

XSS.

5. Email verification and password reset — standard account recovery.

6. NGO verification and campaign pages — lets organisations run winter drives.

7. Notifications — tell donors when a listing is reported or hidden.

## E5. Sources, Libraries and Tools

**Table 31: Sources, libraries and tools**

| Name | Version / link | Used for |
| --- | --- | --- |
| React, React DOM | 19.3 — react.dev | Frontend UI |
| TypeScript | 7.0 — typescriptlang.org | Type-safe frontend |
| Vite, @vitejs/plugin-react | 8.3 / 6.1 — vite.dev | Dev server and build |
| FastAPI | ≥ 0.141 — fastapi.tiangolo.com | REST API, dependencies, OpenAPI docs |
| SQLAlchemy | 2.x — sqlalchemy.org | ORM and models |
| psycopg | 3.2 — psycopg.org | PostgreSQL driver |
| Pydantic | v2 — docs.pydantic.dev | Schemas and validation |
| PyJWT | 2.10+ — pyjwt.readthedocs.io | JWT signing and verification |
| argon2-cffi | 23.1+ — argon2- cffi.readthedocs.io | Password hashing |
| python-dotenv | 1.x | Local environment variables |
| pytest, httpx | 8–9 / 0.27+ | Automated API tests |

| Name | Version / link | Used for |
| --- | --- | --- |
| Supabase | supabase.com | Hosted PostgreSQL |
| Vercel | vercel.com/docs (Services, rewrites) | Hosting and deployment |
| OWASP ASVS, Password Storage and JWT cheat sheets | owasp.org | Security design |
| RFC 7519 | datatracker.ietf.org/doc/html/ rfc7519 | JWT standard |
| Course template | github.com/sayef-reyadh-labs/ smarter-todo | Report structure |
| Git, GitHub, VS Code, Chrome DevTools, Postman | — | Version control, editing, debugging, manual API testing |
| AI tools | ChatGPT (OpenAI), Claude (Anthropic) | Help with coding and debugging, and with writing and formatting this report; all code was reviewed, tested (92 pytest tests) and deployed by me, and the report was checked against the running application |

# Appendix. Test Accounts and Video Demo

## Video Demo

Video demo (5–8 minutes, recorded on the deployed URL): https://youtu.be/eD-V9yR_sQ0?si=6PyurhTMZeFCh7Z0

## Demo Test Accounts

WarmShare allows only one admin account (unique partial index uq_users_single_admin), so 
the demo uses one admin, one moderator and three normal users. All accounts use demo data 
only. The user ID is the account number shown in each dashboard; log in with the email and 
password.

**Table 32: Demo test accounts**

| Role | Name | Email (login) | User ID |
| --- | --- | --- | --- |
| Admin | shaika | aa@gmail.com | 15 |
| Moderator | rita islam | 12@iub.edu.bd | 22 |
| User | test | test@gmail.com | 23 |
| User | rupa | 123@iub.edu.bd | 21 |
| User | arpita | arpita@gmail.com | 8 |

## Shared Group

**Table 33: Demo group**

| Property | Details |
| --- | --- |
| Group name | test |
| Group owner | test (test@gmail.com), user ID 23 |
| Member user IDs | 12, 22, 2 |

**Table 34: Group permission matrix (group "test")**

| User ID | Group role | Create (can create) _ | Edit (can edit) _ | Assign (can assign) _ |
| --- | --- | --- | --- | --- |
| 23 | Owner | Yes | Yes | Yes |
| 12 | Member | Yes | No | Yes |
| 22 | Member | Yes | No | Yes |
| 2 | Member | Yes | No | Yes |

Because members 12, 22 and 2 have Create and Assign but not Edit, they can add donations to 
the group and move their own donations into it, but editing a group donation is refused with 403 
"You do not have the required group permission." Screenshot S5 shows exactly this for user 12.
