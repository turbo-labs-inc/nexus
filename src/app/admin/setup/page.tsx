"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SetupPage() {
  // No layout for this page - it's a standalone utility
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    tables?: string[];
    step?: string;
    manual?: boolean;
    sqlScript?: string;
  } | null>(null);

  const setupDatabase = async () => {
    try {
      setLoading(true);
      const response = await fetch("/admin/setup-api");
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        step: "client_error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-md w-full border rounded-lg shadow-md p-8 bg-card">
        <h1 className="text-2xl font-bold mb-4">Database Setup</h1>
        <p className="mb-6 text-muted-foreground">
          This will create all the necessary database tables for the application to work correctly.
        </p>

        <Button
          onClick={setupDatabase}
          disabled={loading}
          className="w-full mb-4"
        >
          {loading ? "Setting up..." : "Setup Database"}
        </Button>

        {result && (
          <div
            className={`mt-4 p-4 rounded-md ${
              result.success
                ? "bg-green-50 border border-green-200 text-green-700"
                : result.manual 
                  ? "bg-amber-50 border border-amber-200 text-amber-700" 
                  : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {result.success ? (
              <>
                <h3 className="font-bold">Setup Successful</h3>
                <p>{result.message}</p>
                {result.tables && (
                  <div className="mt-2">
                    <p className="font-medium">Tables created:</p>
                    <ul className="list-disc pl-5 mt-1">
                      {result.tables.map((table) => (
                        <li key={table}>{table}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : result.manual && result.sqlScript ? (
              <>
                <h3 className="font-bold">Manual Setup Required</h3>
                <p className="mb-2">Please run the following SQL commands in your Supabase SQL Editor:</p>
                <div className="bg-black text-white p-3 rounded-md overflow-auto text-xs">
                  <pre>{result.sqlScript}</pre>
                </div>
                <p className="mt-3 text-sm">
                  After running these commands, refresh the app to continue.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-bold">Setup Failed</h3>
                <p>Error: {result.error}</p>
                {result.step && <p className="mt-1">Step: {result.step}</p>}
              </>
            )}
          </div>
        )}

        <div className="mt-6 text-sm text-muted-foreground">
          <p>
            <strong>Note:</strong> You should only need to run this once when setting up the application. 
            This is a development utility and should not be accessible in production.
          </p>
        </div>
      </div>
    </div>
  );
}