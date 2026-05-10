import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, User, Phone, Calendar, Key, Shield } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    secretKeyword: '',
    isHost: false,
    governmentIdType: 'aadhaar',
    governmentIdUrl: '',
    selfieWithIdUrl: '',
    isCompany: false,
    businessName: '',
    businessProofUrl: '',
    accountHolderName: '',
    bankName: '',
    accountNumberLast4: '',
    ifsc: '',
    upiId: '',
    bankProofUrl: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, hostRegister } = useAuth();
  const navigate = useNavigate();

  const getErrorMessage = (error) => {
    if (error.code === 'ECONNABORTED') {
      return 'The server is taking too long to respond. Please check backend, MongoDB, and email settings.';
    }

    return error.response?.data?.message || 'Registration failed';
  };

  const goToVerification = (email, res) => {
    navigate('/verify-email', {
      state: {
        from: 'registration',
        email,
        emailSent: res.emailSent !== false,
        canResendNow: res.emailSent === false
      }
    });

    if (res.emailSent === false) {
      toast.error(res.message || 'Account created, but the OTP email could not be sent. Try resend.');
    } else {
      toast.success('Please check your email for verification code');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (formData.isHost) {
        const res = await hostRegister({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          secretKeyword: formData.secretKeyword,
          governmentIdType: formData.governmentIdType,
          governmentIdUrl: formData.governmentIdUrl,
          selfieWithIdUrl: formData.selfieWithIdUrl,
          isCompany: formData.isCompany,
          businessName: formData.businessName,
          businessProofUrl: formData.businessProofUrl,
          accountHolderName: formData.accountHolderName,
          bankName: formData.bankName,
          accountNumberLast4: formData.accountNumberLast4,
          ifsc: formData.ifsc,
          upiId: formData.upiId,
          bankProofUrl: formData.bankProofUrl
        });
        if (res.requiresVerification || res.requiresOTP) {
          goToVerification(formData.email, res);
        } else {
          toast.success('Host account created!');
          navigate('/host');
        }
      } else {
        const res = await register(formData.name, formData.email, formData.password, formData.phone);
        if (res.requiresVerification || res.requiresOTP) {
          goToVerification(formData.email, res);
        } else {
          toast.success('Registration successful!');
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <Calendar className="h-10 w-10 text-primary-600" />
              <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Evento
              </span>
            </Link>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Create an account</h2>
            <p className="mt-2 text-gray-600">Join us to discover amazing events</p>
          </div>

          <div className="mb-6">
            <label className="flex items-center justify-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="isHost"
                checked={formData.isHost}
                onChange={handleChange}
                className="w-4 h-4 text-secondary-600 rounded focus:ring-secondary-500"
              />
              <span className="text-sm font-medium text-gray-700">Register as Host</span>
              <Shield className="h-4 w-4 text-secondary-600" />
            </label>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-field pl-10"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="label">Phone Number {formData.isHost ? '*' : '(Optional)'}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required={formData.isHost}
                  className="input-field pl-10"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="input-field pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {formData.isHost && (
              <div className="space-y-5 rounded-lg border border-secondary-200 bg-secondary-50/40 p-4">
                <div>
                  <label htmlFor="secretKeyword" className="label">
                    <span className="flex items-center text-secondary-700">
                      <Key className="h-4 w-4 mr-2" />
                      Host Secret Keyword *
                    </span>
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="secretKeyword"
                      name="secretKeyword"
                      type="password"
                      value={formData.secretKeyword}
                      onChange={handleChange}
                      required={formData.isHost}
                      className="input-field pl-10 border-2 border-secondary-300 focus:border-secondary-500"
                      placeholder="Enter host keyword"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="governmentIdType" className="label">Government ID *</label>
                    <select
                      id="governmentIdType"
                      name="governmentIdType"
                      value={formData.governmentIdType}
                      onChange={handleChange}
                      className="input-field"
                      required={formData.isHost}
                    >
                      <option value="aadhaar">Aadhaar</option>
                      <option value="pan">PAN</option>
                      <option value="passport">Passport</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="governmentIdUrl" className="label">ID Upload URL *</label>
                    <input
                      id="governmentIdUrl"
                      name="governmentIdUrl"
                      type="url"
                      value={formData.governmentIdUrl}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="https://..."
                      required={formData.isHost}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="selfieWithIdUrl" className="label">Selfie With ID URL *</label>
                  <input
                    id="selfieWithIdUrl"
                    name="selfieWithIdUrl"
                    type="url"
                    value={formData.selfieWithIdUrl}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="https://..."
                    required={formData.isHost}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    name="isCompany"
                    checked={formData.isCompany}
                    onChange={handleChange}
                    className="h-4 w-4 rounded text-secondary-600 focus:ring-secondary-500"
                  />
                  Registering as a company
                </label>

                {formData.isCompany && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="businessName" className="label">Business Name</label>
                      <input id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} className="input-field" />
                    </div>
                    <div>
                      <label htmlFor="businessProofUrl" className="label">Business Proof URL *</label>
                      <input id="businessProofUrl" name="businessProofUrl" type="url" value={formData.businessProofUrl} onChange={handleChange} className="input-field" placeholder="https://..." required={formData.isCompany} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="accountHolderName" className="label">Account Holder Name *</label>
                    <input id="accountHolderName" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} className="input-field" required={formData.isHost} />
                  </div>
                  <div>
                    <label htmlFor="bankName" className="label">Bank Name</label>
                    <input id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} className="input-field" placeholder="Required unless UPI is provided" />
                  </div>
                  <div>
                    <label htmlFor="accountNumberLast4" className="label">Account Last 4</label>
                    <input id="accountNumberLast4" name="accountNumberLast4" value={formData.accountNumberLast4} onChange={handleChange} className="input-field" maxLength={4} placeholder="1234" />
                  </div>
                  <div>
                    <label htmlFor="ifsc" className="label">IFSC</label>
                    <input id="ifsc" name="ifsc" value={formData.ifsc} onChange={handleChange} className="input-field" placeholder="HDFC0000001" />
                  </div>
                  <div>
                    <label htmlFor="upiId" className="label">UPI ID</label>
                    <input id="upiId" name="upiId" value={formData.upiId} onChange={handleChange} className="input-field" placeholder="name@upi" />
                  </div>
                  <div>
                    <label htmlFor="bankProofUrl" className="label">Bank Proof URL</label>
                    <input id="bankProofUrl" name="bankProofUrl" type="url" value={formData.bankProofUrl} onChange={handleChange} className="input-field" placeholder="https://..." />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">
              <strong className="text-primary-700">Users:</strong> Register with name, email, phone, and password.
              <br />
              <strong className="text-secondary-700">Hosts:</strong> KYC, phone, and bank verification are required before events can be published.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
