import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Button } from '../components/ui/Button';
import { Input, PasswordInput } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';

// Validation schema for Register
const schema = yup.object().shape({
  firstName: yup.string().trim().required('First name is required'),
  lastName: yup.string().trim().required('Last name is required'),
  email: yup.string().trim().email('Please enter a valid email').required('Email is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters long'),
  phone: yup
    .string()
    .trim()
    .matches(/^[0-9+\-()\s]*$/, 'Phone can only contain digits, spaces, + - ( )'),
  nationality: yup.string().trim().optional()
});

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useDocumentTitle('Create account');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    // Check a field when the user leaves it, then keep checking as they type
    mode: 'onTouched'
  });

  const onSubmit = async (data) => {
    setServerError('');
    setSubmitting(true);
    try {
      await registerUser(data);
      navigate('/flights');
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-ink">Create account</h1>
            <p className="text-sm text-ink-muted">
              Sign up as a passenger to book flights and manage reservations.
            </p>
          </div>

          {serverError && <Alert variant="danger">{serverError}</Alert>}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First name"
                id="firstName"
                placeholder="Juan"
                error={errors.firstName?.message}
                {...register('firstName')}
              />

              <Input
                label="Last name"
                id="lastName"
                placeholder="Dela Cruz"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <Input
              label="Email address"
              id="email"
              type="email"
              autoComplete="email"
              placeholder="juan@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <PasswordInput
              label="Password"
              id="password"
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone (optional)"
                id="phone"
                type="tel"
                placeholder="09123456789"
                error={errors.phone?.message}
                {...register('phone')}
              />

              <Input
                label="Nationality (optional)"
                id="nationality"
                placeholder="Filipino"
                error={errors.nationality?.message}
                {...register('nationality')}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                className="w-full"
              >
                Create account
              </Button>
            </div>

            <p className="text-center text-sm text-ink-muted pt-2">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
