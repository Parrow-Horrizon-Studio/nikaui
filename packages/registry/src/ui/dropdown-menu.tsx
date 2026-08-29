"use client";

import * as React from "react";
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  MenuSection,
  MenuHeading,
  MenuSeparator,
} from "@headlessui/react";
import { motion as m } from "motion/react";
import { cn } from "../lib/utils";
import { useMotionPreset, type MotionPreset } from "../lib/motion";

const DropdownMenu = Menu;

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof MenuButton>
>(({ className, ...props }, ref) => (
  <MenuButton ref={ref} className={cn(className)} {...props} />
));
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export interface DropdownMenuContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end";
  /** Animation feel. Omit to inherit from NikaMotionConfig, or "none" to disable. */
  motion?: MotionPreset;
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = "start", children, motion: motionProp, ...props }, ref) => {
    const feel = useMotionPreset("dropdown-menu", motionProp);

    return (
      <MenuItems
        ref={ref}
        anchor={align === "end" ? "bottom end" : "bottom start"}
        className={cn(
          // NOT overflow-hidden: a submenu is a second floating layer anchored to
          // this one, and hidden overflow clips it away entirely.
          "z-50 min-w-[8rem] origin-top-left rounded-lg border border-line bg-overlay p-1.5 text-content shadow-lg",
          className
        )}
        {...props}
      >
        <m.div
          initial={{ opacity: 0, scale: feel.scale.tap }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: feel.scale.tap }}
          transition={feel.transition}
        >
          {children as React.ReactNode}
        </m.div>
      </MenuItems>
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

export type DropdownMenuItemProps = React.ComponentPropsWithoutRef<
  typeof MenuItem
> & {
  inset?: boolean;
  /** Leading icon. Positioned by the item, so every menu aligns the same way. */
  icon?: React.ReactNode;
  /** Trailing keyboard hint, e.g. `⇧⌘P`. */
  shortcut?: React.ReactNode;
  /** Secondary line beneath the label. */
  description?: React.ReactNode;
  /** Destructive actions read in the danger colour and tint danger on hover. */
  destructive?: boolean;
};

/**
 * The four slots a real menu item needs.
 *
 * This took children and nothing else, so an icon, a shortcut hint, a
 * secondary description and a destructive action were each laid out by hand
 * in the consuming app — and therefore laid out differently in every app.
 * Putting them here is what makes two menus in two codebases line up.
 */
const DropdownMenuItem = React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  (
    { className, inset, icon, shortcut, description, destructive, children, ...props },
    ref
  ) => {
    // Inside a submenu panel there is no Headless UI Menu context to join, so
    // the item renders as a plain button carrying role="menuitem" itself. One
    // component either way: a separate SubMenuItem export would put the
    // burden of remembering which to use on every consumer.
    const inSubPanel = React.useContext(InSubPanelContext);
    const Element = inSubPanel ? "button" : MenuItem;
    const elementProps = inSubPanel
      ? { type: "button" as const, role: "menuitem", tabIndex: -1 }
      : { as: "button" as const };

    return (
    <Element
      ref={ref as never}
      {...elementProps}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-[7px] text-left text-sm outline-none transition-colors data-[focus]:bg-field-hover data-[focus]:text-content data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        destructive &&
          "text-danger data-[focus]:bg-danger/12 data-[focus]:text-danger",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {icon ? (
        <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{children as React.ReactNode}</span>
        {description ? (
          <span
            className={cn(
              "truncate text-xs",
              destructive ? "text-danger/70" : "text-content-subtle"
            )}
          >
            {description}
          </span>
        ) : null}
      </span>
      {shortcut ? (
        <span className="ml-auto shrink-0 font-mono text-[11px] text-content-subtle">
          {shortcut}
        </span>
      ) : null}
    </Element>
    );
  }
);
DropdownMenuItem.displayName = "DropdownMenuItem";

export interface DropdownMenuGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Visible heading. Also becomes the group's accessible name. */
  label?: React.ReactNode;
}

/**
 * A labelled group, built on Headless UI's own MenuSection/MenuHeading.
 *
 * DropdownMenuLabel already existed and was undocumented, but it labelled
 * only *visually* — nothing tied it to the items beneath it, so assistive
 * technology heard a stray line of text rather than a heading for what
 * followed.
 *
 * MenuSection wires `role="group"` to the heading's id itself. Hand-rolling
 * that with useId worked and passed the same test, but this is one less piece
 * of custom accessibility plumbing to keep correct, and it stays correct if
 * the library's semantics change.
 */
const DropdownMenuGroup = React.forwardRef<HTMLDivElement, DropdownMenuGroupProps>(
  ({ className, label, children, ...props }, ref) => (
    <MenuSection ref={ref} className={cn("py-0.5", className)} {...props}>
      {label ? (
        <MenuHeading className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-content-subtle">
          {label}
        </MenuHeading>
      ) : null}
      {children}
    </MenuSection>
  )
);
DropdownMenuGroup.displayName = "DropdownMenuGroup";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof MenuSeparator>
>(({ className, ...props }, ref) => (
  <MenuSeparator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-line", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuLabel = ({
  className,
  inset,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) => (
  <div
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
);


/**
 * Submenus.
 *
 * Built here rather than borrowed. Headless UI 2.2.10 does not support a
 * nested `Menu` inside a `MenuItem` — verified: the inner MenuButton renders,
 * but neither a click nor a keypress opens it, because the parent MenuItem
 * intercepts the interaction. So the open state, the panel, the focus moves
 * and the outside-click are owned here.
 *
 * The trigger stays a real `MenuItem` so the PARENT menu's roving focus still
 * includes it, which is what keeps arrow-key travel through the top level
 * intact. Only the second layer is hand-built.
 */
const SubMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
} | null>(null);

/** Marks the subtree inside a submenu panel, so items render plainly there. */
const InSubPanelContext = React.createContext(false);

function useSubMenu() {
  const ctx = React.useContext(SubMenuContext);
  if (!ctx) {
    throw new Error(
      "DropdownMenuSubTrigger and DropdownMenuSubContent must be inside a DropdownMenuSub."
    );
  }
  return ctx;
}

const DropdownMenuSub = ({ children }: { children?: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  return (
    <SubMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative" data-submenu="">
        {children}
      </div>
    </SubMenuContext.Provider>
  );
};

/** Moves focus within one menu panel. */
function focusItem(panel: HTMLElement | null, index: number) {
  if (!panel) return;
  const items = panel.querySelectorAll<HTMLElement>('[role="menuitem"]');
  if (!items.length) return;
  const wrapped = (index + items.length) % items.length;
  items[wrapped]?.focus();
}

export type DropdownMenuSubTriggerProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onSelect"
> & {
  icon?: React.ReactNode;
  /** Replaces the default chevron. */
  indicator?: React.ReactNode;
};

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuSubTriggerProps
>(({ className, children, icon, indicator, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useSubMenu();

  return (
    <MenuItem
      as="button"
      ref={(node: HTMLButtonElement | null) => {
        triggerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      aria-haspopup="menu"
      aria-expanded={open}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-[7px] text-left text-sm outline-none transition-colors data-[focus]:bg-field-hover",
        open && "bg-field-hover",
        className
      )}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        // Without this the parent menu closes on select, taking the submenu
        // with it before it can be seen.
        event.preventDefault();
        if (open) setOpen(false);
        else setOpen(true);
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }
      }}
      onMouseEnter={() => setOpen(true)}
      {...props}
    >
      {icon ? (
        <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">
          {icon}
        </span>
      ) : null}
      <span className="flex-1 truncate">{children as React.ReactNode}</span>
      <span className="ml-auto shrink-0 text-content-subtle" aria-hidden="true">
        {indicator ?? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3.5"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        )}
      </span>
    </MenuItem>
  );
});
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useSubMenu();
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  // The panel takes focus when it mounts, rather than the trigger reaching in
  // after a frame — there is no frame to guess at here, the effect runs once
  // the panel is in the DOM.
  //
  // Only when the trigger currently holds focus, which is what distinguishes
  // "opened by keyboard" from "opened by hover". Pulling focus out from under
  // someone who merely moved the mouse over a menu would be worse than not
  // moving it at all.
  React.useLayoutEffect(() => {
    if (!open) return;
    if (document.activeElement !== triggerRef.current) return;
    focusItem(panelRef.current, 0);
  }, [open, triggerRef]);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    // Back to the trigger, never to the root menu: landing anywhere else
    // loses your place in the parent list, which is what makes nested menus
    // unusable by keyboard.
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={(node: HTMLDivElement | null) => {
        panelRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      role="menu"
      data-submenu-panel=""
      className={cn(
        "absolute left-full top-0 z-50 ml-1 min-w-[8rem] rounded-lg border border-line bg-overlay p-1.5 text-content shadow-lg",
        className
      )}
      onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
        const items = panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
        const index = items
          ? [...items].indexOf(document.activeElement as HTMLElement)
          : -1;
        if (event.key === "ArrowLeft" || event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close();
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          event.stopPropagation();
          focusItem(panelRef.current, index + 1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          event.stopPropagation();
          focusItem(panelRef.current, index - 1);
        }
      }}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      <InSubPanelContext.Provider value={true}>
        {children}
      </InSubPanelContext.Provider>
    </div>
  );
});
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export type DropdownMenuCheckboxItemProps = Omit<
  DropdownMenuItemProps,
  "onSelect"
> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

/**
 * A menu item that toggles instead of acting.
 *
 * The one behaviour that separates it from DropdownMenuItem is that
 * selecting it does NOT close the menu — you are usually toggling several
 * things in a row. Headless UI closes on select by default, so the handler
 * calls preventDefault to keep the panel open.
 */
const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuCheckboxItemProps
>(({ className, children, checked = false, onCheckedChange, ...props }, ref) => {
  // Headless UI writes role="menuitem" onto every MenuItem and overrides a
  // role passed as a prop — verified against 2.2.10, including through
  // as={Fragment}. `menuitem` with aria-checked is not valid ARIA; the role
  // for a toggling item is menuitemcheckbox. So it is re-applied after each
  // render, which is the smallest correct workaround available.
  const localRef = React.useRef<HTMLButtonElement | null>(null);
  React.useLayoutEffect(() => {
    localRef.current?.setAttribute("role", "menuitemcheckbox");
  });

  return (
  <MenuItem
    ref={(node: HTMLButtonElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }}
    as="button"
    aria-checked={checked}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center gap-2.5 rounded-md py-[7px] pl-8 pr-2.5 text-left text-sm outline-none transition-colors data-[focus]:bg-field-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
      // Keeps the menu open across several toggles.
      event.preventDefault();
      onCheckedChange?.(!checked);
    }}
    {...props}
  >
    <span className="absolute left-2.5 flex size-3.5 items-center justify-center">
      {checked ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3.5"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : null}
    </span>
    <span className="flex-1 truncate">{children as React.ReactNode}</span>
  </MenuItem>
  );
});
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
