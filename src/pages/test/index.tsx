"use client";

import { useState } from "react";
import { Link } from "waku";
import * as Accordion from "@/components/ui/accordion";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
	ComboboxValue,
} from "@/components/ui/combobox";
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
	ContextMenuCheckboxItem,
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
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSet,
	FieldTitle,
} from "@/components/ui/field";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemHeader,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import {
	Menubar,
	MenubarCheckboxItem,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarSeparator,
	MenubarTrigger,
} from "@/components/ui/menubar";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Progress, ProgressIndicator, ProgressTrack, ProgressValue } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

const CHART_CONFIG = {
	desktop: { label: "Desktop", color: "#2563eb" },
	mobile: { label: "Mobile", color: "#60a5fa" },
} as const;

const CHART_DATA = [
	{ month: "Jan", desktop: 186, mobile: 80 },
	{ month: "Feb", desktop: 305, mobile: 200 },
	{ month: "Mar", desktop: 237, mobile: 120 },
	{ month: "Apr", desktop: 73, mobile: 190 },
	{ month: "May", desktop: 209, mobile: 130 },
	{ month: "Jun", desktop: 214, mobile: 140 },
];

const invoices = [
	{ invoice: "INV001", paymentStatus: "Paid", totalAmount: 250, paymentMethod: "Credit Card" },
	{ invoice: "INV002", paymentStatus: "Pending", totalAmount: 150, paymentMethod: "PayPal" },
	{ invoice: "INV003", paymentStatus: "Unpaid", totalAmount: 350, paymentMethod: "Bank Transfer" },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-wrap items-start gap-4">{children}</CardContent>
		</Card>
	);
}

