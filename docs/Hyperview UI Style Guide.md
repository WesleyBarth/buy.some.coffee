# Hyperview UI Framework Assay and Style Guide

This guide is the agent-facing reference for consuming `@hyperview/ui`. It describes the framework shape, public API, visual rules, and composition patterns visible in the source and playground.

## Framework Assay

Hyperview UI is a compact React component library for operational application screens: app shells, navigation, panels, forms, tables, dashboards, and dense control surfaces. Components are intentionally thin. Most primitives wrap native HTML elements, add `hv-*` classes, expose regular React DOM props, and rely on CSS tokens for the visual system.

The framework favors:

- Dense, scannable application interfaces over marketing pages.
- Token-driven theming through `--hv-*` CSS variables.
- Native controls where possible, with Radix primitives for overlays, disclosure, tabs, and selection controls.
- Composition through small layout helpers (`Stack`, `Inline`, `DashboardGrid`) instead of page-specific components.
- Accessibility defaults such as `aria-label`, `aria-current`, `aria-invalid`, `aria-pressed`, `role="toolbar"`, and `role="alert"` where the component can infer them.

The library does not own routing, data fetching, form state, table sorting, icons, or validation logic. Consumers provide those behaviors and compose the exported primitives around them.

## Installation and Setup

Import components from the package root and import the stylesheet once at the application boundary.

```tsx
import { AppShell, Button, Panel, Stack, Text } from "@hyperview/ui";
import "@hyperview/ui/styles.css";
```

To enable dark mode, set `data-hv-theme="dark"` on an ancestor, usually `document.documentElement`.

```tsx
document.documentElement.dataset.hvTheme = "dark";
```

Override theme variables in app CSS after importing `@hyperview/ui/styles.css`.

```css
:root {
  --hv-color-accent: #24b47e;
  --hv-radius-md: 0.375rem;
}
```

## Design Language

Use Hyperview UI for product and data workflows. Screens should feel quiet, utilitarian, and built for repeated use.

- Prefer `Panel`, `TableFrame`, and dashboard grids for grouped operational content.
- Keep cards for repeated or self-contained items. Do not nest cards inside cards.
- Use `Toolbar`, `ToolbarGroup`, `Button`, and `IconButton` for commands.
- Use `Field`, `Label`, `FieldHint`, and `FieldError` around form controls.
- Use `Text` for typography when tone, size, or semantic tag needs to be consistent.
- Use icons inside command controls when the action benefits from quick recognition.
- Avoid custom spacing constants when a `Stack`, `Inline`, or CSS token can express the layout.

## Tokens

CSS variables live in `src/styles/theme.css`. The exported TypeScript token maps are intentionally small:

| Token map | Values | CSS variables |
| --- | --- | --- |
| `space` | `none`, `xs`, `sm`, `md`, `lg`, `xl` | `--hv-space-0`, `--hv-space-1`, `--hv-space-2`, `--hv-space-4`, `--hv-space-6`, `--hv-space-8` |
| `radius` | `xs`, `sm`, `md`, `lg`, `pill` | `--hv-radius-xs`, `--hv-radius-sm`, `--hv-radius-md`, `--hv-radius-lg`, `--hv-radius-pill` |

Important CSS token groups:

- Color: `--hv-color-canvas`, `--hv-color-surface`, `--hv-color-surface-subtle`, `--hv-color-text`, `--hv-color-text-muted`, `--hv-color-border`, `--hv-color-border-strong`, `--hv-color-accent`, `--hv-color-danger`.
- Workspace and panels: `--hv-workspace-background`, `--hv-panel-background`, `--hv-panel-background-subtle`, `--hv-panel-background-raised`.
- Controls: `--hv-control-background`, `--hv-control-background-hover`.
- Tables: `--hv-table-background`, `--hv-table-header-background`, `--hv-table-row-background`, `--hv-table-row-hover`, `--hv-table-row-selected`, `--hv-table-border`, `--hv-table-text`.
- Typography: `--hv-font-sans`, `--hv-font-mono`, `--hv-font-size-xs` through `--hv-font-size-2xl`, `--hv-line-height-tight`, `--hv-line-height-normal`.
- Motion and elevation: `--hv-transition-fast`, `--hv-shadow-sm`, `--hv-shadow-md`.

