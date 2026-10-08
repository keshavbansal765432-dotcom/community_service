# Edu School Classroom System

A simple Class 1–5 school management system for a Principal/Admin and teachers. **AI is intentionally not included.**

## Included
- Supabase email/password authentication.
- First Admin/Principal setup at `/admin/setup`.
- No public teacher registration.
- Admin can create, edit, deactivate and remove teacher accounts.
- Admin can assign/reassign a teacher to a class.
- Admin CRUD for Classes, Students, Subjects, Timetable and Notices.
- Teacher CRUD for their own Assignments.
- Teacher Attendance marking for assigned classes.
- Teacher Classes page showing only classes assigned by Admin.
- Database-backed Classroom Mode: lessons and slides are stored in Supabase; there is no hardcoded lesson content.
- Cartoon-style Smart Board classroom interface with full-screen mode.
- Printable browser worksheets.

## Setup

### 1. Install and start
```bash
npm install
npm run dev
```

If Next.js chooses another port, use the port shown by the terminal.

### 2. Configure `.env.local`
The ZIP contains a simple `.env.local` with only these three values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SECRET_KEY
```

Replace only the values. The names can stay exactly as shown. The secret key is server-only and must never be put in a `NEXT_PUBLIC_*` variable.

### 3. Database
Open Supabase → SQL Editor and run `db/schema.sql`. This creates the tables, classroom lesson storage, triggers and RLS policies.

### 4. Create the first Admin
Open:

```text
http://localhost:3000/admin/setup
```

If your dev server is using port 3001, use:

```text
http://localhost:3001/admin/setup
```

Enter the Principal/Admin name, email and password. The setup route checks whether an active Admin already exists. Once one exists, setup is locked.

### 5. Admin workflow
1. Open `/login`.
2. Sign in as the Principal/Admin.
3. Create Classes and Sections.
4. Create Subjects for each class.
5. Create teacher accounts and assign their classes.
6. Add students to classes.
7. Build the timetable.
8. Publish notices.

When a teacher leaves, use **Admin → Teachers → Remove** to delete the teacher's login and clear their class assignment, or use **Edit → Account active** to deactivate them without deleting the account.

### 6. Teacher workflow
Teachers only see classes assigned to them. They can:
- create/edit/delete assignments for their assigned classes;
- mark attendance;
- view their assigned classes and students;
- create database-backed classroom lessons and slides;
- open the cartoon Smart Board Classroom Mode;
- create and print worksheets.

Teachers cannot change their own class assignment. Only Admin can assign/reassign classes.

## Classroom Mode

Go to **Teacher → Classroom**. Select the assigned class and a saved lesson. Create a new lesson to add its title, explanation and slides. The classroom screen reads its content from the `classroom_lessons` table.

## Printable Worksheets

Go to **Teacher → Worksheets**, edit the worksheet and questions, then choose **Print worksheet**. The print stylesheet hides navigation and controls so the output is suitable for a physical worksheet.

## Security

The server uses the Supabase secret key only in server-side Admin APIs. Teachers are restricted to their assigned classes by both API checks and database RLS policies.
