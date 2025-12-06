import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import useAuthStore from '../stores/authStore';
import { FaChevronDown, FaUserShield, FaBuilding, FaDollarSign, FaCog, FaChartBar } from 'react-icons/fa';

function Navbar() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [openDropdown, setOpenDropdown] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getRoleColor = (role) => {
        const colors = {
            Admin: 'badge-danger',
            Staff: 'badge-info',
            Technician: 'badge-warning',
            Tenant: 'badge-success',
        };
        return colors[role] || 'badge-info';
    };

    const toggleDropdown = (menu) => {
        setOpenDropdown(openDropdown === menu ? null : menu);
    };

    const closeDropdowns = () => {
        setOpenDropdown(null);
    };

    // Organize navigation by categories
    const getNavCategories = () => {
        if (!user) return [];

        if (user.roleName === 'Admin') {
            return [
                {
                    name: 'Admin',
                    icon: <FaUserShield />,
                    links: [
                        { to: '/admin/users', label: 'Users' },
                        { to: '/admin/roles', label: 'Roles' },
                        { to: '/admin/approvals', label: 'Approvals' },
                        { to: '/admin/lease-templates', label: 'Lease Templates' },
                        { to: '/admin/audit-logs', label: 'Audit Logs' },
                    ]
                },
                {
                    name: 'Property',
                    icon: <FaBuilding />,
                    links: [
                        { to: '/staff/properties', label: 'Properties' },
                        { to: '/staff/units', label: 'Units' },
                        { to: '/staff/leases', label: 'Leases' },
                    ]
                },
                {
                    name: 'Financial',
                    icon: <FaDollarSign />,
                    links: [
                        { to: '/staff/invoices', label: 'Invoices' },
                        { to: '/staff/payments', label: 'Payments' },
                        { to: '/staff/expenses', label: 'Expenses' },
                    ]
                },
                {
                    name: 'Operations',
                    icon: <FaCog />,
                    links: [
                        { to: '/staff/tenants', label: 'Tenants' },
                        { to: '/staff/maintenance', label: 'Maintenance' },
                        { to: '/staff/messages', label: 'Messages' },
                    ]
                },
                {
                    name: 'Analytics',
                    icon: <FaChartBar />,
                    links: [
                        { to: '/staff/reports', label: 'Reports' },
                    ]
                }
            ];
        } else if (user.roleName === 'Staff') {
            return [
                {
                    name: 'Property',
                    icon: <FaBuilding />,
                    links: [
                        { to: '/dashboard', label: 'Dashboard' },
                        { to: '/staff/properties', label: 'Properties' },
                        { to: '/staff/units', label: 'Units' },
                        { to: '/staff/leases', label: 'Leases' },
                    ]
                },
                {
                    name: 'Financial',
                    icon: <FaDollarSign />,
                    links: [
                        { to: '/staff/invoices', label: 'Invoices' },
                        { to: '/staff/payments', label: 'Payments' },
                        { to: '/staff/expenses', label: 'Expenses' },
                    ]
                },
                {
                    name: 'Operations',
                    icon: <FaCog />,
                    links: [
                        { to: '/staff/tenants', label: 'Tenants' },
                        { to: '/staff/maintenance', label: 'Maintenance' },
                        { to: '/staff/messages', label: 'Messages' },
                    ]
                },
                {
                    name: 'Analytics',
                    icon: <FaChartBar />,
                    links: [
                        { to: '/staff/reports', label: 'Reports' },
                    ]
                }
            ];
        } else if (user.roleName === 'Tenant') {
            return [
                {
                    name: 'My Account',
                    icon: <FaUserShield />,
                    links: [
                        { to: '/tenant/dashboard', label: 'Dashboard' },
                        { to: '/tenant/lease', label: 'My Lease' },
                        { to: '/tenant/profile', label: 'Profile' },
                    ]
                },
                {
                    name: 'Payments',
                    icon: <FaDollarSign />,
                    links: [
                        { to: '/tenant/payments', label: 'Invoices & Payments' },
                    ]
                },
                {
                    name: 'Services',
                    icon: <FaCog />,
                    links: [
                        { to: '/tenant/maintenance', label: 'Maintenance Requests' },
                        { to: '/tenant/notifications', label: 'Notifications' },
                    ]
                }
            ];
        }

        return [];
    };

    const navCategories = getNavCategories();

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <h1 className="text-xl font-bold text-primary-600">Property Management System</h1>

                        {/* Dropdown Navigation */}
                        {navCategories.length > 0 && (
                            <div className="hidden md:flex space-x-1">
                                {navCategories.map((category) => (
                                    <div
                                        key={category.name}
                                        className="relative"
                                        onMouseEnter={() => toggleDropdown(category.name)}
                                        onMouseLeave={closeDropdowns}
                                    >
                                        <button
                                            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded transition"
                                        >
                                            {category.icon}
                                            <span>{category.name}</span>
                                            <FaChevronDown className="text-xs" />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {openDropdown === category.name && (
                                            <div className="absolute left-0 top-full w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1">
                                                {category.links.map((link) => (
                                                    <Link
                                                        key={link.to}
                                                        to={link.to}
                                                        onClick={closeDropdowns}
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition"
                                                    >
                                                        {link.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-700">{user?.name}</span>
                        <span className={`badge ${getRoleColor(user?.roleName)}`}>
                            {user?.roleName}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="btn btn-secondary text-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