## Public API

All components accept `className` and the relevant native HTML attributes unless noted.

### Application Structure

| Component | Purpose | Key props |
| --- | --- | --- |
| `AppShell` | Page frame with optional header, footer, left sidebar, right sidebar, and main content. | `header`, `footer`, `leftSidebar`, `rightSidebar`, `children` |
| `Header` | Top application bar. | `brand`, `actions`, `sticky`, `children` |
| `Footer` | Bottom application bar. | `start`, `end`, `children` |
| `Sidebar` | Left or right sidebar. | `side: "left" | "right"`, `width`, `header`, `footer`, `children` |
| `Nav` | Labeled navigation container. | `direction: "vertical" | "horizontal"`, `label`, `children` |
| `NavItem` | Anchor-style navigation item. | `active`, anchor props, `children` |
| `Breadcrumbs` | Breadcrumb navigation landmark. | `label`, `children` |
| `BreadcrumbItem` | Breadcrumb list item. | list item props |
| `BreadcrumbLink` | Breadcrumb anchor with current-page support. | `current`, anchor props |
| `Separator` | Horizontal or vertical divider. | `orientation`, `decorative` |
| `VisuallyHidden` | Screen-reader-visible hidden text. | `children` |

Use `NavItem active` for the current page or section. It sets `aria-current="page"`.

```tsx
<AppShell
  header={<Header brand={<Text weight="bold">Hyperview</Text>} />}
  leftSidebar={
    <Sidebar header={<Text size="sm" tone="muted">Library</Text>}>
      <Nav label="Library">
        <NavItem href="/overview" active>Overview</NavItem>
      </Nav>
    </Sidebar>
  }
>
  <Panel>...</Panel>
</AppShell>
```

### Layout

| Component | Purpose | Key props |
| --- | --- | --- |
| `Stack` | Vertical flex layout. | `gap: "none" | "xs" | "sm" | "md" | "lg" | "xl"`, `align` |
| `Inline` | Horizontal flex layout. | `gap`, `align`, `justify`, `wrap` |
| `DashboardGrid` | Responsive CSS grid for dashboards. | `columns: 1 | 2 | 3 | 4 | 6 | 12`, `gap` |
| `DashboardGridItem` | Grid item with responsive span. | `span: number | { base?, sm?, md?, lg? }` |
| `DashboardMetric` | Metric card for dashboards. | `label`, `value`, `change`, `description`, `actions`, `tone` |

`DashboardGridItem` spans resolve at breakpoints: base, 560px (`sm`), 860px (`md`), and 1120px (`lg`). On viewports below 560px, items span the full grid.

```tsx
<DashboardGrid>
  <DashboardGridItem span={{ base: 12, sm: 6, lg: 3 }}>
    <DashboardMetric label="Revenue" value="$128.4k" change="+12.8%" tone="positive" />
  </DashboardGridItem>
</DashboardGrid>
```

### Typography and Surfaces

| Component | Purpose | Key props |
| --- | --- | --- |
| `Text` | Tokenized text with semantic element override. | `as`, `size`, `tone`, `weight`, `align` |
| `Avatar` | Circular user/workspace image or fallback. | `src`, `alt`, `fallback`, `size` |
| `AvatarGroup` | Overlapped avatar stack. | `children` |
| `Badge` | Compact inline status marker. | `tone`, `size` |
| `Alert` | Block-level callout for status, warning, or error feedback. | `tone`, `title`, `actions` |
| `EmptyState` | Centered empty-region message with optional icon and actions. | `title`, `description`, `actions`, `icon`, `size` |
| `Progress` | Linear progress indicator. | `value`, `max`, `label`, `showValue`, `tone` |
| `Skeleton` | Loading placeholder block. | `shape`, `width`, `height`, `radius`, `animated` |
| `SkeletonText` | Multi-line loading text placeholder. | `lines`, `animated` |
| `Card` | Simple framed content block. | `padding: "none" | "sm" | "md" | "lg"` |
| `Panel` | Section frame for workflows and grouped content. | `flush`, `children` |
| `PanelHeader` | Panel title area. | `heading`, `description`, `actions`, `children` |
| `PanelBody` | Panel content area. | `padding: "none" | "sm" | "md" | "lg"` |
| `PanelFooter` | Panel action/footer area. | `align: "start" | "between" | "end"` |
| `Accordion` | Radix-backed disclosure group. | `type`, `value`, `defaultValue`, `collapsible` |
| `AccordionItem` | Accordion item wrapper. | `value` |
| `AccordionTrigger` | Accordion disclosure button. | trigger props |
| `AccordionContent` | Accordion collapsible content. | content props |
| `Tabs` | Radix-backed tab root. | Radix root props |
| `TabsList` | Tab trigger row. | `density: "compact" | "comfortable"` |
| `TabsTrigger` | Individual tab trigger. | Radix trigger props, requires `value` |
| `TabsContent` | Tab panel. | `padding: "none" | "sm" | "md" | "lg"`, requires `value` |

