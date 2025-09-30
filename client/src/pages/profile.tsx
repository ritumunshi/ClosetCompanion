import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Settings, HandHelping, LogOut, Bell, UserCircle, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-neutral-800">Profile</h1>
        </div>
      </header>

      {/* Profile Info */}
      <div className="max-w-md mx-auto px-4 py-6">
        <Card className="bg-white rounded-2xl p-6 border border-neutral-200 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-800">Fashion Enthusiast</h2>
              <p className="text-neutral-600">Building a smart wardrobe</p>
            </div>
          </div>
        </Card>

        {/* Menu Options */}
        <div className="space-y-4">
          <Link href="/notifications">
            <Card className="bg-white rounded-2xl border border-neutral-200">
              <Button 
                variant="ghost" 
                className="w-full p-6 justify-start text-left"
                data-testid="button-notifications"
              >
                <Bell size={20} className="mr-3" />
                <span>Notifications</span>
              </Button>
            </Card>
          </Link>

          <Link href="/avatars">
            <Card className="bg-white rounded-2xl border border-neutral-200">
              <Button 
                variant="ghost" 
                className="w-full p-6 justify-start text-left"
                data-testid="button-avatars"
              >
                <UserCircle size={20} className="mr-3" />
                <span>My Avatars</span>
              </Button>
            </Card>
          </Link>

          <Link href="/dressup">
            <Card className="bg-white rounded-2xl border border-neutral-200">
              <Button 
                variant="ghost" 
                className="w-full p-6 justify-start text-left"
                data-testid="button-dressup"
              >
                <Sparkles size={20} className="mr-3" />
                <span>Dress-Up Mode</span>
              </Button>
            </Card>
          </Link>

          <Card className="bg-white rounded-2xl border border-neutral-200">
            <Button 
              variant="ghost" 
              className="w-full p-6 justify-start text-left"
            >
              <Settings size={20} className="mr-3" />
              <span>Settings</span>
            </Button>
          </Card>

          <Card className="bg-white rounded-2xl border border-neutral-200">
            <Button 
              variant="ghost" 
              className="w-full p-6 justify-start text-left"
            >
              <HandHelping size={20} className="mr-3" />
              <span>Help & Support</span>
            </Button>
          </Card>

          <Card className="bg-white rounded-2xl border border-neutral-200">
            <Button 
              variant="ghost" 
              className="w-full p-6 justify-start text-left text-red-600 hover:text-red-700"
            >
              <LogOut size={20} className="mr-3" />
              <span>Sign Out</span>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
