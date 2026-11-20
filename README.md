# e-FUND

**e-FUND** is a front-end fund request management system for the Supreme Student Council (SSC) Committee on Financial Management and Audit (COMMFIMA) at Batangas State University — ARASOF-Nasugbu.

The project presents a complete prototype for submitting, reviewing, approving, tracking, and recording fund requests without using Google Forms.

## Features

### Landing Page
- Responsive project presentation and loading screen
- SSC and COMMFIMA audience information
- Project rationale, objectives, and implementation timeline
- Ten-feature system showcase
- Fund request workflow
- UI previews
- UN Sustainable Development Goal information
- Budget summary
- Direct links to the login page

### Authentication
- Login with email and password
- Account registration
- Password visibility controls
- Password strength indicator
- Data Privacy Policy acknowledgement
- SSC Officer and COMMFIMA Member roles
- Demo login for both user roles
- Browser-based account storage

### Dashboard
- Officer and COMMFIMA-specific views
- Fund request overview
- Request submission and document fields
- Disbursement voucher folders
- Checks and project records
- Search and status filtering
- Notifications and audit log
- Request approval and status workflow
- Responsive sidebar and mobile menu
- Session logout

## Demo Accounts

You can use the demo buttons on the login page:

- **Try as SSC Officer** — opens the officer dashboard.
- **Try as COMMFIMA** — opens the administrator dashboard.

You may also register an account from `signup.html`. Registered accounts are stored locally in the browser.

## Project Structure

```text
.
├── index.html        # Landing page
├── login.html        # Login page
├── signup.html       # Account registration page
├── dashboard.html    # User dashboard
├── style.css         # Main and landing page styles
├── auth.css          # Login and registration styles
├── dashboard.css     # Dashboard styles
├── index.js          # Landing page interactions
├── auth.js           # Authentication and local account handling
├── dashboard.js      # Dashboard data and interactions
├── icons.js          # Shared SVG icon sprite
├── images/           # Logos and interface preview images
└── README.md
```

## Running the Project

This is a static prototype and does not require package installation.

From the project folder, run:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500/index.html
```

You can also open the HTML files directly in a browser, although a local server is recommended.

## Demo Data and Storage

This project is a front-end demonstration. It uses the browser's `localStorage` and `sessionStorage`:

- `efund_users` — registered demo accounts
- `efund_session` — the currently signed-in user
- `efund_flash` — temporary registration success messages
- `efund_data_v1` — dashboard requests, notifications, checks, and logs

Clearing browser site data resets the demo.

## Production Limitations

Before production deployment, authentication and fund records should be moved to a secure backend:

- Replace browser-only password storage with server-side authentication.
- Add Google OAuth or G Suite authentication.
- Store data in a database.
- Validate every request and user role on the server.
- Add secure file uploads and document storage.
- Configure authorization, audit logging, backups, and monitoring.
- Add server-side privacy and data retention controls.

## Technologies

- HTML5
- CSS3
- JavaScript
- Browser Local Storage
- SVG icons
- Google Fonts

## Institution

Supreme Student Council — Committee on Financial Management and Audit  
Batangas State University, The National Engineering University — ARASOF-Nasugbu
