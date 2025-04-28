"use client";

import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function ComponentDemo() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h2 className="text-2xl font-bold">Nexus Component Demo</h2>

      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Welcome to Nexus</CardTitle>
          <CardDescription>A demo of some shadcn/ui components</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="buttons">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="misc">Misc</TabsTrigger>
            </TabsList>

            <TabsContent value="buttons" className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => toast("Default button clicked")}>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">🔍</Button>
              </div>
            </TabsContent>

            <TabsContent value="inputs" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Input placeholder="Default input" />
                <Input disabled placeholder="Disabled input" />
                <Input aria-invalid placeholder="Invalid input" />
                <div className="flex gap-2">
                  <Input placeholder="With button" />
                  <Button>Send</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="misc" className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost">Cancel</Button>
          <Button onClick={() => toast("Changes saved!")}>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
