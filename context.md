{\rtf1\ansi\ansicpg1252\cocoartf2867
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica-Bold;\f1\fswiss\fcharset0 Helvetica;\f2\froman\fcharset0 Times-Roman;
\f3\froman\fcharset0 TimesNewRomanPSMT;}
{\colortbl;\red255\green255\blue255;\red42\green75\blue126;\red63\green108\blue175;\red0\green0\blue0;
}
{\*\expandedcolortbl;;\cssrgb\c21176\c37255\c56863;\cssrgb\c30980\c50588\c74118;\cssrgb\c0\c0\c0;
}
\margl1440\margr1440\vieww17380\viewh10520\viewkind0
\deftab720
\pard\pardeftab720\sl429\partightenfactor0

\f0\b\fs37\fsmilli18667 \cf2 \expnd0\expndtw0\kerning0
FF&E Secure Client Portal \'96 Technical Specification\
\pard\pardeftab720\sl398\partightenfactor0

\fs34\fsmilli17333 \cf3 1. Project Overview\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\f1\b0\fs29\fsmilli14667 \cf4 Build a secure web-based portal for FF&E (Furniture, Fixtures & Equipment Procurement) to manage client service requests, generate quotes, manage approvals, and move projects into contract and scheduling phases. The application must be built using React for the frontend and a secure backend architecture.
\f2 \
\pard\pardeftab720\sl398\partightenfactor0

\f0\b\fs34\fsmilli17333 \cf3 2. Core User Roles\
\pard\pardeftab720\sl337\partightenfactor0

\fs29\fsmilli14667 \cf3 2.1 Admin User\
\pard\pardeftab720\li960\fi-480\sl337\partightenfactor0

\f1\b0 \cf4 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Secure login
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 View all incoming client requests
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 View uploaded documents
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Create and edit quotes using a drag-and-drop service builder
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Generate downloadable PDF quotes
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Send quotes back to client through portal
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Revise quotes based on client comments
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Upload and send contracts
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Mark project status (Pending, Quoted, Approved, Contract Sent, Completed)
\f2 \
\pard\pardeftab720\li960\fi-480\sl337\sa266\partightenfactor0

\f1 \cf4 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Attach meeting scheduling link (Zoom or Google Meet)
\f2 \
\pard\pardeftab720\sl337\partightenfactor0

\f0\b \cf3 2.2 Client User\
\pard\pardeftab720\li960\fi-480\sl337\partightenfactor0

\f1\b0 \cf4 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Secure login and registration
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Submit new FF&E service request via structured form
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Upload documents (PDF, XLSX, DOCX, images, architectural plans)
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 View request history
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Review quotes
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Add comments to quotes
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Approve quote
\f2 \

\f1 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Download contracts
\f2 \
\pard\pardeftab720\li960\fi-480\sl337\sa266\partightenfactor0

\f1 \cf4 -
\f3\fs18\fsmilli9333 \'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0\'a0 
\f1\fs29\fsmilli14667 Schedule meeting via provided link
\f2 \
\pard\pardeftab720\sl398\partightenfactor0

\f0\b\fs34\fsmilli17333 \cf3 3. Authentication & Security Requirements\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\f1\b0\fs29\fsmilli14667 \cf4 - Use secure authentication (JWT-based or session-based authentication)\uc0\u8232 - Encrypted passwords using bcrypt\u8232 - HTTPS required\u8232 - Role-based access control (Admin vs Client)\u8232 - Secure file upload storage (AWS S3 or secure cloud storage)\u8232 - File size limits and validation\u8232 - Input sanitization to prevent injection attacks\u8232 - CSRF protection\u8232 - Secure environment variables for secrets\
- no clerk usage
\f2 \
\pard\pardeftab720\sl398\partightenfactor0

\f0\b\fs34\fsmilli17333 \cf3 4. Frontend Requirements (React)\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\f1\b0\fs29\fsmilli14667 \cf4 - React with modern hooks\uc0\u8232 - Routing (React Router or Next.js routing)\u8232 - Dashboard layout for Admin and Client\u8232 - Drag-and-drop interface for quote builder (e.g., dnd-kit)\u8232 - Form validation (React Hook Form)\u8232 - File upload component with preview\u8232 - Status badges and project tracking UI\u8232 - PDF preview option
\f2 \
\pard\pardeftab720\sl398\partightenfactor0

\f0\b\fs34\fsmilli17333 \cf3 5. Backend Requirements\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\f1\b0\fs29\fsmilli14667 \cf4 - Node.js with Express or Next.js API routes\uc0\u8232 - REST API structure\u8232 - Database: PostgreSQL preferred\u8232 - ORM: Drizzle\u8232 - File storage: S3-compatible storage\u8232 - PDF generation using server-side library (e.g., pdfkit)
\f2 \
\pard\pardeftab720\sl398\partightenfactor0

\f0\b\fs34\fsmilli17333 \cf3 6. Database Schema (High-Level)\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\f1\b0\fs29\fsmilli14667 \cf4 Users Table:\uc0\u8232 - id\u8232 - name\u8232 - email\u8232 - password_hash\u8232 - role (admin/client)\u8232 - created_at\u8232 \u8232 Requests Table:\u8232 - id\u8232 - client_id\u8232 - project_name\u8232 - description\u8232 - status\u8232 - created_at\u8232 \u8232 Documents Table:\u8232 - id\u8232 - request_id\u8232 - file_url\u8232 - file_type\u8232 \u8232 Quotes Table:\u8232 - id\u8232 - request_id\u8232 - total_price\u8232 - status\u8232 - created_at\u8232 \u8232 Quote_Items Table:\u8232 - id\u8232 - quote_id\u8232 - service_name\u8232 - description\u8232 - price\u8232 \u8232 Comments Table:\u8232 - id\u8232 - quote_id\u8232 - user_id\u8232 - message\u8232 - created_at
\f2 \
\pard\pardeftab720\sl398\partightenfactor0

\f0\b\fs34\fsmilli17333 \cf3 7. Quote Builder Logic\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\f1\b0\fs29\fsmilli14667 \cf4 - Admin selects services from predefined service list\uc0\u8232 - Drag-and-drop into active quote area\u8232 - Each service has editable price field\u8232 - Automatic total calculation\u8232 - Ability to save draft\u8232 - Generate structured PDF\u8232 - Send quote notification to client
\f2 \
\pard\pardeftab720\sl398\partightenfactor0

\f0\b\fs34\fsmilli17333 \cf3 8. Workflow Logic\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\f1\b0\fs29\fsmilli14667 \cf4 1. Client submits request with documents\uc0\u8232 2. Admin reviews request\u8232 3. Admin builds quote\u8232 4. Quote sent to client\u8232 5. Client reviews and comments OR approves\u8232 6. Admin revises if needed\u8232 7. Upon approval, admin uploads contract\u8232 8. Client receives contract\u8232 9. Client schedules 30-minute meeting via provided scheduling link\u8232 \u8232 
\f2 \
\pard\pardeftab720\sl398\partightenfactor0

\f0\b\fs34\fsmilli17333 \cf3 9. Future Scalability Considerations\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\f1\b0\fs29\fsmilli14667 \cf4 - Ability to add more user roles\uc0\u8232 - Stripe integration for payments\u8232 - E-signature integration\u8232 - Notification system (email + in-app)\u8232 - Admin analytics dashboard
\f2 \
}