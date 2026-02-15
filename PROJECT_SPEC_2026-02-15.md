# DesignDomain Project Specification - 2026-02-15

This document outlines the current state and key functionalities of the DesignDomain portal, incorporating all features and modifications implemented as of 2026-02-15.

---

## 1. Core Application & Technologies

*   **Framework:** Next.js (v16.1.6) App Router
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Database:** PostgreSQL (with Drizzle ORM)
*   **Authentication:** JWT-based authentication (jose, bcryptjs) with secure cookie management (httpOnly, secure, sameSite=Lax).
*   **Form Management:** React Hook Form with Zod for schema validation.
*   **PDF Generation:** `@react-pdf/renderer` for server-side PDF generation.
*   **Notifications:** `sonner` for toast notifications (though not yet integrated into the UI).

## 2. Authentication & User Management

### 2.1 User Roles
The system supports three primary user roles, each with distinct dashboards and access controls:
*   **Admin:** Full access to manage users, services, pricing, requests, quotes, and contractor requests.
*   **Client:** Can submit new requests, view current projects, view their team, and manage their profile.
*   **Contractor:** Can view their dashboard, manage company information, and submit invoices.

### 2.2 Login & Registration
*   Secure login process with email/password authentication.
*   Registration allows new users to create accounts. Roles can be assigned via URL parameters (e.g., `/register?role=contractor`).
*   Client-side navigation after successful login, redirecting users to their role-specific dashboard (e.g., `/admin/dashboard`, `/client/dashboard`, `/contractor/dashboard`).
*   Middleware protects routes based on authentication token and user role, redirecting unauthorized access to `/login`.

## 3. Request & Quote Management

### 3.1 Client Request Submission
*   Clients can submit new project requests, providing details about their FF&E needs.

### 3.2 Admin Request & Quote Building
*   Admins can view and manage client requests.
*   **Quote Builder Page (`/admin/requests/[requestId]/quote`):**
    *   Allows admins to build quotes for specific client requests.
    *   Integrates a service catalog for adding predefined services.
    *   Supports adding **custom items**, with the service name field initially blank for immediate input.
    *   Features drag-and-drop reordering of quote items (via Dnd Kit).
    *   Calculates net price, tax amount (based on adjustable tax rate), delivery fee, and total price.
    *   **"Edit vs. View" Logic:** Displays quotes as editable if their status is `draft`. For quotes with `sent`, `approved`, or `revised` status, the page renders as largely read-only, disabling input fields and action buttons (e.g., "Add to Quote", "Save Draft", "Send Quote").
    *   Allows saving quotes as `draft` or changing status to `sent`.
    *   Supports deleting quotes (if not sent).
    *   Displays the request details, client information, and quote items.
    *   **Quote ID Display:** Displays a truncated 6-character version of the Quote ID (e.g., `xxxxxx`).
    *   Displays the "Quote Created" date and time in the Quote Summary section.

### 3.3 Quote PDF Generation & Download
*   Admins (and clients if authorized) can download quotes as PDFs.
*   **Filename Format:** Downloaded PDFs are named `DesignDomainLLC-Quote-YYYY-MM-DD-xxxxxx.pdf` (where `xxxxxx` is the 6-character short quote ID).
*   **PDF Internal Title:** The PDF document itself has an internal title set to `Quote - [Project Name] - [Short Quote ID]`.
*   **Technology:** Uses `@react-pdf/renderer` for robust, React-component-based PDF generation in the Node.js runtime.
*   The API route (`/api/quotes/[quoteId]/pdf`) is explicitly configured to run in the `nodejs` runtime to ensure compatibility with `react-pdf/renderer`'s dependencies.

## 4. Contractor Management

### 4.1 Contractor Company Information (`/contractor/settings`)
*   Contractors have a dedicated page to manage and update their company information (Name, Company Name).
*   Form uses `react-hook-form` and `zod` for validation.
*   Updates are handled via a `PUT /api/contractor/profile` endpoint.

### 4.2 Client Request to Become Contractor
*   **Database Schema:** New `contractorRequests` table (`clientId`, `adminId`, `status`, `createdAt`, `updatedAt`) added to `src/db/schema.ts`, along with a `contractorRequestStatusEnum` (`pending`, `approved`, `rejected`).
*   **Client-side (`/client/request-contractor`):** Clients can search for administrators by name or email.
*   Clients can send a request to an admin to be linked as a contractor.
*   **Admin-side (`/admin/contractor-requests`):** Admins can view pending requests from clients.
*   Admins can `approve` or `reject` these requests.
    *   Upon approval, the client's `role` in the `users` table is changed to `contractor`, and their `parentId` is set to the approving admin's ID.
*   Navigation links added for both client and admin roles.

## 5. Database Schema Enhancements (quotes table)

*   **`version` field:** Added to the `quotes` table (varchar, default '1.0') to track quote versions.
*   **`sentAt` field:** Added to the `quotes` table (timestamp) to record when a quote was sent.
*   The Drizzle ORM schema (`src/db/schema.ts`) reflects these changes, and the database has been successfully updated via `drizzle-kit push`.

---

This document should serve as a comprehensive overview of the current application state.
