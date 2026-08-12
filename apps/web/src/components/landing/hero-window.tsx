"use client";
// Marked independently of hero.tsx (which already establishes a client
// boundary): Switch and Tooltip hold their own interaction state via
// registry hooks, so this file stays correct even if a future refactor
// renders it from a Server Component instead.

import { Avatar, AvatarFallback } from "@nikaui/registry/ui/avatar";
import { Badge } from "@nikaui/registry/ui/badge";
import { Button, buttonVariants } from "@nikaui/registry/ui/button";
import { Card } from "@nikaui/registry/ui/card";
import { Input } from "@nikaui/registry/ui/input";
import { Label } from "@nikaui/registry/ui/label";
import { Progress } from "@nikaui/registry/ui/progress";
import { Switch } from "@nikaui/registry/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@nikaui/registry/ui/tooltip";
import { cn } from "@nikaui/registry/lib/utils";

/**
 * Nine real registry components, composed — no images, no hand-rolled
 * stand-ins. The one deliberate exception: the tooltip's trigger renders
 * `buttonVariants()` (the exact class function `<Button>` itself calls)
 * rather than literally nesting `<Button>` inside `<TooltipTrigger>`.
 * `TooltipTrigger` is itself a real `<button>` that owns the hover/focus
 * wiring Tooltip needs to work — nesting a second `<button>` inside it
 * would be invalid HTML and inert to a screen reader. This is the same
 * pattern hero.tsx already uses for its CTA `Link`s, which can't literally
 * render as `<Button>` either.
 */
export function HeroWindow() {
  return (
    // A labelled group, so a screen-reader user meeting "Continue", "Primary"
    // or "Keep me signed in" out of context is told what they belong to.
    // Nothing in here does anything.
    <div className="hero-window" role="group" aria-label="Live component preview">
      <div className="flex items-center gap-2 border-b border-line bg-canvas-2 px-4 py-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
        </span>
        <span className="font-mono text-xs text-content-subtle">preview — components/ui</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 p-6 min-[720px]:grid-cols-[1.1fr_1fr] sm:p-8">
        <Card className="flex flex-col gap-6 p-6">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>N</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-content">Welcome aboard</p>
              <p className="text-sm text-content-muted">Sign in to continue</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {/* The visible label is "Email", the same word the real waitlist
                field uses — and both are focusable, so a screen-reader user
                rotoring the page's form fields would otherwise find two
                identically named inputs and no way to tell which one is the
                real signup. The sr-only tail distinguishes the accessible
                name ("Email (preview only)") without changing what anyone
                reads, and keeps the htmlFor/id association intact. */}
            <Label htmlFor="hero-window-email">
              Email <span className="sr-only">(preview only)</span>
            </Label>
            <Input id="hero-window-email" type="email" readOnly value="luffy@nika.dev" />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="hero-window-keep-signed-in" defaultChecked />
            <Label htmlFor="hero-window-keep-signed-in">Keep me signed in</Label>
          </div>

          <Button className="w-full">Continue</Button>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">
              Soft
            </Button>
            <Button size="sm" variant="outline">
              Outline
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>Pro</Badge>
            <Badge variant="secondary">Beta</Badge>
            <Badge variant="outline">Stable</Badge>
          </div>

          <Card className="flex flex-col gap-3 p-4">
            {/* Illustrative demo content for the widget stack, not a claim
                about Nika itself — "Weekly active" reads as sample product
                telemetry, deliberately not "installs", which could be
                mistaken for a real number about this library. */}
            <p
              id="hero-window-metric-label"
              className="text-xs font-medium uppercase tracking-wide text-content-subtle"
            >
              Weekly active
            </p>
            <p className="text-2xl font-semibold text-content">1,284</p>
            <Progress value={72} aria-labelledby="hero-window-metric-label" />
          </Card>

          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger
                type="button"
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
              >
                Hover
              </TooltipTrigger>
              <TooltipContent>Springs in ✦</TooltipContent>
            </Tooltip>

            <div className="flex -space-x-2" aria-hidden="true">
              <Avatar className="ring-2 ring-surface">
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <Avatar className="ring-2 ring-surface">
                <AvatarFallback>B</AvatarFallback>
              </Avatar>
              <Avatar className="ring-2 ring-surface">
                <AvatarFallback>C</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
