
import { useState } from 'react';
import { Task } from '../types/crm';
import { StorageService } from '../services/StorageService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface TaskFormProps {
  task: Task | null;
  onClose: () => void;
}

export const TaskForm = ({ task, onClose }: TaskFormProps) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || 'call',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    dueDate: task?.dueDate || '',
    assignedTo: task?.assignedTo || '',
    relatedContactId: task?.relatedContactId || '',
    relatedLeadId: task?.relatedLeadId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const taskData: Task = {
      id: task?.id || crypto.randomUUID(),
      title: formData.title,
      description: formData.description,
      type: formData.type as Task['type'],
      priority: formData.priority as Task['priority'],
      status: formData.status as Task['status'],
      dueDate: formData.dueDate,
      assignedTo: formData.assignedTo,
      relatedContactId: formData.relatedContactId || undefined,
      relatedLeadId: formData.relatedLeadId || undefined,
      createdAt: task?.createdAt || new Date().toISOString(),
      completedAt: task?.completedAt,
    };

    if (task) {
      StorageService.updateTask(taskData);
      toast({
        title: "Task updated",
        description: "The task has been successfully updated.",
      });
    } else {
      StorageService.addTask(taskData);
      toast({
        title: "Task added",
        description: "The task has been successfully created.",
      });
    }

    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-2 border-primary/30 shadow-2xl rounded-2xl bg-white">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl font-bold text-primary">
            {task ? 'Edit Task' : 'Add New Task'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="title" className="font-semibold">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="description" className="font-semibold">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type" className="font-semibold">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData(prev => ({
                    ...prev,
                    type: value as Task['type'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority" className="font-semibold">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData(prev => ({
                    ...prev,
                    priority: value as Task['priority'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="status" className="font-semibold">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData(prev => ({
                  ...prev,
                  status: value as Task['status'],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dueDate" className="font-semibold">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, dueDate: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="assignedTo" className="font-semibold">Assigned To</Label>
            <Input
              id="assignedTo"
              value={formData.assignedTo}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  assignedTo: e.target.value,
                }))
              }
              placeholder="Team member name"
            />
          </div>
          <div className="flex space-x-2 mt-2">
            <Button type="submit" className="flex-1 py-2 text-base font-medium rounded-lg shadow-md hover:scale-105 transition">
              {task ? 'Update Task' : 'Add Task'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 py-2 text-base font-medium rounded-lg border-gray-300"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