`Text` supports sizes `xs`, `sm`, `md`, `lg`, `xl`, `2xl`; tones `default`, `muted`, `accent`, `danger`; and weights `regular`, `medium`, `semibold`, `bold`.

`Badge` tones are `neutral`, `accent`, `success`, `warning`, and `danger`. Use badges for compact labels inside tables, cards, metrics, and toolbar summaries.

`Alert` uses `role="alert"` for `tone="danger"` and `role="status"` otherwise unless a role is provided. Use alerts for inline feedback that should remain visible with nearby content.

```tsx
<Panel>
  <PanelHeader
    heading={<Text weight="semibold">Workspace settings</Text>}
    description="Persistent settings for this workspace."
    actions={<Button size="sm">Save</Button>}
  />
  <PanelBody>
    <Stack gap="md">...</Stack>
  </PanelBody>
</Panel>

<Alert tone="warning" title="Production deploy blocked">
  Add a service token before running production deploys.
</Alert>

<Badge tone="success">Healthy</Badge>

<AvatarGroup>
  <Avatar fallback="WB" />
  <Avatar fallback="HV" />
</AvatarGroup>

<EmptyState
  title="No deployments"
  description="Adjust filters or create the first deployment."
  actions={<Button size="sm">Create deployment</Button>}
/>

<SkeletonText lines={3} />

<Progress label="Import progress" value={64} showValue />

<Accordion type="single" collapsible>
  <AccordionItem value="retention">
    <AccordionTrigger>Retention policy</AccordionTrigger>
    <AccordionContent>
      <Text size="sm" tone="muted">Audit events are retained for 90 days.</Text>
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

Use `Tabs` to switch between related views within the same workflow. Keep each trigger short enough to scan in a dense toolbar row.

```tsx
<Tabs defaultValue="activity">
  <TabsList aria-label="Workspace views">
    <TabsTrigger value="activity">Activity</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="activity" padding="md">
    <TableFrame>...</TableFrame>
  </TabsContent>
  <TabsContent value="settings" padding="md">
    <Panel>...</Panel>
  </TabsContent>
</Tabs>
```

### Commands

| Component | Purpose | Key props |
| --- | --- | --- |
| `Button` | Text or icon+text command button. | `variant`, `size`, `fullWidth` |
| `IconButton` | Icon-only command button. | `label`, `active`, `variant`, `size` |
| `Toolbar` | Command group container. | `density: "compact" | "comfortable"` |
| `ToolbarGroup` | Logical command cluster. | `separated` |
| `CommandBar` | Keyboard-first command palette with typed parameters and async result handling. | `commands`, `context`, `open`, `onOpenChange`, `placeholder` |

`Button` variants are `solid`, `soft`, `outline`, `ghost`, and `danger`. Sizes are `sm`, `md`, and `lg`.

`IconButton` variants are `ghost`, `outline`, and `soft`. Always provide a concise `label`; it is used for `aria-label` and as the default `title`.

Use `CommandBar` for global command workflows, not ordinary page forms. Commands own their typed parameter definitions, but consumers still own the action behavior, routing, permission checks, and result copy.

```tsx
<Toolbar aria-label="Editor actions">
  <ToolbarGroup>
    <IconButton label="Bold" active>
      <Bold />
    </IconButton>
    <IconButton label="Italic">
      <Italic />
    </IconButton>
  </ToolbarGroup>
  <ToolbarGroup separated>
    <Button size="sm" variant="outline">Export</Button>
  </ToolbarGroup>
