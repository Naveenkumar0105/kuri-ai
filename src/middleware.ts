import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (NextAuth API routes)
         * - api/register (Registration API route)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - login (login page)
         * - home (landing page)
         * - privacy (privacy policy)
         * - icons (PWA icons)
         * - manifest.json (PWA manifest)
         * - service-worker.js (PWA service worker)
         */
        "/((?!api/auth|api/register|_next/static|_next/image|favicon.ico|login|home|privacy|icons|manifest.json|service-worker.js).*)",
    ],
};
