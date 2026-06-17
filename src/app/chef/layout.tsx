import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChefSidebar from "@/components/chef/ChefSidebar";

export default async function ChefLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "CHEF") redirect("/client/dashboard");

  return (
    <div className="chef-portal flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <ChefSidebar />
        <main className="flex-1 bg-[#fafaf8] p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
