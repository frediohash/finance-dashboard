"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import {
  IconDashboard,
  IconTrendingDown,
  IconTrendingUp,
  IconBuildingBank,
  IconChartBar,
  IconReportAnalytics,
  IconSettings,
  IconHelp,
  IconCoins,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Expenses",
    url: "/dashboard/expenses",
    icon: IconTrendingDown,
  },
  {
    title: "Income",
    url: "/dashboard/income",
    icon: IconTrendingUp,
  },
  {
    title: "Assets",
    url: "/dashboard/assets",
    icon: IconBuildingBank,
  },
  {
    title: "Investments",
    url: "/dashboard/investments",
    icon: IconCoins,
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: IconReportAnalytics,
  },
];

const navSecondary = [
  {
    title: "Settings",
    url: "#",
    icon: IconSettings,
  },
  {
    title: "Help",
    url: "#",
    icon: IconHelp,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  const userData = session?.user
    ? {
        name: session.user.name || "User",
        email: session.user.email,
        avatar: session.user.image || "/codeguide-logo.png",
      }
    : {
        name: "Guest",
        email: "guest@example.com",
        avatar: "/codeguide-logo.png",
      };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/dashboard">
                <IconChartBar className="h-8 w-8 text-primary" />
                <span className="text-base font-semibold font-parkinsans">FinancePro</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
