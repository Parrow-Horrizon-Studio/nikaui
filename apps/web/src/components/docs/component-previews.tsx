"use client";

import { useState } from "react";
import { Button } from "@nikaui/registry/ui/button";
import { Badge } from "@nikaui/registry/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@nikaui/registry/ui/card";
import { Input } from "@nikaui/registry/ui/input";
import { Textarea } from "@nikaui/registry/ui/textarea";
import { Label } from "@nikaui/registry/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@nikaui/registry/ui/alert";
import { Progress } from "@nikaui/registry/ui/progress";
import { Slider } from "@nikaui/registry/ui/slider";
import { RadioGroup, RadioGroupItem } from "@nikaui/registry/ui/radio-group";
import { Separator } from "@nikaui/registry/ui/separator";
import { Skeleton } from "@nikaui/registry/ui/skeleton";
import { Spinner, LoadingDots } from "@nikaui/registry/ui/spinner";
import { Avatar, AvatarFallback } from "@nikaui/registry/ui/avatar";
import { AspectRatio } from "@nikaui/registry/ui/aspect-ratio";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@nikaui/registry/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@nikaui/registry/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@nikaui/registry/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@nikaui/registry/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@nikaui/registry/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@nikaui/registry/ui/accordion";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@nikaui/registry/ui/select";
import {
  Combobox,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxItem,
} from "@nikaui/registry/ui/combobox";
import { Switch } from "@nikaui/registry/ui/switch";
import { Checkbox } from "@nikaui/registry/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent } from "@nikaui/registry/ui/tooltip";
import { ToastProvider, useToast } from "@nikaui/registry/ui/toast";

function ToastDemo() {
  const { addToast } = useToast();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => addToast({ title: "Hello!", description: "This is a toast." })}
    >
      Show Toast
    </Button>
  );
}

