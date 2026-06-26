"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
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
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSet,
	FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function FormsPage() {
	const [sliderValue, setSliderValue] = useState<readonly number[]>([50]);

	return (
		<div className="container mx-auto flex flex-col gap-8 p-8">
			<h1 className="text-foreground text-3xl font-bold">Forms & Inputs</h1>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Button</h2>
				<div className="flex flex-wrap items-start gap-4">
					<div className="flex flex-wrap items-center gap-2">
						<Button>Default</Button>
						<Button variant="outline">Outline</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="ghost">Ghost</Button>
						<Button variant="destructive">Destructive</Button>
						<Button variant="link">Link</Button>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button size="sm">Small</Button>
						<Button>Default</Button>
						<Button size="lg">Large</Button>
						<Button size="icon-sm">icon-sm</Button>
						<Button size="icon">icon</Button>
						<Button size="icon-lg">icon-lg</Button>
					</div>
					<Button disabled>Disabled</Button>
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Button Group</h2>
				<div className="flex flex-wrap items-start gap-4">
					<ButtonGroup>
						<Button>Left</Button>
						<ButtonGroupSeparator />
						<Button>Middle</Button>
						<ButtonGroupSeparator />
						<Button>Right</Button>
					</ButtonGroup>
					<ButtonGroup orientation="vertical">
						<Button>Top</Button>
						<ButtonGroupSeparator />
						<Button>Middle</Button>
						<ButtonGroupSeparator />
						<Button>Bottom</Button>
					</ButtonGroup>
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Input</h2>
				<div className="flex flex-wrap items-start gap-4">
					<div className="space-y-2">
						<Label htmlFor="input-default">Default</Label>
						<Input id="input-default" placeholder="Default input" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="input-disabled">Disabled</Label>
						<Input id="input-disabled" placeholder="Disabled" disabled />
					</div>
					<div className="space-y-2">
						<Label htmlFor="input-file">File</Label>
						<Input id="input-file" type="file" />
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Textarea</h2>
				<div className="flex flex-wrap items-start gap-4">
					<div className="space-y-2">
						<Label htmlFor="ta-default">Default</Label>
						<Textarea id="ta-default" placeholder="Type your message here." className="w-80" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="ta-disabled">Disabled</Label>
						<Textarea id="ta-disabled" placeholder="Disabled" disabled className="w-80" />
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Select</h2>
				<div className="flex flex-wrap items-start gap-4">
					<div className="space-y-2">
						<Label htmlFor="sel-1">Pick one</Label>
						<Select>
							<SelectTrigger id="sel-1" className="w-40">
								<SelectValue placeholder="Select..." />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="a">Option A</SelectItem>
								<SelectItem value="b">Option B</SelectItem>
								<SelectItem value="c" disabled>
									Option C
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Native Select</h2>
				<NativeSelect defaultValue="">
					<option value="" disabled>
						Pick an option
					</option>
					<NativeSelectOption value="1">Option 1</NativeSelectOption>
					<NativeSelectOption value="2">Option 2</NativeSelectOption>
				</NativeSelect>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Checkbox</h2>
				<div className="flex flex-wrap items-center gap-4">
					<div className="flex items-center gap-2">
						<Checkbox id="c1" />
						<Label htmlFor="c1">Unchecked</Label>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox id="c2" defaultChecked />
						<Label htmlFor="c2">Checked</Label>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox id="c3" disabled />
						<Label htmlFor="c3">Disabled</Label>
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Switch</h2>
				<div className="flex flex-wrap items-center gap-4">
					<div className="flex items-center gap-2">
						<Switch id="s1" />
						<Label htmlFor="s1">Off</Label>
					</div>
					<div className="flex items-center gap-2">
						<Switch id="s2" defaultChecked />
						<Label htmlFor="s2">On</Label>
					</div>
					<div className="flex items-center gap-2">
						<Switch id="s3" disabled />
						<Label htmlFor="s3">Disabled</Label>
					</div>
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Radio Group</h2>
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
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Slider</h2>
				<div className="w-48 space-y-2">
					<Slider value={sliderValue} onValueChange={(v) => setSliderValue(v as readonly number[])} min={0} max={100} />
					<p className="text-sm">Value: {sliderValue[0]}</p>
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Toggle</h2>
				<div className="flex flex-wrap items-center gap-2">
					<Toggle size="sm">Sm</Toggle>
					<Toggle>Default</Toggle>
					<Toggle size="lg">Lg</Toggle>
					<Toggle variant="outline">Outline</Toggle>
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Toggle Group</h2>
				<ToggleGroup defaultValue={["b"]}>
					<ToggleGroupItem value="b">B</ToggleGroupItem>
					<ToggleGroupItem value="i">I</ToggleGroupItem>
					<ToggleGroupItem value="u">U</ToggleGroupItem>
				</ToggleGroup>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Input OTP</h2>
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
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Input Group</h2>
				<InputGroup className="w-64">
					<InputGroupAddon align="inline-start">
						<InputGroupText>@</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput placeholder="Username" />
				</InputGroup>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Field</h2>
				<Field orientation="vertical" className="w-64">
					<FieldSet>
						<FieldTitle>Personal Info</FieldTitle>
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
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Combobox</h2>
				<div className="flex flex-col gap-4">
					<p className="text-muted-foreground text-sm">Select-like (trigger + popup):</p>
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
					<p className="text-muted-foreground text-sm">Searchable (inline input + popup):</p>
					<Combobox>
						<ComboboxInput placeholder="Search colors..." showTrigger />
						<ComboboxContent>
							<ComboboxList>
								<ComboboxItem value="red">Red</ComboboxItem>
								<ComboboxItem value="green">Green</ComboboxItem>
								<ComboboxItem value="blue">Blue</ComboboxItem>
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
				</div>
			</section>
		</div>
	);
}
