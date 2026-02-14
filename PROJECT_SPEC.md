# DesignDomain FF&E Portal - Technical Specification

## 1. Project Overview
**DesignDomain FF&E Portal** is a specialized web application for managing Furniture, Fixtures, and Equipment (FF&E) procurement. It connects **Clients** (designers, businesses) with **Admins** (procurement agency) and **Contractors** (service providers).

The system facilitates:
-   **Client Requests:** Submission of procurement needs.
-   **Quote Building:** Interactive drag-and-drop quote creation by Admins.
-   **Team Management:** Clients can add sub-users (team members).
-   **Cost Tracking:** Contractors can submit invoices/costs for approval.
-   **Service Management:** Admins manage a catalog of services and pricing.

---

## 2. Tech Stack
*   **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React Server Components)
*   **Language:** TypeScript
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **Database:** PostgreSQL (via Vercel Postgres or local)
*   **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
*   **Authentication:** Custom JWT-based Auth (stateless, secure cookie)
*   **UI Components:** Custom components using `lucide-react` icons.
*   **State Management:** React Hooks (`useState`, `useEffect`), `react-hook-form` + `zod` for forms.
*   **Drag & Drop:** `@dnd-kit/core` for the Quote Builder.

---

## 3. Database Schema
The database consists of 8 normalized tables.

### `users`
*   `id` (UUID, PK): Unique user ID.
*   `name`: Full Name.
*   `email`: User email.
*   `companyName`: Organization name (for clients).
*   `role`: Enum (`'admin'`, `'client'`, `'contractor'`).
*   `parentId` (UUID): Self-reference. If set, this user is a "subuser" of the parent (e.g., a colleague).
*   `passwordHash`: Bcrypt hash.

### `requests`
*   `id` (UUID, PK)
*   `clientId` (FK -> users): Who submitted it.
*   `status`: Enum (`'pending'`, `'quoted'`, `'approved'`, `'completed'`).

### `services`
*   `id` (UUID, PK)
*   `name`, `description`
*   `price`: Public price per unit.
*   `pricingType`: Enum (`'flat'`, `'hourly'`).
*   `internalCost`, `margin`: For admin profitability tracking.

### `quotes`
*   `id` (UUID, PK)
*   `requestId` (FK -> requests)
*   `totalPrice`: Sum of all items.
*   `status`: Enum (`'draft'`, `'sent'`, `'approved'`).

### `quote_items`
*   `id` (UUID, PK)
*   `quoteId` (FK -> quotes)
*   `serviceName`, `description` (Snapshot of service data)
*   `quantity`: Number of units or hours.
*   `unitPrice`: Rate at time of quote.
*   `price`: Line total (`quantity * unitPrice`).

### `invoices` (Contractor Submissions)
*   `id` (UUID, PK)
*   `contractorId` (FK -> users)
*   `amount`, `description`, `projectName`.
*   `status`: Enum (`'pending'`, `'approved'`, `'paid'`).

---

## 4. User Roles & Workflows

### **A. Admin (The Agency)**
*   **Dashboard:** High-level metrics (Total Requests, Revenue, Pending Actions).
*   **Manage Requests:** View all client requests.
*   **Quote Builder:**
    *   **From Request:** Open a client request -> Click "Create Quote".
    *   **From Scratch:** Use "Create New Quote" in Dashboard Quick Actions -> Select Client -> Build Quote.
    *   Drag & Drop services from the catalog.
    *   Adjust Quantities (Hours/Units) and Unit Prices.
    *   Save Draft or Send to Client.
*   **Manage Services:** CRUD operations for the service catalog (Price, Cost, Margin).
*   **Manage Users:** Add/Edit/Delete users of any role.
*   **Manage Invoices:** View and Approve/Pay costs submitted by Contractors.

### **B. Client (The Customer)**
*   **Dashboard:** View personal and team project history.
*   **New Request:** Submit detailed requirements for new projects.
*   **Team Management:** Add colleagues ("Subusers").
    *   *Logic:* A subuser sees their own requests AND the parent's requests. The parent sees everything.
*   **Settings:** Update profile name and password.

### **C. Contractor (The Vendor)**
*   **Dashboard:** View submission history and payment status.
*   **Submit Invoice:** Input project costs/hours for Admin approval.

---

## 5. Directory Structure (Key Files)

```
/src
  /app
    /(auth)                 # Public Auth Pages
      /login
      /register
    /(dashboard)            # Protected App Area (Shared Layout)
      /admin
        /dashboard          # Admin Home
        /requests           # Request List
          /[id]/quote       # Quote Builder Page
        /services           # Service Catalog
        /users              # User Management
        /invoices           # Contractor Invoice Review
      /client
        /dashboard          # Client Home
        /new-request        # Submit Form
        /team               # Subuser Management
        /settings           # Profile Settings
      /contractor
        /dashboard          # Contractor Home
        /invoices/new       # Submit Cost Form
    /api                    # Backend API Routes
      /auth                 # Login/Register/Logout
      /admin                # Admin-only endpoints
      /client               # Client endpoints
      /contractor           # Contractor endpoints
  /db                       # Database Config
    schema.ts               # Drizzle Schema Definitions
  /lib
    auth.ts                 # JWT & Hashing Utilities
```

## 6. Replication / Installation Guide

1.  **Clone Repository**: Download the source code.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Setup Environment**:
    Create `.env.local` with:
    ```
    DATABASE_URL="postgresql://user:pass@host:port/dbname"
    JWT_SECRET="your-secure-random-string"
    ```
4.  **Database Migration**:
    ```bash
    npx drizzle-kit generate
    npx drizzle-kit migrate
    ```
5.  **Run Development Server**:
    ```bash
    npm run dev
    ```
6.  **Initial Setup**:
    *   Go to `/register` to create a user.
    *   Manually update the database to make this user an `admin` (since registration defaults to `client`).
        ```sql
        UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
        ```
    *   Log in as Admin.
    *   Go to `/admin/services` to add initial services.
    *   Go to `/admin/users` to create Contractor accounts.

---

## 7. Branding & Theme
The project uses a custom color palette defined in `globals.css` and exposed as CSS variables:
*   `--brand-black`: #000000 (Primary UI elements, text)
*   `--brand-red`: #710505 (Buttons, Accents)
*   `--brand-white`: #f6f6f6 (Backgrounds)
*   `--brand-beige`: #ac8d79 (Secondary Accents, Links)
*   **Font:** DM Sans (Google Fonts)
