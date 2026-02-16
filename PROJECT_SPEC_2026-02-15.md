# Project Specification - DesignDomain

## Date: February 15, 2026

## 1. Introduction

This document outlines the current functionality, key features, and technical stack of the DesignDomain application. DesignDomain is a comprehensive platform designed to streamline project management, quoting, invoicing, and contractor/client interactions within a service-based business.

## 2. Core Functionality

The application provides distinct dashboards and functionalities tailored for three primary user roles: Admin, Client, and Contractor.

### 2.1 Admin Dashboard

-   **User Management**: View and manage user accounts.
-   **Contractor Request Management**: Approve or deny contractor requests.
-   **Invoice Management**: Create, view, and manage invoices.
-   **Labor Request Management**: Handle and assign labor requests.
-   **Pricing Management**: Manage pricing entries for services.
-   **Quote Management**: Create, view, and manage quotes, including PDF generation.
-   **Service Management**: Manage available services.
-   **System Settings**: Configure application-wide settings and profiles.
-   **Project Management**: Oversee client projects and requests.

### 2.2 Client Dashboard

-   **Project Overview**: View current projects and their status.
-   **New Project Creation**: Initiate new service projects.
-   **Service Request**: Submit new requests for services.
-   **Contractor Request**: Request specific contractors for projects.
-   **Settings**: Manage client profile and account settings.
-   **Team Management**: Manage team members (if applicable).
-   **Document Management**: Access project-related documents.

### 2.3 Contractor Dashboard

-   **Accepted Quotes**: View and manage accepted quotes.
-   **Invoice Creation**: Create invoices for completed work.
-   **Labor Request Handling**: Respond to and manage labor requests.
-   **Settings**: Manage contractor profile and account settings.
-   **Subcontractor Requests**: Manage requests for subcontractors.
-   **Admin Connections**: Manage connections with administrators.

## 3. Key Features

### 3.1 Authentication & Authorization

-   User login, registration, and logout.
-   Role-based access control for Admin, Client, and Contractor.
-   Secure authentication processes (likely using `next-auth` or similar).

### 3.2 PDF Generation

-   Generation of PDF documents for quotes and invoices (`src/lib/pdf-generator.tsx`, `src/lib/invoice-generator.ts`).
-   Client-side PDF generation utilities (`src/utils/client-pdf-generator.ts`).

### 3.3 API Endpoints

A comprehensive set of API endpoints are available, categorized by user role (Admin, Client, Contractor) and functionality:

-   **Admin API**: Endpoints for managing contractor requests, invoices, labor requests, pricing, quotes, services, and users.
-   **Client API**: Endpoints for projects, quotes, requests, contractor linking, and team management.
-   **Contractor API**: Endpoints for connected admins, invoices, profile management, and admin requests.
-   **General API**: Endpoints for authentication (login, register, logout), contact forms, sending emails, and user profile management.

### 3.4 Database & Schema

-   Relational database management, likely using Drizzle ORM given the `drizzle` directory and `drizzle.config.ts`.
-   Schema definitions for various entities (`src/db/schema.ts`).
-   Database migrations are managed through Drizzle (`drizzle/*.sql`).

### 3.5 Styling & UI

-   Modern web application interface.
-   Global styling defined in `src/app/globals.css`.
-   Responsive design for various devices.

### 3.6 Helper Utilities

-   Authentication utilities for edge and server environments (`src/lib/auth-edge.ts`, `src/lib/auth-server.ts`).
-   Various scripts for database migrations and data checks (`scripts/`).

## 4. Technologies Used

-   **Framework**: Next.js (React)
-   **Styling**: PostCSS (tailwind.css likely used given `postcss.config.mjs`)
-   **Database ORM**: Drizzle ORM
-   **Database**: (Inferred from Drizzle migrations, likely PostgreSQL or similar)
-   **Authentication**: (Inferred from auth files, potentially NextAuth.js or custom implementation)
-   **TypeScript**: Primary language for development.

## 5. Future Considerations

(This section can be populated as the project evolves with new requirements or features.)