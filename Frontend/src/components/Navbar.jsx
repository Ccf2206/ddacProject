import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useState, useRef } from 'react';
import useAuthStore from '../stores/authStore';
import { FaChevronDown, FaUserShield, FaBuilding, FaDollarSign, FaCog, FaChartBar, FaBars, FaTimes } from 'react-icons/fa';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [openDropdown, setOpenDropdown] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const closeTimeoutRef = useRef(null);

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

    const handleMouseEnter = (menu) => {
        // Clear any pending close timeout
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setOpenDropdown(menu);
    };

    const handleMouseLeave = () => {
        // Add delay before closing dropdown
        closeTimeoutRef.current = setTimeout(() => {
            setOpenDropdown(null);
        }, 300); // 300ms delay
    };

    const closeDropdowns = () => {
        setOpenDropdown(null);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
        setOpenDropdown(null);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
        setOpenDropdown(null);
    };

    // Check if current path is active
    const isActiveLink = (path) => {
        return location.pathname === path;
    };

    // Check if any link in category is active
    const isCategoryActive = (links) => {
        return links.some(link => location.pathname === link.to);
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
                        { to: '/tenant/announcements', label: 'Announcements' },
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
                    {/* Logo and Desktop Navigation */}
                    <div className="flex items-center space-x-8">
                        <h1 className="text-lg sm:text-xl font-bold text-primary-600">
                            <span className="hidden sm:inline">Property Management System</span>
                            <span className="sm:hidden">PMS</span>
                        </h1>

                        {/* Desktop Dropdown Navigation */}
                        {navCategories.length > 0 && (
                            <div className="hidden md:flex space-x-1">
                                {navCategories.map((category) => (
                                    <div
                                        key={category.name}
                                        className="relative"
                                        onMouseEnter={() => handleMouseEnter(category.name)}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <button
                                            className={`flex items-center gap-1 px-3 py-2 text-sm rounded transition ${
                                                isCategoryActive(category.links)
                                                    ? 'text-primary-600 bg-primary-50 font-semibold'
                                                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {category.icon}
                                            <span>{category.name}</span>
                                            <FaChevronDown className="text-xs" />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {openDropdown === category.name && (
                                            <div 
                                                className="absolute left-0 top-full w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 mt-1"
                                                onMouseEnter={() => handleMouseEnter(category.name)}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                {category.links.map((link) => (
                                                    <Link
                                                        key={link.to}
                                                        to={link.to}
                                                        onClick={closeDropdowns}
                                                        className={`block px-4 py-2 text-sm transition ${
                                                            isActiveLink(link.to)
                                                                ? 'bg-primary-100 text-primary-700 font-semibold'
                                                                : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                                                        }`}
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

                    {/* Desktop Right Side */}
                    <div className="hidden md:flex items-center space-x-4">
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

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={toggleMobileMenu}
                            className="text-gray-700 hover:text-primary-600 p-2"
                        >
                            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200">
                    <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
                        {/* User Info */}
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <div className="text-sm font-semibold text-gray-700">{user?.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`badge ${getRoleColor(user?.roleName)} text-xs`}>
                                    {user?.roleName}
                                </span>
                            </div>
                        </div>

                        {/* Navigation Categories */}
                        {navCategories.map((category) => (
                            <div key={category.name} className="border-b border-gray-200">
                                <button
                                    onClick={() => toggleDropdown(category.name)}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition ${
                                        isCategoryActive(category.links)
                                            ? 'text-primary-600 bg-primary-50'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {category.icon}
                                        <span>{category.name}</span>
                                    </div>
                                    <FaChevronDown
                                        className={`text-xs transition-transform ${
                                            openDropdown === category.name ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                {/* Submenu */}
                                {openDropdown === category.name && (
                                    <div className="bg-gray-50">
                                        {category.links.map((link) => (
                                            <Link
                                                key={link.to}
                                                to={link.to}
                                                onClick={closeMobileMenu}
                                                className={`block px-8 py-2 text-sm transition ${
                                                    isActiveLink(link.to)
                                                        ? 'text-primary-700 bg-primary-100 font-semibold border-l-4 border-primary-600'
                                                        : 'text-gray-600 hover:bg-gray-100 hover:text-primary-600'
                                                }`}
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Logout Button */}
                        <div className="px-4 py-3">
                            <button
                                onClick={() => {
                                    handleLogout();
                                    closeMobileMenu();
                                }}
                                className="w-full btn btn-secondary text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
