import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, CalendarDays, Key, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import GoogleAuthButton, { hasGoogleClientId } from '../components/GoogleAuthButton';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [hostKeyword, setHostKeyword] = useState('');
    const [isHost, setIsHost] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const { login, hostLogin, googleLogin } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (searchParams.get('host') === 'true') {
            setIsHost(true);
        }
    }, [searchParams]);

    const navigateAfterAuth = (authUser) => {
        navigate(authUser?.role === 'admin' ? '/admin' : authUser?.role === 'host' ? '/host' : '/dashboard');
    };

    const handleGoogleCredential = async (credential) => {
        setGoogleLoading(true);
        try {
            const response = await googleLogin(credential);
            toast.success('Login successful!');
            navigateAfterAuth(response.user);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Google login failed');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let response;
            if (isHost) {
                response = await hostLogin(email, password, hostKeyword);
            } else {
                response = await login(email, password);
            }

            if (response.requiresVerification || response.requiresOTP) {
                navigate('/verify-email', {
                    state: {
                        from: 'login',
                        email,
                        emailSent: response.emailSent !== false,
                        canResendNow: response.emailSent === false
                    }
                });
                if (response.emailSent === false) {
                    toast.error(response.message || 'Could not send OTP email. Try resend.');
                } else {
                    toast.success('OTP sent to your email!');
                }
            } else {
                toast.success('Login successful!');
                navigateAfterAuth(response.user);
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                toast.error('The server is taking too long to respond. Please try again.');
            } else {
                toast.error(error.response?.data?.message || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="subtle-grid min-h-screen bg-[#fbf8f4]">
            <div className="mx-auto grid min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
                <div className="relative hidden animate-fade-in-up overflow-hidden rounded-lg bg-cocoa-900 shadow-2xl shadow-cocoa-900/20 lg:block">
                    <img
                        src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1400&q=85"
                        alt="Event audience in a professional venue"
                        className="absolute inset-0 h-full w-full object-cover opacity-65 transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-cocoa-900 via-cocoa-900/60 to-transparent" />
                    <div className="absolute right-8 top-8 rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur">
                        Secure workspace access
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-10 text-white">
                        <Link to="/" className="mb-8 inline-flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-500 text-white">
                                <CalendarDays className="h-6 w-6" />
                            </span>
                            <span className="text-2xl font-extrabold uppercase">Evento</span>
                        </Link>
                        <h1 className="max-w-xl text-4xl font-extrabold">
                            Welcome back to your event workspace.
                        </h1>
                        <div className="mt-6 grid gap-3 text-sm font-bold text-cocoa-100">
                            {['Track bookings and tickets', 'Join event communities', 'Manage host operations'].map((item) => (
                                <div key={item} className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-primary-200" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center lg:px-10">
                    <div className="w-full max-w-md">
                        <div className="premium-surface animate-fade-in-up p-8">
                            <div className="mb-8 text-center">
                                <Link to="/" className="inline-flex items-center gap-3 lg:hidden">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-500 text-white">
                                        <CalendarDays className="h-6 w-6" />
                                    </span>
                                    <span className="text-2xl font-extrabold uppercase text-cocoa-900">Evento</span>
                                </Link>
                                <h2 className="mt-5 text-3xl font-extrabold text-cocoa-900">
                                    {isHost ? 'Host access' : 'Sign in'}
                                </h2>
                                <p className="mt-2 font-semibold text-cocoa-500">
                                    {isHost ? 'Use your host credentials and secret keyword.' : 'Continue to your bookings, wishlist, and event updates.'}
                                </p>
                            </div>

                            <label className="mb-6 flex cursor-pointer items-center justify-between rounded-lg border border-cocoa-100 bg-[#fbf8f4] p-4 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/50">
                                <span className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary-700 shadow-sm">
                                        <Shield className="h-5 w-5" />
                                    </span>
                                    <span>
                                        <span className="block text-sm font-extrabold text-cocoa-900">Login as host</span>
                                        <span className="text-xs font-semibold text-cocoa-400">Enable host panel authentication</span>
                                    </span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={isHost}
                                    onChange={(e) => setIsHost(e.target.checked)}
                                    className="h-5 w-5 rounded border-cocoa-200 text-primary-600 focus:ring-primary-500"
                                />
                            </label>

                            {!isHost && hasGoogleClientId && (
                                <div className="mb-5 space-y-5">
                                    <GoogleAuthButton
                                        disabled={loading || googleLoading}
                                        onCredential={handleGoogleCredential}
                                        onError={() => toast.error('Google login failed')}
                                        text="signin_with"
                                    />
                                    <div className="flex items-center gap-3">
                                        <span className="h-px flex-1 bg-cocoa-100" />
                                        <span className="text-xs font-extrabold uppercase text-cocoa-300">or</span>
                                        <span className="h-px flex-1 bg-cocoa-100" />
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="email" className="label">Email Address</label>
                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa-300" />
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="input-field pl-10"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="password" className="label">Password</label>
                                        <Link to="/forgot-password" className="mb-2 text-sm font-bold text-primary-700 hover:text-primary-800">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa-300" />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="input-field pl-10 pr-10"
                                            placeholder="Enter password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-cocoa-300 hover:text-cocoa-600"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {isHost && (
                                    <div>
                                        <label htmlFor="hostKeyword" className="label">
                                            <span className="flex items-center text-primary-700">
                                                <Key className="mr-2 h-4 w-4" />
                                                Host secret keyword
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <Shield className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa-300" />
                                            <input
                                                id="hostKeyword"
                                                type="password"
                                                value={hostKeyword}
                                                onChange={(e) => setHostKeyword(e.target.value)}
                                                required={isHost}
                                                className="input-field pl-10"
                                                placeholder="Enter host keyword"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button type="submit" disabled={loading} className="btn-primary w-full">
                                    {loading ? 'Signing in...' : (isHost ? 'Access host panel' : 'Sign in')}
                                    {!loading && <ArrowRight className="h-4 w-4" />}
                                </button>
                            </form>

                            <p className="mt-6 text-center text-sm font-semibold text-cocoa-500">
                                Do not have an account?{' '}
                                <Link to="/register" className="font-bold text-primary-700 hover:text-primary-800">
                                    Create account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
