import React, { useState, useEffect } from 'react';
import { Plus, Github, LogOut, Edit2, Trash2, X, Loader2, Code2, ExternalLink, Sparkles, Lock, Mail, User } from 'lucide-react';

// API Configuration
const API_URL = 'http://localhost:5000/api';

// API Service
const api = {
  async register(name, email, password) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async getProjects(token) {
    const res = await fetch(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch projects');
    return data;
  },

  async createProject(token, project) {
    const res = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(project)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create project');
    return data;
  },

  async updateProject(token, id, project) {
    const res = await fetch(`${API_URL}/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(project)
    });
    if (!res.ok) {
      const data = await res.json();
      console.error('Update error response:', data);
      throw new Error(data.error || 'Failed to update project');
    }
    return await res.json();
  },

  async deleteProject(token, id) {
    const res = await fetch(`${API_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete project');
    }
    return await res.json();
  }
};

export default function ProjectTracker() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    githubLink: '',
    techStack: ''
  });
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      loadProjects();
    }
  }, [token]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects(token);
      console.log('Loaded projects:', data); // Debug log to check IDs
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    setError('');
    if (!authData.email || !authData.password) {
      setError('Please fill in all fields');
      return;
    }
    if (authMode === 'signup' && !authData.name) {
      setError('Please enter your name');
      return;
    }

    try {
      setLoading(true);
      let result;
      if (authMode === 'login') {
        result = await api.login(authData.email, authData.password);
      } else {
        result = await api.register(authData.name, authData.email, authData.password);
      }
      
      setToken(result.token);
      setUser(result.user);
      setAuthData({ email: '', password: '', name: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setProjects([]);
  };

  const handleSubmit = async () => {
    setError('');
    if (!formData.title || !formData.description || !formData.techStack) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const projectData = {
        title: formData.title,
        description: formData.description,
        githubLink: formData.githubLink,
        techStack: formData.techStack.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (editingProject) {
        const projectId = editingProject._id || editingProject.id;
        console.log('Updating project with ID:', projectId); // Debug log
        if (!projectId) {
          throw new Error('Project ID is missing');
        }
        await api.updateProject(token, projectId, projectData);
      } else {
        await api.createProject(token, projectData);
      }

      await loadProjects();
      setShowModal(false);
      setEditingProject(null);
      setFormData({ title: '', description: '', githubLink: '', techStack: '' });
    } catch (err) {
      setError(err.message);
      console.error('Submit error:', err);
      console.error('Editing project:', editingProject); // Debug log
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      githubLink: project.githubLink || '',
      techStack: Array.isArray(project.techStack) ? project.techStack.join(', ') : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      setLoading(true);
      await api.deleteProject(token, id);
      // Remove from local state immediately for better UX
      setProjects(projects.filter(p => p._id !== id && p.id !== id));
    } catch (err) {
      setError(err.message);
      // Reload projects if delete failed
      await loadProjects();
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setFormData({ title: '', description: '', githubLink: '', techStack: '' });
    setError('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative w-full max-w-md">
          {/* Glassmorphism card */}
          <div className="backdrop-blur-2xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 transform transition-all duration-300 hover:scale-[1.02]">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 transform rotate-6 hover:rotate-12 transition-transform">
                <Code2 size={32} className="text-white transform -rotate-6" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 bg-clip-text text-transparent mb-2">
              DevTracker
              </h1>
              <p className="text-purple-200/80">Your creative workspace awaits</p>
            </div>

            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-100 px-4 py-3 rounded-xl mb-4 animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {authMode === 'signup' && (
                <div className="group">
                  <label className="block text-sm font-medium text-purple-200 mb-2 ml-1">Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300" />
                    <input
                      type="text"
                      value={authData.name}
                      onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all disabled:bg-white/5"
                      placeholder="Your name"
                    />
                  </div>
                </div>
              )}

              <div className="group">
                <label className="block text-sm font-medium text-purple-200 mb-2 ml-1">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300" />
                  <input
                    type="email"
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all disabled:bg-white/5"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-purple-200 mb-2 ml-1">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300" />
                  <input
                    type="password"
                    value={authData.password}
                    onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all disabled:bg-white/5"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                onClick={handleAuth}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setError('');
                }}
                disabled={loading}
                className="text-purple-200 hover:text-white text-sm transition-colors disabled:text-purple-300/50"
              >
                {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <span className="font-semibold underline decoration-purple-400">
                  {authMode === 'login' ? 'Sign up' : 'Sign in'}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-purple-200/60 text-sm backdrop-blur-sm bg-white/5 rounded-xl p-3 border border-white/10">
            <p>💡 Backend must be running on localhost:5000</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Glassmorphic navbar */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/10 border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform rotate-6">
                <Code2 size={24} className="text-white transform -rotate-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                  Project Tracker
                </h1>
                <p className="text-sm text-purple-300">Hey, {user.name}! 👋</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white rounded-xl transition-all duration-300 border border-white/10 transform hover:scale-105"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 bg-clip-text text-transparent mb-2">
              My Projects
            </h2>
            <p className="text-purple-300">Track your creative journey</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 transform hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            <span>New Project</span>
          </button>
        </div>

        {loading && projects.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-12 text-center">
            <Loader2 size={48} className="animate-spin mx-auto text-purple-400 mb-4" />
            <p className="text-purple-200">Loading your projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl mb-6">
              <Code2 size={40} className="text-purple-300" />
            </div>
            <h3 className="text-2xl font-bold text-purple-200 mb-2">No projects yet</h3>
            <p className="text-purple-300 mb-6">Start building something amazing!</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <Plus size={20} />
              <span>Create Your First Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, idx) => (
              <div
                key={project._id || project.id}
                className="group backdrop-blur-xl bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02] hover:bg-white/15"
                style={{animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s backwards`}}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-purple-100 flex-1 group-hover:text-white transition-colors">
                    {project.title}
                  </h3>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(project)}
                      disabled={loading}
                      className="p-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 hover:text-white rounded-lg transition-all disabled:opacity-50 transform hover:scale-110"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(project._id || project.id)}
                      disabled={loading}
                      className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 hover:text-white rounded-lg transition-all disabled:opacity-50 transform hover:scale-110"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-purple-200/80 mb-4 line-clamp-3 text-sm leading-relaxed">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.techStack.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-purple-200 rounded-full text-xs font-medium hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {project.githubLink && (
                  <a
                    href={project.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-purple-300 hover:text-white transition-colors group/link"
                  >
                    <Github size={18} />
                    <span className="text-sm font-medium">View Repository</span>
                    <ExternalLink size={14} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="backdrop-blur-2xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all animate-slideUp">
            <div className="sticky top-0 p-6 border-b border-white/10 flex justify-between items-center backdrop-blur-xl bg-white/10 z-10 rounded-t-3xl">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                {editingProject ? '✏️ Edit Project' : '✨ New Project'}
              </h3>
              <button
                onClick={closeModal}
                disabled={loading}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 text-purple-200 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-100 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2 ml-1">
                  Project Title <span className="text-pink-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all disabled:bg-white/5"
                  placeholder="My Awesome Project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2 ml-1">
                  Description <span className="text-pink-400">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent h-32 resize-none outline-none transition-all disabled:bg-white/5"
                  placeholder="Tell us about your project..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2 ml-1">
                  GitHub Repository
                </label>
                <input
                  type="url"
                  value={formData.githubLink}
                  onChange={(e) => setFormData({ ...formData, githubLink: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all disabled:bg-white/5"
                  placeholder="https://github.com/username/repo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2 ml-1">
                  Tech Stack <span className="text-pink-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.techStack}
                  onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all disabled:bg-white/5"
                  placeholder="React, Node.js, MongoDB, Tailwind"
                />
                <p className="text-purple-300/60 text-xs mt-2 ml-1">Separate technologies with commas</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={closeModal}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-purple-200 hover:text-white rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}