</Toolbar>
```

```tsx
<CommandBar
  commands={[
    {
      id: "open-project",
      title: "Open project",
      group: "Navigation",
      params: [
        {
          name: "projectId",
          label: "Project",
          type: "select",
          required: true,
          options: projects.map((project) => ({
            label: project.name,
            value: project.id
          }))
        }
      ],
      run: ({ params }) => {
        router.navigate(`/projects/${params.projectId}`);
        return { title: "Project opened" };
      }
    }
  ]}
  context={{ userId: currentUser.id }}
  placeholder="Run a command..."
/>
```

### Forms

| Component | Purpose | Key props |
| --- | --- | --- |
| `Field` | Vertical field wrapper. | `children` |
| `Label` | Label with optional marker. | `htmlFor`, `optional`, `children` |
| `FieldHint` | Secondary field help. | `children` |
| `FieldError` | Validation message. | `children` |
| `Combobox` | Single-select searchable option picker. | `value`, `options`, `onValueChange`, `label`, `placeholder` |
| `Input` | Native input. | `inputSize: "sm" | "md" | "lg"`, `invalid` |
| `Select` | Native select. | `selectSize: "sm" | "md" | "lg"`, `invalid` |
| `Textarea` | Native textarea. | `textareaSize: "sm" | "md" | "lg"`, `invalid` |
| `Checkbox` | Label-wrapped checkbox. | `children`, `description`, checkbox props |
| `Switch` | Label-wrapped checkbox styled as switch. | `children`, `description`, checkbox props |
| `RadioGroup` | Radix-backed radio group. | `value`, `defaultValue`, `onValueChange` |
| `RadioGroupItem` | Labeled radio option. | `value`, `description`, `children` |
| `SegmentedControl` | Compact single-select mode switch. | `value`, `options`, `onValueChange`, `label` |

`Input`, `Select`, and `Textarea` map `invalid` to `aria-invalid` unless `aria-invalid` is explicitly provided.

```tsx
<Field>
  <Label htmlFor="project-name">Workspace name</Label>
  <Input id="project-name" placeholder="northstar-console" />
  <FieldHint>Use a short name that scans well in navigation.</FieldHint>
</Field>

<Field>
  <Label>Environment</Label>
  <Combobox
    label="Environment"
    value={environment}
    onValueChange={setEnvironment}
    options={[
      { label: "Production", value: "production" },
      { label: "Preview", value: "preview" },
      { label: "Development", value: "development" }
    ]}
  />
</Field>

<Field>
  <Label htmlFor="api-key">Service token</Label>
  <Input id="api-key" invalid placeholder="Missing deployment token" />
  <FieldError>A service token is required before production deploys can run.</FieldError>
</Field>

<RadioGroup defaultValue="compact">
  <RadioGroupItem value="compact" description="More rows per viewport.">Compact</RadioGroupItem>
  <RadioGroupItem value="comfortable" description="More breathing room for review.">Comfortable</RadioGroupItem>
</RadioGroup>

<SegmentedControl
  label="Time range"
  value={range}
  onValueChange={setRange}
  options={[
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
    { label: "90d", value: "90d" }
  ]}
