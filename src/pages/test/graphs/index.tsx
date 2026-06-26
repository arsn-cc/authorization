"use client";

import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	ComposedChart,
	Funnel,
	FunnelChart,
	LabelList,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	Radar,
	RadarChart,
	RadialBar,
	RadialBarChart,
	Sankey,
	Scatter,
	ScatterChart,
	Treemap,
	XAxis,
	YAxis,
} from "recharts";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { SankeyNodeProps } from "recharts";

function SankeyNode({ x, y, width, height, payload }: SankeyNodeProps) {
	return (
		<rect
			x={x}
			y={y}
			width={width}
			height={height}
			fill={(payload as unknown as { fill: string }).fill}
			fillOpacity={0.8}
			rx={2}
		/>
	);
}

const monthlyData = [
	{ month: "Jan", revenue: 4000, expenses: 2400, profit: 1600 },
	{ month: "Feb", revenue: 3000, expenses: 1398, profit: 1602 },
	{ month: "Mar", revenue: 2000, expenses: 9800, profit: -7800 },
	{ month: "Apr", revenue: 2780, expenses: 3908, profit: -1128 },
	{ month: "May", revenue: 1890, expenses: 4800, profit: -2910 },
	{ month: "Jun", revenue: 2390, expenses: 3800, profit: -1410 },
];

const productData = [
	{ product: "Electronics", sales: 4200, marketShare: 35, fill: "var(--color-electronics)" },
	{ product: "Clothing", sales: 3100, marketShare: 25, fill: "var(--color-clothing)" },
	{ product: "Food", sales: 2400, marketShare: 20, fill: "var(--color-food)" },
	{ product: "Books", sales: 1800, marketShare: 15, fill: "var(--color-books)" },
	{ product: "Other", sales: 600, marketShare: 5, fill: "var(--color-other)" },
];

const funnelData = [
	{ stage: "Visitors", value: 10000, fill: "var(--color-visitors)" },
	{ stage: "Signups", value: 4500, fill: "var(--color-signups)" },
	{ stage: "Activated", value: 2800, fill: "var(--color-activated)" },
	{ stage: "Paid", value: 1200, fill: "var(--color-paid)" },
	{ stage: "Retained", value: 800, fill: "var(--color-retained)" },
];

const scatterData = [
	{ x: 10, y: 30, z: 200 },
	{ x: 40, y: 20, z: 400 },
	{ x: 30, y: 50, z: 150 },
	{ x: 80, y: 40, z: 350 },
	{ x: 20, y: 70, z: 250 },
	{ x: 60, y: 10, z: 300 },
	{ x: 50, y: 60, z: 180 },
	{ x: 70, y: 80, z: 220 },
	{ x: 90, y: 30, z: 500 },
	{ x: 15, y: 45, z: 280 },
];

const radarData = [
	{ metric: "Speed", productA: 85, productB: 70 },
	{ metric: "Reliability", productA: 75, productB: 90 },
	{ metric: "Cost", productA: 60, productB: 80 },
	{ metric: "Features", productA: 95, productB: 65 },
	{ metric: "Support", productA: 70, productB: 85 },
	{ metric: "UX", productA: 80, productB: 75 },
];

const radialData = [
	{ name: "Q1", value: 85, fill: "var(--color-q1)" },
	{ name: "Q2", value: 65, fill: "var(--color-q2)" },
	{ name: "Q3", value: 90, fill: "var(--color-q3)" },
	{ name: "Q4", value: 70, fill: "var(--color-q4)" },
];

const treemapData = [
	{ name: "Asia", size: 4500, fill: "var(--color-asia)" },
	{ name: "Europe", size: 3200, fill: "var(--color-europe)" },
	{ name: "Americas", size: 2800, fill: "var(--color-americas)" },
	{ name: "Africa", size: 1600, fill: "var(--color-africa)" },
	{ name: "Oceania", size: 900, fill: "var(--color-oceania)" },
];

