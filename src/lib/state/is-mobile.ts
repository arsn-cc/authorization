import { atom, useAtom } from "jotai";
import { useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

const isMobileBaseAtom = atom(false);

export function useIsMobile() {
	const [isMobile, setIsMobile] = useAtom(isMobileBaseAtom);

	useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
		const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		mql.addEventListener("change", onChange);
		setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		return () => mql.removeEventListener("change", onChange);
	}, [setIsMobile]);

	return isMobile;
}
