# WarmShare — Software Requirements Specification (SRS)

**Project:** WarmShare — Winter Clothing Donation and Distribution Platform  
**Document Type:** Software Requirements Specification (SRS)  
**Version:** 1.0  
**Status:** Initial Planning  
**Development Type:** Solo Academic Project  
**Frontend:** React.js with TypeScript  
**Backend:** FastAPI with Python  
**Database:** PostgreSQL  
**Architecture:** REST API  
**Repository:** [2311080-Warmshare](https://github.com/shaikaislamarpita/2311080-Warmshare)

---

# 1. Introduction

## 1.1 Purpose

This Software Requirements Specification (SRS) defines the functional and non-functional requirements of WarmShare.

The document describes the system's expected behavior, user interactions, data requirements, security constraints, and acceptance criteria.

It serves as a reference for development, testing, and evaluation during the midterm and final demonstrations.

## 1.2 Project Scope

WarmShare is a web application that connects donors with NGO volunteers for the collection and distribution of winter clothing and blankets.

Donors create listings containing item details and available quantities. NGO volunteers browse listings and claim specific quantities. Administrators verify NGO volunteers and manage platform activities.

The project will be delivered in two releases.

**Release 1 — MVP (Midterm)**

The MVP focuses on:

- Donation listing CRUD operations.
- Listing browsing and filtering.
- Quantity-based claims.
- Claim release and collection tracking.
- PostgreSQL database integration.
- REST APIs using FastAPI.
- React and TypeScript frontend integration.
- Local execution and demonstration.

The MVP will use seeded demonstration donor and NGO records without authentication.

**Release 2 — Beta (Final)**

The Beta release adds:

- User registration and login.
- JWT-based authentication.
- Role-Based Access Control (RBAC).
- Security scopes and permissions.
- Resource ownership validation.
- NGO verification.
- User profiles and role-specific dashboards.
- Administrative management.
- Deployment.

## 1.3 Intended Audience

This document is intended for:

- Course instructor and evaluators.
- Project developer.
- Future maintainers.
- Software testers.

## 1.4 Definitions and Acronyms

| Term | Definition |
|---|---|
| PRD | Product Requirements Document |
| SRS | Software Requirements Specification |
| TDD | Technical Design Document |
| MVP | Minimum Viable Product |
| Beta | Feature-complete release planned for final demonstration |
| NGO | Non-Governmental Organization |
| API | Application Programming Interface |
| REST | Representational State Transfer |
| CRUD | Create, Read, Update, Delete |
| RBAC | Role-Based Access Control |
| JWT | JSON Web Token |
| ORM | Object-Relational Mapping |
| Claim | Reservation of a specified quantity from a donation listing |
| Scope | Permission associated with a protected API operation |
| Ownership | Relationship determining which user controls a resource |

## 1.5 Requirement Identification

Each requirement will use a unique identifier.

- `FR-XX`: Functional Requirement
- `NFR-XX`: Non-Functional Requirement
- `BR-XX`: Business Rule
- `DR-XX`: Data Requirement
- `AC-XX`: Acceptance Criterion

Requirements are labeled as **MVP** or **Beta**.

Priority levels are:

- **Must:** Required for the designated release.
- **Should:** Important but may be deferred if necessary.
- **Could:** Optional enhancement.

---

# 2. Overall Description

## 2.1 Product Perspective

WarmShare is a standalone full-stack web application.

It consists of:

1. React and TypeScript frontend.
2. FastAPI backend.
3. PostgreSQL relational database.
4. REST APIs connecting frontend and backend.

The frontend handles user interaction and presentation.

The backend handles validation, business logic, database operations, and, during Beta, authentication and authorization.

## 2.2 Product Functions

The system will support:

- Donation listing management.
- Quantity tracking.
- Donation claims.
- Claim release and collection completion.
- User authentication.
- Role-based permissions.
- NGO verification.
- User dashboards.
- Administrative operations.

## 2.3 User Classes

### Donor

Creates and manages donation listings.

### NGO Volunteer

Browses available listings and reserves quantities for collection.

### Admin

Verifies NGO accounts, moderates listings, manages users, and views statistics.

During MVP, donor and NGO identities are represented by seeded demo records.

During Beta, these become authenticated roles.

## 2.4 Operating Environment

**Development Environment**

- Windows or another supported operating system.
- Visual Studio Code.
- Node.js and npm.
- Python.
- PostgreSQL.
- Git and GitHub.
- Modern web browser.

**Runtime Environment**

- React frontend.
- FastAPI application server.
- PostgreSQL database.
- HTTP/HTTPS communication.

The MVP will run locally.

The Beta release will be deployed to a suitable hosting environment.

## 2.5 Design Constraints

- React.js with TypeScript is mandatory for frontend development.
- FastAPI with Python is mandatory for backend development.
- Frontend-backend communication must use REST APIs.
- Data must be persisted in PostgreSQL.
- Authentication, authorization, RBAC, and security scopes must be implemented by Beta.
- The project must remain feasible for a solo developer.
- AI, machine learning, payment gateways, and complex logistics features are excluded.

## 2.6 Assumptions and Dependencies

- Demo records are available for MVP testing.
- NGO volunteers arrange physical pickup outside the platform.
- NGO verification is performed manually by administrators.
- Internet connectivity is required for the deployed Beta application.
- The project uses a single backend service and relational database.

---

# 3. Functional Requirements — MVP

## 3.1 Donation Listing Management

### FR-01: Create Donation Listing

**Release:** MVP  
**Priority:** Must

The system shall allow creation of a donation listing with the following information:

- Title.
- Category.
- Size, where applicable.
- Age group.
- Gender category.
- Item condition.
- Total quantity.
- Pickup address.

**Acceptance Criteria:**

1. Required fields must be provided.
2. The total quantity must be a positive integer.
3. The listing must be saved in the database.
4. `quantity_remaining` must initially equal `quantity_total`.
5. The API must return the created listing with a unique identifier.

### FR-02: View Donation Listings

**Release:** MVP  
**Priority:** Must

The system shall return a list of donation listings.

**Acceptance Criteria:**

1. The API returns listing information in JSON format.
2. Each listing includes its identifier, title, category, quantities, and status.
3. The frontend displays the returned listings.
4. A valid request with no matching listings returns an empty collection.

### FR-03: View Listing Details

**Release:** MVP  
**Priority:** Must

The system shall provide detailed information for a selected listing.

**Acceptance Criteria:**

1. A valid listing ID returns the corresponding listing.
2. An unknown listing ID returns HTTP 404.
3. The frontend displays the listing's details and available quantity.

### FR-04: Update Donation Listing

**Release:** MVP  
**Priority:** Must

The system shall allow an existing listing to be updated.

**Acceptance Criteria:**

1. Valid changes are persisted.
2. Invalid fields are rejected.
3. Updates must preserve quantity consistency.
4. Once claims exist, the original total quantity cannot be changed in a way that invalidates the claim history.
5. A withdrawn listing cannot be reactivated through a normal update request.

### FR-05: Delete or Withdraw Listing

**Release:** MVP  
**Priority:** Must

The system shall support deletion of an eligible unused listing and withdrawal of an eligible active listing.

**Acceptance Criteria:**

1. A listing with no claim history may be deleted.
2. A listing with active claims cannot be deleted or withdrawn.
3. A listing with historical claims may be withdrawn only when no active claims remain.
4. A withdrawn listing cannot receive new claims.
5. Deletion and withdrawal are reflected in subsequent API responses.

### FR-06: Filter Donation Listings

**Release:** MVP  
**Priority:** Should

The system shall support filtering listings by category and availability.

**Acceptance Criteria:**

1. Users can filter by a supported category.
2. Users can request available listings.
3. Results match the supplied filters.
4. An unsupported category is rejected with a validation error.

---

## 3.2 Quantity and Claim Management

### FR-07: Initialize and Track Quantities

**Release:** MVP  
**Priority:** Must

The system shall maintain `quantity_total` and `quantity_remaining` for each listing.

**Acceptance Criteria:**

1. Both quantities are stored as integers.
2. Remaining quantity cannot be negative.
3. Remaining quantity cannot exceed total quantity.
4. Quantities are updated after successful claims and releases.

### FR-08: Create Quantity-Based Claim

**Release:** MVP  
**Priority:** Must

The system shall allow a demo NGO to reserve a specified quantity from an available listing.

**Acceptance Criteria:**

1. The requested quantity must be a positive integer.
2. The listing must not be withdrawn.
3. Sufficient remaining quantity must exist.
4. A successful claim is recorded with status `claimed`.
5. The listing's remaining quantity decreases by the claimed amount.
6. Claim creation and quantity adjustment must occur in one database transaction.

### FR-09: Prevent Overclaiming

**Release:** MVP  
**Priority:** Must

The system shall prevent claims exceeding the available quantity, including simultaneous requests.

**Acceptance Criteria:**

1. Claims exceeding remaining quantity are rejected.
2. Concurrent claims cannot reserve more than the available quantity.
3. Failed claims do not change remaining quantity.
4. The backend returns HTTP 409 for an availability conflict.
5. Database consistency is maintained.

### FR-10: Release Claim

**Release:** MVP  
**Priority:** Must

The system shall allow an active claim to be released.

**Acceptance Criteria:**

1. Only a claim in `claimed` status can be released.
2. The status changes to `released`.
3. The reserved quantity is restored exactly once.
4. A repeated release request must not restore the quantity again.
5. The claim record remains available for history.

### FR-11: Complete Collection

**Release:** MVP  
**Priority:** Must

The system shall allow a claimed donation to be marked as collected.

**Acceptance Criteria:**

1. Only a claim in `claimed` status can be completed.
2. The status changes to `collected`.
3. Collected quantities are not returned to availability.
4. A collected claim cannot subsequently be released.
5. The collection status is persisted.

### FR-12: View Claims

**Release:** MVP  
**Priority:** Must

The system shall provide claim records for demonstration and tracking.

**Acceptance Criteria:**

1. Claims can be retrieved through REST APIs.
2. Each claim includes listing ID, NGO ID, quantity, and status.
3. The frontend displays claim information.
4. Claim data remains available after application restart.

---

## 3.3 Frontend and Backend Integration

### FR-13: REST API Integration

**Release:** MVP  
**Priority:** Must

The React frontend shall communicate with the FastAPI backend using HTTP requests.

**Acceptance Criteria:**

1. Listing creation is performed through a backend API.
2. Listing data is retrieved from the backend.
3. Claim creation and release use backend endpoints.
4. Backend validation errors are displayed appropriately.
5. The frontend does not directly access the database.

### FR-14: Basic Frontend Pages

**Release:** MVP  
**Priority:** Must

The system shall provide basic interfaces for donation management.

Required views:

- Home page.
- Browse listings.
- Listing details.
- Create/edit listing.
- Claim management.

**Acceptance Criteria:**

1. Users can navigate between the required views.
2. Forms submit data to REST APIs.
3. Listing and claim information is displayed correctly.
4. The interface shows loading, success, and error states.

---

# 4. Functional Requirements — Beta

## 4.1 Authentication and User Accounts

### FR-15: User Registration

**Release:** Beta  
**Priority:** Must

The system shall allow users to register as Donors or NGO Volunteers.

**Acceptance Criteria:**

1. Users provide name, email, and password.
2. Email addresses must be unique.
3. Passwords are securely hashed.
4. Public registration cannot create Admin accounts.
5. Newly registered NGO volunteers are unverified.

### FR-16: User Login

**Release:** Beta  
**Priority:** Must

The system shall authenticate registered users.

**Acceptance Criteria:**

1. Valid credentials produce an access token.
2. Invalid credentials are rejected with HTTP 401.
3. Protected endpoints reject missing or invalid tokens.
4. Token expiration is enforced.

### FR-17: User Logout

**Release:** Beta  
**Priority:** Must

The frontend shall provide logout functionality.

**Acceptance Criteria:**

1. The current client-side authentication state is cleared.
2. The application redirects the user to an appropriate public page.
3. Protected frontend views become inaccessible without a new login.
4. Previously issued access tokens remain valid until expiration unless a separate revocation mechanism is implemented.

### FR-18: User Profile Management

**Release:** Beta  
**Priority:** Must

Authenticated users shall be able to view and update permitted profile fields.

**Acceptance Criteria:**

1. Users can retrieve their profile.
2. Users can update their own name and permitted contact information.
3. Users cannot directly modify their role or verification status.
4. Invalid profile updates are rejected.

---

## 4.2 Authorization and Permissions

### FR-19: Role-Based Access Control

**Release:** Beta  
**Priority:** Must

The system shall enforce permissions for Donor, NGO Volunteer, and Admin roles.

**Acceptance Criteria:**

1. Only Donors can create donation listings.
2. Only verified NGO Volunteers can create claims.
3. Only Admins can approve NGO verification requests.
4. Unauthorized operations return HTTP 403.
5. Permissions are enforced by the backend.

### FR-20: Security Scopes

**Release:** Beta  
**Priority:** Must

Protected API endpoints shall validate required security scopes.

**Acceptance Criteria:**

1. Scope requirements are defined for protected operations.
2. FastAPI validates the scopes associated with the authenticated user.
3. Requests lacking required scopes are rejected.
4. Frontend visibility alone does not grant permission.
5. Role changes affect effective permissions on subsequent authorization checks.

### FR-21: Resource Ownership Validation

**Release:** Beta  
**Priority:** Must

The system shall verify ownership for user-specific operations.

**Acceptance Criteria:**

1. Donors can update only their own listings.
2. Donors can withdraw only their own listings.
3. NGO Volunteers can release or complete only their own claims.
4. Users cannot access another user's private claim management data without permission.
5. Ownership validation is performed on the backend.

---

## 4.3 NGO Verification

### FR-22: Submit NGO Verification Request

**Release:** Beta  
**Priority:** Must

An NGO Volunteer shall be able to submit an organization verification request.

**Acceptance Criteria:**

1. The request includes organization name and registration information.
2. A new request has status `pending`.
3. Duplicate active verification requests are rejected.
4. The applicant can view their verification status.

### FR-23: Approve or Reject NGO Verification

**Release:** Beta  
**Priority:** Must

An Admin shall be able to review verification requests.

**Acceptance Criteria:**

1. Admins can view pending requests.
2. Admins can approve or reject requests.
3. Approval updates the NGO's verification status.
4. Rejection does not grant claim permission.
5. Non-admin users cannot perform verification decisions.

---

## 4.4 Dashboards and Administration

### FR-24: Role-Specific Dashboard

**Release:** Beta  
**Priority:** Must

The system shall provide a dashboard appropriate to each authenticated role.

**Acceptance Criteria:**

1. Donors can access their listings and associated claims.
2. NGO Volunteers can access their claims and verification status.
3. Admins can access administrative functionality.
4. Users cannot access another role's protected functionality through direct API calls.

### FR-25: Admin User Management

**Release:** Beta  
**Priority:** Should

Admins shall be able to view users and manage permitted account information and roles.

**Acceptance Criteria:**

1. Only Admins can access user management APIs.
2. Role changes are validated.
3. Public registration cannot grant administrative privileges.
4. Sensitive password hashes are never returned by the API.

### FR-26: Admin Listing Moderation

**Release:** Beta  
**Priority:** Should

Admins shall be able to moderate inappropriate donation listings.

**Acceptance Criteria:**

1. Only Admins can perform moderation.
2. Listings with active claims cannot be physically deleted.
3. Moderation preserves necessary claim history.
4. Moderated listings cannot receive new claims.

### FR-27: Platform Statistics

**Release:** Beta  
**Priority:** Should

Admins shall be able to view basic platform statistics.

Statistics may include:

- Total listings.
- Total quantity offered.
- Total quantity collected.
- Claims by status.
- Listings by category.

**Acceptance Criteria:**

1. Statistics are calculated from database records.
2. Collected quantities count only completed claims.
3. Statistics endpoints require Admin permission.

### FR-28: Deployment

**Release:** Beta  
**Priority:** Must

The completed application shall be deployed to a suitable hosting environment.

**Acceptance Criteria:**

1. The frontend is accessible through a deployed URL.
2. The backend API is accessible to the deployed frontend.
3. The database is connected successfully.
4. Production secrets are stored outside source control.
5. Protected APIs enforce authentication and authorization in the deployed environment.

---

# 5. Non-Functional Requirements

| ID | Requirement | Specification | Release | Priority |
|---|---|---|---|---|
| NFR-01 | Performance | Ordinary API requests should complete within 2 seconds under local demonstration conditions, excluding startup delays. | MVP | Should |
| NFR-02 | Data Integrity | Database constraints and transactions must preserve quantity consistency. | MVP | Must |
| NFR-03 | Reliability | Failed claim transactions must not partially update quantities. | MVP | Must |
| NFR-04 | Usability | Forms must provide clear labels, validation messages, and feedback. | MVP | Must |
| NFR-05 | Maintainability | Backend routes, schemas, models, and business logic must be organized into modules. | MVP | Must |
| NFR-06 | Compatibility | The frontend must work in a current desktop browser. | MVP | Must |
| NFR-07 | Persistence | Listings and claims must survive application restarts. | MVP | Must |
| NFR-08 | Authentication Security | Passwords must be hashed and tokens validated. | Beta | Must |
| NFR-09 | Authorization Security | Protected operations must enforce roles, scopes, and ownership. | Beta | Must |
| NFR-10 | Transport Security | Deployed authentication and API traffic must use HTTPS. | Beta | Must |
| NFR-11 | Responsive Design | Main application pages should support desktop and mobile-sized screens. | Beta | Should |
| NFR-12 | Deployment Configuration | Credentials and secrets must be managed through environment variables or equivalent secure configuration. | Beta | Must |
| NFR-13 | Error Handling | APIs must return consistent, meaningful error responses without exposing sensitive implementation details. | MVP | Must |
| NFR-14 | Testability | Critical listing, claim, and authorization workflows must be covered by repeatable tests. | MVP/Beta | Must |

---

# 6. Data Requirements

## DR-01: User Data

**Release:** MVP (seeded records), Beta (authenticated accounts)

The system shall maintain user records containing:

- Unique identifier.
- Name.
- Email.
- Role.
- Account status.

Beta adds:

- Password hash.
- NGO verification status.
- Profile information.
- Creation timestamp.

## DR-02: Donation Listing Data

**Release:** MVP

Each listing shall contain:

- Listing ID.
- Donor ID.
- Title.
- Category.
- Size.
- Age group.
- Gender.
- Condition.
- Quantity total.
- Quantity remaining.
- Pickup address.
- Listing status.
- Creation timestamp.

## DR-03: Claim Data

**Release:** MVP

Each claim shall contain:

- Claim ID.
- Listing ID.
- NGO ID.
- Claimed quantity.
- Claim status.
- Claim creation timestamp.
- Collection timestamp, when applicable.

## DR-04: NGO Verification Data

**Release:** Beta

Each verification request shall contain:

- Request ID.
- Applicant user ID.
- Organization name.
- Registration information.
- Verification status.
- Submission timestamp.
- Review timestamp, when applicable.

## DR-05: Referential Integrity

**Release:** MVP

The system shall maintain valid relationships between:

- Users and listings.
- Users and claims.
- Listings and claims.

Beta adds the relationship between users and NGO verification requests.

---

# 7. Business Rules

| ID | Business Rule | Release |
|---|---|---|
| BR-01 | Listing total quantity must be a positive integer. | MVP |
| BR-02 | Claim quantity must be a positive integer. | MVP |
| BR-03 | Claim quantity cannot exceed remaining quantity. | MVP |
| BR-04 | Remaining quantity cannot be negative or greater than total quantity. | MVP |
| BR-05 | Successful claims must atomically reserve the requested quantity. | MVP |
| BR-06 | Releasing a claimed reservation restores quantity exactly once. | MVP |
| BR-07 | Collected claims cannot be released. | MVP |
| BR-08 | Listings with active claims cannot be withdrawn or deleted. | MVP |
| BR-09 | Claim history must be preserved after release or collection. | MVP |
| BR-10 | Total quantity cannot be modified in a way that invalidates claim history. | MVP |
| BR-11 | Only authenticated Donors may create listings. | Beta |
| BR-12 | Donors may modify only their own listings. | Beta |
| BR-13 | Only verified NGO Volunteers may create claims. | Beta |
| BR-14 | NGO Volunteers may manage only their own claims. | Beta |
| BR-15 | Admin-only functionality must reject other roles. | Beta |
| BR-16 | Scope checks do not replace ownership checks. | Beta |

---

# 8. Listing and Claim State Models

## 8.1 Listing Status

Listing status will be determined as follows:

| Status | Meaning |
|---|---|
| `available` | Listing is active and has remaining quantity greater than zero. |
| `fully_claimed` | Listing is active and remaining quantity is zero. |
| `withdrawn` | Listing is no longer accepting claims. |

A listing can contain several claims in different states. Therefore, `collected` is a claim status rather than a listing status.

## 8.2 Claim Status

| Current State | Action | Next State |
|---|---|---|
| New | Successful claim | `claimed` |
| `claimed` | Release | `released` |
| `claimed` | Confirm collection | `collected` |
| `released` | Release again | Rejected |
| `collected` | Release | Rejected |
| `collected` | Collect again | Rejected |

State transitions must be validated by the backend.

---

# 9. Role-Based Access Control Requirements — Beta

| Operation | Donor | NGO Volunteer | Admin |
|---|---|---|---|
| Create listing | Allowed | Denied | Denied |
| Update own listing | Allowed | Denied | Denied |
| Withdraw own listing | Allowed | Denied | Denied |
| Browse listings | Allowed | Allowed | Allowed |
| Create claim | Denied | Verified only | Denied |
| Release own claim | Denied | Allowed | Denied |
| Complete own claim | Denied | Allowed | Denied |
| View claims on own listings | Allowed | Denied | Allowed |
| Submit NGO verification | Denied | Allowed | Denied |
| Approve NGO verification | Denied | Denied | Allowed |
| Manage users | Denied | Denied | Allowed |
| Moderate listings | Denied | Denied | Allowed |
| View statistics | Denied | Denied | Allowed |

---

# 10. Security Scope Requirements — Beta

| Scope | Authorized Function |
|---|---|
| `listings:create` | Create donation listing |
| `listings:update_own` | Update owned listing |
| `listings:withdraw_own` | Withdraw owned listing |
| `listings:read` | Browse listings |
| `claims:create` | Create donation claim |
| `claims:release_own` | Release owned claim |
| `claims:complete` | Complete owned claim |
| `claims:read_own` | View owned claims |
| `claims:read_on_own_listings` | View claims associated with owned listings |
| `users:verify_ngo` | Review NGO verification |
| `users:manage_roles` | Manage user roles |
| `listings:delete` | Perform authorized listing moderation |
| `stats:read` | Access platform statistics |

The backend shall validate required scopes for protected endpoints.

Permissions shall be derived from trusted server-side role information and must not be accepted from arbitrary client input.

---

# 11. External Interface Requirements

## 11.1 User Interface

**MVP**

- Home page.
- Donation listing page.
- Listing details page.
- Listing creation and editing form.
- Claim management interface.

**Beta**

- Registration page.
- Login page.
- User profile page.
- Donor dashboard.
- NGO dashboard.
- Admin dashboard.
- NGO verification interface.

## 11.2 API Interface

The system shall use REST APIs with JSON request and response bodies, except where standard authentication protocols require another encoding.

The APIs shall support:

- Standard HTTP methods.
- Appropriate HTTP status codes.
- Input validation.
- Consistent error responses.
- Authentication and authorization during Beta.

FastAPI-generated OpenAPI documentation shall be available for development and testing.

## 11.3 Database Interface

The backend shall access PostgreSQL through a database access layer or ORM.

The frontend shall not connect directly to the database.

## 11.4 Communication Interface

- Local HTTP communication during MVP.
- HTTPS communication for deployed Beta.
- Configured Cross-Origin Resource Sharing (CORS) for approved frontend origins.

---

# 12. Error Handling Requirements

| Scenario | Expected HTTP Status |
|---|---|
| Successful resource creation | 201 Created |
| Successful retrieval or update | 200 OK |
| Successful deletion without response body | 204 No Content |
| Invalid request data | 422 Unprocessable Entity |
| Missing or invalid authentication | 401 Unauthorized |
| Insufficient permission | 403 Forbidden |
| Resource does not exist | 404 Not Found |
| Insufficient quantity or invalid state transition | 409 Conflict |
| Unexpected server error | 500 Internal Server Error |

The backend shall not expose database credentials, password hashes, or internal stack traces in client-facing error messages.

---

# 13. Acceptance Test Scenarios

## AC-01: Listing Creation — MVP

**Given:** Valid donation information.  
**When:** A listing is submitted.  
**Then:** The listing is saved and remaining quantity equals total quantity.

## AC-02: Partial Claim — MVP

**Given:** A listing has 10 jackets available.  
**When:** An NGO claims 6 jackets.  
**Then:** The system records the claim and remaining quantity becomes 4.

## AC-03: Overclaim Prevention — MVP

**Given:** A listing has 4 jackets remaining.  
**When:** An NGO requests 5 jackets.  
**Then:** The request is rejected and the remaining quantity stays 4.

## AC-04: Claim Release — MVP

**Given:** An active claim reserves 6 jackets.  
**When:** The claim is released.  
**Then:** The system restores 6 jackets to availability exactly once.

## AC-05: Collection Completion — MVP

**Given:** A claim is active.  
**When:** Collection is confirmed.  
**Then:** Its status becomes `collected` and the reserved quantity is not restored.

## AC-06: Concurrent Claims — MVP

**Given:** A listing has 5 items remaining.  
**When:** Two requests simultaneously attempt to claim 4 items each.  
**Then:** At most one request succeeds and the remaining quantity never becomes negative.

## AC-07: Authentication — Beta

**Given:** A user provides valid credentials.  
**When:** The login request is submitted.  
**Then:** The backend authenticates the user and returns an access token.

## AC-08: Ownership Protection — Beta

**Given:** Donor A attempts to update Donor B's listing.  
**When:** The request reaches the backend.  
**Then:** The request is denied and the listing remains unchanged.

## AC-09: NGO Verification — Beta

**Given:** An unverified NGO volunteer attempts to create a claim.  
**When:** The request is submitted.  
**Then:** The backend rejects the claim.

## AC-10: Admin Authorization — Beta

**Given:** A non-admin user attempts to approve NGO verification.  
**When:** The request reaches the backend.  
**Then:** The operation is denied.

## AC-11: Deployment — Beta

**Given:** The frontend and backend are deployed.  
**When:** An authenticated user performs an authorized action.  
**Then:** The deployed frontend successfully communicates with the backend and the change is persisted.

---

# 14. Requirements Traceability Matrix

| PRD Objective | SRS Requirements | Release |
|---|---|---|
| OBJ-01: Create and browse listings | FR-01, FR-02, FR-03, FR-06 | MVP |
| OBJ-02: Listing CRUD | FR-01, FR-02, FR-03, FR-04, FR-05 | MVP |
| OBJ-03: Quantity-based claims | FR-07, FR-08, FR-10, FR-11, FR-12 | MVP |
| OBJ-04: Prevent overclaiming | FR-07, FR-08, FR-09 | MVP |
| OBJ-05: Track claims and collections | FR-10, FR-11, FR-12 | MVP |
| OBJ-06: Frontend-backend integration | FR-13, FR-14 | MVP |
| OBJ-07: Secure authentication | FR-15, FR-16, FR-17 | Beta |
| OBJ-08: RBAC and scopes | FR-19, FR-20, FR-21 | Beta |
| OBJ-09: NGO verification | FR-22, FR-23 | Beta |
| OBJ-10: Dashboards and profiles | FR-18, FR-24, FR-25, FR-26, FR-27 | Beta |
| OBJ-11: Deployment | FR-28 | Beta |

---

# 15. Release Acceptance Criteria

## 15.1 MVP Completion Criteria

The MVP is considered complete when:

- Listing CRUD operations work.
- Quantity-based claims work.
- Overclaiming is prevented.
- Claim release restores quantities correctly.
- Collection completion updates claim status.
- PostgreSQL persistence works.
- React successfully communicates with FastAPI.
- The system runs locally.
- The midterm demonstration scenarios pass.

## 15.2 Beta Completion Criteria

The Beta is considered complete when:

- Users can register and log in.
- JWT authentication works.
- Roles and security scopes are enforced.
- Resource ownership checks work.
- NGO verification works.
- User profiles and dashboards are functional.
- Unauthorized operations are rejected.
- The application is deployed.
- The final demonstration scenarios pass.

---

# 16. Exclusions and Future Enhancements

The following are not required for MVP or Beta:

- Payment gateway.
- Live chat.
- GPS tracking.
- Courier management.
- AI or machine learning.
- Recommendation systems.
- Mobile application.
- Automated NGO matching.
- NGO donation campaigns.

These may be considered in future development.

---

# 17. Conclusion

This SRS defines the functional and non-functional requirements for WarmShare across its two planned releases.

The MVP emphasizes donation listing management, quantity-based claims, reliable database transactions, and frontend-backend integration.

The Beta release adds secure authentication, role-based authorization, security scopes, NGO verification, dashboards, and deployment.

The requirements provide a testable foundation for the Technical Design Document (TDD), implementation, and course demonstrations.