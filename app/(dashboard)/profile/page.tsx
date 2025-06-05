"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

interface ProfileData {
  name: string;
  email: string;
  bio?: string;
  location?: string;
  website?: string;
  image?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    bio: "",
    location: "",
    website: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile({
            name: data.name || "",
            email: data.email || "",
            bio: data.bio || "",
            location: data.location || "",
            website: data.website || "",
            image: data.image || "",
          });
        }
      } catch (e) {
        setMessage("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      let imageUrl = profile.image;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const uploadRes = await fetch("/api/profile/avatar", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          imageUrl = data.url;
        } else {
          setMessage("Failed to upload avatar");
          setSaving(false);
          return;
        }
      }
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, image: imageUrl }),
      });
      if (res.ok) {
        setMessage("Profile updated successfully!");
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        setMessage("Failed to update profile");
      }
    } catch (e) {
      setMessage("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage("");
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPasswordMessage("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        const data = await res.json();
        setPasswordMessage(data.error || "Failed to update password");
      }
    } catch (e) {
      setPasswordMessage("An error occurred while updating password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailMessage("");
    try {
      const res = await fetch("/api/profile/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, password: emailPassword }),
      });
      if (res.ok) {
        setEmailMessage("Email updated successfully!");
        setProfile((prev) => ({ ...prev, email: newEmail }));
        setNewEmail("");
        setEmailPassword("");
      } else {
        const data = await res.json();
        setEmailMessage(data.error || "Failed to update email");
      }
    } catch (e) {
      setEmailMessage("An error occurred while updating email");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500">
      {/* Blurred SVG shape for depth, matching other sections */}
      <svg className="absolute -top-32 -left-32 w-[600px] h-[600px] opacity-30 blur-2xl -z-10" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="300" cy="300" r="300" fill="url(#paint0_radial)" />
        <defs>
          <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientTransform="translate(300 300) scale(300)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a5b4fc" />
            <stop offset="1" stopColor="#818cf8" stopOpacity="0.2" />
          </radialGradient>
        </defs>
      </svg>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm">Profile</h1>
            <p className="mt-1 text-white/90 drop-shadow-sm">
              Manage your personal information and account settings
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="gap-2 bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg hover:scale-105 transition-transform"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Personal Information */}
          <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl transition-transform duration-200 hover:shadow-2xl hover:scale-[1.01] flex flex-col">
            <CardHeader>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                    <AvatarImage src={avatarPreview || profile.image || "https://github.com/shadcn.png"} />
                    <AvatarFallback>{profile.name ? profile.name[0].toUpperCase() : "?"}</AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full p-2 shadow cursor-pointer hover:scale-110 transition-transform border-2 border-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z" /></svg>
                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
                <div className="text-center">
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your photo and personal details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between">
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input
                      id="display-name"
                      name="name"
                      placeholder="Enter your display name"
                      value={profile.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      name="bio"
                      placeholder="Tell us about yourself"
                      value={profile.bio}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="Enter your location"
                      value={profile.location}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      placeholder="Enter your website"
                      value={profile.website}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                {message && (
                  <div className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>{message}</div>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 transition-transform" type="submit" disabled={saving || loading}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Account Settings */}
          <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-lg rounded-2xl transition-transform duration-200 hover:shadow-2xl hover:scale-[1.01] flex flex-col">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account credentials</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-8">
              {/* Email Update Form */}
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={newEmail || profile.email} onChange={e => setNewEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-password">Current Password</Label>
                    <Input id="email-password" type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} required />
                  </div>
                </div>
                {emailMessage && (
                  <div className={`text-sm ${emailMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>{emailMessage}</div>
                )}
                <Button className="w-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 transition-transform" type="submit" disabled={emailLoading || !newEmail || !emailPassword || newEmail === profile.email}>
                  {emailLoading ? "Updating..." : "Update Email"}
                </Button>
              </form>
              <div className="border-t border-white/30 my-2"></div>
              {/* Password Update Form */}
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                  </div>
                </div>
                {passwordMessage && (
                  <div className={`text-sm ${passwordMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>{passwordMessage}</div>
                )}
                <Button className="w-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg hover:scale-105 transition-transform" type="submit" disabled={passwordLoading || !currentPassword || !newPassword}>
                  {passwordLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}