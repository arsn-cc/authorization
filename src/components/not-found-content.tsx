import { Link } from "waku";

export function NotFoundContent() {
	return (
		<div className="mx-auto w-full max-w-md px-4 py-8 text-center">
			<title>404 - Not Found</title>
			<h1 className="text-6xl font-bold tracking-tight">404</h1>
			<p className="text-muted-foreground mt-4">Page not found</p>
			<Link to="/login" className="text-foreground mt-6 inline-block font-medium underline underline-offset-4">
				Go to login
			</Link>
		</div>
	);
}
