
import { useState } from 'react';
import { Lead } from '../types/crm';
import { StorageService } from '../services/StorageService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LeadForm } from './LeadForm';
import { Plus, Edit, Trash2, DollarSign, Calendar, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LeadsViewProps {
  leads: Lead[];
  searchTerm: string;
  onDataUpdate: () => void;
}

export const LeadsView = ({ leads, searchTerm, onDataUpdate }: LeadsViewProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      StorageService.deleteLead(id);
      onDataUpdate();
      toast({
        title: "Lead deleted",
        description: "The lead has been successfully removed.",
      });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLead(null);
    onDataUpdate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'secondary';
      case 'contacted': return 'default';
      case 'qualified': return 'default';
      case 'proposal': return 'default';
      case 'negotiation': return 'default';
      case 'won': return 'default';
      case 'lost': return 'destructive';
      default: return 'secondary';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'text-green-600';
    if (probability >= 50) return 'text-yellow-600';
    if (probability >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus size={16} />
          <span>Add Lead</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{lead.name}</CardTitle>
                  <p className="text-sm text-gray-600">{lead.company}</p>
                </div>
                <Badge variant={getStatusColor(lead.status)}>
                  {lead.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-1">
                    <DollarSign size={14} className="text-gray-400" />
                    <span>Value</span>
                  </span>
                  <span className="font-medium">${lead.value.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span>Probability</span>
                  <span className={`font-medium ${getProbabilityColor(lead.probability)}`}>
                    {lead.probability}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-1">
                    <Calendar size={14} className="text-gray-400" />
                    <span>Close Date</span>
                  </span>
                  <span>{new Date(lead.expectedCloseDate).toLocaleDateString()}</span>
                </div>

                {lead.assignedTo && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center space-x-1">
                      <User size={14} className="text-gray-400" />
                      <span>Assigned</span>
                    </span>
                    <span>{lead.assignedTo}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(lead)}
                  className="flex-1"
                >
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(lead.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              {lead.notes && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {lead.notes.substring(0, 100)}
                  {lead.notes.length > 100 && '...'}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No leads found. Add your first lead to get started!</p>
        </div>
      )}

      {showForm && (
        <LeadForm
          lead={editingLead}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};
