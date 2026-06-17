import { useEffect, useState } from 'react'
import { ChevronDown, Plus, Save } from 'lucide-react'
import { clsx } from 'clsx'
import type { Category, Tag } from '../../domain/types'
import { Surface, Toolbar } from '../ui/Surface'

export type CategoryFormState = {
  name: string
  color: string
  type: Category['type']
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
    <section className="view-stack">
      <Surface
        className={clsx('taxonomy-surface', categoriesCollapsed && 'is-collapsed')}
        title="Spending categories"
        variant="table"
        actions={
          <Toolbar>
            <span>Budgets use categories</span>
            <button
              aria-expanded={!categoriesCollapsed}
              aria-label={categoriesCollapsed ? 'Expand categories table' : 'Collapse categories table'}
              className="icon-action taxonomy-collapse-toggle"
              onClick={() => setCategoriesCollapsed(!categoriesCollapsed)}
              title={categoriesCollapsed ? 'Expand categories table' : 'Collapse categories table'}
              type="button"
            >
              <ChevronDown size={16} />
            </button>
          </Toolbar>
        }
      >
        {!categoriesCollapsed && (
          <div className="taxonomy-body">
            <form className="taxonomy-form" onSubmit={onAddCategory}>
              <input
                className="table-input taxonomy-name-input"
                onChange={(event) => onCategoryFormChange({ ...categoryForm, name: event.target.value })}
                placeholder="Category name"
                value={categoryForm.name}
              />
              <select
                className="table-input taxonomy-type-input"
                onChange={(event) =>
                  onCategoryFormChange({ ...categoryForm, type: event.target.value as Category['type'] })
                }
                value={categoryForm.type}
              >
                <option value="expense">expense</option>
                <option value="income">income</option>
                <option value="transfer">transfer</option>
              </select>
              <input
                aria-label="Category color"
                onChange={(event) => onCategoryFormChange({ ...categoryForm, color: event.target.value })}
                type="color"
                value={categoryForm.color}
              />
              <label className="checkbox-label">
                <input
                  checked={categoryForm.budgetable}
                  onChange={(event) => onCategoryFormChange({ ...categoryForm, budgetable: event.target.checked })}
                  type="checkbox"
                />
                Budgetable
              </label>
              <button className="primary-action" type="submit">
                <Plus size={18} />
                Add
              </button>
            </form>
            <div className="taxonomy-list">
              <div className="taxonomy-editor taxonomy-editor-head" aria-hidden="true">
                <span>Name</span>
                <span>Type</span>
                <span>Color</span>
                <span>Budgetable</span>
                <span>Archived</span>
                <span></span>
              </div>
              {categories.map((category) => (
                <CategoryEditor
                  category={category}
                  key={category.id}
                  onUpdate={(patch) => onUpdateCategory(category.id, patch)}
                />
              ))}
            </div>
          </div>
        )}
      </Surface>

      <Surface
        className="taxonomy-surface"
        title="Tags"
        variant="table"
        actions={<Toolbar>Cross-cutting filters</Toolbar>}
      >
        <form className="taxonomy-form tag-form" onSubmit={onAddTag}>
          <input
            className="table-input taxonomy-name-input"
            onChange={(event) => onTagFormChange({ ...tagForm, name: event.target.value })}
            placeholder="Tag name"
            value={tagForm.name}
          />
          <input
            aria-label="Tag color"
            onChange={(event) => onTagFormChange({ ...tagForm, color: event.target.value })}
            type="color"
            value={tagForm.color}
          />
          <button className="primary-action" type="submit">
            <Plus size={18} />
            Add
          </button>
        </form>
        <div className="taxonomy-list">
          <div className="taxonomy-editor taxonomy-editor-head tag-editor" aria-hidden="true">
            <span>Name</span>
            <span>Color</span>
            <span>Archived</span>
            <span></span>
          </div>
          {tags.map((tag) => (
            <TagEditor tag={tag} key={tag.id} onUpdate={(patch) => onUpdateTag(tag.id, patch)} />
          ))}
        </div>
      </Surface>
    </section>
  )
}

function CategoryEditor({
  category,
  onUpdate,
}: {
  category: Category
  onUpdate: (patch: Partial<Category>) => void
}) {
  const [draft, setDraft] = useState({
    name: category.name,
    color: category.color,
    type: category.type ?? 'expense',
    budgetable: Boolean(category.budgetable),
    isArchived: Boolean(category.isArchived),
  })

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDraft({
        name: category.name,
        color: category.color,
        type: category.type ?? 'expense',
        budgetable: Boolean(category.budgetable),
        isArchived: Boolean(category.isArchived),
      })
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [category])

  function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.name.trim()) return
    onUpdate({
      name: draft.name.trim(),
      color: draft.color,
      type: draft.type,
      budgetable: draft.budgetable,
      isArchived: draft.isArchived,
    })
  }

  return (
    <form className={clsx('taxonomy-editor', draft.isArchived && 'archived')} onSubmit={saveCategory}>
      <input
        className="table-input taxonomy-name-input"
        onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        value={draft.name}
      />
      <select
        className="table-input taxonomy-type-input"
        onChange={(event) => setDraft({ ...draft, type: event.target.value as NonNullable<Category['type']> })}
        value={draft.type}
      >
        <option value="expense">expense</option>
        <option value="income">income</option>
        <option value="transfer">transfer</option>
      </select>
      <input
        aria-label={`${draft.name} color`}
        onChange={(event) => setDraft({ ...draft, color: event.target.value })}
        type="color"
        value={draft.color}
      />
      <label className="checkbox-label">
        <input
          checked={draft.budgetable}
          onChange={(event) => setDraft({ ...draft, budgetable: event.target.checked })}
          type="checkbox"
        />
        Budgetable
      </label>
      <label className="checkbox-label">
        <input
          checked={draft.isArchived}
          onChange={(event) => setDraft({ ...draft, isArchived: event.target.checked })}
          type="checkbox"
        />
        Archived
      </label>
      <button className="icon-action" title="Save category" type="submit">
        <Save size={18} />
      </button>
    </form>
  )
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

  function saveTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.name.trim()) return
    onUpdate({ name: draft.name.trim(), color: draft.color, isArchived: draft.isArchived })
  }

  return (
    <form className={clsx('taxonomy-editor tag-editor', draft.isArchived && 'archived')} onSubmit={saveTag}>
      <input
        className="table-input taxonomy-name-input"
        onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        value={draft.name}
      />
      <input
        aria-label={`${draft.name} color`}
        onChange={(event) => setDraft({ ...draft, color: event.target.value })}
        type="color"
        value={draft.color}
      />
      <label className="checkbox-label">
        <input
          checked={draft.isArchived}
          onChange={(event) => setDraft({ ...draft, isArchived: event.target.checked })}
          type="checkbox"
        />
        Archived
      </label>
      <button className="icon-action" title="Save tag" type="submit">
        <Save size={18} />
      </button>
    </form>
  )
}