/>
```

### Overlays

Dropdown menu, popover, and tooltip are Radix-backed. Use `asChild` on triggers when wrapping Hyperview buttons.

| Component | Purpose | Key props |
| --- | --- | --- |
| `DropdownMenu` | Radix dropdown root. | Radix root props |
| `DropdownMenuTrigger` | Dropdown trigger. | Radix trigger props, commonly `asChild` |
| `DropdownMenuContent` | Portalized menu content. | `align`, `sideOffset`, Radix content props |
| `DropdownMenuItem` | Menu item. | `inset`, Radix item props |
| `DropdownMenuCheckboxItem` | Checkable menu item. | Radix checkbox item props |
| `DropdownMenuLabel` | Menu label. | Radix label props |
| `DropdownMenuSeparator` | Menu separator. | Radix separator props |
| `Dialog` | Radix dialog root. | Radix root props |
| `DialogTrigger` | Dialog trigger. | Radix trigger props, commonly `asChild` |
| `DialogContent` | Portalized modal surface with overlay. | `overlayClassName`, Radix content props |
| `DialogHeader` | Dialog title/action area. | `actions`, `children` |
| `DialogTitle` | Accessible dialog title. | Radix title props |
| `DialogDescription` | Accessible dialog description. | Radix description props |
| `DialogBody` | Scrollable dialog content area. | `padding: "none" | "sm" | "md" | "lg"` |
| `DialogFooter` | Dialog action/footer area. | `align: "start" | "between" | "end"` |
| `DialogClose` | Dialog close control. | Radix close props, commonly `asChild` |
| `Popover` | Radix popover root. | Radix root props |
| `PopoverTrigger` | Popover trigger. | Radix trigger props, commonly `asChild` |
| `PopoverContent` | Portalized popover body. | `align`, `sideOffset`, Radix content props |
| `PopoverClose` | Popover close control. | Radix close props |
| `Tooltip` | Trigger plus portalized tooltip content. | `content`, `side`, `className`, `children` |
| `TooltipProvider` | Radix tooltip provider. | Radix provider props |

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button size="sm" variant="outline">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Project</DropdownMenuLabel>
    <DropdownMenuItem>Open dashboard</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuCheckboxItem checked>Show archived</DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Use `Dialog` for modal workflows that require focused user decisions. Always include `DialogTitle`; include `DialogDescription` when the title alone does not explain the effect.

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="danger">Delete workspace</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete workspace</DialogTitle>
      <DialogDescription>This permanently removes the workspace and its saved views.</DialogDescription>
    </DialogHeader>
    <DialogBody>
      <Text size="sm">This action cannot be undone.</Text>
    </DialogBody>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="ghost">Cancel</Button>
      </DialogClose>
      <Button variant="danger">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

For checkbox items that should not close the menu when toggled, prevent the select event:

```tsx
<DropdownMenuCheckboxItem
  checked={enabled}
  onCheckedChange={setEnabled}
  onSelect={(event) => event.preventDefault()}
>
  Enabled
</DropdownMenuCheckboxItem>
```

### Feedback and Loading

Use `ToastProvider` once near the app root when the app needs viewport-level success, status, warning, or error messaging. The default toast position is `bottom-right`, matching Hyperview's preferred lower-right notification stack.

| Component or hook | Purpose | Key props or methods |
| --- | --- | --- |
| `ToastProvider` | Provides toast state and optionally renders the viewport. | `position`, `defaultDuration`, `maxToasts`, `renderViewport` |
| `useToast` | Imperative toast API for actions and async workflows. | `showToast`, `success`, `warning`, `danger`, `neutral`, `dismissToast`, `clearToasts` |
| `ToastViewport` | Custom-rendered notification stack. | `position`, `toasts`, `onDismiss` |
| `Toast` | Individual toast item. | `toast`, `onDismiss` |
| `LoadingSpinner` | Compact inline loading indicator. | `size`, `label` |
| `LoadingState` | Informative loading row/block for panels and empty regions. | `label`, `description`, `size` |
| `LoadingOverlay` | Local content or full viewport loading screen. | `active`, `scope: "content" | "viewport"`, `label`, `description` |

Use toasts for short-lived feedback after an action completes. Keep copy concise and actionable. Use `duration={0}` only for messages that must remain until dismissed.

```tsx
function AppRoot() {
  return (
    <ToastProvider position="bottom-right" defaultDuration={5000}>
      <App />
    </ToastProvider>
  );
}

function SaveButton() {
  const toast = useToast();

  return (
    <Button
      onClick={() =>
        toast.success({
          title: "Settings saved",
          description: "Production alerts are now enabled."
        })
      }
    >
      Save
    </Button>
  );
}
```

Use loading scope based on what is blocked: `LoadingSpinner` for a single control, `LoadingOverlay` with the default `content` scope for a panel or region, and `scope="viewport"` only when the whole visible app is waiting.

```tsx
<LoadingOverlay active={isRefreshing} label="Refreshing table" description="Fetching the latest deployments.">
  <TableFrame>...</TableFrame>
</LoadingOverlay>