const sankeyData = {
	nodes: [
		{ name: "Total Traffic", fill: "var(--color-traffic)" },
		{ name: "Organic", fill: "var(--color-organic)" },
		{ name: "Paid", fill: "var(--color-paid)" },
		{ name: "Social", fill: "var(--color-social)" },
		{ name: "Direct", fill: "var(--color-direct)" },
		{ name: "Converted", fill: "var(--color-converted)" },
		{ name: "Bounced", fill: "var(--color-bounced)" },
	],
	links: [
		{ source: 0, target: 1, value: 4000 },
		{ source: 0, target: 2, value: 3000 },
		{ source: 0, target: 3, value: 2000 },
		{ source: 0, target: 4, value: 1000 },
		{ source: 1, target: 5, value: 1200 },
		{ source: 2, target: 5, value: 800 },
		{ source: 3, target: 5, value: 600 },
		{ source: 4, target: 5, value: 400 },
		{ source: 1, target: 6, value: 2800 },
		{ source: 2, target: 6, value: 2200 },
		{ source: 3, target: 6, value: 1400 },
		{ source: 4, target: 6, value: 600 },
	],
};

const barConfig = {
	revenue: { label: "Revenue", color: "var(--chart-1)" },
	expenses: { label: "Expenses", color: "var(--chart-2)" },
	profit: { label: "Profit", color: "var(--chart-3)" },
};

const lineConfig = {
	revenue: { label: "Revenue", color: "var(--chart-1)" },
	expenses: { label: "Expenses", color: "var(--chart-2)" },
};

const areaConfig = {
	revenue: { label: "Revenue", color: "var(--chart-1)" },
	profit: { label: "Profit", color: "var(--chart-3)" },
};

const pieConfig = {
	electronics: { label: "Electronics", color: "var(--chart-1)" },
	clothing: { label: "Clothing", color: "var(--chart-2)" },
	food: { label: "Food", color: "var(--chart-3)" },
	books: { label: "Books", color: "var(--chart-4)" },
	other: { label: "Other", color: "var(--chart-5)" },
};

const radarConfig = {
	productA: { label: "Product A", color: "var(--chart-1)" },
	productB: { label: "Product B", color: "var(--chart-2)" },
};

const radialConfig = {
	q1: { label: "Q1", color: "var(--chart-1)" },
	q2: { label: "Q2", color: "var(--chart-2)" },
	q3: { label: "Q3", color: "var(--chart-3)" },
	q4: { label: "Q4", color: "var(--chart-4)" },
};

const funnelConfig = {
	visitors: { label: "Visitors", color: "var(--chart-1)" },
	signups: { label: "Signups", color: "var(--chart-2)" },
	activated: { label: "Activated", color: "var(--chart-3)" },
	paid: { label: "Paid", color: "var(--chart-4)" },
	retained: { label: "Retained", color: "var(--chart-5)" },
};

const scatterConfig = {
	products: { label: "Products", color: "var(--chart-1)" },
};

const treemapConfig = {
	asia: { label: "Asia", color: "var(--chart-1)" },
	europe: { label: "Europe", color: "var(--chart-2)" },
	americas: { label: "Americas", color: "var(--chart-3)" },
	africa: { label: "Africa", color: "var(--chart-4)" },
	oceania: { label: "Oceania", color: "var(--chart-5)" },
};

const sankeyConfig = {
	traffic: { label: "Total Traffic", color: "var(--chart-1)" },
	organic: { label: "Organic", color: "var(--chart-2)" },
	paid: { label: "Paid", color: "var(--chart-3)" },
	social: { label: "Social", color: "var(--chart-4)" },
	direct: { label: "Direct", color: "var(--chart-5)" },
	converted: { label: "Converted", color: "var(--chart-1)" },
	bounced: { label: "Bounced", color: "var(--chart-2)" },
};

