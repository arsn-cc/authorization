import { NotFoundContent } from "@/components/not-found-content";

export default function NotFoundPage() {
	return <NotFoundContent />;
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
