import React, { useState, useEffect } from 'react';
import { Mail, Shield, Smartphone, MoreHorizontal, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export const Users = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      // NOTE: For this to work, the user connected to DB must have permissions to read auth.users
      // The current backend runs as 'postgres' superuser (default docker), so it works.
      const data = await api.get('/auth/users');
      if (data) setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  if (loading) return <div className="p-8 text-slate-400 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading Users...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-3xl font-bold text-white mb-2">Users</h2>
           <p className="text-slate-400">Manage authenticated users (auth.users).</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800 text-slate-400 font-medium">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Provider</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4">Last Sign In</th>
              <th className="px-6 py-4">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{user.email}</span>
                    <span className="text-slate-500 text-xs font-mono">{user.id}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-300 capitalize">
                    {/* Simplified provider logic for demo */}
                    <Mail size={14} />
                    email
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-400 font-mono text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-slate-400 font-mono text-xs">{user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString() : 'Never'}</td>
                <td className="px-6 py-4">
                   <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700">
                     {user.role}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="p-6 text-center text-slate-500">No users found.</div>}
      </div>
    </div>
  );
};