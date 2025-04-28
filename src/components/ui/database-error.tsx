"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface DatabaseErrorProps {
  message: string;
}

export function DatabaseError({ message }: DatabaseErrorProps) {
  return (
    <div className="container mx-auto p-6 max-w-3xl border rounded-lg shadow-sm mt-16">
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Database Error</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <p className="text-muted-foreground">
          It looks like the database tables needed for this application haven't been set up yet.
        </p>
        
        <div className="bg-muted p-4 rounded-md space-y-2">
          <h3 className="font-medium">How to fix this:</h3>
          <p>Visit the database setup page to initialize the required tables.</p>
          
          <Button asChild className="mt-2">
            <Link href="/admin/setup">
              Go to Setup Page
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}