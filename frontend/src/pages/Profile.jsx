import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Validation schema for the profile form
const profileSchema = yup.object().shape({
  firstName: yup.string().trim().required('First name is required'),
  lastName: yup.string().trim().required('Last name is required'),
  phone: yup
    .string()
    .trim()
    .matches(/^[0-9+\-()\s]*$/, 'Phone can only contain digits, spaces, + - ( )'),
  nationality: yup.string().trim()
});

// Validation schema for the change password form
const passwordSchema = yup.object().shape({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(6, 'New password must be at least 6 characters'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
    .required('Please confirm your new password')
});

// Input border turns red when the field has an error
const inputClass = (hasError) =>
  `mt-1 block w-full px-3 py-2 border ${
    hasError ? 'border-red-500' : 'border-gray-300'
  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`;

const Message = ({ message }) => {
  if (!message.text) return null;
  const style =
    message.type === 'error'
      ? 'bg-red-50 border-red-500 text-red-700'
      : 'bg-emerald-50 border-emerald-500 text-emerald-700';
  return <div className={`border-l-4 p-4 rounded text-sm mb-4 ${style}`}>{message.text}</div>;
};

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile form starts with the current user data
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors }
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      nationality: user?.nationality || ''
    }
  });

  // Password form starts empty
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors }
  } = useForm({
    resolver: yupResolver(passwordSchema)
  });

  const onProfileSubmit = async (data) => {
    setProfileMessage({ type: '', text: '' });
    setSavingProfile(true);
    try {
      // Only these four fields are sent. Email and role cannot be changed here.
      const response = await api.put(`/api/users/${user._id}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        nationality: data.nationality
      });
      // Update the user in AuthContext so the Navbar shows the new name right away
      updateUser(response.data);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error) {
      setProfileMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile.'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordMessage({ type: '', text: '' });
    setSavingPassword(true);
    try {
      await api.put(`/api/users/${user._id}`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      resetPassword();
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to change password.'
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-gray-600">No user data available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile details */}
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase">
            {user.role}
          </span>
        </div>

        <Message message={profileMessage} />

        <form className="space-y-4" onSubmit={handleProfileSubmit(onProfileSubmit)} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input type="text" {...registerProfile('firstName')} className={inputClass(profileErrors.firstName)} />
              {profileErrors.firstName && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input type="text" {...registerProfile('lastName')} className={inputClass(profileErrors.lastName)} />
              {profileErrors.lastName && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.lastName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email (cannot be changed)</label>
              <input
                type="email"
                value={user.email}
                disabled
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                {...registerProfile('phone')}
                className={inputClass(profileErrors.phone)}
                placeholder="e.g. +63 912 345 6789"
              />
              {profileErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.phone.message}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Nationality</label>
              <input
                type="text"
                {...registerProfile('nationality')}
                className={inputClass(profileErrors.nationality)}
                placeholder="e.g. Filipino"
              />
              {profileErrors.nationality && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.nationality.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm shadow-sm transition disabled:opacity-50"
          >
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>

        <Message message={passwordMessage} />

        <form className="space-y-4" onSubmit={handlePasswordSubmit(onPasswordSubmit)} noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input
              type="password"
              autoComplete="current-password"
              {...registerPassword('currentPassword')}
              className={inputClass(passwordErrors.currentPassword)}
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                autoComplete="new-password"
                {...registerPassword('newPassword')}
                className={inputClass(passwordErrors.newPassword)}
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                autoComplete="new-password"
                {...registerPassword('confirmPassword')}
                className={inputClass(passwordErrors.confirmPassword)}
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="bg-gray-800 hover:bg-gray-900 text-white font-medium px-5 py-2.5 rounded-lg text-sm shadow-sm transition disabled:opacity-50"
          >
            {savingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
