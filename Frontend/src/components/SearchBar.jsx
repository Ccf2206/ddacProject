import { FaSearch, FaTimes } from 'react-icons/fa';

function SearchBar({ value, onChange, placeholder = "Search...", className = "" }) {
    return (
        <div className={`relative ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="input pl-10 pr-10 w-full"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    type="button"
                >
                    <FaTimes />
                </button>
            )}
        </div>
    );
}

export default SearchBar;
