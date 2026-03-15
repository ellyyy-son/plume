import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/confirm",
];

function isPublicRoute(pathname: string) {
  const isAuthRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAuthRoute) {
    return true;
  }

  return pathname.startsWith("/_next") || pathname.startsWith("/api/");
}

function isPetSelectionRoute(pathname: string) {
  return pathname === "/pet-selection" || pathname.startsWith("/pet-selection/");
}

async function userNeedsPetSelection(supabase: ReturnType<typeof createServerClient>, userId: string) {
  const { data: profile, error } = await supabase
    .from("profile")
    .select("virtual_petid")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Profile lookup failed in middleware:", error.message);
    return false;
  }

  return !profile || profile.virtual_petid == null;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublic = isPublicRoute(pathname);
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  let shouldGoToPetSelection = false;

  if (user) {
    shouldGoToPetSelection = await userNeedsPetSelection(supabase, user.id);

    if (shouldGoToPetSelection && !isPetSelectionRoute(pathname)) {
      const petSelectionResponse = NextResponse.redirect(
        new URL("/pet-selection", request.url)
      );
      response.cookies.getAll().forEach((cookie) => {
        petSelectionResponse.cookies.set(cookie.name, cookie.value);
      });
      response = petSelectionResponse;
    }
  }

  if (user && isPublicRoute(pathname) && !shouldGoToPetSelection) {
    const redirectResponse = NextResponse.redirect(new URL("/", request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    response = redirectResponse;
  }

  if (!isPublic && !user) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    response = redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
