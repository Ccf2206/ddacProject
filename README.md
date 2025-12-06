# Property Management System - Complete Documentation

## 📋 Project Overview

A full-stack **Property Management System** built with **React + Vite (Frontend)** and **ASP.NET Core (Backend)** with **MySQL** database. This system provides comprehensive property management capabilities for multiple user roles including Admin, Staff, Technician, and Tenant.

---

## 🏗️ Technology Stack

### Frontend
- **Framework**: React 19.2.0 with Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Icons**: React Icons

### Backend
- **Framework**: ASP.NET Core (.NET)
- **Database**: MySQL with Entity Framework Core (Pomelo)
- **Authentication**: JWT Bearer Tokens
- **API Documentation**: Swagger/OpenAPI

### Database
- **DBMS**: MySQL
- **ORM**: Entity Framework Core
- **Database Name**: PropertyManagementDB

---

## 👥 User Roles & Features

### 🔑 Admin Role
**Full system access and administrative capabilities**

#### User Management
- View all users in the system
- Create new user accounts for any role
- Edit existing user information
- Delete users
- Assign/change user roles
- View user activity and audit logs

#### Role Management
- Create custom roles
- Assign permissions to roles
- View role assignments
- Manage role hierarchy

#### Approvals Management
- Review and approve/reject lease applications
- Manage maintenance request approvals
- View approval history
- Set approval workflows

#### Audit Logs
- View all system activities
- Track user actions
- Monitor security events
- Export audit reports

#### Lease Templates
- Create reusable lease templates
- Edit template terms and conditions
- Set default rental terms
- Manage template versions

---

### 👔 Staff Role
**Property and lease management**

#### Property Management
- Add new properties
- Edit property details
- View all properties
- Manage property status

#### Unit Management
- Add units to properties
- Edit unit information
- Set unit availability
- Manage unit pricing

#### Lease Management
- Create new leases
- Assign tenants to units
- Set lease terms and duration
- Manage lease renewals
- Track lease expiration

#### Invoice Management
- Generate rent invoices
- Set due dates
- Track payment status
- Send payment reminders

#### Tenant Management
- View tenant details
- Add new tenants
- Update tenant information
- Track tenant history

#### Maintenance Management
- View all maintenance requests
- Assign requests to technicians
- Update request status
- Track maintenance history

#### Financial Management
- Record expenses
- Generate financial reports
- Track payments
- View overdue invoices

---

### 🔧 Technician Role
**Maintenance request handling**

#### Maintenance Dashboard
- View assigned maintenance requests
- See pending tasks
- Track completed work
- View request priorities

#### Request Management
- Accept/reject maintenance assignments
- Update job status (In Progress, Completed, Cancelled)
- Add work notes and updates
- Upload completion photos
- Record time spent on tasks

#### Communication
- Send messages to staff
- Update tenants on progress
- Request additional resources
- Report issues or delays

---

### 🏠 Tenant Role
**Self-service portal for tenants**

#### Dashboard
- Overview of lease information
- View current rent balance
- See upcoming payment due dates
- Quick access to all features

#### Lease Information
- View lease agreement details
- Check lease start/end dates
- Download lease documents
- View unit information

#### Payments & Invoices
- View all invoices (paid, pending, overdue)
- **Pay invoices online** with one-click payment
- Download payment receipts
- View payment history
- Track overdue balances

#### Maintenance Requests
- Submit new maintenance requests with priority levels
- **Upload photos** of issues (multiple images supported)
- Track request status
- View maintenance history
- Communicate with assigned technicians

#### Notifications
- Receive rent due reminders
- Get lease expiry alerts
- View maintenance updates
- See new invoice notifications
- Track overdue payment reminders

#### Profile Management
- Update contact information
- Change password
- View personal details
- Upload profile photo

---

## 📁 Project Structure

