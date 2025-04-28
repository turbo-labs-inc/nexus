import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(request: NextRequest) {
  // Create a response which we can modify
  const response = NextResponse.next();

  // Skip middleware entirely if disabled via env var (useful for testing)
  if (process.env.NEXT_DISABLE_MIDDLEWARE === '1') {
    return response;
  }

  // Special bypass for Cypress testing
  if (process.env.CYPRESS_TEST_MODE === 'true') {
    return response;
  }
  
  // Check if required env vars exist, if not skip auth check and proceed
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase env vars are missing, just continue - helpful for tests and local dev
    return response;
  }
  
  // Get cookie for auth session
  const supabaseAuthCookie = request.cookies.get("nexus-auth-token")?.value;
  
  try {
    // Create a Supabase client with cookie access
    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "nexus-auth-token",
          storage: {
            getItem: (key) => {
              return request.cookies.get(key)?.value ?? null;
            },
            setItem: () => {
              // We can't set cookies in middleware directly
              return;
            },
            removeItem: () => {
              // We can't remove cookies in middleware directly
              return;
            },
          },
        },
      }
    );

    // Carefully check for cookie-based session
    let session = null;
    
    try {
      // Try to get session from Supabase (will use cookie through our custom storage handler)
      const { data, error } = await supabase.auth.getSession();
      
      if (!error) {
        session = data.session;
      }
      
      // If cookie exists but no session, try a more careful approach to parse it
      if (supabaseAuthCookie && !session) {
        try {
          const parsedSession = JSON.parse(supabaseAuthCookie);
          
          // Verify it has the necessary properties and isn't expired
          if (parsedSession && 
              parsedSession.access_token && 
              parsedSession.refresh_token && 
              parsedSession.expires_at) {
            
            // Check if token is expired
            const now = Math.floor(Date.now() / 1000);
            if (parsedSession.expires_at > now) {
              // Token is still valid, try to set it
              const { data: sessionData } = await supabase.auth.setSession({
                access_token: parsedSession.access_token,
                refresh_token: parsedSession.refresh_token,
              });
              
              if (sessionData.session) {
                session = sessionData.session;
              }
            }
          }
        } catch (e) {
          // Silent fail, continue with the request
          console.error("Failed to parse session from cookie:", e);
        }
      }
    } catch (sessionError) {
      console.error("Error getting session in middleware:", sessionError);
      // Continue with null session
    }

    // Define protected routes that require authentication
    const protectedRoutes = ["/dashboard", "/profile", "/settings", "/servers", "/chat"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );

    // If trying to access a protected route without being authenticated
    if (isProtectedRoute && !session) {
      // Redirect to login page
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Continue with the request if user is authenticated or route is not protected
    return response;
  } catch (error) {
    // If there's an error, just continue with the request
    return response;
  }
}

export const config = {
  // Specify which paths the middleware should run on
  matcher: [
    // Apply to all routes except static files, api routes, and auth pages
    "/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)",
  ],
};
