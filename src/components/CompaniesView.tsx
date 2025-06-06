import { useState, useEffect, useCallback } from 'react';
import { Company } from '../types/crm';
import { StorageService } from '../services/StorageService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompanyForm } from './CompanyForm';
import { Plus, Edit, Trash2, Globe, Mail, Phone, MapPin, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CompaniesViewProps {
  companies: Company[];
  searchTerm: string;
  onDataUpdate: () => void;
}

export const CompaniesView = ({ companies, searchTerm, onDataUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  // "Hit Enter" to add
  const handleKeyDown = useCallback(
    (e) => {
      if (
        e.key === 'Enter'
        && !showForm
        && (document.activeElement?.tagName === 'BODY' || document.activeElement === document.body)
      ) {
        setShowForm(true);
      }
    },
    [showForm]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      StorageService.deleteCompany(id);
      onDataUpdate();
      toast({
        title: "Company deleted",
        description: "The company has been successfully removed.",
      });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCompany(null);
    onDataUpdate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect': return 'secondary';
      case 'customer': return 'default';
      case 'partner': return 'default';
      case 'inactive': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-8 px-1 pb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-1">Companies</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2 text-base font-semibold rounded-lg shadow-lg bg-primary text-white hover:bg-primary/90 transition"
        >
          <Plus size={20} />
          <span>Add Company</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="hover:shadow-xl transition-shadow border-2 border-primary/10 bg-white">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">{company.name}</CardTitle>
                  <p className="text-xs text-gray-500">{company.industry}</p>
                </div>
                <Badge
                  variant={getStatusColor(company.status)}
                  className="px-3 py-1 rounded-full text-xs tracking-wide font-bold uppercase"
                >
                  {company.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 mt-1">
              <div className="space-y-2">
                {company.website && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Globe size={14} className="text-gray-400" />
                    <a 
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
                
                {company.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail size={14} className="text-gray-400" />
                    <span className="font-medium">{company.email}</span>
                  </div>
                )}
                
                {company.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone size={14} className="text-gray-400" />
                    <span>{company.phone}</span>
                  </div>
                )}

                {(company.city || company.state) && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{[company.city, company.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm">
                  <Users size={14} className="text-gray-400" />
                  <span>{company.employees ? `${company.employees} employees` : company.size}</span>
                </div>
              </div>
              {company.revenue > 0 && (
                <div className="text-sm bg-blue-50 p-2 rounded font-medium border">
                  <span className="font-semibold">Revenue: </span>
                  ${company.revenue.toLocaleString()}
                </div>
              )}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(company)}
                  className="flex-1 border border-primary font-semibold"
                >
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(company.id)}
                  className="text-red-600 hover:text-red-700 border border-red-300"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              {company.notes && (
                <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded border">
                  {company.notes.length > 100
                    ? company.notes.substring(0, 100) + '...'
                    : company.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-gray-400 font-medium">
            No companies found. Add your first company to get started!
          </p>
        </div>
      )}
      {showForm && (
        <CompanyForm
          company={editingCompany}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};
