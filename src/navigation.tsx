import { useCallback } from "react";
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  useNavigate as useRouterNavigate,
  type LinkProps,
  type NavLinkProps,
  type NavigateOptions,
  type To,
} from "react-router-dom";
const motionEnabled = () =>
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** All internal links use the same outgoing/incoming page transition. */
export function Link(props: LinkProps) {
  return <RouterLink viewTransition={motionEnabled()} {...props} />;
}
export function NavLink(props: NavLinkProps) {
  return <RouterNavLink viewTransition={motionEnabled()} {...props} />;
}
export function useNavigate() {
  const navigate = useRouterNavigate();
  return useCallback(
    (to: To | number, options?: NavigateOptions) =>
      typeof to === "number"
        ? navigate(to)
        : navigate(to, { viewTransition: motionEnabled(), ...options }),
    [navigate],
  );
}
