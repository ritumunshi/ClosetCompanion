import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import Home from "@/pages/home";
import Wardrobe from "@/pages/wardrobe";
import Outfits from "@/pages/outfits";
import Notifications from "@/pages/notifications";
import Profile from "@/pages/profile";
import Avatars from "@/pages/avatars";
import DressUp from "@/pages/dressup";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";
import { useNotifications } from "@/hooks/useNotifications";
import { FEATURE_FLAGS } from "@/config/features";

function Router() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Switch>
        <Route path="/auth" component={Auth} />
        <Route path="/" component={Home} />
        <Route path="/wardrobe" component={Wardrobe} />
        <Route path="/outfits" component={Outfits} />
        {FEATURE_FLAGS.AVATARS_ENABLED && <Route path="/avatars" component={Avatars} />}
        {FEATURE_FLAGS.DRESS_UP_MODE_ENABLED && <Route path="/dressup" component={DressUp} />}
        <Route path="/notifications" component={Notifications} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
      <Navigation />
    </div>
  );
}

function AutoEnableNotifications() {
  const { isSupported, isSubscribed, subscribe } = useNotifications();

  useEffect(() => {
    // Check if we should auto-enable notifications
    const hasPrompted = localStorage.getItem('notification-prompted');
    
    if (isSupported && !isSubscribed && !hasPrompted) {
      // Mark as prompted so we don't ask repeatedly
      localStorage.setItem('notification-prompted', 'true');
      
      // Automatically subscribe (will prompt for permission)
      subscribe();
    }
  }, [isSupported, isSubscribed, subscribe]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AutoEnableNotifications />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
