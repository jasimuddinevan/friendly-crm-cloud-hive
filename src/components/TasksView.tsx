
import { useState } from 'react';
import { Task } from '../types/crm';
import { StorageService } from '../services/StorageService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskForm } from './TaskForm';
import { Plus, Edit, Trash2, Calendar, Clock, User, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TasksViewProps {
  tasks: Task[];
  searchTerm: string;
  onDataUpdate: () => void;
}

export const TasksView = ({ tasks, searchTerm, onDataUpdate }: TasksViewProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      StorageService.deleteTask(id);
      onDataUpdate();
      toast({
        title: "Task deleted",
        description: "The task has been successfully removed.",
      });
    }
  };

  const handleComplete = (task: Task) => {
    const updatedTask = {
      ...task,
      status: 'completed' as const,
      completedAt: new Date().toISOString()
    };
    StorageService.updateTask(updatedTask);
    onDataUpdate();
    toast({
      title: "Task completed",
      description: "The task has been marked as completed.",
    });
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTask(null);
    onDataUpdate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in-progress': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'completed' && status !== 'cancelled';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus size={16} />
          <span>Add Task</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <Card key={task.id} className={`hover:shadow-lg transition-shadow ${isOverdue(task.dueDate, task.status) ? 'border-red-200 bg-red-50' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                </div>
                <div className="flex flex-col space-y-1">
                  <Badge variant={getStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                  <Badge variant={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-1">
                    <Calendar size={14} className="text-gray-400" />
                    <span>Due Date</span>
                  </span>
                  <span className={isOverdue(task.dueDate, task.status) ? 'text-red-600 font-medium' : ''}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-1">
                    <Clock size={14} className="text-gray-400" />
                    <span>Type</span>
                  </span>
                  <span className="capitalize">{task.type}</span>
                </div>

                {task.assignedTo && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center space-x-1">
                      <User size={14} className="text-gray-400" />
                      <span>Assigned</span>
                    </span>
                    <span>{task.assignedTo}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                {task.status !== 'completed' && task.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleComplete(task)}
                    className="flex-1 text-green-600 hover:text-green-700"
                  >
                    <CheckCircle size={14} className="mr-1" />
                    Complete
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(task)}
                  className="flex-1"
                >
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(task.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              {isOverdue(task.dueDate, task.status) && (
                <div className="text-sm text-red-600 bg-red-100 p-2 rounded">
                  ⚠️ This task is overdue
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks found. Add your first task to get started!</p>
        </div>
      )}

      {showForm && (
        <TaskForm
          task={editingTask}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};
