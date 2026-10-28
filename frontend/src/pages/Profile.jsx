import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input, PasswordInput } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Alert } from '../components/ui/Alert';

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

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();

  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useDocumentTitle('Profile settings');

  // Profile form starts with the current user data
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors }
  } = useForm({
    resolver: yupResolver(profileSchema),
    mode: 'onTouched',
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
    resolver: yupResolver(passwordSchema),
    mode: 'onTouched'
  });

  const onProfileSubmit = async (data) => {
    setProfileError('');
    setSavingProfile(true);
    try {
      const response = await api.put(`/api/users/${user._id}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        nationality: data.nationality
      });
      updateUser(response.data);
      toast.success('Profile updated successfully.');
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordError('');
    setSavingPassword(true);
    try {
      await api.put(`/api/users/${user._id}`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      resetPassword();
      toast.success('Password changed successfully.');
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-ink-muted">No user data available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="Profile settings"
        description="Manage your personal details and account security."
      />

      {/* Profile details */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div>
            <h2 className="text-base font-semibold text-ink">Personal details</h2>
            <p className="text-xs text-ink-muted">Your public identity and contact information.</p>
          </div>
          <Badge variant={user.role === 'admin' ? 'accent' : 'neutral'}>
            {user.role}
          </Badge>
        </div>

        {profileError && <Alert variant="danger">{profileError}</Alert>}

        <form className="space-y-4" onSubmit={handleProfileSubmit(onProfileSubmit)} noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First name"
              id="firstName"
              error={profileErrors.firstName?.message}
              {...registerProfile('firstName')}
            />

            <Input
              label="Last name"
              id="lastName"
              error={profileErrors.lastName?.message}
              {...registerProfile('lastName')}
            />

            <Input
              label="Email address"
              id="email"
              type="email"
              value={user.email}
              disabled
              readOnly
              helperText="Email address cannot be changed."
            />

            <Input
              label="Phone"
              id="phone"
              type="tel"
              placeholder="+63 912 345 6789"
              error={profileErrors.phone?.message}
              {...registerProfile('phone')}
            />

            <div className="sm:col-span-2">
              <Input
                label="Nationality"
                id="nationality"
                placeholder="Filipino"
                error={profileErrors.nationality?.message}
                {...registerProfile('nationality')}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={savingProfile}
            >
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Change password */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="pb-4 border-b border-line">
          <h2 className="text-base font-semibold text-ink">Change password</h2>
          <p className="text-xs text-ink-muted">
            Ensure your account uses a strong password to remain protected.
          </p>
        </div>

        {passwordError && <Alert variant="danger">{passwordError}</Alert>}

        <form className="space-y-4" onSubmit={handlePasswordSubmit(onPasswordSubmit)} noValidate>
          <PasswordInput
            label="Current password"
            id="currentPassword"
            autoComplete="current-password"
            error={passwordErrors.currentPassword?.message}
            {...registerPassword('currentPassword')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordInput
              label="New password"
              id="newPassword"
              autoComplete="new-password"
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword')}
            />

            <PasswordInput
              label="Confirm new password"
              id="confirmPassword"
              autoComplete="new-password"
              error={passwordErrors.confirmPassword?.message}
              {...registerPassword('confirmPassword')}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="secondary"
              loading={savingPassword}
            >
              Update password
            </Button>
          </div>
        </form>
      </Card>

      {/* Account Session / Sign Out */}
      <Card className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Session</h2>
          <p className="text-xs text-ink-muted">Sign out of your active session on this device.</p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={logout}
        >
          Sign out
        </Button>
      </Card>
    </div>
  );
};

export default Profile;
