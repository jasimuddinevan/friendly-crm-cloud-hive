import { useState } from 'react';
import { Lead } from '../types/crm';
import { StorageService } from '../services/StorageService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface LeadFormProps {
  lead: Lead | null;
  onClose: () => void;
}

export const LeadForm = ({ lead, onClose }: LeadFormProps) => {
  const [formData, setFormData] = useState({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    company: lead?.company || '',
    status: lead?.status || 'new' as Lead['status'],
    source: lead?.source || '',
    value: lead?.value || 0,
    probability: lead?.probability || 0,
    expectedCloseDate: lead?.expectedCloseDate || '',
    notes: lead?.notes || '',
    assignedTo: lead?.assignedTo || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const leadData: Lead = {
      id: lead?.id || crypto.randomUUID(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      status: formData.status,
      source: formData.source,
      value: formData.value,
      probability: formData.probability,
      expectedCloseDate: formData.expectedCloseDate,
      notes: formData.notes,
      assignedTo: formData.assignedTo,
      createdAt: lead?.createdAt || new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };

    if (lead) {
      StorageService.updateLead(leadData);
      toast({
        title: "Lead updated",
        description: "The lead has been successfully updated.",
      });
    } else {
      StorageService.addLead(leadData);
      toast({
        title: "Lead added",
        description: "The lead has been successfully created.",
      });
    }

    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Lead Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: Lead['status']) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                placeholder="Website, referral, etc."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="value">Value ($)</Label>
            <Input
              id="value"
              type="number"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
            />
          </div>

          <div>
            <Label htmlFor="probability">Probability (%)</Label>
            <Input
              id="probability"
              type="number"
              min="0"
              max="100"
              value={formData.probability}
              onChange={(e) => setFormData(prev => ({ ...prev, probability: Number(e.target.value) }))}
            />
          </div>

          <div>
            <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
            <Input
              id="expectedCloseDate"
              type="date"
              value={formData.expectedCloseDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="assignedTo">Assigned To</Label>
            <Input
              id="assignedTo"
              value={formData.assignedTo}
              onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
              placeholder="Sales rep name"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex space-x-2">
            <Button type="submit" className="flex-1">
              {lead ? 'Update Lead' : 'Add Lead'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
