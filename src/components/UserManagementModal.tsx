import React, { useEffect, useState } from 'react';
import { fetchAllUsers, updateUser, User } from '../lib/userAdmin';

interface UserManagementModalProps {
  open: boolean;
  onClose: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ open, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  // Inline edit handlers
  const handleEdit = (user: User) => {
    setEditUserId(user._id);
    setEditData({
      email: user.email,
      contactNo: user.contactNo,
      dob: user.dob,
      role: user.role,
      privilegeForBooks: user.privilegeForBooks || 'normal'
    });
  };

  const handleEditChange = (field: keyof User, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };


  const handleEditSave = async (userId: string) => {
    try {
      const token = localStorage.getItem('vedic_auth_token') || sessionStorage.getItem('vedic_auth_token') || '';
      const updated = await updateUser(token, userId, editData);
      setUsers(users => users.map(u => u._id === userId ? updated : u));
      setEditUserId(null);
      setEditData({});
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  };

  const handleEditCancel = () => {
    setEditUserId(null);
    setEditData({});
  };

  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('vedic_auth_token') || sessionStorage.getItem('vedic_auth_token') || '';
        const data = await fetchAllUsers(token);
        setUsers(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div
        className="rounded-lg shadow-lg p-8 w-full max-w-6xl relative border"
        style={{
          background: 'var(--color-vb-modal-bg, #fff)',
          borderColor: 'var(--color-vb-header-bottom, #eebd89)',
          color: 'var(--color-vb-normal-text, #222)'
        }}
      >
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl"
          onClick={onClose}
          title="Close"
        >
          &times;
        </button>
        <h2
          className="text-2xl font-bold mb-6 text-center"
          style={{ color: 'var(--color-vb-header-top-text, #b97b2c)' }}
        >
          User Management
        </h2>
        {loading ? (
          <div className="text-center text-lg text-yellow-600">Loading users...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="min-w-full border rounded-lg"
              style={{
                background: 'var(--color-vb-modal-bg, #fff)',
                color: 'var(--color-vb-normal-text, #222)'
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--color-vb-header-bottom, #fdf6e3)',
                    color: 'var(--color-vb-header-top-text, #b97b2c)'
                  }}
                >
                  <th className="px-4 py-2 border-b">Name</th>
                  <th className="px-4 py-2 border-b">Username</th>
                  <th className="px-4 py-2 border-b">Email</th>
                  <th className="px-4 py-2 border-b">Contact</th>
                  <th className="px-4 py-2 border-b">DOB</th>
                  <th className="px-4 py-2 border-b">Role</th>
                  <th className="px-4 py-2 border-b">Privilege For Books</th>
                  <th className="px-4 py-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr
                    key={user._id}
                    className="transition"
                    style={{
                      background: 'var(--color-vb-modal-bg, #fff)',
                      color: 'var(--color-vb-normal-text, #222)'
                    }}
                  >
                    <td className="px-4 py-2 border-b font-semibold">{user.name}</td>
                    <td className="px-4 py-2 border-b">{user.username}</td>
                    {editUserId === user._id ? (
                      <>
                        <td className="px-4 py-2 border-b">
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={editData.email || ''}
                            onChange={e => handleEditChange('email', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2 border-b">
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={editData.contactNo || ''}
                            onChange={e => handleEditChange('contactNo', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2 border-b">
                          <input
                            className="border rounded px-2 py-1 w-full"
                            type="date"
                            value={editData.dob ? new Date(editData.dob).toISOString().substring(0, 10) : ''}
                            onChange={e => handleEditChange('dob', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2 border-b">
                          <select
                            className="border rounded px-2 py-1 w-32 min-w-[8rem]"
                            value={editData.role || 'user'}
                            onChange={e => handleEditChange('role', e.target.value)}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                            <option value="guest">guest</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 border-b">
                          <select
                            className="border rounded px-2 py-1 w-32 min-w-[8rem]"
                            value={editData.privilegeForBooks || 'normal'}
                            onChange={e => handleEditChange('privilegeForBooks', e.target.value)}
                          >
                            <option value="normal">Normal</option>
                            <option value="special">Special</option>
                            <option value="private">Private</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 border-b text-center">
                          <button className="text-green-600 hover:underline mr-2" onClick={() => handleEditSave(user._id)}>Save</button>
                          <button className="text-gray-600 hover:underline" onClick={handleEditCancel}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 border-b">{user.email}</td>
                        <td className="px-4 py-2 border-b">{user.contactNo}</td>
                        <td className="px-4 py-2 border-b">{user.dob ? new Date(user.dob).toLocaleDateString() : ''}</td>
                        <td className="px-4 py-2 border-b">{user.role}</td>
                        <td className="px-4 py-2 border-b text-center">{user.privilegeForBooks || 'normal'}</td>
                        <td className="px-4 py-2 border-b text-center">
                          <button className="text-blue-600 hover:underline mr-2" onClick={() => handleEdit(user)}>Edit</button>
                          <button className="text-red-600 hover:underline" disabled>Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementModal;
