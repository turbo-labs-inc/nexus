"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseClient, syncAuthToCookies } from "@/lib/supabase/client";
import { useAuth } from "@/context";

export default function DirectAuthPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  // Extract token from localStorage on component mount
  useEffect(() => {
    const checkToken = () => {
      try {
        // Check localStorage
        const tokenStr = localStorage.getItem("nexus-auth-token");
        if (tokenStr) {
          try {
            const token = JSON.parse(tokenStr);
            setTokenInfo(token);

            // Try to sync to cookies
            syncAuthToCookies();

            setMessage("Found token in localStorage and synced to cookies");
          } catch (e) {
            setMessage("Error parsing token from localStorage");
          }
        } else {
          setMessage("No token found in localStorage");
        }
      } catch (error) {
        console.error("Error checking token:", error);
      }
    };

    checkToken();
  }, []);

  const handleDirectAuth = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      // Force signout first
      await supabase.auth.signOut();

      // Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`Auth error: ${error.message}`);
        return;
      }

      if (data.session) {
        // Manually sync the session to cookies
        const sessionStr = JSON.stringify(data.session);
        document.cookie = `nexus-auth-token=${sessionStr}; path=/; max-age=2592000; SameSite=Lax`;

        setMessage("Login successful! Session synced to cookies.");
        setTokenInfo(data.session);

        // Force page reload to update auth state
        window.location.href = "/servers";
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">Direct Authentication</h1>

      <div className="mb-6 rounded-md bg-card p-4">
        <h2 className="mb-2 text-lg font-semibold">Authentication Status</h2>
        <p>Authenticated: {isAuthenticated ? "Yes" : "No"}</p>
        <p>User ID: {user?.id || "Not logged in"}</p>
        <p>User Email: {user?.email || "Not logged in"}</p>
        <p>Message: {message}</p>
      </div>

      <div className="mb-6 rounded-md bg-card p-4">
        <h2 className="mb-2 text-lg font-semibold">Token Info</h2>
        {tokenInfo ? (
          <div>
            <p>
              Access Token:{" "}
              {tokenInfo.access_token ? `${tokenInfo.access_token.substring(0, 10)}...` : "None"}
            </p>
            <p>
              Expires At:{" "}
              {tokenInfo.expires_at
                ? new Date(tokenInfo.expires_at * 1000).toLocaleString()
                : "Unknown"}
            </p>
          </div>
        ) : (
          <p>No token information available</p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="mb-1 block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border p-2"
          />
        </div>

        <Button onClick={handleDirectAuth} disabled={loading} className="w-full">
          {loading ? "Authenticating..." : "Direct Sign In"}
        </Button>

        <div className="mt-4">
          <Button
            onClick={() => {
              // Force sync cookies
              syncAuthToCookies();
              setMessage("Manually synced auth token to cookies");
            }}
            variant="outline"
            className="mr-2"
          >
            Sync Auth to Cookies
          </Button>

          <Button
            onClick={() => {
              const supabase = getSupabaseClient();
              supabase.auth.signOut().then(() => {
                setMessage("Signed out");
                setTokenInfo(null);
                // Redirect to home
                window.location.href = "/";
              });
            }}
            variant="destructive"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
