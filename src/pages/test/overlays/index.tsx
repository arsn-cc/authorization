"use client";

import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarSeparator,
	MenubarTrigger,
} from "@/components/ui/menubar";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function OverlaysPage() {
	return (
		<div className="container mx-auto flex flex-col gap-8 p-8">
			<h1 className="text-foreground text-3xl font-bold">Overlays & Popups</h1>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Dialog</h2>
				<Dialog>
					<DialogTrigger>
						<Button variant="outline">Open Dialog</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Profile</DialogTitle>
							<DialogDescription>Make changes to your profile.</DialogDescription>
						</DialogHeader>
						<div className="py-4">
							<Input placeholder="Your name" />
						</div>
						<DialogFooter>
							<Button variant="outline">Cancel</Button>
							<Button>Save</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Alert Dialog</h2>
				<AlertDialog>
					<AlertDialogTrigger>
						<Button variant="destructive">Delete</Button>
					</AlertDialogTrigger>
					<AlertDialogContent size="sm">
						<AlertDialogHeader>
							<AlertDialogMedia />
							<AlertDialogTitle>Are you sure?</AlertDialogTitle>
							<AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction>Delete</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Sheet</h2>
				<Sheet>
					<SheetTrigger>
						<Button variant="outline">Open Sheet</Button>
					</SheetTrigger>
					<SheetContent>
						<SheetHeader>
							<SheetTitle>Sheet Title</SheetTitle>
							<SheetDescription>Sheet description here.</SheetDescription>
						</SheetHeader>
						<div className="py-4">
							<p>Sheet content</p>
						</div>
					</SheetContent>
				</Sheet>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Drawer</h2>
				<Drawer>
					<DrawerTrigger>
						<Button variant="outline">Open Drawer</Button>
					</DrawerTrigger>
					<DrawerContent>
						<DrawerHeader>
							<DrawerTitle>Drawer Title</DrawerTitle>
							<DrawerDescription>Drawer description.</DrawerDescription>
						</DrawerHeader>
						<div className="p-4">
							<p>Drawer content</p>
						</div>
					</DrawerContent>
				</Drawer>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Popover</h2>
				<Popover>
					<PopoverTrigger>
						<Button variant="outline">Open Popover</Button>
					</PopoverTrigger>
					<PopoverContent>
						<PopoverHeader>
							<PopoverTitle>Popover Title</PopoverTitle>
							<PopoverDescription>Popover description.</PopoverDescription>
						</PopoverHeader>
						<div className="pt-2">
							<Input placeholder="Type here" />
						</div>
					</PopoverContent>
				</Popover>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Hover Card</h2>
				<HoverCard>
					<HoverCardTrigger>
						<Button variant="link">Hover me</Button>
					</HoverCardTrigger>
					<HoverCardContent>
						<p>Content shown on hover.</p>
					</HoverCardContent>
				</HoverCard>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Tooltip</h2>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger>
							<Button variant="outline">Hover for tooltip</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Tooltip content</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Dropdown Menu</h2>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="outline">Open Menu</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem>Profile</DropdownMenuItem>
						<DropdownMenuItem>Settings</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>Logout</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Context Menu</h2>
				<ContextMenu>
					<ContextMenuTrigger>
						<div className="bg-muted flex h-24 w-48 items-center justify-center rounded-md text-sm">
							Right-click here
						</div>
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuItem>Action</ContextMenuItem>
						<ContextMenuItem>Copy</ContextMenuItem>
						<ContextMenuSeparator />
						<ContextMenuItem>Delete</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Menubar</h2>
				<Menubar>
					<MenubarMenu>
						<MenubarTrigger>File</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>New Tab</MenubarItem>
							<MenubarItem>Open File</MenubarItem>
							<MenubarSeparator />
							<MenubarItem>Exit</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu>
						<MenubarTrigger>Edit</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>Undo</MenubarItem>
							<MenubarItem>Redo</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
				</Menubar>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Navigation Menu</h2>
				<NavigationMenu>
					<NavigationMenuList>
						<NavigationMenuItem>
							<NavigationMenuTrigger>Products</NavigationMenuTrigger>
							<NavigationMenuContent>
								<div className="p-4 text-sm">Product list goes here.</div>
							</NavigationMenuContent>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Command</h2>
				<CommandDialog>
					<CommandInput placeholder="Type a command..." />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup heading="Suggestions">
							<CommandItem>Calendar</CommandItem>
							<CommandItem>Search</CommandItem>
						</CommandGroup>
					</CommandList>
				</CommandDialog>
				<p className="text-muted-foreground text-sm">Press ⌘K to open</p>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Collapsible</h2>
				<Collapsible>
					<div className="flex items-center gap-2">
						<CollapsibleTrigger>
							<Button size="sm" variant="ghost">
								Toggle
							</Button>
						</CollapsibleTrigger>
						<span className="text-sm">Click to expand</span>
					</div>
					<CollapsibleContent className="mt-2">
						<div className="bg-muted rounded-md p-2 text-sm">
							This content is collapsible. Click the toggle button to show/hide.
						</div>
					</CollapsibleContent>
				</Collapsible>
			</section>
		</div>
	);
}
