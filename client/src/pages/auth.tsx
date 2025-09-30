import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { UserPlus, LogIn, Shield } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpPhone, setOtpPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    phone: "",
    email: ""
  });
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    onSuccess: () => {
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
      setOtpPhone(formData.phone);
      setShowOtpVerification(true);
      toast({
        title: "Account Created!",
        description: "Please verify your phone number to continue.",
      });
      sendOtpMutation.mutate({ phone: formData.phone });
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
    onSuccess: () => {
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
      if (!formData.username || !formData.password || !formData.name || !formData.phone) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
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
    verifyOtpMutation.mutate({ phone: otpPhone, otp });
  };

  if (showOtpVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">Verify Your Phone</h1>
            <p className="text-neutral-600">Enter the 6-digit code sent to {otpPhone}</p>
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

            <Button
              onClick={handleVerifyOtp}
              className="w-full"
              disabled={verifyOtpMutation.isPending}
              data-testid="button-verify-otp"
            >
              {verifyOtpMutation.isPending ? "Verifying..." : "Verify Code"}
            </Button>

            <Button
              variant="outline"
              onClick={() => sendOtpMutation.mutate({ phone: otpPhone })}
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
                setOtp("");
              }}
              className="w-full text-neutral-600"
              data-testid="button-back-to-register"
            >
              Back to Registration
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Closet Concierge</h1>
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
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  required={!isLogin}
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  data-testid="input-email"
                />
              </div>
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