export const previews: Record<string, React.ReactNode> = {
  button: <Button size="sm">Button</Button>,

  badge: <Badge>New</Badge>,

  card: (
    <Card className="w-full">
      <CardHeader className="p-4">
        <CardTitle className="text-sm">Card Title</CardTitle>
        <CardDescription className="text-xs">Description</CardDescription>
      </CardHeader>
    </Card>
  ),

  input: <Input placeholder="Type here..." className="h-9 text-sm" />,

  textarea: <TextareaDemo />,

  label: <Label>Email address</Label>,

  separator: (
    <div className="w-full space-y-2">
      <div className="text-sm">Above</div>
      <Separator />
      <div className="text-sm">Below</div>
    </div>
  ),

  skeleton: (
    <div className="w-full space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),

  spinner: (
    <div className="flex items-center gap-4">
      <Spinner size="sm" />
      <LoadingDots />
    </div>
  ),

  avatar: (
    <Avatar>
      <AvatarFallback>NK</AvatarFallback>
    </Avatar>
  ),

  "aspect-ratio": (
    <AspectRatio ratio={16 / 9} className="rounded-md bg-fd-muted">
      <div className="flex h-full items-center justify-center text-xs text-fd-muted-foreground">
        16:9
      </div>
    </AspectRatio>
  ),

  alert: <AlertDemo />,

  progress: <ProgressDemo />,

  dialog: <DialogDemo />,
  "alert-dialog": <AlertDialogDemo />,
  "dropdown-menu": <DropdownMenuDemo />,
  popover: <PopoverDemo />,
  tabs: <TabsDemo />,
  accordion: <AccordionDemo />,
  select: <SelectDemo />,
  combobox: <ComboboxDemo />,
  switch: <SwitchDemo />,
  checkbox: <CheckboxDemo />,
  "radio-group": <RadioGroupDemo />,
  slider: <SliderDemo />,
  tooltip: <TooltipDemo />,
  toast: (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
};

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Open Dialog
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog</DialogTitle>
            <DialogDescription>This is a dialog demo.</DialogDescription>
          </DialogHeader>
          <Button size="sm" onClick={() => setOpen(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AlertDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Confirm
      </Button>
      <AlertDialog open={open} onClose={() => setOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setOpen(false)}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DropdownMenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-fd-accent">
        Menu
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-fd-accent">
        Popover
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm">Popover content here.</p>
      </PopoverContent>
    </Popover>
  );
}

function TabsDemo() {
  return (
    <Tabs className="w-full">
      <TabsList>
        <TabsTrigger>Tab 1</TabsTrigger>
        <TabsTrigger>Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent className="p-2 text-sm">Content 1</TabsContent>
      <TabsContent className="p-2 text-sm">Content 2</TabsContent>
    </Tabs>
  );
}

function AccordionDemo() {
  return (
    <Accordion className="w-full">
      <AccordionItem>
        <AccordionTrigger>What is in this panel?</AccordionTrigger>
        <AccordionContent>
          Whatever you put here. Each panel opens and closes on its own.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function SelectDemo() {
  const [value, setValue] = useState("react");
  return (
    <Select value={value} onChange={setValue}>
      <SelectTrigger className="h-9 w-full text-sm">
        {value}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="react">React</SelectItem>
        <SelectItem value="vue">Vue</SelectItem>
        <SelectItem value="svelte">Svelte</SelectItem>
      </SelectContent>
    </Select>
  );
}

const FRAMEWORKS = ["React", "Vue", "Svelte", "Solid"];

/**
 * The real component, not a look-alike. It starts with a selection rather
 * than a placeholder because `ComboboxTrigger`'s props are derived from
 * `ComboboxInput`'s unresolved default generic, which admits `aria-*` but not
 * native input attributes such as `placeholder`. A selected value is the
 * better demonstration anyway: it exercises `displayValue` as well as the
 * filtering.
 */
function ComboboxDemo() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>("React");

  const matches = query
    ? FRAMEWORKS.filter((f) => f.toLowerCase().includes(query.toLowerCase()))
    : FRAMEWORKS;

  return (
    <Combobox
      value={selected}
      onChange={setSelected}
      onClose={() => setQuery("")}
    >
      <ComboboxTrigger
        className="h-9 text-sm"
        aria-label="Framework"
        // Same unresolved generic: the item arrives as `unknown`, so narrow
        // it rather than assert it.
        displayValue={(value) => (typeof value === "string" ? value : "")}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ComboboxContent>
        {matches.map((framework) => (
          <ComboboxItem key={framework} value={framework}>
            {framework}
          </ComboboxItem>
        ))}
      </ComboboxContent>
    </Combobox>
  );
}

function SwitchDemo() {
  const [enabled, setEnabled] = useState(true);
  return <Switch checked={enabled} onChange={setEnabled} />;
}

function CheckboxDemo() {
  const [checked, setChecked] = useState(true);
  return (
    <div className="flex items-center gap-2">
      <Checkbox checked={checked} onChange={setChecked} />
      <Label className="text-sm">Accept terms</Label>
    </div>
  );
}

function TooltipDemo() {
  return (
    <Tooltip>
      <TooltipTrigger className="rounded-md border px-3 py-1.5 text-sm">
        Hover me
      </TooltipTrigger>
      <TooltipContent>Tooltip content</TooltipContent>
    </Tooltip>
  );
}

function AlertDemo() {
  return (
    <div className="w-full space-y-2">
      <Alert variant="success" className="px-3 py-2">
        <AlertTitle className="text-sm">Changes saved</AlertTitle>
        <AlertDescription className="text-xs">
          Your edits are live.
        </AlertDescription>
      </Alert>
      <Alert variant="danger" className="px-3 py-2">
        <AlertTitle className="text-sm">Upload failed</AlertTitle>
        <AlertDescription className="text-xs">
          The file is larger than 5 MB.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function ProgressDemo() {
  const [value, setValue] = useState(40);
  return (
    <div className="w-full space-y-3">
      <Progress value={value} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-fd-muted-foreground">{value}%</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setValue((current) => (current >= 100 ? 0 : current + 20))}
        >
          Advance
        </Button>
      </div>
    </div>
  );
}

function RadioGroupDemo() {
  const [value, setValue] = useState("comfortable");
  return (
    <RadioGroup value={value} onChange={setValue}>
      <RadioGroupItem value="comfortable">Comfortable</RadioGroupItem>
      <RadioGroupItem value="compact">Compact</RadioGroupItem>
    </RadioGroup>
  );
}

function SliderDemo() {
  const [value, setValue] = useState(50);
  return (
    <div className="w-full space-y-2">
      <Slider
        aria-label="Volume"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
      />
      <div className="text-center text-xs text-fd-muted-foreground">{value}</div>
    </div>
  );
}

function TextareaDemo() {
  const [value, setValue] = useState("");
  return (
    <div className="w-full space-y-1">
      <Textarea
        aria-label="Message"
        placeholder="Write a message..."
        maxLength={120}
        className="min-h-16 text-sm"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="text-right text-xs text-fd-muted-foreground">
        {value.length} / 120
      </div>
    </div>
  );
}
