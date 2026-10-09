# WarmShare — Product Requirements Document (PRD)

**Project:** WarmShare — Winter Clothing Donation and Distribution Platform  
**Document:** Product Requirements Document (PRD)  
**Version:** 1.0  
**Status:** Initial Planning  
**Development Type:** Solo Academic Project  
**Frontend:** React.js with TypeScript  
**Backend:** FastAPI with Python  
**Database:** PostgreSQL  
**Repository:** [2311080-Warmshare](https://github.com/shaikaislamarpita/2311080-Warmshare)

---

## 1. Executive Summary

WarmShare is a web-based donation management platform that connects individuals who have unused winter clothing with verified NGO volunteers who collect and distribute these items to people in need.

Donors can create listings for jackets, sweaters, blankets, shawls, and socks. NGO volunteers can browse available donations and claim specific quantities instead of claiming an entire listing. Administrators verify NGO volunteers, moderate listings, and manage platform activities.

The application will be developed in two releases:

- **MVP (Midterm):** Core donation listing management, quantity-based claims, basic REST APIs, database operations, and local frontend-backend integration.
- **Beta (Final):** Authentication, Role-Based Access Control (RBAC), security scopes, NGO verification, user dashboards, and deployment.

The project emphasizes a practical, secure, and maintainable full-stack application without unnecessary complexity.

## 2. Problem Statement

During winter, many individuals possess usable clothing and blankets that they no longer need, while disadvantaged communities may struggle to obtain adequate winter essentials.

Donations are frequently coordinated through informal communication, personal contacts, or social media. These approaches can make it difficult to identify available items, track quantities, and coordinate collection.

For example, a donor may have 10 jackets available, while an NGO requires only 6. A system that treats every listing as an all-or-nothing donation cannot efficiently support this situation.

WarmShare aims to address these problems through a centralized platform that supports structured donation listings, partial quantity claims, and collection tracking.

## 3. Product Vision

To make winter clothing donation more organized, accessible, and transparent by connecting donors with verified NGO volunteers through a simple digital platform.

## 4. Product Goals and Objectives

| ID | Objective | Target Release |
|---|---|---|
| OBJ-01 | Allow users to create and browse winter clothing donation listings | MVP |
| OBJ-02 | Support CRUD operations for donation listings | MVP |
| OBJ-03 | Enable quantity-based donation claims | MVP |
| OBJ-04 | Prevent claims from exceeding available quantities | MVP |
| OBJ-05 | Track donation claim and collection statuses | MVP |
| OBJ-06 | Integrate React frontend with FastAPI REST APIs | MVP |
| OBJ-07 | Implement secure user registration and login | Beta |
| OBJ-08 | Enforce RBAC and security scopes | Beta |
| OBJ-09 | Verify NGO volunteers before allowing claims | Beta |
| OBJ-10 | Provide role-specific dashboards and user profiles | Beta |
| OBJ-11 | Deploy the complete application | Beta |

## 5. Target Users and Stakeholders

### 5.1 Donor

A donor is an individual who wants to contribute unused winter clothing.

**Goals:**
- List winter clothing easily.
- Manage available donation quantities.
- Track claims and collections.
- Withdraw items that are no longer available.

**Key Features:**
- Create donation listings — MVP
- View and edit listings — MVP
- Withdraw eligible listings — MVP
- View claims associated with listings — MVP
- Secure account and profile — Beta
- Ownership-protected listing management — Beta

### 5.2 NGO Volunteer

An NGO volunteer represents an organization that collects winter clothing for distribution.

**Goals:**
- Find suitable donations.
- Claim only the required quantity.
- Track reserved donations.
- Record completed collections.

**Key Features:**
- Browse listings — MVP
- Claim available quantities — MVP
- Release active claims — MVP
- Mark claims as collected — MVP
- Register and log in — Beta
- Apply for NGO verification — Beta
- Manage claims through a protected dashboard — Beta

### 5.3 Administrator

An administrator oversees platform operations.

**Goals:**
- Maintain platform integrity.
- Verify NGO accounts.
- Manage users and inappropriate listings.
- Monitor donation activities.

**Key Features:**
- Admin authentication — Beta
- Approve or reject NGO verification — Beta
- Manage user accounts and roles — Beta
- Moderate donation listings — Beta
- View platform statistics — Beta

### 5.4 Other Stakeholders

| Stakeholder | Interest |
|---|---|
| Donation Recipients | Receive winter essentials through NGO distribution |
| Course Instructor | Evaluate functionality, architecture, security, and documentation |
| Project Developer | Deliver a maintainable and complete academic project |

Donation recipients do not require accounts in the initial release.

## 6. Product Scope

### 6.1 In Scope — MVP

The MVP will demonstrate the application's main business functionality locally.

- Create, view, update, and delete donation listings.
- Browse listings and filter by category.
- Maintain total and remaining quantities.
- Create partial donation claims.
- Release claims and restore reserved quantities.
- Mark claims as collected.
- Track listing availability.
- Persist data in PostgreSQL.
- Implement REST APIs using FastAPI.
- Build basic React and TypeScript pages.
- Connect frontend forms and views to backend APIs.
- Provide seeded demonstration donors and NGO volunteers.

MVP donor and NGO identities will be represented by predefined demonstration records. Authentication and access restrictions will not yet be implemented. The MVP must not be deployed publicly with unprotected write endpoints.

### 6.2 In Scope — Beta

The Beta release will complete the application with security and user management.

- User registration and login.
- Secure password hashing.
- JWT-based authentication.
- Donor, NGO Volunteer, and Admin roles.
- Role-Based Access Control.
- FastAPI security scopes.
- Resource ownership validation.
- NGO verification requests and approval.
- Role-specific dashboards.
- User profile management.
- Administrative listing moderation.
- Basic platform statistics.
- Production deployment.

### 6.3 Out of Scope

The following features are excluded from both planned releases:

- Payment processing.
- Courier or delivery management.
- GPS-based pickup tracking.
- Live messaging.
- AI or machine learning.
- Recommendation engines.
- Mobile applications.
- Real-time notifications.
- NGO fundraising campaigns.
- Automated matching of donors and NGOs.
- Management of final distribution to individual recipients.

Collection and distribution logistics will be handled outside the application by NGO volunteers.

## 7. Release Roadmap

### 7.1 Release 1 — MVP (Midterm Demo)

**Objective:** Demonstrate the complete core donation workflow through REST APIs and a basic frontend running locally.

| ID | Feature | Priority |
|---|---|---|
| MVP-01 | Create donation listing | Must |
| MVP-02 | View donation listings and details | Must |
| MVP-03 | Update and delete listings | Must |
| MVP-04 | Filter listings by category | Should |
| MVP-05 | Store total and remaining quantities | Must |
| MVP-06 | Claim a specific quantity | Must |
| MVP-07 | Prevent overclaiming | Must |
| MVP-08 | Release an active claim | Must |
| MVP-09 | Mark a claim as collected | Must |
| MVP-10 | React–FastAPI integration | Must |
| MVP-11 | PostgreSQL persistence | Must |

**Midterm demonstration scenario:**

1. Create a listing for 10 jackets.
2. Display the listing in the React interface.
3. Claim 6 jackets using a demo NGO.
4. Show the remaining quantity as 4.
5. Attempt to claim 5 more jackets and demonstrate validation failure.
6. Release the first claim and restore availability.
7. Claim 6 jackets again and mark them as collected.
8. Show the final claim status and quantity records.

### 7.2 Release 2 — Beta (Final Demo)

**Objective:** Secure the MVP features with authentication, roles, permissions, and ownership checks, and deploy the application.

| ID | Feature | Priority |
|---|---|---|
| BETA-01 | User registration | Must |
| BETA-02 | User login and logout | Must |
| BETA-03 | JWT authentication | Must |
| BETA-04 | Role-Based Access Control | Must |
| BETA-05 | Security scopes | Must |
| BETA-06 | Ownership-based authorization | Must |
| BETA-07 | NGO verification workflow | Must |
| BETA-08 | User profile management | Must |
| BETA-09 | Role-specific dashboards | Must |
| BETA-10 | Admin user management | Should |
| BETA-11 | Admin listing moderation | Should |
| BETA-12 | Basic platform statistics | Should |
| BETA-13 | Deployment | Must |

**Final demonstration scenario:**

1. Register and log in as a donor.
2. Create a donation listing.
3. Register and log in as an NGO volunteer.
4. Submit an NGO verification request.
5. Log in as an administrator and approve the request.
6. Log back in as the verified NGO volunteer.
7. Claim a quantity from the donor's listing.
8. Demonstrate that an unverified NGO cannot create claims.
9. Demonstrate that users cannot edit another donor's listing.
10. Show role-specific dashboards and the deployed application.

## 8. Functional Feature Descriptions

### 8.1 Donation Listing Management — MVP

Donors will be able to create and manage donation listings.

Each listing will contain the following fields:

| Field | Description | Required |
|---|---|---|
| Title | Name of donated items | Yes |
| Category | Jacket, Sweater, Blanket, Shawl, Socks | Yes |
| Size | Item size, where applicable | No |
| Age Group | Child or Adult | Yes |
| Gender | Male, Female, or Unisex | Yes |
| Condition | Like New, Good, or Worn | Yes |
| Quantity Total | Total quantity offered | Yes |
| Quantity Remaining | Currently unreserved quantity | System-generated |
| Pickup Address | Collection location | Yes |
| Status | Available, Fully Claimed, or Withdrawn | System-managed |

Listing details must be validated before saving.

During Beta, only the listing owner will be authorized to update or withdraw their listing.

### 8.2 Quantity-Based Claim Management — MVP

A claim reserves a specified quantity from a donation listing.

Example:

- A listing contains 10 jackets.
- NGO A claims 6 jackets.
- The remaining quantity becomes 4.
- NGO B can claim up to 4 jackets.

The backend must reject requests exceeding the remaining quantity.

Claims must use a database transaction to prevent simultaneous requests from reserving more items than are available.

### 8.3 Claim Status Management — MVP

Each claim has one of the following statuses:

- **Claimed:** Items are reserved for the NGO.
- **Released:** The NGO has canceled the reservation; the quantity becomes available again.
- **Collected:** The NGO has collected the reserved items.

A collected claim cannot be released.

Listing status and claim status are separate concepts because one listing may have several claims at different stages.

### 8.4 Authentication — Beta

Users will register and log in using an email address and password.

The backend will securely store password hashes and issue authentication tokens after successful login.

Protected API endpoints will require valid authentication.

### 8.5 Role-Based Access Control — Beta

The system will support three roles:

- Donor
- NGO Volunteer
- Admin

Each role will have a defined set of permissions.

Role enforcement must occur on the backend, not only through frontend visibility.

### 8.6 NGO Verification — Beta

NGO volunteers will submit organization information for administrative review.

Verification states will be:

- Pending
- Approved
- Rejected

Only approved NGO volunteers may create new donation claims.

### 8.7 User Dashboards — Beta

The system will provide role-specific dashboard views.

**Donor Dashboard:**
- My listings
- Remaining quantities
- Claims received
- Listing management

**NGO Dashboard:**
- Available listings
- My claims
- Claim status
- Verification status

**Admin Dashboard:**
- Pending NGO verification requests
- User management
- Listing moderation
- Basic donation statistics

## 9. User Stories

| ID | User Story | Release |
|---|---|---|
| US-01 | As a donor, I want to create a listing so that NGOs can discover my available winter clothing. | MVP |
| US-02 | As a donor, I want to edit a listing so that its information stays accurate. | MVP |
| US-03 | As an NGO volunteer, I want to browse listings so that I can find suitable donations. | MVP |
| US-04 | As an NGO volunteer, I want to claim a specific quantity so that I reserve only what I need. | MVP |
| US-05 | As an NGO volunteer, I want to release a claim so that unused reservations become available again. | MVP |
| US-06 | As an NGO volunteer, I want to mark a claim as collected so that collection is recorded. | MVP |
| US-07 | As a user, I want to log in securely so that my account is protected. | Beta |
| US-08 | As a donor, I want only my account to modify my listings so that others cannot change them. | Beta |
| US-09 | As an NGO volunteer, I want to request verification so that I can claim donations. | Beta |
| US-10 | As an admin, I want to approve NGO verification requests so that only verified NGOs can claim items. | Beta |
| US-11 | As an admin, I want to manage users and listings so that platform rules are maintained. | Beta |
| US-12 | As a user, I want a dashboard so that I can manage my activities conveniently. | Beta |

## 10. Acceptance Criteria

### AC-01: Create Donation Listing — MVP

**Given** valid listing information,  
**When** a listing is submitted,  
**Then** the backend saves it and initializes `quantity_remaining` equal to `quantity_total`.

### AC-02: Claim Donation Quantity — MVP

**Given** a listing has 10 items remaining,  
**When** an NGO claims 6 items,  
**Then** the claim is recorded and the remaining quantity becomes 4.

### AC-03: Prevent Overclaiming — MVP

**Given** a listing has 4 items remaining,  
**When** a request attempts to claim 5 items,  
**Then** the backend rejects the request and quantities remain unchanged.

### AC-04: Release Claim — MVP

**Given** an NGO has an active claim for 6 items,  
**When** the claim is released,  
**Then** its status becomes Released and the reserved quantity is restored exactly once.

### AC-05: Complete Collection — MVP

**Given** a claim is in Claimed status,  
**When** collection is confirmed,  
**Then** its status changes to Collected and the reserved quantity is not restored.

### AC-06: NGO Verification — Beta

**Given** an NGO volunteer has submitted a verification request,  
**When** an administrator approves it,  
**Then** the volunteer becomes verified and may create claims.

### AC-07: Ownership Authorization — Beta

**Given** a donor attempts to edit another donor's listing,  
**When** the request reaches the backend,  
**Then** access is denied and the listing remains unchanged.

### AC-08: Security Scopes — Beta

**Given** an authenticated user lacks a required permission,  
**When** they call a protected endpoint,  
**Then** the backend denies the action.

### AC-09: Deployment — Beta

**Given** the application is deployed,  
**When** a user accesses the frontend,  
**Then** the frontend can communicate successfully with the deployed backend and database.

## 11. Business Rules

| ID | Rule | Release |
|---|---|---|
| BR-01 | A listing must contain a positive total quantity. | MVP |
| BR-02 | A claim must contain a positive quantity. | MVP |
| BR-03 | A claim cannot exceed the remaining quantity. | MVP |
| BR-04 | A successful claim decreases remaining quantity atomically. | MVP |
| BR-05 | Releasing an active claim restores its quantity exactly once. | MVP |
| BR-06 | Collected claims cannot be released. | MVP |
| BR-07 | Remaining quantity must never become negative. | MVP |
| BR-08 | A listing cannot be withdrawn or deleted while active claims exist. | MVP |
| BR-09 | Deleting a listing with claim history is not permitted; it may instead be withdrawn when eligible. | MVP |
| BR-10 | After claims exist, the original total quantity cannot be reduced or changed in a way that invalidates existing claims. | MVP |
| BR-11 | Only authenticated donors may create listings. | Beta |
| BR-12 | Donors may update only their own listings. | Beta |
| BR-13 | Only verified NGO volunteers may create claims. | Beta |
| BR-14 | NGO volunteers may manage only their own claims. | Beta |
| BR-15 | Administrative operations require Admin permissions. | Beta |
| BR-16 | Backend authorization must enforce roles and security scopes. | Beta |

## 12. Role and Permission Matrix — Beta

| Operation | Donor | NGO Volunteer | Admin |
|---|---|---|---|
| Create listing | Yes | No | No |
| Update own listing | Yes | No | No |
| Withdraw own listing | Yes | No | No |
| Browse listings | Yes | Yes | Yes |
| Create claim | No | Verified only | No |
| Release own claim | No | Yes | No |
| Complete own claim | No | Yes | No |
| View claims on own listings | Yes | No | Yes |
| Approve NGO verification | No | No | Yes |
| Manage users | No | No | Yes |
| Moderate listings | No | No | Yes |
| View platform statistics | No | No | Yes |

## 13. Security Scope Requirements — Beta

The backend will use permission scopes to restrict protected operations.

| Scope | Purpose |
|---|---|
| `listings:create` | Create donation listings |
| `listings:update_own` | Update owned listings |
| `listings:withdraw_own` | Withdraw owned listings |
| `listings:read` | Browse donation listings |
| `claims:create` | Create donation claims |
| `claims:release_own` | Release owned claims |
| `claims:complete` | Complete owned claims |
| `claims:read_own` | View owned claims |
| `claims:read_on_own_listings` | View claims on owned listings |
| `users:verify_ngo` | Approve or reject NGO verification |
| `users:manage_roles` | Manage user roles |
| `listings:delete` | Moderate or remove eligible listings |
| `stats:read` | View platform statistics |

Possessing a scope alone does not override resource ownership checks or NGO verification requirements.

## 14. MoSCoW Prioritization

### Must Have

- Listing CRUD — MVP
- Quantity tracking — MVP
- Partial claims — MVP
- Claim release and collection — MVP
- REST API integration — MVP
- Database persistence — MVP
- Authentication — Beta
- RBAC — Beta
- Security scopes — Beta
- NGO verification — Beta
- User profile/dashboard — Beta
- Deployment — Beta

### Should Have

- Category filtering — MVP
- Listing status filters — MVP
- Admin user management — Beta
- Listing moderation — Beta
- Basic statistics — Beta

### Could Have

- More detailed statistics — Beta, only if time permits
- Additional search filters — Beta, only if time permits

### Won't Have in Initial Releases

- Payments
- Live chat
- GPS tracking
- Automated delivery
- AI features
- NGO campaigns
- Mobile application

## 15. Non-Functional Product Expectations

### Usability

- The interface should be simple and responsive.
- Forms should display clear validation messages.
- Navigation should be understandable for each role.

### Performance

- Ordinary API operations should respond within 2 seconds under local demonstration conditions, excluding startup time and network delays.

### Reliability

- Quantity updates must be transaction-safe.
- Failed claim requests must not change stored quantities.
- Invalid state transitions must be rejected.

### Security

- Beta must use secure password hashing.
- Protected endpoints must validate authentication and authorization.
- Sensitive configuration values must not be committed to GitHub.
- Pickup addresses must not be exposed unnecessarily to unauthorized users in Beta.

### Maintainability

- Frontend components should be reusable.
- Backend APIs should be organized into modules.
- Database operations and business logic should be separated.
- Documentation should remain consistent with the implementation.

## 16. Success Metrics

| Metric | Target | Release |
|---|---|---|
| Listing CRUD | All required operations work | MVP |
| Quantity validation | Overclaiming is rejected | MVP |
| Claim lifecycle | Claim, release, and collection work correctly | MVP |
| Data persistence | Records survive application restart | MVP |
| API integration | React successfully communicates with FastAPI | MVP |
| Authentication | Protected endpoints reject unauthenticated requests | Beta |
| Authorization | Unauthorized operations are denied | Beta |
| NGO verification | Only verified NGOs can claim | Beta |
| Dashboard | Each role can access its relevant functionality | Beta |
| Deployment | Frontend and backend operate in the deployed environment | Beta |

## 17. Assumptions and Dependencies

- The project will be developed by one student.
- React with TypeScript and FastAPI with Python are mandatory technologies.
- PostgreSQL is the planned database.
- Demo users and sample donations may be used during MVP.
- NGO verification is performed manually by an administrator.
- Volunteers coordinate physical collection outside the application.
- The project will use GitHub Issues, feature branches, commits, and Pull Requests.
- Deployment will be completed during Beta, subject to available hosting resources.

## 18. Risks and Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Scope becomes too large | Delayed delivery | Follow MVP/Beta roadmap |
| Concurrent claims exceed availability | Incorrect inventory | Use atomic database transactions |
| Authentication takes longer than expected | Beta delays | Complete MVP first |
| Incorrect permissions | Unauthorized operations | Add backend authorization tests |
| Deployment problems | Final demo disruption | Test deployment before final presentation |
| Inconsistent documentation | Confusing implementation | Maintain shared requirement IDs and release labels |

## 19. Development Milestones

| Milestone | Deliverable | Release |
|---|---|---|
| M1 | PRD, SRS, TDD, GitHub Issue and PR | Planning |
| M2 | Database models and FastAPI setup | MVP |
| M3 | Listing CRUD APIs | MVP |
| M4 | Claim management and quantity validation | MVP |
| M5 | React frontend and API integration | MVP |
| M6 | Midterm demonstration | MVP |
| M7 | Authentication and user profiles | Beta |
| M8 | RBAC, security scopes, NGO verification | Beta |
| M9 | Dashboards and administration | Beta |
| M10 | Testing and deployment | Beta |
| M11 | Final demonstration | Beta |

## 20. Future Enhancements

After the Beta release, WarmShare may be extended with:

- NGO donation campaigns.
- Pickup scheduling.
- Email notifications.
- Location-based donation discovery.
- Detailed donation analytics.
- Additional clothing categories.

These enhancements are not commitments for the current academic project.

## 21. Conclusion

WarmShare is designed as a manageable, practical full-stack web application that addresses the coordination of winter clothing donations.

The MVP focuses on donation listing CRUD, quantity-based claims, and REST API integration. The Beta release extends this functionality with authentication, RBAC, security scopes, NGO verification, dashboards, and deployment.

This two-release approach supports the course requirements while keeping the project realistic for a solo developer.