export default function GraphsPage() {
	return (
		<div className="container mx-auto flex flex-col gap-12 p-8">
			<h1 className="text-foreground text-3xl font-bold">Charts & Graphs</h1>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Bar Chart</h2>
				<ChartContainer config={barConfig} className="min-h-72">
					<BarChart accessibilityLayer data={monthlyData}>
						<CartesianGrid vertical={false} />
						<XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
						<YAxis tickLine={false} tickMargin={10} axisLine={false} />
						<ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
						<ChartLegend content={<ChartLegendContent />} />
						<Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
						<Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
					</BarChart>
				</ChartContainer>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Line Chart</h2>
				<ChartContainer config={lineConfig} className="min-h-72">
					<LineChart accessibilityLayer data={monthlyData}>
						<CartesianGrid vertical={false} />
						<XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
						<YAxis tickLine={false} tickMargin={10} axisLine={false} />
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<ChartLegend content={<ChartLegendContent />} />
						<Line dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
						<Line dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} dot={false} />
					</LineChart>
				</ChartContainer>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Area Chart</h2>
				<ChartContainer config={areaConfig} className="min-h-72">
					<AreaChart accessibilityLayer data={monthlyData}>
						<CartesianGrid vertical={false} />
						<XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
						<YAxis tickLine={false} tickMargin={10} axisLine={false} />
						<ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
						<ChartLegend content={<ChartLegendContent />} />
						<Area dataKey="revenue" fill="var(--color-revenue)" fillOpacity={0.2} stroke="var(--color-revenue)" />
						<Area dataKey="profit" fill="var(--color-profit)" fillOpacity={0.2} stroke="var(--color-profit)" />
					</AreaChart>
				</ChartContainer>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Composed Chart</h2>
				<ChartContainer config={barConfig} className="min-h-72">
					<ComposedChart accessibilityLayer data={monthlyData}>
						<CartesianGrid vertical={false} />
						<XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
						<YAxis tickLine={false} tickMargin={10} axisLine={false} />
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<ChartLegend content={<ChartLegendContent />} />
						<Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
						<Line dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} />
						<Area dataKey="profit" fill="var(--color-profit)" fillOpacity={0.1} stroke="var(--color-profit)" />
					</ComposedChart>
				</ChartContainer>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Pie Chart</h2>
				<ChartContainer config={pieConfig} className="min-h-72">
					<PieChart accessibilityLayer>
						<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
						<Pie data={productData} dataKey="sales" nameKey="product" innerRadius={60} strokeWidth={2}>
							<LabelList
								dataKey="product"
								position="outside"
								offset={8}
								className="fill-foreground text-xs"
								stroke="none"
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Radar Chart</h2>
				<ChartContainer config={radarConfig} className="min-h-72">
					<RadarChart accessibilityLayer data={radarData}>
						<CartesianGrid />
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<Radar dataKey="productA" fill="var(--color-productA)" fillOpacity={0.3} stroke="var(--color-productA)" />
						<Radar dataKey="productB" fill="var(--color-productB)" fillOpacity={0.3} stroke="var(--color-productB)" />
						<Legend />
					</RadarChart>
				</ChartContainer>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Radial Bar Chart</h2>
				<ChartContainer config={radialConfig} className="min-h-72">
					<RadialBarChart accessibilityLayer data={radialData} innerRadius="30%" outerRadius="100%">
						<RadialBar dataKey="value" background>
							<LabelList dataKey="name" position="insideStart" className="fill-background text-xs" />
						</RadialBar>
						<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
						<Legend />
					</RadialBarChart>
				</ChartContainer>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Scatter Chart</h2>
				<ChartContainer config={scatterConfig} className="min-h-72">
					<ScatterChart accessibilityLayer>
						<CartesianGrid />
						<XAxis dataKey="x" type="number" tickLine={false} tickMargin={10} axisLine={false} />
						<YAxis dataKey="y" type="number" tickLine={false} tickMargin={10} axisLine={false} />
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<Scatter data={scatterData} fill="var(--color-products)" />
					</ScatterChart>
				</ChartContainer>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Funnel Chart</h2>
				<ChartContainer config={funnelConfig} className="min-h-72">
					<FunnelChart accessibilityLayer>
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<Funnel data={funnelData} dataKey="value" nameKey="stage" isAnimationActive={false}>
							<LabelList dataKey="stage" position="right" className="fill-foreground text-xs" stroke="none" />
						</Funnel>
					</FunnelChart>
				</ChartContainer>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Treemap</h2>
				<ChartContainer config={treemapConfig} className="min-h-72">
					<Treemap data={treemapData} dataKey="size" aspectRatio={4 / 3} stroke="var(--background)">
						<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
					</Treemap>
				</ChartContainer>
			</section>

			<section className="space-y-4">
				<h2 className="text-foreground text-xl font-semibold">Sankey Diagram</h2>
				<ChartContainer config={sankeyConfig} className="min-h-72">
					<Sankey
						data={sankeyData}
						nodePadding={30}
						margin={{ top: 20, bottom: 20 }}
						width={600}
						link={{ stroke: "hsl(var(--border))" }}
						node={SankeyNode}
					/>
				</ChartContainer>
			</section>
		</div>
	);
}
