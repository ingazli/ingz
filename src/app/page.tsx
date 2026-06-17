import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Redirect to appropriate dashboard based on role
  if (session.user.role === "chef") {
    redirect("/chef/dashboard");
  } else if (session.user.role === "client") {
    redirect("/client/dashboard");
  }

  // Fallback
  redirect("/login");
}
