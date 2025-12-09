// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Play, Edit2, Trash2, Plus, Terminal, Clock, 
  CheckCircle, XCircle, Loader, Code, Tag, X, Eye, Save 
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

interface Script {
  id: string;
  name: string;
  description: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface Execution {
  id: string;
  script_id: string;
  script_name: string;
  status: 'running' | 'completed' | 'failed';
  output: string;
  error: string;
  started_at: string;
  completed_at?: string;
  exit_code?: number;
}

interface Stats {
  total_scripts: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  running_executions: number;
}

// StatCard Component
const StatCard = ({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string; 
}) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  };

  return (
    <div className={`rounded-sm border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-70">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="opacity-70">{icon}</div>
      </div>
    </div>
  );
};

// ScriptCard Component
const ScriptCard = ({
  script,
  onEdit,
  onDelete,
  onExecute,
}: {
  script: Script;
  onEdit: (script: Script) => void;
  onDelete: (id: string) => void;
  onExecute: (script: Script) => void;
}) => {
  return (
    <div className="border rounded-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{script.name}</h3>
          {/* <p className="text-sm text-gray-600 mt-1">{script.description}</p> */}
          <div className="flex items-center gap-2 mt-3">
            {script.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
          {/* <p className="text-xs text-gray-500">
            Updated: {new Date(script.updated_at).toLocaleString()}
          </p> */}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onExecute(script)}
            className="p-2 bg-green-100 text-green-700 rounded-sm hover:bg-green-200 transition-colors"
            title="Execute Script"
          >
            <Play className="w-5 h-5" />
          </button>
          <button
            onClick={() => onEdit(script)}
            className="p-2 bg-blue-100 text-blue-700 rounded-sm hover:bg-blue-200 transition-colors"
            title="Edit Script"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(script.id)}
            className="p-2 bg-red-100 text-red-700 rounded-sm hover:bg-red-200 transition-colors"
            title="Delete Script"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ExecutionRow Component
const ExecutionRow = ({
  execution,
  onView,
}: {
  execution: Execution;
  onView: (execution: Execution) => void;
}) => {
  const getStatusBadge = (status: string) => {
    const classes = {
      failed: 'bg-red-100 text-red-800',
      running: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
    };

    const icons = {
      failed: <XCircle className="w-4 h-4" />,
      running: <Loader className="w-4 h-4 animate-spin" />,
      completed: <CheckCircle className="w-4 h-4" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${classes[status as keyof typeof classes]}`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getDuration = () => {
    if (!execution.completed_at) return '-';
    const start = new Date(execution.started_at).getTime();
    const end = new Date(execution.completed_at).getTime();
    const duration = (end - start) / 1000;
    return `${duration.toFixed(2)}s`;
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{execution.script_name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(execution.status)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          {new Date(execution.started_at).toLocaleString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{getDuration()}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onView(execution)}
          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-sm hover:bg-blue-200 transition-colors text-sm"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
      </td>
    </tr>
  );
};

// Modal Component
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-sm shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    tags: '',
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [scriptsRes, executionsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/scripts`),
        axios.get(`${API_URL}/executions`),
        axios.get(`${API_URL}/stats`),
      ]);
      setScripts(scriptsRes.data.scripts);
      setExecutions(executionsRes.data.executions);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreate = () => {
    setSelectedScript(null);
    setFormData({ name: '', description: '', content: '', tags: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (script: Script) => {
    setSelectedScript(script);
    setFormData({
      name: script.name,
      description: script.description,
      content: script.content,
      tags: script.tags.join(', '),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        name: formData.name,
        description: formData.description,
        content: formData.content,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
      };

      if (selectedScript) {
        await axios.put(`${API_URL}/scripts/${selectedScript.id}`, data);
      } else {
        await axios.post(`${API_URL}/scripts`, data);
      }

      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving script:', error);
      alert('Error saving script. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this script?')) {
      try {
        await axios.delete(`${API_URL}/scripts/${id}`);
        loadData();
      } catch (error) {
        console.error('Error deleting script:', error);
      }
    }
  };

  const handleExecute = async (script: Script) => {
    try {
      await axios.post(`${API_URL}/scripts/${script.id}/execute`);
      alert('Script execution started!');
      setTimeout(loadData, 1000);
    } catch (error) {
      console.error('Error executing script:', error);
      alert('Error executing script. Please try again.');
    }
  };

  const viewExecution = (execution: Execution) => {
    setSelectedExecution(execution);
    setIsExecutionModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <StatCard title="Total Scripts" value={stats.total_scripts} icon={<Code className="w-6 h-6" />} color="blue" />
            <StatCard title="Total Runs" value={stats.total_executions} icon={<Clock className="w-6 h-6" />} color="gray" />
            <StatCard title="Successful" value={stats.successful_executions} icon={<CheckCircle className="w-6 h-6" />} color="green" />
            <StatCard title="Failed" value={stats.failed_executions} icon={<XCircle className="w-6 h-6" />} color="red" />
            <StatCard title="Running" value={stats.running_executions} icon={<Loader className="w-6 h-6" />} color="yellow" />
          </div>
        )}

        {/* Scripts Section */}
        <div className="bg-white rounded-sm shadow-sm border mb-8">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Scripts</h2>
            <button
              onClick={handleCreate}
              className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Script
            </button>
          </div>
          <div className="p-6">
            {scripts.length === 0 ? (
              <div className="text-center py-12">
                <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No scripts yet. Create your first script!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {scripts.map((script) => (
                  <ScriptCard
                    key={script.id}
                    script={script}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onExecute={handleExecute}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Executions Section */}
        <div className="bg-white rounded-sm shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Executions</h2>
          </div>
          <div className="overflow-x-auto">
            {executions.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No executions yet. Run a script to see results!</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Script</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {executions.slice(0, 10).map((execution) => (
                    <ExecutionRow key={execution.id} execution={execution} onView={viewExecution} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Script Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedScript ? 'Edit Script' : 'Create New Script'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Script Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="my-script"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="What does this script do?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="backup, automation, daily"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Script Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              rows={12}
              placeholder="#!/bin/bash&#10;echo 'Hello World'"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              {selectedScript ? 'Update Script' : 'Create Script'}
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Execution Details Modal */}
      <Modal
        isOpen={isExecutionModalOpen}
        onClose={() => setIsExecutionModalOpen(false)}
        title="Execution Details"
      >
        {selectedExecution && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Script</p>
                <p className="text-base font-semibold text-gray-900">{selectedExecution.script_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="text-base font-semibold text-gray-900 capitalize">{selectedExecution.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Started</p>
                <p className="text-base text-gray-900">{new Date(selectedExecution.started_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Exit Code</p>
                <p className="text-base text-gray-900">{selectedExecution.exit_code ?? 'N/A'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Output</p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-sm overflow-x-auto text-sm font-mono">
                {selectedExecution.output || '(no output)'}
              </pre>
            </div>

            {selectedExecution.error && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Error</p>
                <pre className="bg-red-50 text-red-900 p-4 rounded-sm overflow-x-auto text-sm font-mono border border-red-200">
                  {selectedExecution.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default App;