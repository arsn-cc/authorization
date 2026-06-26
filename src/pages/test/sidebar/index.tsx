"use client";

import { CalendarIcon, HomeIcon, InboxIcon, SearchIcon, SettingsIcon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInput,
	SidebarInset,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
	{ title: "Home", url: "#", icon: HomeIcon },
	{ title: "Inbox", url: "#", icon: InboxIcon, badge: "12" },
	{ title: "Calendar", url: "#", icon: CalendarIcon },
	{ title: "Search", url: "#", icon: SearchIcon },
	{ title: "Settings", url: "#", icon: SettingsIcon },
	{ title: "Team", url: "#", icon: UsersIcon },
];

function AppSidebar() {
	return (
		<Sidebar>
			<SidebarHeader>
				<SidebarInput placeholder="Search..." />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarMenu>
						{NAV_ITEMS.map((item) => (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton tooltip={item.title} render={<a href={item.url} />}>
									<item.icon />
									<span>{item.title}</span>
								</SidebarMenuButton>
								{item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
								<SidebarMenuAction showOnHover>
									<span>⋮</span>
								</SidebarMenuAction>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>

				<SidebarSeparator />

				<SidebarGroup>
					<SidebarGroupLabel>With Submenu</SidebarGroupLabel>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton>Parent Item</SidebarMenuButton>
							<SidebarMenuSub>
								<SidebarMenuSubItem>
									<SidebarMenuSubButton>Child 1</SidebarMenuSubButton>
								</SidebarMenuSubItem>
								<SidebarMenuSubItem>
									<SidebarMenuSubButton isActive>Child 2 (active)</SidebarMenuSubButton>
								</SidebarMenuSubItem>
								<SidebarMenuSubItem>
									<SidebarMenuSubButton size="sm">Child 3 (small)</SidebarMenuSubButton>
								</SidebarMenuSubItem>
							</SidebarMenuSub>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>

				<SidebarSeparator />

				<SidebarGroup>
					<SidebarGroupLabel>Skeleton Loading</SidebarGroupLabel>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuSkeleton showIcon />
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuSkeleton />
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuSkeleton showIcon />
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger render={<SidebarMenuButton variant="outline" />}>
								<span>User Name</span>
							</DropdownMenuTrigger>
							<DropdownMenuContent side="top" className="w-(--radix-popper-anchor-width)">
								<DropdownMenuItem>Profile</DropdownMenuItem>
								<DropdownMenuItem>Settings</DropdownMenuItem>
								<DropdownMenuItem>Sign out</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}

export default function SidebarPage() {
	return (
		<SidebarProvider defaultOpen={true}>
			<AppSidebar />
			<SidebarRail />
			<SidebarInset>
				<div className="flex flex-1 flex-col gap-4 p-4">
					<div className="flex items-center gap-2">
						<SidebarTrigger />
						<h1 className="text-foreground text-xl font-semibold">Sidebar Demo</h1>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						<div className="bg-muted/50 rounded-xl p-6">
							<h2 className="mb-2 text-sm font-medium">Sidebar Variants</h2>
							<div className="flex flex-wrap gap-2">
								<Button size="sm" variant="outline">
									Offcanvas
								</Button>
								<Button size="sm" variant="outline">
									Icon
								</Button>
								<Button size="sm" variant="outline">
									Inset
								</Button>
							</div>
						</div>

						<div className="bg-muted/50 rounded-xl p-6">
							<h2 className="mb-2 text-sm font-medium">Keyboard Shortcut</h2>
							<p className="text-muted-foreground text-xs">
								Press <Badge variant="outline">⌘B</Badge> to toggle sidebar
							</p>
						</div>

						<div className="bg-muted/50 rounded-xl p-6">
							<h2 className="mb-2 text-sm font-medium">Active States</h2>
							<div className="flex flex-wrap gap-2">
								<Badge>Desktop</Badge>
								<Badge variant="secondary">Collapsed</Badge>
								<Badge variant="outline">Mobile</Badge>
							</div>
						</div>

						<div className="bg-muted/50 rounded-xl p-6">
							<h2 className="mb-2 text-sm font-medium">Side Panel</h2>
							<p className="text-muted-foreground text-xs">
								Toggle the sidebar to see collapsible behavior. On mobile it opens as a sheet.
							</p>
						</div>

						<div className="bg-muted/50 rounded-xl p-6">
							<h2 className="mb-2 text-sm font-medium">Items</h2>
							<p className="text-muted-foreground text-xs">
								Sidebar supports menu items with badges, actions, tooltips, and submenus.
							</p>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
