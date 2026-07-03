import { useEffect, useState } from 'react'
import {
  Button,
  Checkbox,
  IconButton,
  Inline,
  Input,
  Panel,
  PanelBody,
  PanelHeader,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Toolbar,
  ToolbarGroup,
} from '@hyperview/ui'
import { ChevronDown, Plus, Save } from 'lucide-react'
import { categoryAndDescendantIds, resolveCategoryRole } from '../../domain/categories'
import type { Category, Tag, TransactionRole } from '../../domain/types'

export type CategoryFormState = {
  name: string
  color: string
  type: Category['type']
  parentId: string
  role: TransactionRole | ''
  budgetable: boolean
}

export type TagFormState = {
  name: string
  color: string
}

type CategoriesViewProps = {
  categories: Category[]
  categoryForm: CategoryFormState
  onAddCategory: (event: React.FormEvent<HTMLFormElement>) => void
  onAddTag: (event: React.FormEvent<HTMLFormElement>) => void
  onCategoryFormChange: (form: CategoryFormState) => void
  onTagFormChange: (form: TagFormState) => void
  onUpdateCategory: (categoryId: string, patch: Partial<Category>) => void
  onUpdateTag: (tagId: string, patch: Partial<Tag>) => void
  tagForm: TagFormState
  tags: Tag[]
}

