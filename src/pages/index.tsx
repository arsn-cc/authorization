import { unstable_redirect } from "waku/router/server";

export default function HomePage() {
	unstable_redirect("/login");
}

export const getConfig = async () => {
	return { render: "dynamic" } as const;
};
