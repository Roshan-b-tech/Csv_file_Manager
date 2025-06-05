import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

const handler = NextAuth(authOptions);

// Export handlers for GET and POST requests
const GET = handler;
const POST = handler;

export { GET, POST }; 