export function CategoriesView({
  categories,
  categoryForm,
  onAddCategory,
  onAddTag,
  onCategoryFormChange,
  onTagFormChange,
  onUpdateCategory,
  onUpdateTag,
  tagForm,
  tags,
}: CategoriesViewProps) {
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false)

  return (
    <Stack gap="sm">
      <Panel>
        <PanelHeader
          actions={
            <Toolbar density="compact">
              <ToolbarGroup>
                <Text size="sm" tone="muted">Budgets use categories</Text>
              </ToolbarGroup>
              <ToolbarGroup separated>
                <IconButton
                  aria-expanded={!categoriesCollapsed}
                  label={categoriesCollapsed ? 'Expand categories table' : 'Collapse categories table'}
                  onClick={() => setCategoriesCollapsed(!categoriesCollapsed)}
                  size="sm"
                >
                  <ChevronDown size={16} />
                </IconButton>
              </ToolbarGroup>
            </Toolbar>
          }
          heading="Spending categories"
        />
        <PanelBody padding="none">
        {!categoriesCollapsed && (
          <Stack gap="none">
            <form onSubmit={onAddCategory}>
              <Inline align="end" gap="sm" wrap>
                <Input
                  aria-label="Category name"
                  inputSize="sm"
                  onChange={(event) => onCategoryFormChange({ ...categoryForm, name: event.target.value })}
                  placeholder="Category name"
                  value={categoryForm.name}
                />
                <Select
                  aria-label="Parent category"
                  onChange={(event) => onCategoryFormChange({ ...categoryForm, parentId: event.target.value })}
                  selectSize="sm"
                  value={categoryForm.parentId}
                >
                  <option value="">No parent</option>
                  {categories
                    .filter((category) => !category.isArchived)
                    .map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                </Select>
                <Select
                  aria-label="Category type"
                  onChange={(event) =>
                    onCategoryFormChange({ ...categoryForm, type: event.target.value as Category['type'] })
                  }
                  selectSize="sm"
                  value={categoryForm.type}
                >
                  <option value="expense">expense</option>
                  <option value="income">income</option>
                  <option value="transfer">transfer</option>
                </Select>
                <Select
                  aria-label="Category role"
                  onChange={(event) =>
                    onCategoryFormChange({ ...categoryForm, role: event.target.value as TransactionRole | '' })
                  }
                  selectSize="sm"
                  value={categoryForm.role}
                >
                  <option value="">inherit role</option>
                  {transactionRoleOptions.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </Select>
                <Input
                  aria-label="Category color"
                  inputSize="sm"
                  onChange={(event) => onCategoryFormChange({ ...categoryForm, color: event.target.value })}
                  type="color"
                  value={categoryForm.color}
                />
                <Checkbox
                  checked={categoryForm.budgetable}
                  onChange={(event) => onCategoryFormChange({ ...categoryForm, budgetable: event.target.checked })}
                >
                  Budgetable
                </Checkbox>
                <Button size="sm" type="submit">
                  <Plus size={18} />
                  Add
                </Button>
              </Inline>
            </form>
            <TableFrame density="compact">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Parent</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Role</TableHeaderCell>
                    <TableHeaderCell>Color</TableHeaderCell>
                    <TableHeaderCell>Budgetable</TableHeaderCell>
                    <TableHeaderCell>Archived</TableHeaderCell>
                    <TableHeaderCell aria-label="Actions" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category) => (
                    <CategoryEditor
                      category={category}
                      categories={categories}
                      key={category.id}
                      onUpdate={(patch) => onUpdateCategory(category.id, patch)}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableFrame>
          </Stack>
        )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          actions={
            <Toolbar density="compact">
              <ToolbarGroup>
                <Text size="sm" tone="muted">Cross-cutting filters</Text>
              </ToolbarGroup>
            </Toolbar>
          }
          heading="Tags"
        />
        <PanelBody padding="none">
        <form onSubmit={onAddTag}>
          <Inline align="end" gap="sm" wrap>
            <Input
              aria-label="Tag name"
              inputSize="sm"
              onChange={(event) => onTagFormChange({ ...tagForm, name: event.target.value })}
              placeholder="Tag name"
              value={tagForm.name}
            />
            <Input
              aria-label="Tag color"
              inputSize="sm"
              onChange={(event) => onTagFormChange({ ...tagForm, color: event.target.value })}
              type="color"
              value={tagForm.color}
            />
            <Button size="sm" type="submit">
              <Plus size={18} />
              Add
            </Button>
          </Inline>
        </form>
        <TableFrame density="compact">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Color</TableHeaderCell>
                <TableHeaderCell>Archived</TableHeaderCell>
                <TableHeaderCell aria-label="Actions" />
              </TableRow>
            </TableHead>
            <TableBody>
              {tags.map((tag) => (
                <TagEditor tag={tag} key={tag.id} onUpdate={(patch) => onUpdateTag(tag.id, patch)} />
              ))}
            </TableBody>
          </Table>
        </TableFrame>
        </PanelBody>
      </Panel>
    </Stack>
  )
}

const transactionRoleOptions: Array<{ label: string; value: TransactionRole }> = [
  { label: 'external expense', value: 'external_expense' },
  { label: 'external income', value: 'external_income' },
  { label: 'internal transfer', value: 'internal_transfer' },
  { label: 'credit card payment', value: 'credit_card_payment' },
  { label: 'balance adjustment', value: 'balance_adjustment' },
  { label: 'investment movement', value: 'investment_movement' },
  { label: 'ignore', value: 'ignore' },
]

function CategoryEditor({
  categories,
  category,
  onUpdate,
}: {
  categories: Category[]
  category: Category
  onUpdate: (patch: Partial<Category>) => void
}) {
  const invalidParentIds = categoryAndDescendantIds(category, categories)
  const inheritedRole = resolveCategoryRole({ ...category, role: undefined }, categories)
  const [draft, setDraft] = useState<{
    name: string
    color: string
    type: NonNullable<Category['type']>
    parentId: string
    role: TransactionRole | ''
    budgetable: boolean
    isArchived: boolean
  }>({
    name: category.name,
    color: category.color,
    type: category.type ?? 'expense',
    parentId: category.parentId ?? '',
    role: category.role ?? '',
    budgetable: Boolean(category.budgetable),
    isArchived: Boolean(category.isArchived),
  })

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDraft({
        name: category.name,
        color: category.color,
        type: category.type ?? 'expense',
        parentId: category.parentId ?? '',
        role: category.role ?? '',
        budgetable: Boolean(category.budgetable),
        isArchived: Boolean(category.isArchived),
      })
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [category])

  function saveCategory() {
    if (!draft.name.trim()) return
    onUpdate({
      name: draft.name.trim(),
      color: draft.color,
      type: draft.type,
      parentId: draft.parentId || undefined,
      role: draft.role || undefined,
      budgetable: draft.budgetable,
      isArchived: draft.isArchived,
    })
  }

  return (
    <TableRow selected={draft.isArchived}>
      <TableCell>
        <Input
          aria-label="Category name"
          inputSize="sm"
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          value={draft.name}
        />
      </TableCell>
      <TableCell>
        <Select
          aria-label={`${draft.name} parent category`}
          onChange={(event) => setDraft({ ...draft, parentId: event.target.value })}
          selectSize="sm"
          value={draft.parentId}
        >
          <option value="">No parent</option>
          {categories
            .filter((item) => !item.isArchived && !invalidParentIds.has(item.id))
            .map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
        </Select>
      </TableCell>
      <TableCell>
        <Select
          aria-label="Category type"
          onChange={(event) => setDraft({ ...draft, type: event.target.value as NonNullable<Category['type']> })}
          selectSize="sm"
          value={draft.type}
        >
          <option value="expense">expense</option>
          <option value="income">income</option>
          <option value="transfer">transfer</option>
        </Select>
      </TableCell>
      <TableCell>
        <Stack gap="xs">
          <Select
            aria-label={`${draft.name} category role`}
            onChange={(event) => setDraft({ ...draft, role: event.target.value as TransactionRole | '' })}
            selectSize="sm"
            value={draft.role}
          >
            <option value="">inherit role</option>
            {transactionRoleOptions.map((role) => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </Select>
          {!draft.role && inheritedRole ? (
            <Text size="xs" tone="muted">inherited: {roleLabel(inheritedRole)}</Text>
          ) : null}
        </Stack>
      </TableCell>
      <TableCell>
        <Input
          aria-label={`${draft.name} color`}
          inputSize="sm"
          onChange={(event) => setDraft({ ...draft, color: event.target.value })}
          type="color"
          value={draft.color}
        />
      </TableCell>
      <TableCell>
        <Checkbox
          checked={draft.budgetable}
          onChange={(event) => setDraft({ ...draft, budgetable: event.target.checked })}
        >
          Budgetable
        </Checkbox>
      </TableCell>
      <TableCell>
        <Checkbox
          checked={draft.isArchived}
          onChange={(event) => setDraft({ ...draft, isArchived: event.target.checked })}
        >
          Archived
        </Checkbox>
      </TableCell>
      <TableCell align="right">
        <IconButton label="Save category" onClick={saveCategory} size="sm">
          <Save size={18} />
        </IconButton>
      </TableCell>
    </TableRow>
  )
}

function roleLabel(role: TransactionRole) {
  return transactionRoleOptions.find((option) => option.value === role)?.label ?? role
}

function TagEditor({ tag, onUpdate }: { tag: Tag; onUpdate: (patch: Partial<Tag>) => void }) {
  const [draft, setDraft] = useState({
    name: tag.name,
    color: tag.color,
    isArchived: Boolean(tag.isArchived),
  })

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDraft({ name: tag.name, color: tag.color, isArchived: Boolean(tag.isArchived) })
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [tag])

  function saveTag() {
    if (!draft.name.trim()) return
    onUpdate({ name: draft.name.trim(), color: draft.color, isArchived: draft.isArchived })
  }

  return (
    <TableRow selected={draft.isArchived}>
      <TableCell>
        <Input
          aria-label="Tag name"
          inputSize="sm"
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          value={draft.name}
        />
      </TableCell>
      <TableCell>
        <Input
          aria-label={`${draft.name} color`}
          inputSize="sm"
          onChange={(event) => setDraft({ ...draft, color: event.target.value })}
          type="color"
          value={draft.color}
        />
      </TableCell>
      <TableCell>
        <Checkbox
          checked={draft.isArchived}
          onChange={(event) => setDraft({ ...draft, isArchived: event.target.checked })}
        >
          Archived
        </Checkbox>
      </TableCell>
      <TableCell align="right">
        <IconButton label="Save tag" onClick={saveTag} size="sm">
          <Save size={18} />
        </IconButton>
      </TableCell>
    </TableRow>
  )
}