```
ddacProject/
├── Frontend/                          # React Frontend
│   ├── src/
│   │   ├── components/               # Reusable components
│   │   │   ├── Navbar.jsx           # Navigation bar
│   │   │   └── ProtectedRoute.jsx   # Route protection
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Main dashboard
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Register.jsx         # Registration page
│   │   │   ├── admin/               # Admin pages
│   │   │   │   ├── UsersPage.jsx
│   │   │   │   ├── RolesPage.jsx
│   │   │   │   ├── ApprovalsPage.jsx
│   │   │   │   ├── AuditLogsPage.jsx
│   │   │   │   └── LeaseTemplatesPage.jsx
│   │   │   ├── staff/               # Staff pages
│   │   │   ├── technician/          # Technician pages
│   │   │   └── tenant/              # Tenant pages
│   │   │       ├── TenantDashboard.jsx
│   │   │       ├── TenantLease.jsx
│   │   │       ├── TenantPayments.jsx
│   │   │       ├── TenantMaintenance.jsx
│   │   │       ├── TenantProfile.jsx
│   │   │       └── NotificationsPage.jsx
│   │   ├── App.jsx                  # Main app component
│   │   └── index.css                # Tailwind styles
│   ├── public/                       # Static assets
│   ├── package.json
│   └── vite.config.js
│
└── ddacProject/                      # ASP.NET Backend
    ├── Controllers/                  # API Controllers
    │   ├── AuthController.cs        # Authentication
    │   ├── UsersController.cs       # User management
    │   ├── RolesController.cs       # Role management
    │   ├── PropertiesController.cs  # Properties
    │   ├── UnitsController.cs       # Units
    │   ├── LeasesController.cs      # Leases
    │   ├── TenantsController.cs     # Tenants
    │   ├── InvoicesController.cs    # Invoices
    │   ├── PaymentsController.cs    # Payments
    │   ├── MaintenanceController.cs # Maintenance
    │   ├── NotificationsController.cs
    │   ├── MessagesController.cs
    │   ├── ApprovalsController.cs
    │   ├── AuditLogsController.cs
    │   ├── ReportsController.cs
    │   └── ...
    ├── Models/                       # Data models
    ├── Data/                         # DbContext
    ├── Services/                     # Business logic
    ├── DTOs/                         # Data transfer objects
    ├── wwwroot/uploads/             # File uploads
    ├── appsettings.json
    └── Program.cs
```

---

## 🚀 How to Run the Project

### Prerequisites
- **Node.js** (v18 or higher)
- **.NET SDK** (7.0 or higher)
- **MySQL Server** (8.0 or higher)
- **Git** (for cloning)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd ddacProject
```

### Step 2: Database Setup

1. **Start MySQL Server**
   - Ensure MySQL is running on localhost:3306

2. **Create Database**
   ```sql
   CREATE DATABASE PropertyManagementDB;
   ```

3. **Update Connection String** (if needed)
   - Edit `ddacProject/appsettings.json`
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost;Database=PropertyManagementDB;User=root;Password=YOUR_PASSWORD;"
   }
   ```

### Step 3: Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd ddacProject
   ```

2. **Restore dependencies**
   ```bash
   dotnet restore
   ```

3. **Run the backend**
   ```bash
   dotnet run
   ```

4. **Verify backend is running**
   - Backend will start on: `http://localhost:5000`
   - Swagger UI: `http://localhost:5000/swagger`
   - Database will be automatically seeded with default users on first run

### Step 4: Frontend Setup

1. **Open new terminal and navigate to frontend**
   ```bash
   cd Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend will start on: `http://localhost:5173`
   - Open browser and navigate to this URL

---

## 🔐 Default User Credentials

After the first run, the system creates default users:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@pms.com | Admin123! |
| **Staff** | staff@pms.com | Staff123! |
| **Technician** | tech@pms.com | Tech123! |
| **Tenant 1** | tenant1@email.com | Tenant123! |
| **Tenant 2** | tenant2@email.com | Tenant123! |

---

## 📖 How to Use the System

### For Admins

1. **Login** with admin credentials
2. **Manage Users**: Navigate to Users page to create/edit/delete users
3. **Manage Roles**: Create custom roles and assign permissions
4. **Review Approvals**: Check and approve pending requests
5. **Monitor System**: View audit logs for system activity

### For Staff

1. **Login** with staff credentials
2. **Add Properties**: Go to Properties → Add New Property
3. **Add Units**: Select property → Add Units
4. **Create Leases**: Assign tenants to units with lease terms
5. **Generate Invoices**: Create rent invoices for tenants
6. **Handle Maintenance**: View and assign maintenance requests

### For Technicians

1. **Login** with technician credentials
2. **View Assignments**: See assigned maintenance tasks
3. **Update Status**: Change task status as you progress
4. **Add Notes**: Document work performed
5. **Upload Photos**: Add completion/progress photos
6. **Complete Tasks**: Mark tasks as completed