export default function TestHomePage() {
	const [sliderValue, setSliderValue] = useState<readonly number[]>([50]);
	const [framework, setFramework] = useState("next");

	return (
		<div className="container mx-auto flex flex-col gap-8 p-8">
			<Toaster />
			<h1 className="text-foreground text-3xl font-bold">Component Test Suite</h1>
			<p className="text-muted-foreground text-sm">All shadcn/ui components with all variants</p>

			<Card>
				<CardHeader>
					<CardTitle>Test Pages</CardTitle>
					<CardDescription>Dedicated test pages for specific component groups</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-4">
					<Link to="/test/forms">
						<Button variant="default">Forms & Inputs</Button>
					</Link>
					<Link to="/test/overlays">
						<Button variant="secondary">Overlays & Popups</Button>
					</Link>
					<Link to="/test/sidebar">
						<Button variant="outline">Sidebar</Button>
					</Link>
					<Link to="/test/graphs">
						<Button variant="ghost">Charts & Graphs</Button>
					</Link>
				</CardContent>
			</Card>

			<SectionCard title="Button">
				<div className="flex flex-col gap-4">
					<div className="flex flex-wrap items-center gap-2">
						<Button variant="default">default</Button>
						<Button variant="outline">outline</Button>
						<Button variant="secondary">secondary</Button>
						<Button variant="ghost">ghost</Button>
						<Button variant="destructive">destructive</Button>
						<Button variant="link">link</Button>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button size="xs">xs</Button>
						<Button size="sm">sm</Button>
						<Button size="default">default</Button>
						<Button size="lg">lg</Button>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button size="icon-xs">icon-xs</Button>
						<Button size="icon-sm">icon-sm</Button>
						<Button size="icon">icon</Button>
						<Button size="icon-lg">icon-lg</Button>
					</div>
					<Button disabled>disabled</Button>
				</div>
			</SectionCard>

			<SectionCard title="Button Group">
				<div className="flex flex-col gap-4">
					<ButtonGroup orientation="horizontal">
						<Button>Left</Button>
						<ButtonGroupSeparator />
						<Button>Middle</Button>
						<ButtonGroupSeparator />
						<Button>Right</Button>
					</ButtonGroup>
					<ButtonGroup orientation="vertical">
						<Button>Top</Button>
						<ButtonGroupText>Separator</ButtonGroupText>
						<Button>Bottom</Button>
					</ButtonGroup>
				</div>
			</SectionCard>

			<SectionCard title="Badge">
				<Badge variant="default">default</Badge>
				<Badge variant="secondary">secondary</Badge>
				<Badge variant="destructive">destructive</Badge>
				<Badge variant="outline">outline</Badge>
				<Badge variant="ghost">ghost</Badge>
				<Badge variant="link">link</Badge>
			</SectionCard>

			<SectionCard title="Kbd">
				<KbdGroup>
					<Kbd>⌘</Kbd>
					<Kbd>K</Kbd>
				</KbdGroup>
				<Kbd>⇧</Kbd>
				<Kbd>⌥</Kbd>
			</SectionCard>

			<SectionCard title="Separator">
				<div className="flex w-full flex-col gap-2">
					<span>horizontal</span>
					<Separator />
					<div className="flex h-12 items-center gap-2">
						<span>vertical</span>
						<Separator orientation="vertical" />
						<span>vertical</span>
					</div>
				</div>
			</SectionCard>

			<SectionCard title="Spinner">
				<Spinner className="text-foreground size-4" />
				<Spinner className="text-muted-foreground size-5" />
				<Spinner className="text-primary size-6" />
				<Spinner className="text-destructive size-8" />
			</SectionCard>

			<SectionCard title="Skeleton">
				<div className="flex items-center gap-4">
					<Skeleton className="size-12 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-48" />
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-40" />
					</div>
				</div>
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-48 w-full max-w-sm rounded-lg" />
			</SectionCard>

			<SectionCard title="Card">
				<Card className="w-72" size="default">
					<CardHeader>
						<CardTitle>Card default</CardTitle>
						<CardDescription>size=&quot;default&quot;</CardDescription>
						<CardAction>
							<Button size="icon-sm" variant="ghost">
								⋮
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent>Card content</CardContent>
					<CardFooter className="flex gap-2">
						<Button size="sm">Save</Button>
						<Button size="sm" variant="outline">
							Cancel
						</Button>
					</CardFooter>
				</Card>
				<Card className="w-72" size="sm">
					<CardHeader>
						<CardTitle>Card sm</CardTitle>
						<CardDescription>size=&quot;sm&quot;</CardDescription>
					</CardHeader>
					<CardContent>Compact card</CardContent>
				</Card>
			</SectionCard>

			<SectionCard title="Accordion">
				<div className="w-full max-w-md">
					<Accordion.Accordion>
						<Accordion.AccordionItem value="item-1">
							<Accordion.AccordionTrigger>Section 1</Accordion.AccordionTrigger>
							<Accordion.AccordionContent>Content 1</Accordion.AccordionContent>
						</Accordion.AccordionItem>
						<Accordion.AccordionItem value="item-2">
							<Accordion.AccordionTrigger>Section 2</Accordion.AccordionTrigger>
							<Accordion.AccordionContent>Content 2</Accordion.AccordionContent>
						</Accordion.AccordionItem>
						<Accordion.AccordionItem value="item-3" disabled>
							<Accordion.AccordionTrigger>Disabled</Accordion.AccordionTrigger>
							<Accordion.AccordionContent>N/A</Accordion.AccordionContent>
						</Accordion.AccordionItem>
					</Accordion.Accordion>
				</div>
			</SectionCard>

			<SectionCard title="Tabs">
				<div className="flex flex-col gap-4">
					<Tabs defaultValue="tab1">
						<TabsList variant="default">
							<TabsTrigger value="tab1">Tab 1</TabsTrigger>
							<TabsTrigger value="tab2">Tab 2</TabsTrigger>
						</TabsList>
						<TabsContent value="tab1" className="pt-2">
							default variant
						</TabsContent>
						<TabsContent value="tab2" className="pt-2">
							Tab 2 content
						</TabsContent>
					</Tabs>
					<Tabs defaultValue="tab1">
						<TabsList variant="line">
							<TabsTrigger value="tab1">Tab 1</TabsTrigger>
							<TabsTrigger value="tab2">Tab 2</TabsTrigger>
						</TabsList>
						<TabsContent value="tab1" className="pt-2">
							line variant
						</TabsContent>
						<TabsContent value="tab2" className="pt-2">
							Tab 2 content
						</TabsContent>
					</Tabs>
					<Tabs defaultValue="tab1" orientation="vertical">
						<div className="flex gap-4">
							<TabsList>
								<TabsTrigger value="tab1">Tab 1</TabsTrigger>
								<TabsTrigger value="tab2">Tab 2</TabsTrigger>
							</TabsList>
							<TabsContent value="tab1" className="pt-2">
								vertical orientation
							</TabsContent>
							<TabsContent value="tab2" className="pt-2">
								Tab 2 content
							</TabsContent>
						</div>
					</Tabs>
				</div>
			</SectionCard>

			<SectionCard title="Alert">
				<Alert variant="default">
					<AlertTitle>Default</AlertTitle>
					<AlertDescription>This is a default alert.</AlertDescription>
					<AlertAction>
						<Button size="sm">Action</Button>
					</AlertAction>
				</Alert>
				<Alert variant="destructive">
					<AlertTitle>Destructive</AlertTitle>
					<AlertDescription>This is a destructive alert.</AlertDescription>
				</Alert>
			</SectionCard>

			<SectionCard title="Avatar">
				<Avatar size="sm">
					<AvatarFallback>SM</AvatarFallback>
				</Avatar>
				<Avatar size="default">
					<AvatarImage src="https://github.com/shadcn.png" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar size="lg">
					<AvatarFallback>LG</AvatarFallback>
				</Avatar>
				<AvatarGroup>
					<Avatar size="sm">
						<AvatarFallback>A</AvatarFallback>
					</Avatar>
					<Avatar size="sm">
						<AvatarFallback>B</AvatarFallback>
					</Avatar>
					<Avatar size="sm">
						<AvatarFallback>C</AvatarFallback>
					</Avatar>
					<AvatarGroupCount>+3</AvatarGroupCount>
				</AvatarGroup>
			</SectionCard>

			<SectionCard title="Aspect Ratio">
				<div className="w-40">
					<AspectRatio ratio={1}>
						<div className="bg-muted flex size-full items-center justify-center rounded-md">1:1</div>
					</AspectRatio>
				</div>
				<div className="w-40">
					<AspectRatio ratio={16 / 9}>
						<div className="bg-muted flex size-full items-center justify-center rounded-md">16:9</div>
					</AspectRatio>
				</div>
			</SectionCard>

			<SectionCard title="Breadcrumb">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/">Home</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Components</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</SectionCard>

			<SectionCard title="Pagination">
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious text="Prev" href="#" />
						</PaginationItem>
						<PaginationItem>
							<PaginationLink href="#" isActive>
								1
							</PaginationLink>
						</PaginationItem>
						<PaginationItem>
							<PaginationLink href="#">2</PaginationLink>
						</PaginationItem>
						<PaginationItem>
							<PaginationLink href="#">3</PaginationLink>
						</PaginationItem>
						<PaginationItem>
							<PaginationEllipsis />
						</PaginationItem>
						<PaginationItem>
							<PaginationNext text="Next" href="#" />
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</SectionCard>

			<SectionCard title="Progress">
				<div className="w-48 space-y-3">
					<Progress value={0}>
						<ProgressTrack>
							<ProgressIndicator style={{ width: "0%" }} />
						</ProgressTrack>
						<ProgressValue />
					</Progress>
					<Progress value={50}>
						<ProgressTrack>
							<ProgressIndicator style={{ width: "50%" }} />
						</ProgressTrack>
						<ProgressValue />
					</Progress>
					<Progress value={100}>
						<ProgressTrack>
							<ProgressIndicator style={{ width: "100%" }} />
						</ProgressTrack>
						<ProgressValue />
					</Progress>
				</div>
			</SectionCard>

			<SectionCard title="Input">
				<Input placeholder="Text" />
				<Input type="email" placeholder="Email" />
				<Input type="password" placeholder="Password" />
				<Input type="number" placeholder="Number" />
				<Input type="url" placeholder="URL" />
				<Input type="tel" placeholder="Tel" />
				<Input type="search" placeholder="Search" />
				<Input type="file" />
				<Input placeholder="Disabled" disabled />
				<Input type="date" />
			</SectionCard>

			<SectionCard title="Textarea">
				<Textarea placeholder="Default" className="w-72" />
				<Textarea placeholder="Disabled" disabled className="w-72" />
				<Textarea placeholder="With rows" rows={6} className="w-72" />
			</SectionCard>

			<SectionCard title="Label">
				<div className="flex flex-col gap-2">
					<Label htmlFor="lbl-default">Default Label</Label>
					<Input id="lbl-default" placeholder="Labeled input" />
				</div>
			</SectionCard>

			<SectionCard title="Field">
				<Field orientation="vertical" className="w-64">
					<FieldSet>
						<FieldTitle>Field vertical</FieldTitle>
						<FieldGroup>
							<FieldLabel>Name</FieldLabel>
							<FieldContent>
								<Input placeholder="Enter name" />
							</FieldContent>
							<FieldDescription>Your full name.</FieldDescription>
							<FieldError errors={[{ message: "Name is required" }]} />
						</FieldGroup>
					</FieldSet>
				</Field>
				<Field orientation="horizontal" className="w-96">
					<FieldSet>
						<FieldTitle>Field horizontal</FieldTitle>
						<FieldGroup>
							<FieldLabel>Email</FieldLabel>
							<FieldContent>
								<Input type="email" placeholder="Email" />
							</FieldContent>
							<FieldError errors={[{ message: "Invalid email" }]} />
						</FieldGroup>
					</FieldSet>
				</Field>
			</SectionCard>

			<SectionCard title="Select">
				<div className="space-y-2">
					<Label>default size</Label>
					<Select>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Select..." />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="a">Option A</SelectItem>
							<SelectItem value="b">Option B</SelectItem>
							<SelectItem value="c" disabled>
								Disabled
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label>sm size</Label>
					<Select>
						<SelectTrigger className="w-40" size="sm">
							<SelectValue placeholder="Small" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="x">X</SelectItem>
							<SelectItem value="y">Y</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</SectionCard>

			<SectionCard title="Native Select">
				<NativeSelect size="default" defaultValue="">
					<option value="" disabled>
						Pick one
					</option>
					<NativeSelectOption value="1">Option 1</NativeSelectOption>
					<NativeSelectOption value="2">Option 2</NativeSelectOption>
				</NativeSelect>
				<NativeSelect size="sm" defaultValue="">
					<option value="" disabled>
						Small
					</option>
					<NativeSelectOption value="a">Option A</NativeSelectOption>
				</NativeSelect>
			</SectionCard>

			<SectionCard title="Checkbox">
				<Checkbox id="chk-unchecked" />
				<Label htmlFor="chk-unchecked">Unchecked</Label>
				<Checkbox id="chk-checked" defaultChecked />
				<Label htmlFor="chk-checked">Checked</Label>
				<Checkbox id="chk-disabled" disabled />
				<Label htmlFor="chk-disabled">Disabled</Label>
			</SectionCard>

			<SectionCard title="Switch">
				<div className="space-y-2">
					<Label>default size</Label>
					<div className="flex items-center gap-2">
						<Switch id="sw-off" />
						<Label htmlFor="sw-off">Off</Label>
						<Switch id="sw-on" defaultChecked />
						<Label htmlFor="sw-on">On</Label>
						<Switch id="sw-disabled" disabled />
						<Label htmlFor="sw-disabled">Disabled</Label>
					</div>
				</div>
				<div className="space-y-2">
					<Label>sm size</Label>
					<div className="flex items-center gap-2">
						<Switch id="sw-sm-off" size="sm" />
						<Label htmlFor="sw-sm-off">Off</Label>
						<Switch id="sw-sm-on" size="sm" defaultChecked />
						<Label htmlFor="sw-sm-on">On</Label>
					</div>
				</div>
			</SectionCard>

			<SectionCard title="Radio Group">
				<RadioGroup defaultValue="r1">
					<div className="flex items-center gap-2">
						<RadioGroupItem value="r1" />
						<Label>Option 1</Label>
					</div>
					<div className="flex items-center gap-2">
						<RadioGroupItem value="r2" />
						<Label>Option 2</Label>
					</div>
					<div className="flex items-center gap-2">
						<RadioGroupItem value="r3" disabled />
						<Label>Disabled</Label>
					</div>
				</RadioGroup>
			</SectionCard>

			<SectionCard title="Slider">
				<div className="w-48 space-y-2">
					<Slider value={sliderValue} onValueChange={(v) => setSliderValue(v as readonly number[])} min={0} max={100} />
					<p className="text-sm">Value: {sliderValue[0]}</p>
					<Slider defaultValue={[25]} min={0} max={100} />
					<Slider defaultValue={[75]} min={0} max={100} />
				</div>
			</SectionCard>

			<SectionCard title="Toggle">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<Toggle size="sm">sm</Toggle>
						<Toggle size="default">default</Toggle>
						<Toggle size="lg">lg</Toggle>
					</div>
					<div className="flex items-center gap-2">
						<Toggle variant="default">default</Toggle>
						<Toggle variant="outline">outline</Toggle>
					</div>
				</div>
			</SectionCard>

			<SectionCard title="Toggle Group">
				<div className="flex flex-col gap-4">
					<ToggleGroup defaultValue={["b"]}>
						<ToggleGroupItem value="b">B</ToggleGroupItem>
						<ToggleGroupItem value="i">I</ToggleGroupItem>
						<ToggleGroupItem value="u">U</ToggleGroupItem>
					</ToggleGroup>
					<ToggleGroup orientation="vertical" defaultValue={["1"]}>
						<ToggleGroupItem value="1">1</ToggleGroupItem>
						<ToggleGroupItem value="2">2</ToggleGroupItem>
						<ToggleGroupItem value="3">3</ToggleGroupItem>
					</ToggleGroup>
					<ToggleGroup variant="outline" defaultValue={["x"]}>
						<ToggleGroupItem value="x">X</ToggleGroupItem>
						<ToggleGroupItem value="y">Y</ToggleGroupItem>
					</ToggleGroup>
				</div>
			</SectionCard>

			<SectionCard title="Input OTP">
				<InputOTP maxLength={4}>
					<InputOTPGroup>
						<InputOTPSlot index={0} />
						<InputOTPSlot index={1} />
						<InputOTPSlot index={2} />
						<InputOTPSlot index={3} />
					</InputOTPGroup>
				</InputOTP>
				<InputOTP maxLength={6}>
					<InputOTPGroup>
						<InputOTPSlot index={0} />
						<InputOTPSlot index={1} />
						<InputOTPSlot index={2} />
					</InputOTPGroup>
					<InputOTPSeparator />
					<InputOTPGroup>
						<InputOTPSlot index={3} />
						<InputOTPSlot index={4} />
						<InputOTPSlot index={5} />
					</InputOTPGroup>
				</InputOTP>
			</SectionCard>

			<SectionCard title="Input Group">
				<div className="flex flex-col gap-4">
					<InputGroup className="w-64">
						<InputGroupAddon align="inline-start">
							<InputGroupText>@</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput placeholder="Username" />
					</InputGroup>
					<InputGroup className="w-64">
						<InputGroupInput placeholder="Search" />
						<InputGroupAddon align="inline-end">
							<InputGroupButton variant="ghost" size="icon-xs">
								🔍
							</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
				</div>
			</SectionCard>

			<SectionCard title="Combobox">
				<div className="flex flex-col gap-4">
					<Combobox>
						<ComboboxTrigger className="w-48">
							<ComboboxValue placeholder="Select fruit" />
						</ComboboxTrigger>
						<ComboboxContent>
							<ComboboxList>
								<ComboboxItem value="apple">Apple</ComboboxItem>
								<ComboboxItem value="banana">Banana</ComboboxItem>
								<ComboboxItem value="cherry">Cherry</ComboboxItem>
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
					<Combobox>
						<ComboboxInput placeholder="Search inline..." showTrigger />
						<ComboboxContent>
							<ComboboxList>
								<ComboboxItem value="red">Red</ComboboxItem>
								<ComboboxItem value="green">Green</ComboboxItem>
								<ComboboxItem value="blue">Blue</ComboboxItem>
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
				</div>
			</SectionCard>

			<SectionCard title="Collapsible">
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
						<div className="bg-muted rounded-md p-2 text-sm">Collapsible content</div>
					</CollapsibleContent>
				</Collapsible>
			</SectionCard>

			<SectionCard title="Dialog">
				<Dialog>
					<DialogTrigger>
						<Button variant="outline">Open</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Profile</DialogTitle>
							<DialogDescription>Make changes.</DialogDescription>
						</DialogHeader>
						<div className="py-4">
							<Input placeholder="Name" />
						</div>
						<DialogFooter>
							<Button variant="outline">Cancel</Button>
							<Button>Save</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				<Dialog>
					<DialogTrigger>
						<Button variant="outline">No close btn</Button>
					</DialogTrigger>
					<DialogContent showCloseButton={false}>
						<DialogHeader>
							<DialogTitle>No Close</DialogTitle>
						</DialogHeader>
						<p className="py-4">Close button hidden</p>
					</DialogContent>
				</Dialog>
			</SectionCard>

			<SectionCard title="Alert Dialog">
				<AlertDialog>
					<AlertDialogTrigger>
						<Button variant="destructive">Delete (sm)</Button>
					</AlertDialogTrigger>
					<AlertDialogContent size="sm">
						<AlertDialogHeader>
							<AlertDialogMedia />
							<AlertDialogTitle>Are you sure?</AlertDialogTitle>
							<AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction>Delete</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
				<AlertDialog>
					<AlertDialogTrigger>
						<Button variant="destructive">Delete (default)</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogMedia />
							<AlertDialogTitle>Delete item?</AlertDialogTitle>
							<AlertDialogDescription>This action is permanent.</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction>Delete</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</SectionCard>

			<SectionCard title="Sheet">
				<div className="flex flex-wrap gap-2">
					<Sheet>
						<SheetTrigger>
							<Button variant="outline">Right</Button>
						</SheetTrigger>
						<SheetContent side="right">
							<SheetHeader>
								<SheetTitle>Right</SheetTitle>
								<SheetDescription>Right side sheet</SheetDescription>
							</SheetHeader>
							<div className="py-4">
								<p>Content</p>
							</div>
						</SheetContent>
					</Sheet>
					<Sheet>
						<SheetTrigger>
							<Button variant="outline">Left</Button>
						</SheetTrigger>
						<SheetContent side="left">
							<SheetHeader>
								<SheetTitle>Left</SheetTitle>
								<SheetDescription>Left side sheet</SheetDescription>
							</SheetHeader>
							<div className="py-4">
								<p>Content</p>
							</div>
						</SheetContent>
					</Sheet>
					<Sheet>
						<SheetTrigger>
							<Button variant="outline">Top</Button>
						</SheetTrigger>
						<SheetContent side="top">
							<SheetHeader>
								<SheetTitle>Top</SheetTitle>
								<SheetDescription>Top sheet</SheetDescription>
							</SheetHeader>
							<div className="py-4">
								<p>Content</p>
							</div>
						</SheetContent>
					</Sheet>
					<Sheet>
						<SheetTrigger>
							<Button variant="outline">Bottom</Button>
						</SheetTrigger>
						<SheetContent side="bottom">
							<SheetHeader>
								<SheetTitle>Bottom</SheetTitle>
								<SheetDescription>Bottom sheet</SheetDescription>
							</SheetHeader>
							<div className="py-4">
								<p>Content</p>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</SectionCard>

			<SectionCard title="Drawer">
				<Drawer>
					<DrawerTrigger>
						<Button variant="outline">Open Drawer</Button>
					</DrawerTrigger>
					<DrawerContent>
						<DrawerHeader>
							<DrawerTitle>Drawer Title</DrawerTitle>
							<DrawerDescription>Description</DrawerDescription>
						</DrawerHeader>
						<div className="p-4">
							<p>Drawer content</p>
						</div>
					</DrawerContent>
				</Drawer>
			</SectionCard>

			<SectionCard title="Popover">
				<Popover>
					<PopoverTrigger>
						<Button variant="outline">Open</Button>
					</PopoverTrigger>
					<PopoverContent>
						<PopoverHeader>
							<PopoverTitle>Title</PopoverTitle>
							<PopoverDescription>Description</PopoverDescription>
						</PopoverHeader>
						<div className="pt-2">
							<Input placeholder="Type here" />
						</div>
					</PopoverContent>
				</Popover>
			</SectionCard>

			<SectionCard title="Hover Card">
				<HoverCard>
					<HoverCardTrigger>
						<Button variant="link">Hover me</Button>
					</HoverCardTrigger>
					<HoverCardContent>Content on hover</HoverCardContent>
				</HoverCard>
			</SectionCard>

			<SectionCard title="Tooltip">
				<TooltipProvider>
					<div className="flex flex-wrap gap-2">
						<Tooltip>
							<TooltipTrigger>
								<Button variant="outline">Top</Button>
							</TooltipTrigger>
							<TooltipContent side="top">Top tooltip</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger>
								<Button variant="outline">Bottom</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">Bottom</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger>
								<Button variant="outline">Left</Button>
							</TooltipTrigger>
							<TooltipContent side="left">Left</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger>
								<Button variant="outline">Right</Button>
							</TooltipTrigger>
							<TooltipContent side="right">Right</TooltipContent>
						</Tooltip>
					</div>
				</TooltipProvider>
			</SectionCard>

			<SectionCard title="Dropdown Menu">
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="outline">Item variants</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem>Default</DropdownMenuItem>
						<DropdownMenuItem variant="destructive">Destructive</DropdownMenuItem>
						<DropdownMenuItem inset>Inset</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuLabel>Label with inset</DropdownMenuLabel>
						<DropdownMenuCheckboxItem checked>Checked</DropdownMenuCheckboxItem>
						<DropdownMenuCheckboxItem inset>Unchecked inset</DropdownMenuCheckboxItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="outline">Radio items</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuRadioGroup value={framework} onValueChange={(v) => setFramework(v)}>
							<DropdownMenuRadioItem value="next">Next.js</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="remix">Remix</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="astro">Astro</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SectionCard>

			<SectionCard title="Context Menu">
				<ContextMenu>
					<ContextMenuTrigger>
						<div className="bg-muted flex h-24 w-48 cursor-context-menu items-center justify-center rounded-md text-sm">
							Right-click here
						</div>
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuItem>Default</ContextMenuItem>
						<ContextMenuItem variant="destructive">Delete</ContextMenuItem>
						<ContextMenuItem inset>Inset</ContextMenuItem>
						<ContextMenuSeparator />
						<ContextMenuCheckboxItem checked>Checkbox item</ContextMenuCheckboxItem>
					</ContextMenuContent>
				</ContextMenu>
			</SectionCard>

			<SectionCard title="Menubar">
				<Menubar>
					<MenubarMenu>
						<MenubarTrigger>File</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>New Tab</MenubarItem>
							<MenubarItem inset>Open File</MenubarItem>
							<MenubarSeparator />
							<MenubarItem variant="destructive">Exit</MenubarItem>
						</MenubarContent>
					</MenubarMenu>
					<MenubarMenu>
						<MenubarTrigger>Edit</MenubarTrigger>
						<MenubarContent>
							<MenubarItem>Undo</MenubarItem>
							<MenubarItem>Redo</MenubarItem>
							<MenubarCheckboxItem checked>Checkbox item</MenubarCheckboxItem>
						</MenubarContent>
					</MenubarMenu>
				</Menubar>
			</SectionCard>

			<SectionCard title="Navigation Menu">
				<NavigationMenu>
					<NavigationMenuList>
						<NavigationMenuItem>
							<NavigationMenuTrigger>Products</NavigationMenuTrigger>
							<NavigationMenuContent>
								<div className="w-48 p-4 text-sm">Product list</div>
							</NavigationMenuContent>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuTrigger>Docs</NavigationMenuTrigger>
							<NavigationMenuContent>
								<div className="w-48 p-4 text-sm">Documentation</div>
							</NavigationMenuContent>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			</SectionCard>

			<SectionCard title="Table">
				<Table className="w-full max-w-lg">
					<TableCaption>Invoice list</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>Invoice</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{invoices.map((inv) => (
							<TableRow key={inv.invoice}>
								<TableCell className="font-medium">{inv.invoice}</TableCell>
								<TableCell>{inv.paymentStatus}</TableCell>
								<TableCell className="text-right">${inv.totalAmount}</TableCell>
							</TableRow>
						))}
					</TableBody>
					<TableFooter>
						<TableRow>
							<TableCell colSpan={2}>Total</TableCell>
							<TableCell className="text-right">$750</TableCell>
						</TableRow>
					</TableFooter>
				</Table>
			</SectionCard>

			<SectionCard title="Scroll Area">
				<ScrollArea className="h-24 w-64 rounded-md border p-2">
					{"Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(15)}
					<ScrollBar orientation="vertical" />
				</ScrollArea>
				<ScrollArea className="h-24 w-64 rounded-md border p-2">
					<div className="flex w-max gap-4">
						{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
							<div key={n} className="bg-muted flex size-16 shrink-0 items-center justify-center rounded-md">
								{n}
							</div>
						))}
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</SectionCard>

			<SectionCard title="Resizable">
				<ResizablePanelGroup orientation="horizontal" className="max-w-md rounded-lg border">
					<ResizablePanel defaultSize={50} minSize={30}>
						<div className="flex h-24 items-center justify-center p-2">Left</div>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={50} minSize={30}>
						<div className="flex h-24 items-center justify-center p-2">Right</div>
					</ResizablePanel>
				</ResizablePanelGroup>
				<ResizablePanelGroup orientation="vertical" className="max-w-xs rounded-lg border">
					<ResizablePanel defaultSize={50}>
						<div className="flex h-24 items-center justify-center p-2">Top</div>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel defaultSize={50}>
						<div className="flex h-24 items-center justify-center p-2">Bottom</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			</SectionCard>

			<SectionCard title="Item">
				<ItemGroup className="w-64">
					<Item variant="default" size="default">
						<ItemMedia variant="icon" />
						<ItemContent>
							<ItemHeader>
								<ItemTitle>Default</ItemTitle>
								<ItemDescription>Description</ItemDescription>
							</ItemHeader>
						</ItemContent>
					</Item>
					<Item variant="outline" size="sm">
						<ItemMedia variant="icon" />
						<ItemContent>
							<ItemHeader>
								<ItemTitle>Outline sm</ItemTitle>
							</ItemHeader>
						</ItemContent>
						<ItemActions>
							<Button size="icon-sm" variant="ghost">
								→
							</Button>
						</ItemActions>
					</Item>
					<Item variant="muted" size="xs">
						<ItemContent>
							<ItemHeader>
								<ItemTitle>Muted xs</ItemTitle>
							</ItemHeader>
						</ItemContent>
					</Item>
				</ItemGroup>
			</SectionCard>

			<SectionCard title="Empty State">
				<Empty>
					<EmptyMedia variant="default" />
					<EmptyHeader>
						<EmptyTitle>No results found</EmptyTitle>
						<EmptyDescription>Try adjusting your search.</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button variant="outline" size="sm">
							Clear filters
						</Button>
					</EmptyContent>
				</Empty>
				<Empty>
					<EmptyMedia variant="icon" />
					<EmptyHeader>
						<EmptyTitle>No data</EmptyTitle>
						<EmptyDescription>Nothing to show yet.</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</SectionCard>

			<SectionCard title="Carousel">
				<div className="flex gap-4">
					<Carousel className="w-full max-w-xs" orientation="horizontal">
						<CarouselContent>
							{[1, 2, 3, 4, 5].map((i) => (
								<CarouselItem key={i}>
									<div className="bg-muted flex aspect-square items-center justify-center rounded-lg text-4xl font-semibold">
										{i}
									</div>
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselPrevious />
						<CarouselNext />
					</Carousel>
				</div>
			</SectionCard>

			<SectionCard title="Chart">
				<div className="w-full max-w-md">
					<ChartContainer config={CHART_CONFIG} className="h-48">
						<BarChart data={CHART_DATA}>
							<XAxis dataKey="month" />
							<YAxis />
							<ChartTooltip content={<ChartTooltipContent />} />
							<ChartLegend content={<ChartLegendContent />} />
							<Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
							<Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
						</BarChart>
					</ChartContainer>
				</div>
			</SectionCard>

			<SectionCard title="Calendar">
				<Calendar mode="single" />
				<Calendar mode="single" showOutsideDays={false} captionLayout="dropdown" />
			</SectionCard>

			<SectionCard title="Command">
				<CommandDialog>
					<CommandInput placeholder="Type a command..." />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup heading="Suggestions">
							<CommandItem>Calendar</CommandItem>
							<CommandItem>Search</CommandItem>
							<CommandItem>Settings</CommandItem>
						</CommandGroup>
					</CommandList>
				</CommandDialog>
				<p className="text-muted-foreground text-sm">Press ⌘K to open</p>
			</SectionCard>
		</div>
	);
}
