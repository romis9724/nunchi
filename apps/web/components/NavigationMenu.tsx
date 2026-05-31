/**
 * NavigationMenu — application-level navigation bar.
 *
 * Accepts the current `pathname` as a prop so the component is
 * fully deterministic and testable without router mocking.
 * Active items receive aria-current="page" for screen-reader accessibility.
 */

import { NAV_ITEMS } from "../lib/routes.js";
import { buildNavLinkProps } from "../lib/nav-utils.js";

interface NavigationMenuProps {
  /** Current URL pathname, e.g. '/check' or '/admin/events' */
  pathname: string;
}

/**
 * Renders the main navigation as a <nav> with anchor links.
 * Each link is marked with aria-current="page" when it matches
 * the current pathname (exact or prefix match, root excluded).
 */
export function NavigationMenu({ pathname }: NavigationMenuProps) {
  const links = buildNavLinkProps(pathname, NAV_ITEMS);

  return (
    <nav aria-label="주요 탐색">
      <ul role="list">
        {links.map(({ key, href, label, "aria-current": ariaCurrent }) => (
          <li key={key}>
            <a href={href} aria-current={ariaCurrent}>
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
