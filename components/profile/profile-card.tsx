"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/hooks/use-toast";

interface ProfileCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: "admin" | "student" | "alumni";
    department?: string;
    batch_year?: number;
    graduation_year?: number;
    current_job?: string;
    linkedin_url?: string;
    github_url?: string;
    leetcode_url?: string;
    is_mentorship_available?: boolean;
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Profile updated",
        description: "Your avatar has been updated successfully.",
      });

      // Refresh the page to show new avatar
      window.location.reload();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatar_url} alt={user.name} />
            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90"
          >
            <Camera className="h-4 w-4" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={isUploading}
            />
          </label>
        </div>
        <div>
          <CardTitle className="text-2xl">{user.name}</CardTitle>
          <p className="text-muted-foreground">{user.email}</p>
          <p className="text-sm font-medium capitalize">{user.role}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.role === "student" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Department</p>
                <p>{user.department}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Batch Year</p>
                <p>{user.batch_year}</p>
              </div>
            </div>
            {(user.github_url || user.leetcode_url) && (
              <div className="grid grid-cols-2 gap-4">
                {user.github_url && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">GitHub</p>
                    <a
                      href={user.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {user.github_url}
                    </a>
                  </div>
                )}
                {user.leetcode_url && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">LeetCode</p>
                    <a
                      href={user.leetcode_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {user.leetcode_url}
                    </a>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {user.role === "alumni" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Graduation Year</p>
                <p>{user.graduation_year}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Job</p>
                <p>{user.current_job}</p>
              </div>
            </div>
            {user.linkedin_url && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">LinkedIn</p>
                <a
                  href={user.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {user.linkedin_url}
                </a>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mentorship Available</p>
              <p>{user.is_mentorship_available ? "Yes" : "No"}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 