import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { User, Mail, Lock, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast'; // Assuming you have a toast component

export default function ProfileSettingsPage() {
  const { profile, user, updateProfile } = useAuth(); // Assuming updateProfile function exists
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Basic validation
    if (!fullName || !email) {
      toast({
        title: "Error",
        description: "Full name and email cannot be empty.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    // Password change validation
    if (newPassword) {
      if (newPassword !== confirmNewPassword) {
        toast({
          title: "Error",
          description: "New password and confirm password do not match.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      if (!currentPassword) {
        toast({
          title: "Error",
          description: "Current password is required to change password.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      // In a real app, you'd send currentPassword, newPassword to backend for verification and update
      // For this mock, we'll just simulate success
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real app, you'd call an actual updateProfile function from your auth context
      // For now, we'll just show a success toast
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      // Clear password fields after successful update
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account details and preferences.</p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your name and email address.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                // Note: If your Input component doesn't support a 'prefix' prop,
                // you might need to adjust this to place the icon next to the input.
                // prefix={<User className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@example.com"
                // prefix={<Mail className="h-4 w-4 text-muted-foreground" />}
                disabled // Email is often not directly editable by user in settings, or requires re-verification
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'N/A'}
                disabled
              />
            </div>

            <h2 className="text-xl font-semibold pt-4">Change Password</h2>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                // prefix={<Lock className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                // prefix={<Lock className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                // prefix={<Lock className="h-4 w-4 text-muted-foreground" />}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}