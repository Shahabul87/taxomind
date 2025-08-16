"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ServerSettingsContentProps {
  userId: string;
}

const ServerSettingsContent = ({ userId }: ServerSettingsContentProps) => {
  return (
    <div className="mt-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Server Settings</CardTitle>
          <CardDescription>
            Configure your server settings and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Server settings configuration for user: {userId}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerSettingsContent; 