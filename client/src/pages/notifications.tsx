import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";

export default function Notifications() {
  const { toast } = useToast();
  const {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    testNotification,
    isSubscribing,
    isUnsubscribing,
    isTesting
  } = useNotifications();

  const handleToggleNotifications = () => {
    if (isSubscribed) {
      unsubscribe(undefined, {
        onSuccess: () => {
          toast({
            title: "Notifications Disabled",
            description: "You will no longer receive notifications",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to disable notifications",
            variant: "destructive"
          });
        }
      });
    } else {
      subscribe(undefined, {
        onSuccess: () => {
          toast({
            title: "Notifications Enabled",
            description: "You'll now receive outfit suggestions and reminders",
          });
        },
        onError: (error: Error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to enable notifications",
            variant: "destructive"
          });
        }
      });
    }
  };

  const handleTestNotification = () => {
    testNotification(
      {
        title: "Test Notification",
        body: "This is a test notification from Closet Concierge!"
      },
      {
        onSuccess: () => {
          toast({
            title: "Test Sent",
            description: "Check your notifications!",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to send test notification",
            variant: "destructive"
          });
        }
      }
    );
  };

  if (!isSupported) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Not Supported</CardTitle>
            <CardDescription>
              Push notifications are not supported in your browser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              To receive notifications, please use a modern browser like Chrome, Firefox, Safari, or Edge.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl pb-24">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Push Notifications</CardTitle>
            <CardDescription>
              Get daily outfit suggestions and reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications-toggle" className="text-base">
                  Enable Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isSubscribed 
                    ? "You're currently subscribed to notifications" 
                    : "Subscribe to receive notifications"}
                </p>
              </div>
              <Switch
                id="notifications-toggle"
                data-testid="switch-notifications"
                checked={isSubscribed}
                onCheckedChange={handleToggleNotifications}
                disabled={isSubscribing || isUnsubscribing}
              />
            </div>

            {permission === 'denied' && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md flex items-start gap-2">
                <X className="h-5 w-5 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Notifications Blocked</p>
                  <p className="mt-1">
                    You've blocked notifications. Please enable them in your browser settings.
                  </p>
                </div>
              </div>
            )}

            {permission === 'granted' && isSubscribed && (
              <div className="p-4 bg-green-500/10 text-green-600 rounded-md flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">All Set!</p>
                  <p className="mt-1">
                    You'll receive notifications for outfit suggestions and reminders.
                  </p>
                </div>
              </div>
            )}

            {isSubscribed && (
              <Button
                data-testid="button-test-notification"
                onClick={handleTestNotification}
                disabled={isTesting}
                variant="outline"
                className="w-full"
              >
                {isTesting ? "Sending..." : "Send Test Notification"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              What you'll be notified about
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Daily Outfit Suggestions</p>
                <p className="text-sm text-muted-foreground">
                  Get a morning notification with outfit suggestions based on today's weather
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Notifications help you make the most of Closet Concierge by providing timely outfit suggestions.
            </p>
            <p>
              You can disable notifications at any time, and we'll never spam you with unnecessary alerts.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
