import { useState, useEffect, useCallback } from 'react';
import { Contact } from '../types/crm';
import { StorageService } from '../services/StorageService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContactForm } from './ContactForm';
import { Plus, Edit, Trash2, Mail, Phone, Building } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ContactsViewProps {
  contacts: Contact[];
  searchTerm: string;
  onDataUpdate: () => void;
}

export const ContactsView = ({ contacts, searchTerm, onDataUpdate }: ContactsViewProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // "Hit Enter" to add
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only trigger if no form is open and not typing in input
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

  const filteredContacts = contacts.filter(contact =>
    `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      StorageService.deleteContact(id);
      onDataUpdate();
      toast({
        title: "Contact deleted",
        description: "The contact has been successfully removed.",
      });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingContact(null);
    onDataUpdate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'lead': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus size={16} />
          <span>Add Contact</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {contact.firstName} {contact.lastName}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{contact.position}</p>
                </div>
                <Badge variant={getStatusColor(contact.status)}>
                  {contact.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Mail size={14} className="text-gray-400" />
                  <span>{contact.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone size={14} className="text-gray-400" />
                  <span>{contact.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Building size={14} className="text-gray-400" />
                  <span>{contact.company}</span>
                </div>
              </div>

              {contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(contact)}
                  className="flex-1"
                >
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(contact.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              {contact.notes && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {contact.notes.substring(0, 100)}
                  {contact.notes.length > 100 && '...'}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No contacts found. Add your first contact to get started!</p>
        </div>
      )}

      {showForm && (
        <ContactForm
          contact={editingContact}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};