<LoadingOverlay active={isBooting} scope="viewport" label="Loading workspace" />
```

### Tables

| Component | Purpose | Key props |
| --- | --- | --- |
| `TableFrame` | Table container with optional heading, toolbar, footer, density, and variant. | `variant: "card" | "fill"`, `density: "compact" | "comfortable"`, `heading`, `toolbar`, `footer` |
| `TableToolbar` | Toolbar area optimized for table controls. | `children` |
| `Table` | Native table wrapper. | table props |
| `TableHead` | `thead` wrapper. | section props |
| `TableBody` | `tbody` wrapper. | section props |
| `TableRow` | `tr` wrapper. | `selected` |
| `TableHeaderCell` | `th` wrapper. | `align`, `truncate` |
| `TableSortableHeaderCell` | Sort button inside a header cell. | `direction: "asc" | "desc" | null`, `onSort`, `align`, `truncate` |
| `TableCell` | `td` wrapper. | `align`, `muted`, `truncate` |
| `TableEmptyRow` | Standard empty table state row. | `colSpan`, `title`, `description`, `actions` |
| `TableLoadingRow` | Standard loading table state row. | `colSpan`, `label`, `description` |
| `TableFooter` | Footer layout helper. | `children` |
| `TablePaginationFooter` | Footer with summary and controlled pagination. | `summary`, `page`, `totalPages`, `onPageChange` |
| `Pagination` | Controlled pagination navigation for tables and lists. | `page`, `totalPages`, `onPageChange`, `siblingCount` |

Use `variant="card"` for embedded tables and `variant="fill"` for full-height data browser surfaces. Use `density="comfortable"` for dashboard summaries and `density="compact"` for data-heavy screens.

```tsx
<TableFrame
  density="compact"
  heading="workspace.deployments"
  toolbar={<TableToolbar>{/* search, filters, actions */}</TableToolbar>}
  footer={<TableFooter><Text size="sm" tone="muted">5 records</Text></TableFooter>}
  variant="fill"
>
  <Table aria-label="Accounts">
    <TableHead>
      <TableRow>
        <TableSortableHeaderCell direction="asc" onSort={() => setSort("id")}>id</TableSortableHeaderCell>
        <TableHeaderCell>name</TableHeaderCell>
        <TableHeaderCell align="right">balance</TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow selected>
        <TableCell truncate>0b46a205-2049-4753-a028-7b8949e00ec9</TableCell>
        <TableCell>Primary Checking</TableCell>
        <TableCell align="right">$2,840.12</TableCell>
      </TableRow>
    </TableBody>
  </Table>
  <TablePaginationFooter summary="11-20 of 82 rows" page={2} totalPages={8} onPageChange={setPage} />
</TableFrame>
```

## Agent Consumption Rules

When generating UI with this framework:

1. Import `@hyperview/ui/styles.css` exactly once at the app boundary.
2. Compose screens from exported primitives before adding custom CSS.
3. Use `AppShell`, `Header`, `Sidebar`, `Footer`, and `Nav` for application chrome.
4. Use `Panel` for grouped workflows; use `Card` only for small self-contained blocks.
5. Use `Stack` and `Inline` for ordinary spacing. Prefer token gaps over custom margins.
6. Use `TableFrame` and table subcomponents for data grids. Put search, filter, sort, and export controls in `TableToolbar`.
7. Use `Field` plus `Label` for every visible form control.
8. Set `invalid` and render `FieldError` when a field has a validation error.
9. Use `IconButton` only with a meaningful `label`.
10. Use `DropdownMenuTrigger asChild` and `PopoverTrigger asChild` when the trigger is a `Button` or `IconButton`.
11. Keep business logic, routing, state, filtering, and sorting outside the UI components.
12. Prefer CSS variable overrides for theme changes instead of editing component CSS.

## Extension Guidance

When adding new components to the framework:

- Export the component and its prop type from `src/index.ts`.
- Add the component stylesheet to `src/styles/global.css`.
- Prefix classes with `hv-`.
- Extend native HTML attributes where practical.
- Use token variables from `theme.css`; avoid hard-coded colors except for narrowly scoped semantic values.
- Preserve accessibility defaults in the component contract.
- Add a playground example that shows the component in a realistic workflow.
