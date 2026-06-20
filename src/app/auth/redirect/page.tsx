import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthRedirectPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return redirect("/login");
  }

  if (session.user.role === "CHEF") {
    return redirect("/chef/dashboard");
  }

  return redirect("/client/dashboard");
}
