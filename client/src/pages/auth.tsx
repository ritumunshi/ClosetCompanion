import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { UserPlus, LogIn, Shield, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpPhone, setOtpPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resetPhone, setResetPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    phone: "",
    email: ""
  });
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      toast({
        title: "Success!",
        description: "Welcome back!",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      toast({
        title: "Welcome to ATTIRELY!",
        description: "Your account has been created successfully.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (data: { phone: string }) => {
      const response = await apiRequest("POST", "/api/send-otp", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Code Sent!",
        description: "A 6-digit code has been sent to your phone.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { phone: string; otp: string }) => {
      const response = await apiRequest("POST", "/api/verify-otp", data);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      toast({
        title: "Verified!",
        description: "Your phone number has been verified. Welcome to Closet Concierge!",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { phone: string; otp: string; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/reset-password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset!",
        description: "Your password has been updated. Please login with your new password.",
      });
      setShowForgotPassword(false);
      setShowOtpVerification(false);
      setResetPhone("");
      setOtp("");
      setNewPassword("");
      setIsLogin(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      if (!formData.username || !formData.password) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive",
        });
        return;
      }
      loginMutation.mutate({
        username: formData.username,
        password: formData.password
      });
    } else {
      if (!formData.username || !formData.password || !formData.name) {
        toast({
          title: "Error",
          description: "Please fill in username, password, and name",
          variant: "destructive",
        });
        return;
      }
      if (!formData.phone && !formData.email) {
        toast({
          title: "Error",
          description: "Please provide either phone number or email",
          variant: "destructive",
        });
        return;
      }
      registerMutation.mutate(formData);
    }
  };

  const handleVerifyOtp = () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }
    
    if (showForgotPassword) {
      if (!newPassword || newPassword.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters",
          variant: "destructive",
        });
        return;
      }
      resetPasswordMutation.mutate({ phone: resetPhone, otp, newPassword });
    } else {
      verifyOtpMutation.mutate({ phone: otpPhone, otp });
    }
  };

  const handleForgotPassword = () => {
    if (!resetPhone) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }
    sendOtpMutation.mutate({ phone: resetPhone });
    setShowOtpVerification(true);
  };

  if (showOtpVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">
              {showForgotPassword ? "Reset Password" : "Verify Your Phone"}
            </h1>
            <p className="text-neutral-600">
              Enter the 6-digit code sent to {showForgotPassword ? resetPhone : otpPhone}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="text-center text-2xl tracking-widest"
                data-testid="input-otp"
              />
            </div>

            {showForgotPassword && (
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  data-testid="input-new-password"
                />
              </div>
            )}

            <Button
              onClick={handleVerifyOtp}
              className="w-full"
              disabled={verifyOtpMutation.isPending || resetPasswordMutation.isPending}
              data-testid="button-verify-otp"
            >
              {(verifyOtpMutation.isPending || resetPasswordMutation.isPending)
                ? "Please wait..." 
                : showForgotPassword 
                  ? "Reset Password" 
                  : "Verify Code"}
            </Button>

            <Button
              variant="outline"
              onClick={() => sendOtpMutation.mutate({ phone: showForgotPassword ? resetPhone : otpPhone })}
              className="w-full"
              disabled={sendOtpMutation.isPending}
              data-testid="button-resend-otp"
            >
              {sendOtpMutation.isPending ? "Sending..." : "Resend Code"}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setShowOtpVerification(false);
                setShowForgotPassword(false);
                setOtp("");
                setNewPassword("");
                setResetPhone("");
              }}
              className="w-full text-neutral-600"
              data-testid="button-back-to-login"
            >
              {showForgotPassword ? "Back to Login" : "Back to Registration"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (showForgotPassword && !showOtpVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <KeyRound className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">Forgot Password</h1>
            <p className="text-neutral-600">Enter your phone number to reset your password</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="resetPhone">Phone Number</Label>
              <Input
                id="resetPhone"
                type="tel"
                value={resetPhone}
                onChange={(e) => setResetPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                data-testid="input-reset-phone"
              />
            </div>

            <Button
              onClick={handleForgotPassword}
              className="w-full"
              disabled={sendOtpMutation.isPending}
              data-testid="button-send-reset-code"
            >
              {sendOtpMutation.isPending ? "Sending..." : "Send Reset Code"}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setShowForgotPassword(false);
                setResetPhone("");
              }}
              className="w-full text-neutral-600"
              data-testid="button-back-to-login-from-forgot"
            >
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src="/logo.jpeg" alt="ATTIRELY Logo" className="h-20 w-20 mx-auto mb-4 rounded-2xl object-cover" />
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">ATTIRELY</h1>
          <p className="text-neutral-600">Your personal wardrobe assistant</p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            type="button"
            variant={isLogin ? "default" : "outline"}
            className="flex-1"
            onClick={() => setIsLogin(true)}
            data-testid="button-toggle-login"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </Button>
          <Button
            type="button"
            variant={!isLogin ? "default" : "outline"}
            className="flex-1"
            onClick={() => setIsLogin(false)}
            data-testid="button-toggle-signup"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Sign Up
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required={!isLogin}
                  data-testid="input-name"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  data-testid="input-email"
                />
              </div>
              <p className="text-xs text-neutral-600">* Phone or Email required</p>
            </>
          )}

          <div>
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="johndoe"
              required
              data-testid="input-username"
            />
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              data-testid="input-password"
            />
          </div>

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline"
                data-testid="link-forgot-password"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending || registerMutation.isPending}
            data-testid="button-submit-auth"
          >
            {(loginMutation.isPending || registerMutation.isPending) 
              ? "Please wait..." 
              : isLogin 
                ? "Login" 
                : "Create Account"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