### For Tenants

1. **Login** with tenant credentials
2. **View Dashboard**: See lease info and payment status
3. **Pay Invoices**: 
   - Go to Payments page
   - Click "View Details" on any unpaid invoice
   - Click the "💳 Pay Now" button
   - Confirm payment
4. **Submit Maintenance**:
   - Go to Maintenance page
   - Click "Create Request"
   - Fill in details and upload photos
   - Submit request
5. **Check Notifications**: View alerts and reminders
6. **Update Profile**: Manage personal information

---

## 🔧 Key Features Implementation

### Online Payment System
- Tenants can pay invoices with one click
- **Endpoint**: `POST /api/invoices/{id}/pay`
- **Authorization**: Tenant role required
- Automatically creates payment record
- Updates invoice status to "Paid"
- Requires tenant to own the invoice (security check)

### Maintenance with Photo Upload
- Tenants can upload multiple photos when creating requests
- **Endpoint**: `POST /api/maintenance` (multipart/form-data)
- Photos stored in `wwwroot/uploads/maintenance/`
- Supports: .jpg, .jpeg, .png
- Max file size: 5MB per file

### Automated Notifications
- **Rent Due Reminders**: Sent when invoices are created
- **Lease Expiry Alerts**: Notify tenants before lease ends
- **Overdue Reminders**: Alert for unpaid invoices
- **Maintenance Updates**: Status change notifications

### Role-Based Access Control
- JWT-based authentication
- Route protection based on roles
- API endpoints secured with `[Authorize(Roles = "...")]`
- Frontend route guards with ProtectedRoute component

---

## 📊 API Endpoints Overview

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Invoices
- `GET /api/invoices` - Get user's invoices
- `GET /api/invoices/{id}` - Get invoice details
- `POST /api/invoices` - Create invoice (Staff/Admin)
- `POST /api/invoices/{id}/pay` - Pay invoice (Tenant)

### Maintenance
- `GET /api/maintenance` - Get maintenance requests
- `POST /api/maintenance` - Create request (with photos)
- `PUT /api/maintenance/{id}` - Update request status
- `GET /api/maintenance/{id}` - Get request details

### Users
- `GET /api/users` - List all users (Admin)
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/{id}` - Update user (Admin)
- `DELETE /api/users/{id}` - Delete user (Admin)

*See Swagger documentation at `/swagger` for complete API reference*

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-Based Authorization**: Endpoint access control
- **Password Hashing**: BCrypt for password security
- **CORS Protection**: Configured for specific origins
- **File Upload Validation**: File type and size checks
- **SQL Injection Prevention**: Entity Framework parameterization
- **XSS Protection**: React's built-in escaping

---

## 🐛 Troubleshooting

### Backend won't start
- Check MySQL is running
- Verify connection string in appsettings.json
- Ensure port 5000 is not in use

### Frontend can't connect to backend
- Verify backend is running on localhost:5000
- Check CORS configuration in Program.cs
- Clear browser cache and reload

### Database errors
- Run `dotnet ef database drop` then restart backend to reseed
- Check MySQL credentials
- Ensure database exists

### File upload issues
- Verify `wwwroot/uploads` directory exists
- Check file size (max 5MB)
- Ensure correct file extensions (.jpg, .jpeg, .png, .pdf)

---

## 📝 Development Notes

### Building for Production

**Frontend:**
```bash
cd Frontend
npm run build
```

**Backend:**
```bash
cd ddacProject
dotnet publish -c Release
```

### Database Migrations
```bash
dotnet ef migrations add MigrationName
dotnet ef database update
```

---

## 🎯 Project Status

✅ **Completed Features**:
- All role-based dashboards
- User authentication & authorization
- Property & unit management
- Lease management
- Invoice generation & online payment
- Maintenance requests with photo upload
- Automated notifications system
- Audit logging
- Role & permissions management

🚧 **Future Enhancements**:
- Email notifications
- SMS alerts
- Report generation (PDF export)
- Payment gateway integration
- Mobile app version

---

## 📞 Support

For issues or questions:
1. Check Swagger documentation at `/swagger`
2. Review error logs in browser console and backend terminal
3. Verify database connection and data integrity

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**License**: Private/Educational Project
