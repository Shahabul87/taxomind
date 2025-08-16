"use client";

import React from "react";

interface ServerSettingsContentProps {
  userId: string;
}

const ServerSettingsContent = ({ userId }: ServerSettingsContentProps) => {
  return (
    <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-4 sm:p-6 w-full">
      <h2 className="text-xl font-semibold mb-4 text-white">Server Settings</h2>
      <p className="text-slate-400">Server configuration options will be displayed here</p>
    </div>
  );
};

export default ServerSettingsContent; 