import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import SearchBar from '../../components/SearchBar';
import axios from 'axios';
import { FaFileContract, FaCheckCircle, FaTimes } from 'react-icons/fa';

function LeaseTemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        templateName: '',
        templateContent: '',
        templateVariables: '',
        isActive: true
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/leasetemplates', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            if (editingTemplate) {
                // Update existing template
                await axios.put(
                    `http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/leasetemplates/${editingTemplate.templateId}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert('Template updated successfully!');
            } else {
                // Create new template
                await axios.post(
                    'http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/leasetemplates',
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert('Template created successfully!');
            }

            resetForm();
            fetchTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            templateName: template.templateName,
            templateContent: template.templateContent,
            templateVariables: template.templateVariables || '',
            isActive: template.isActive
        });
        setShowForm(true);
    };

    const handleDeactivate = async (templateId) => {
        if (!window.confirm('Deactivate this template?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://ddac-backend-env.eba-mvuepuat.us-east-1.elasticbeanstalk.com/api/leasetemplates/${templateId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Template deactivated successfully!');
            fetchTemplates();
        } catch (error) {
            console.error('Error deactivating template:', error);
            alert('Error deactivating template');
        }
    };

    const resetForm = () => {
        setFormData({
            templateName: '',
            templateContent: '',
            templateVariables: '',
            isActive: true
        });
        setEditingTemplate(null);
        setShowForm(false);
    };

    const activeTemplates = templates.filter(t => t.isActive);
    const inactiveTemplates = templates.filter(t => !t.isActive);

    const filteredActiveTemplates = activeTemplates.filter(template =>
        template.templateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.templateContent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.templateVariables?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredInactiveTemplates = inactiveTemplates.filter(template =>
        template.templateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.templateContent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.templateVariables?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><FaFileContract /> Lease Templates Management</h2>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn btn-primary"
                    >
                        {showForm ? 'Cancel' : '+ Create Template'}
                    </button>
                </div>

                {/* Template Form */}
                {showForm && (
                    <div className="card mb-6">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingTemplate ? 'Edit Template' : 'Create New Template'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Template Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Template Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.templateName}
                                    onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                                    className="input"
                                    placeholder="e.g., Standard Residential Lease"
                                    required
                                />
                            </div>

                            {/* Template Variables */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Available Variables
                                </label>
                                <input
                                    type="text"
                                    value={formData.templateVariables}
                                    onChange={(e) => setFormData({ ...formData, templateVariables: e.target.value })}
                                    className="input"
                                    placeholder="TENANT_NAME, UNIT_NUMBER, RENT_AMOUNT, START_DATE, END_DATE"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Comma-separated list of variables available in the template
                                </p>
                            </div>

                            {/* Template Content */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Template Content *
                                </label>
                                <textarea
                                    value={formData.templateContent}
                                    onChange={(e) => setFormData({ ...formData, templateContent: e.target.value })}
                                    className="input font-mono text-sm"
                                    rows="15"
                                    placeholder="LEASE AGREEMENT&#10;&#10;This lease agreement is entered into on {{START_DATE}} between:&#10;&#10;Landlord: [Property Management]&#10;Tenant: {{TENANT_NAME}}&#10;&#10;Property: Unit {{UNIT_NUMBER}}&#10;Rent: RM {{RENT_AMOUNT}} per month&#10;&#10;Term: {{START_DATE}} to {{END_DATE}}&#10;&#10;..."
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Use {'{{VARIABLE_NAME}}'} for dynamic content
                                </p>
                            </div>

                            {/* Is Active */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="mr-2"
                                />
                                <label className="text-sm font-medium text-gray-700">
                                    Active Template
                                </label>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3">
                                <button type="submit" className="btn btn-primary flex-1">
                                    {editingTemplate ? 'Update Template' : 'Create Template'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Active Templates */}
                <div className="card mb-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><FaCheckCircle /> Active Templates ({activeTemplates.length})</h3>
                    
                    <div className="mb-4">
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search templates by name, content, or variables..."
                        />
                        <p className="text-sm text-gray-600 mt-2">
                            Showing {filteredActiveTemplates.length} of {activeTemplates.length} active templates
                        </p>
                    </div>

                    {loading ? (
                        <p>Loading templates...</p>
                    ) : filteredActiveTemplates.length > 0 ? (
                        <div className="space-y-4">
                            {filteredActiveTemplates.map((template) => (
                                <div
                                    key={template.templateId}
                                    className="border border-gray-200 rounded-lg p-4"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-semibold text-lg">{template.templateName}</h4>
                                            <p className="text-sm text-gray-600">
                                                Created by {template.createdByUserName} on{' '}
                                                {new Date(template.createdAt).toLocaleDateString()}
                                            </p>
                                            {template.templateVariables && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Variables: {template.templateVariables}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(template)}
                                                className="btn btn-sm btn-primary"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeactivate(template.templateId)}
                                                className="btn btn-sm btn-danger"
                                            >
                                                Deactivate
                                            </button>
                                        </div>
                                    </div>

                                    {/* Template Preview */}
                                    <details className="mt-3">
                                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                            View Template Content
                                        </summary>
                                        <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                                            {template.templateContent}
                                        </pre>
                                    </details>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No active templates</p>
                    )}
                </div>

                {/* Inactive Templates */}
                {inactiveTemplates.length > 0 && (
                    <div className="card">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <FaTimes /> Inactive Templates ({inactiveTemplates.length})
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Showing {filteredInactiveTemplates.length} of {inactiveTemplates.length} inactive templates
                        </p>
                        <div className="space-y-3">
                            {filteredInactiveTemplates.map((template) => (
                                <div
                                    key={template.templateId}
                                    className="p-3 bg-gray-50 rounded"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-700">{template.templateName}</p>
                                            <p className="text-xs text-gray-500">
                                                Deactivated on {new Date(template.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className="badge bg-gray-200 text-gray-600">Inactive</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LeaseTemplatesPage;
