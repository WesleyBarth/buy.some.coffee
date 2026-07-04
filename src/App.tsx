import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  Alert,
  AppShell,
  Button,
  Field,
  Header,
  IconButton,
  Input,
  Label,
  LoadingOverlay,
  Nav,
  NavItem,
  Panel,
  PanelBody,
  Sidebar,
  SegmentedControl,
  Inline,
  Stack,
  Text,
  useToast,
} from '@hyperview/ui'
import Papa from 'papaparse'
import {
  Banknote,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Landmark,
  LineChart,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ReceiptText,
  ShieldCheck,
  Tags,
  Upload,
} from 'lucide-react'
import { AccountsView } from './components/accounts/AccountsView'
import { BudgetsView } from './components/budgets/BudgetsView'
import { CategoriesView } from './components/categories/CategoriesView'
import { DashboardView } from './components/dashboard/DashboardView'
import { ImportView } from './components/import/ImportView'
import { NetWorthView } from './components/net-worth/NetWorthView'
import { PlaidView } from './components/plaid/PlaidView'
import { ExpensesView } from './components/recurring/ExpensesView'
import { IncomeView } from './components/recurring/IncomeView'
import { TransactionsView } from './components/transactions/TransactionsView'
import {
  accountSignedBalance,
  normalizePlaidBalanceForAccount,
} from './domain/accounts'
import {
  isIncomeCategory,
  isProjectionCategory,
  isSubscriptionCategory,
  normalizeCategory,
} from './domain/categories'
import {
  archivedDefaultCategoryNames,
  categoryColors,
  categoryNames,
  categoryPalette,
  initialAccounts,
  initialBudgets,
  initialCategories,
  initialMatchRules,
  initialMonthlyRecurring,
  initialSnapshots,
  initialSubscriptionServices,
  initialTags,
  initialTransactions,
  monthlyRecurringCategoryName,
  monthlySavingsGoal,
  transferCategoryName,
  uncategorizedCategoryName,
} from './domain/defaults'
import {
  addMonthsToMonth,
  clampMonthDay,
  currentMonthString,
  formatMonthLabel,
  localDatePart,
  nextRecurringDueDate,
  todayDateString,
} from './domain/dates'
import {
  applyBudgetDrafts,
  budgetDraftKey,
  buildBudgetRows,
  summarizeBudgets,
} from './domain/budgets'
import { buildMonthPositionTrend, buildSpendByCategory } from './domain/dashboard'
import { buildMonthlyCashSummary } from './domain/cashflow'
import { parseCurrency } from './domain/money'
import {
  detectPlaidTransferOutcomes,
  hasReviewBlockingPlaidRows,
  initialPlaidModeledOutcome,
  roleForPlaidModeledOutcome,
  shouldImportPlaidPreviewRow,
} from './domain/plaid'
import { normalizeRecurringCashflow } from './domain/recurring'
import { isBudgetSpend } from './domain/transactions'
import type {
  Account,
  AccountType,
  Budget,
  Category,
  CsvPreviewRow,
  NetWorthSnapshot,
  PlaidAccountPreview,
  PlaidLinkHandler,
  PlaidLinkMetadata,
  PlaidTransactionPreview,
  PlaidTransactionPreviewStats,
  RecurringCashflow,
  RecurringFrequency,
  RecurringKind,
  Tag,
  Transaction,
  TransactionColumnVisibility,
  TransactionMatchRule,
  TransactionPatch,
  TransactionRole,
} from './domain/types'
import { isSupabaseConfigured, supabase } from './lib/supabase'

declare global {
  interface Window {
    Plaid?: {
      create: (options: {
        token: string
        onSuccess: (publicToken: string, metadata: PlaidLinkMetadata) => void
        onExit?: (error: unknown, metadata: unknown) => void
      }) => PlaidLinkHandler
    }
  }
}

const knownViewIds = new Set([
  'dashboard',
  'accounts',
  'plaid',
  'categories',
  'transactions',
  'import',
  'expenses',
  'income',
  'budgets',
  'net-worth',
])

const primaryNavItems = [
  ['dashboard', 'Dashboard', BarChart3],
  ['accounts', 'Accounts', Landmark],
  ['plaid', 'Plaid', ShieldCheck],
  ['categories', 'Categories', Tags],
  ['transactions', 'Transactions', ReceiptText],
  ['import', 'Import', Upload],
  ['expenses', 'Expenses', CreditCard],
  ['income', 'Income', Banknote],
  ['budgets', 'Budgets', CalendarDays],
  ['net-worth', 'Net Worth', LineChart],
] as const

function App() {
  const remoteEnabled = isSupabaseConfigured && supabase
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!remoteEnabled)
  const [loadingData, setLoadingData] = useState(false)
  const [remoteDataLoaded, setRemoteDataLoaded] = useState(!remoteEnabled)
  const [appError, setAppError] = useState('')
  const [notice, setNotice] = useState('')
  const [storedActiveView, setActiveView] = useLocalStorageState('finance.activeView', 'dashboard')
  const activeView = isKnownView(storedActiveView) ? storedActiveView : 'dashboard'
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorageState('finance.sidebarCollapsed', false)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthString())
  const [localAccounts, setLocalAccounts] = useLocalStorageState('finance.accounts', initialAccounts)
  const [localCategories, setLocalCategories] = useLocalStorageState('finance.categories', initialCategories)
  const [localTags, setLocalTags] = useLocalStorageState('finance.tags', initialTags)
  const [localTransactions, setLocalTransactions] = useLocalStorageState(
    'finance.transactions',
    initialTransactions,
  )
  const [localBudgets, setLocalBudgets] = useLocalStorageState('finance.budgets', initialBudgets)
  const [localSubscriptionServices, setLocalSubscriptionServices] = useLocalStorageState(
    'finance.subscriptionServices',
    initialSubscriptionServices,
  )
  const [localMonthlyRecurring, setLocalMonthlyRecurring] = useLocalStorageState(
    'finance.monthlyRecurring',
    initialMonthlyRecurring,
  )
  const [localMatchRules, setLocalMatchRules] = useLocalStorageState('finance.transactionMatchRules', initialMatchRules)
  const [dismissedRecurringCandidateIds, setDismissedRecurringCandidateIds] = useLocalStorageState<string[]>(
    'finance.dismissedRecurringCandidates',
    [],
  )
  const [localSnapshots, setLocalSnapshots] = useLocalStorageState(
    'finance.netWorthSnapshots',
    initialSnapshots,
  )
  const [remoteAccounts, setRemoteAccounts] = useState<Account[]>([])
  const [remoteCategories, setRemoteCategories] = useState<Category[]>([])
  const [remoteTags, setRemoteTags] = useState<Tag[]>([])
  const [remoteTransactions, setRemoteTransactions] = useState<Transaction[]>([])
  const [remoteBudgets, setRemoteBudgets] = useState<Budget[]>([])
  const [remoteRecurringCashflows, setRemoteRecurringCashflows] = useState<RecurringCashflow[]>([])
  const [remoteMatchRules, setRemoteMatchRules] = useState<TransactionMatchRule[]>([])
  const [remoteSnapshots, setRemoteSnapshots] = useState<NetWorthSnapshot[]>([])
  const [plaidAccounts, setPlaidAccounts] = useState<PlaidAccountPreview[]>([])
  const [plaidTransactionRows, setPlaidTransactionRows] = useState<PlaidTransactionPreview[]>([])
  const [plaidTransactionCursors, setPlaidTransactionCursors] = useState<Record<string, string>>({})
  const [plaidTransactionPreviewStats, setPlaidTransactionPreviewStats] = useState<PlaidTransactionPreviewStats>({
    added: 0,
    modified: 0,
    removed: 0,
  })
  const [plaidWorking, setPlaidWorking] = useState(false)
  const [plaidBusyMessage, setPlaidBusyMessage] = useState('')
  const [csvRows, setCsvRows] = useState<CsvPreviewRow[]>([])
  const [transactionColumns, setTransactionColumns] = useLocalStorageState<TransactionColumnVisibility>(
    'finance.transactionColumns',
    {
      year: false,
      account: false,
      tags: true,
      source: false,
    },
  )
  const [showSelectedMonthTransactions, setShowSelectedMonthTransactions] = useState(false)
  const [importAccountId, setImportAccountId] = useState('')
  const [accountForm, setAccountForm] = useState({
    name: '',
    institution: '',
    type: 'checking' as AccountType,
    balance: '',
  })
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    color: categoryPalette[0],
    type: 'expense' as Category['type'],
    parentId: '',
    role: '' as TransactionRole | '',
    budgetable: true,
  })
  const [tagForm, setTagForm] = useState({
    name: '',
    color: categoryPalette[1],
  })
  const [newTransaction, setNewTransaction] = useState({
    date: todayDateString(),
    accountId: '',
    description: '',
    category: uncategorizedCategoryName,
    amount: '',
  })
  const [recurringForm, setRecurringForm] = useState({
    name: '',
    accountId: '',
    category: uncategorizedCategoryName,
    amount: '',
    day: '1',
    frequency: 'monthly' as RecurringFrequency,
    nextDueDate: todayDateString(),
  })
  const [newSnapshot, setNewSnapshot] = useState({
    date: todayDateString(),
    assets: '',
    liabilities: '',
  })
  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({})
  const [savingBudgetCategory, setSavingBudgetCategory] = useState('')
  const [recurringCandidateDrafts, setRecurringCandidateDrafts] = useState<Record<string, Partial<RecurringCashflow>>>({})
  const [pendingRecurringFocusId, setPendingRecurringFocusId] = useState('')
  const recurringFocusRef = useRef<HTMLInputElement | null>(null)
  const dismissNotice = useCallback(() => setNotice(''), [])

  const isRemoteSignedIn = Boolean(remoteEnabled && session)
  const isInitialRemoteDataLoading = isRemoteSignedIn && !remoteDataLoaded
  const showAuthLoading = useDelayedBoolean(!authReady, 220)
  const showLoadingData = useDelayedBoolean(loadingData || isInitialRemoteDataLoading, 280)
  const accounts = isRemoteSignedIn ? remoteAccounts : localAccounts
  const activeAccounts = accounts.filter((account) => !account.isArchived)
  const activeAccountNameById = useMemo(
    () => new Map(activeAccounts.map((account) => [account.id, account.name])),
    [activeAccounts],
  )
  const categories = isRemoteSignedIn ? remoteCategories : localCategories
  const tags = isRemoteSignedIn ? remoteTags : localTags
  const transactions = isRemoteSignedIn ? remoteTransactions : localTransactions
  const budgets = isRemoteSignedIn ? remoteBudgets : localBudgets
  const persistedRecurringCashflows = useMemo(
    () =>
      isRemoteSignedIn
        ? remoteRecurringCashflows
        : [
            ...localMonthlyRecurring.map((item) => normalizeRecurringCashflow({ ...item, kind: 'monthly_recurring' as const, isPersisted: true })),
            ...localSubscriptionServices.map((item) => normalizeRecurringCashflow({ ...item, kind: 'subscription' as const, isPersisted: true })),
          ],
    [isRemoteSignedIn, localMonthlyRecurring, localSubscriptionServices, remoteRecurringCashflows],
  )
  const matchRules = isRemoteSignedIn ? remoteMatchRules : localMatchRules
  const snapshots = isRemoteSignedIn ? remoteSnapshots : localSnapshots
  const activeCategories = useMemo(() => categories.filter((category) => !category.isArchived), [categories])

  useEffect(() => {
    if (isRemoteSignedIn) return

    setLocalCategories((current) => {
      const hasUncategorized = current.some((category) => category.name === uncategorizedCategoryName)
      const next = current.map((category) =>
        archivedDefaultCategoryNames.includes(category.name)
          ? { ...category, isArchived: true }
          : category,
      )

      if (!hasUncategorized) {
        next.push({
          id: `cat-${normalizeText(uncategorizedCategoryName)}`,
          name: uncategorizedCategoryName,
          color: categoryColors[uncategorizedCategoryName],
          type: 'expense',
          budgetable: true,
          isArchived: false,
        })
      }

      return next.some((category, index) => category !== current[index]) || !hasUncategorized ? next : current
    })
  }, [isRemoteSignedIn, setLocalCategories])

  const activeTags = tags.filter((tag) => !tag.isArchived)
  const categoryLabels =
    activeCategories.length > 0
      ? activeCategories.map((category) => category.name)
      : categoryNames
  const budgetableCategories = activeCategories.filter(
    (category) => category.budgetable !== false && !isProjectionCategory(category.name),
  )
  const activeCategoryByName = useMemo(
    () => new Map(activeCategories.map((category) => [category.name, category])),
    [activeCategories],
  )
  const firstExpenseCategory = activeCategories.find(
    (category) => category.type === 'expense' && !isProjectionCategory(category.name) && category.name !== uncategorizedCategoryName,
  )?.name ?? uncategorizedCategoryName
  const firstIncomeCategory = activeCategories.find((category) => category.type === 'income')?.name ?? uncategorizedCategoryName
  const persistedSubscriptionServices = persistedRecurringCashflows.filter((item) => item.kind === 'subscription')
  const persistedMonthlyRecurring = persistedRecurringCashflows.filter((item) => item.kind === 'monthly_recurring')
  const subscriptionServices = useMemo(
    () => [
      ...persistedSubscriptionServices,
      ...buildRecurringCandidates(
        'subscription',
        transactions,
        persistedSubscriptionServices,
        recurringCandidateDrafts,
        matchRules,
        dismissedRecurringCandidateIds,
      ),
    ],
    [dismissedRecurringCandidateIds, matchRules, persistedSubscriptionServices, recurringCandidateDrafts, transactions],
  )
  const monthlyRecurring = useMemo(
    () => [
      ...persistedMonthlyRecurring,
      ...buildRecurringCandidates(
        'monthly_recurring',
        transactions,
        persistedMonthlyRecurring,
        recurringCandidateDrafts,
        matchRules,
        dismissedRecurringCandidateIds,
      ),
    ],
    [dismissedRecurringCandidateIds, matchRules, persistedMonthlyRecurring, recurringCandidateDrafts, transactions],
  )

  useEffect(() => {
    if (!remoteEnabled) return

    remoteEnabled.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setRemoteDataLoaded(!data.session)
      setAuthReady(true)
    })

    const { data: listener } = remoteEnabled.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setRemoteDataLoaded(!nextSession)
      setAuthReady(true)
    })

    return () => listener.subscription.unsubscribe()
  }, [remoteEnabled])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 5200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const loadRemoteData = useCallback(async () => {
    if (!remoteEnabled || !session) return
    setLoadingData(true)
    setAppError('')

    const [
      accountsResult,
      categoriesResult,
      tagsResult,
      transactionsResult,
      transactionTagsResult,
      budgetsResult,
      recurringCashflowsResult,
      matchRulesResult,
      snapshotsResult,
      plaidAccountsResult,
    ] = await Promise.all([
      remoteEnabled
        .from('accounts')
        .select('id,name,account_type,balance,institution,is_archived')
        .order('created_at'),
      remoteEnabled.from('categories').select('id,name,color,category_type,parent_id,role,budgetable,is_archived').order('name'),
      remoteEnabled.from('tags').select('id,name,color,is_archived').order('name'),
      remoteEnabled
        .from('transactions')
        .select('id,transaction_date,account_id,description,amount,source,external_id,pending_external_id,original_description,role,transfer_group_id,modeled_outcome,categories(name)')
        .order('transaction_date', { ascending: false }),
      remoteEnabled.from('transaction_tags').select('transaction_id,tag_id'),
      remoteEnabled.from('budgets').select('id,month,planned,categories(name)').order('month'),
      remoteEnabled
        .from('recurring_cashflows')
        .select('id,kind,name,account_id,amount,day,frequency,next_due_date,is_active,source_transaction_id,categories(name)')
        .order('created_at'),
      remoteEnabled
        .from('transaction_match_rules')
        .select('id,recurring_cashflow_id,account_id,match_text,normalized_match_text,amount_sign,is_active,categories(name)')
        .order('created_at'),
      remoteEnabled
        .from('net_worth_snapshots')
        .select('id,snapshot_date,assets,liabilities')
        .order('snapshot_date'),
      remoteEnabled
        .from('plaid_accounts')
        .select('plaid_item_id,plaid_account_id,name,official_name,account_type,account_subtype,mask,available_balance,current_balance,limit_amount,iso_currency_code,linked_account_id,last_balance_sync_at,accepted_balance,accepted_balance_at,accepted_transactions_cursor,reconciliation_status,plaid_items(institution_name)')
        .order('created_at'),
    ])

    const error =
      accountsResult.error ??
      categoriesResult.error ??
      tagsResult.error ??
      transactionsResult.error ??
      transactionTagsResult.error ??
      budgetsResult.error ??
      recurringCashflowsResult.error ??
      matchRulesResult.error ??
      snapshotsResult.error ??
      plaidAccountsResult.error

    if (error) {
      setAppError(error.message)
      setRemoteDataLoaded(true)
      setLoadingData(false)
      return
    }

    setRemoteAccounts(
      (accountsResult.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        type: row.account_type,
        balance: Number(row.balance),
        institution: row.institution ?? '',
        isArchived: Boolean(row.is_archived),
      })),
    )
    setRemoteCategories(
      (categoriesResult.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        type: row.category_type ?? 'expense',
        parentId: row.parent_id ?? undefined,
        role: row.role ?? undefined,
        budgetable: Boolean(row.budgetable),
        isArchived: Boolean(row.is_archived),
      })),
    )
    setRemoteTags(
      (tagsResult.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        isArchived: Boolean(row.is_archived),
      })),
    )
    const tagIdsByTransactionId = new Map<string, string[]>()
    ;(transactionTagsResult.data ?? []).forEach((row) => {
      tagIdsByTransactionId.set(row.transaction_id, [
        ...(tagIdsByTransactionId.get(row.transaction_id) ?? []),
        row.tag_id,
      ])
    })

    setRemoteTransactions(
      (transactionsResult.data ?? []).map((row) => ({
        id: row.id,
        date: row.transaction_date,
        accountId: row.account_id,
        description: row.description,
        category: relationName(row.categories),
        amount: Number(row.amount),
        source: row.source,
        externalId: row.external_id ?? undefined,
        pendingExternalId: row.pending_external_id ?? undefined,
        originalDescription: row.original_description ?? undefined,
        role: row.role ?? undefined,
        transferGroupId: row.transfer_group_id ?? undefined,
        modeledOutcome: row.modeled_outcome ?? undefined,
        tagIds: tagIdsByTransactionId.get(row.id) ?? [],
      })),
    )
    setRemoteBudgets(
      (budgetsResult.data ?? []).map((row) => ({
        id: row.id,
        month: String(row.month).slice(0, 7),
        category: relationName(row.categories),
        planned: Number(row.planned),
      })),
    )
    setRemoteRecurringCashflows(
      (recurringCashflowsResult.data ?? []).map((row) => normalizeRecurringCashflow({
        id: row.id,
        kind: row.kind,
        name: row.name,
        accountId: row.account_id,
        category: relationName(row.categories),
        amount: Number(row.amount),
        day: Number(row.day),
        frequency: row.frequency,
        nextDueDate: row.next_due_date ?? undefined,
        isActive: Boolean(row.is_active),
        isPersisted: true,
        sourceTransactionId: row.source_transaction_id ?? undefined,
      })),
    )
    setRemoteMatchRules(
      (matchRulesResult.data ?? []).map((row) => ({
        id: row.id,
        recurringCashflowId: row.recurring_cashflow_id ?? undefined,
        accountId: row.account_id ?? undefined,
        category: relationName(row.categories),
        matchText: row.match_text,
        normalizedMatchText: row.normalized_match_text,
        amountSign: row.amount_sign,
        isActive: Boolean(row.is_active),
      })),
    )
    setRemoteSnapshots(
      (snapshotsResult.data ?? []).map((row) => ({
        id: row.id,
        date: row.snapshot_date,
        assets: Number(row.assets),
        liabilities: Number(row.liabilities),
      })),
    )
    setPlaidAccounts(
      (plaidAccountsResult.data ?? []).map((row) => ({
        plaidItemId: row.plaid_item_id,
        plaidAccountId: row.plaid_account_id,
        institutionName: relationInstitutionName(row.plaid_items),
        name: row.name,
        officialName: row.official_name ?? undefined,
        type: row.account_type,
        subtype: row.account_subtype ?? undefined,
        mask: row.mask ?? undefined,
        availableBalance: row.available_balance === null ? null : Number(row.available_balance),
        currentBalance: row.current_balance === null ? null : Number(row.current_balance),
        limitAmount: row.limit_amount === null ? null : Number(row.limit_amount),
        isoCurrencyCode: row.iso_currency_code ?? undefined,
        linkedAccountId: row.linked_account_id ?? undefined,
        lastBalanceSyncAt: row.last_balance_sync_at ?? undefined,
        acceptedBalance: row.accepted_balance === null ? null : Number(row.accepted_balance),
        acceptedBalanceAt: row.accepted_balance_at ?? undefined,
        acceptedTransactionsCursor: row.accepted_transactions_cursor ?? undefined,
        reconciliationStatus: row.reconciliation_status ?? undefined,
      })),
    )
    setRemoteDataLoaded(true)
    setLoadingData(false)
  }, [remoteEnabled, session])

  useEffect(() => {
    if (!remoteEnabled || !session) return
    const timeout = window.setTimeout(() => {
      void loadRemoteData()
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [remoteEnabled, session, loadRemoteData])

  const selectedMonthTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.date.startsWith(selectedMonth)),
    [selectedMonth, transactions],
  )
  const displayedTransactions = showSelectedMonthTransactions ? selectedMonthTransactions : transactions
  const plaidInstitutionCount = useMemo(
    () => new Set(plaidAccounts.map((account) => account.institutionName).filter(Boolean)).size,
    [plaidAccounts],
  )
  const mappedPlaidAccounts = plaidAccounts.filter((account) => account.linkedAccountId && typeof account.currentBalance === 'number')
  const plaidItemIds = useMemo(
    () => [...new Set(plaidAccounts.map((account) => account.plaidItemId).filter((id): id is string => Boolean(id)))],
    [plaidAccounts],
  )
  const plaidConnections = useMemo(
    () =>
      plaidItemIds.map((plaidItemId) => {
        const itemAccounts = plaidAccounts.filter((account) => account.plaidItemId === plaidItemId)
        return {
          id: plaidItemId,
          institutionName: itemAccounts.find((account) => account.institutionName)?.institutionName || 'Unknown institution',
          accountCount: itemAccounts.length,
        }
      }),
    [plaidAccounts, plaidItemIds],
  )
  const plaidBalanceStatusByAccountId = useMemo(() => {
    const appAccountById = new Map(accounts.map((account) => [account.id, account]))
    return new Map(
      plaidAccounts.map((plaidAccount) => {
        const linkedAccount = plaidAccount.linkedAccountId ? appAccountById.get(plaidAccount.linkedAccountId) : undefined
        if (!linkedAccount || typeof plaidAccount.currentBalance !== 'number') {
          return [plaidAccount.plaidAccountId, 'Not mapped']
        }

        const normalizedBalance = normalizePlaidBalanceForAccount(plaidAccount.currentBalance, linkedAccount.type)
        return [
          plaidAccount.plaidAccountId,
          Math.abs(normalizedBalance - linkedAccount.balance) < 0.01 ? 'Current' : 'Needs sync',
        ]
      }),
    )
  }, [accounts, plaidAccounts])

  const cashflowTransactions = useMemo(
    () => selectedMonthTransactions.filter((transaction) => transaction.category !== transferCategoryName),
    [selectedMonthTransactions],
  )
  const variableTransactions = useMemo(
    () =>
      cashflowTransactions.filter((transaction) =>
        !isProjectionCategory(transaction.category) && isBudgetSpend(transaction, activeCategories),
      ),
    [activeCategories, cashflowTransactions],
  )

  const activeExpectedCashflows = useMemo(
    () =>
      persistedRecurringCashflows
        .filter((item) => item.isActive !== false)
        .filter((item) => activeAccounts.some((account) => account.id === item.accountId)),
    [activeAccounts, persistedRecurringCashflows],
  )
  const activeMonthlyRecurring = activeExpectedCashflows.filter((item) => item.kind === 'monthly_recurring')
  const activeSubscriptionServices = activeExpectedCashflows.filter((item) => item.kind === 'subscription')
  const monthlyRecurringIncome = activeMonthlyRecurring
    .filter((item) => item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0)
  const monthlyRecurringSpend = Math.abs(
    activeMonthlyRecurring
      .filter((item) => item.amount < 0)
      .reduce((sum, item) => sum + item.amount, 0),
  )
  const monthlyRecurringFlow = activeMonthlyRecurring.reduce((sum, item) => sum + item.amount, 0)
  const subscriptionServicesSpend = Math.abs(
    activeSubscriptionServices
      .filter((item) => item.amount < 0)
      .reduce((sum, item) => sum + item.amount, 0),
  )
  const expectedSubscriptionItems = subscriptionServices
    .filter((item) => item.amount < 0)
    .sort((a, b) => a.name.localeCompare(b.name))
  const expectedMonthlyRecurringExpenseItems = monthlyRecurring
    .filter((item) => item.amount < 0)
    .sort((a, b) => a.name.localeCompare(b.name))
  const expectedIncomeItems = monthlyRecurring
    .filter((item) => item.amount > 0)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  const remainingExpectedProjectionFlow = activeExpectedCashflows
    .filter((item) => selectedMonth === currentMonthString() && nextRecurringDueDate(item).startsWith(selectedMonth))
    .reduce((sum, item) => sum + item.amount, 0)
  const expectedExpenseSpend = monthlyRecurringSpend + subscriptionServicesSpend

  const accountInitialValue = activeAccounts.reduce((sum, account) => sum + accountSignedBalance(account), 0)
  const latestSnapshot = snapshots.at(-1)
  const latestNetWorth = latestSnapshot
    ? latestSnapshot.assets - latestSnapshot.liabilities
    : accountInitialValue

  useEffect(() => {
    if (!pendingRecurringFocusId) return
    const timeout = window.setTimeout(() => {
      recurringFocusRef.current?.focus()
      recurringFocusRef.current?.select()
      setPendingRecurringFocusId('')
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [expectedMonthlyRecurringExpenseItems, expectedSubscriptionItems, pendingRecurringFocusId])

  const spendByCategory = buildSpendByCategory(categoryLabels, variableTransactions, activeCategories)

  const budgetRows = buildBudgetRows({
    budgetableCategories,
    budgets,
    categories: activeCategories,
    currentMonth: selectedMonth,
    variableTransactions,
    normalizeCategoryId: normalizeText,
  })
  const budgetRowsWithDrafts = applyBudgetDrafts(budgetRows, budgetDrafts, selectedMonth)
  const budgetSummary = summarizeBudgets(budgetRowsWithDrafts)
  const {
    totalBudgetRemaining,
    remainingPlannedSpend,
  } = budgetSummary
  const actualVariableSpend = variableTransactions.reduce((sum, transaction) => sum - transaction.amount, 0)
  const monthlyCashSummary = buildMonthlyCashSummary({
    accounts: activeAccounts,
    monthlySavingsGoal,
    remainingExpectedProjectionFlow,
    remainingPlannedVariableSpend: remainingPlannedSpend,
    selectedMonthTransactions,
  })

  const monthPositionTrend = buildMonthPositionTrend({
    currentCashPosition: monthlyCashSummary.cashOnHand,
    projectedMonthEndPosition: monthlyCashSummary.projectedMonthEndCashBalance,
  })

  const netWorthTrend = snapshots.map((snapshot) => ({
    date: snapshot.date.slice(5),
    netWorth: snapshot.assets - snapshot.liabilities,
  }))

  const selectedTransactionAccountId = activeAccounts.some((account) => account.id === newTransaction.accountId)
    ? newTransaction.accountId
    : activeAccounts[0]?.id ?? ''
  const selectedTransactionCategory = categoryLabels.includes(newTransaction.category)
    ? newTransaction.category
    : uncategorizedCategoryName
  const selectedImportAccountId = activeAccounts.some((account) => account.id === importAccountId)
    ? importAccountId
    : activeAccounts[0]?.id ?? ''

  async function addTransaction() {
    const amount = Number(newTransaction.amount)
    const description = newTransaction.description.trim()
    if (!description || Number.isNaN(amount) || amount === 0 || !selectedTransactionAccountId) return

    if (remoteEnabled && session) {
      const categoryId = await ensureRemoteCategory(selectedTransactionCategory)
      const { error } = await remoteEnabled.from('transactions').upsert(
        {
          user_id: session.user.id,
          account_id: selectedTransactionAccountId,
          category_id: categoryId,
          transaction_date: newTransaction.date,
          description,
          amount,
          source: 'manual',
          role: undefined,
          dedupe_key: transactionDedupeKey(selectedTransactionAccountId, newTransaction.date, amount, description),
        },
        { onConflict: 'user_id,dedupe_key' },
      )

      if (error) {
        setAppError(error.message)
        return
      }

      await loadRemoteData()
    } else {
      setLocalTransactions((current) => [
        {
          id: crypto.randomUUID(),
          date: newTransaction.date,
          accountId: selectedTransactionAccountId,
          description,
          category: selectedTransactionCategory,
          amount,
          source: 'manual',
          tagIds: [],
        },
        ...current,
      ])
    }

    setNewTransaction((current) => ({ ...current, description: '', amount: '' }))
  }

  async function updateTransaction(transactionId: string, patch: TransactionPatch) {
    const existing = transactions.find((transaction) => transaction.id === transactionId)
    if (!existing) return

    const next = { ...existing, ...patch }
    if (!next.description.trim() || Number.isNaN(next.amount) || next.amount === 0 || !next.accountId) return
    const transactionFieldChanged = Object.keys(patch).some((key) => key !== 'tagIds')

    if (remoteEnabled && session) {
      const categoryId = await ensureRemoteCategory(next.category)
      setRemoteTransactions((current) =>
        current.map((transaction) => (transaction.id === transactionId ? next : transaction)),
      )

      if (transactionFieldChanged) {
        const { error } = await remoteEnabled
          .from('transactions')
          .update({
            account_id: next.accountId,
            category_id: categoryId,
            transaction_date: next.date,
            description: next.description.trim(),
            amount: next.amount,
            role: next.role,
            transfer_group_id: next.transferGroupId,
            pending_external_id: next.pendingExternalId,
            original_description: next.originalDescription,
            modeled_outcome: next.modeledOutcome,
            dedupe_key: transactionDedupeKey(next.accountId, next.date, next.amount, next.description),
          })
          .eq('id', transactionId)

        if (error) {
          setAppError(error.message)
          await loadRemoteData()
          return
        }
      }

      if (patch.tagIds) {
        const { error: deleteError } = await remoteEnabled
          .from('transaction_tags')
          .delete()
          .eq('transaction_id', transactionId)

        if (deleteError) {
          setAppError(deleteError.message)
          await loadRemoteData()
          return
        }

        if (patch.tagIds.length > 0) {
          const { error: insertError } = await remoteEnabled.from('transaction_tags').insert(
            patch.tagIds.map((tagId) => ({
              transaction_id: transactionId,
              tag_id: tagId,
            })),
          )

          if (insertError) {
            setAppError(insertError.message)
            await loadRemoteData()
          }
        }
      }
    } else {
      setLocalTransactions((current) =>
        current.map((transaction) => (transaction.id === transactionId ? next : transaction)),
      )
    }
  }

  async function deleteTransaction(transactionId: string) {
    if (!window.confirm('Delete this transaction?')) return

    if (remoteEnabled && session) {
      setRemoteTransactions((current) => current.filter((transaction) => transaction.id !== transactionId))
      const { error } = await remoteEnabled.from('transactions').delete().eq('id', transactionId)

      if (error) {
        setAppError(error.message)
        await loadRemoteData()
      }
    } else {
      setLocalTransactions((current) => current.filter((transaction) => transaction.id !== transactionId))
    }
  }

  async function addSnapshot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const assets = Number(newSnapshot.assets)
    const liabilities = Number(newSnapshot.liabilities)
    if (Number.isNaN(assets) || Number.isNaN(liabilities)) return

    if (remoteEnabled && session) {
      const { error } = await remoteEnabled.from('net_worth_snapshots').upsert(
        {
          user_id: session.user.id,
          snapshot_date: newSnapshot.date,
          assets,
          liabilities,
        },
        { onConflict: 'user_id,snapshot_date' },
      )
      if (error) {
        setAppError(error.message)
        return
      }
      await loadRemoteData()
    } else {
      setLocalSnapshots((current) =>
        [
          ...current,
          {
            id: crypto.randomUUID(),
            date: newSnapshot.date,
            assets,
            liabilities,
          },
        ].sort((a, b) => a.date.localeCompare(b.date)),
      )
    }

    setNewSnapshot((current) => ({ ...current, assets: '', liabilities: '' }))
  }

  async function updateBudget(category: string, planned: number) {
    const nextPlanned = Math.max(0, planned)

    if (remoteEnabled && session) {
      const budget = budgets.find((item) => item.month === selectedMonth && item.category === category)
      const categoryId = await ensureRemoteCategory(category)
      if (budget) {
        setRemoteBudgets((current) =>
          current.map((item) => (item.id === budget.id ? { ...item, planned: nextPlanned } : item)),
        )
        const { error } = await remoteEnabled.from('budgets').update({ planned: nextPlanned }).eq('id', budget.id)
        if (error) {
          setAppError(error.message)
          throw error
        }
      } else {
        const { data, error } = await remoteEnabled
          .from('budgets')
          .upsert(
            {
              user_id: session.user.id,
              category_id: categoryId,
              month: `${selectedMonth}-01`,
              planned: nextPlanned,
            },
            { onConflict: 'user_id,category_id,month' },
          )
          .select('id,month,planned,categories(name)')
          .single()
        if (error) {
          setAppError(error.message)
          throw error
        }
        setRemoteBudgets((current) => [
          ...current.filter((item) => !(item.month === selectedMonth && item.category === category)),
          {
            id: data.id,
            month: String(data.month).slice(0, 7),
            category: relationName(data.categories),
            planned: Number(data.planned),
          },
        ])
      }
    } else {
      setLocalBudgets((current) =>
        current.some((budget) => budget.month === selectedMonth && budget.category === category)
          ? current.map((budget) =>
              budget.month === selectedMonth && budget.category === category ? { ...budget, planned: nextPlanned } : budget,
            )
          : [
              ...current,
              {
                id: crypto.randomUUID(),
                month: selectedMonth,
                category,
                planned: nextPlanned,
              },
            ],
      )
    }
  }

  async function saveBudgetDraft(category: string) {
    const key = budgetDraftKey(selectedMonth, category)
    const draft = budgetDrafts[key]
    const planned = draft === undefined || draft.trim() === '' ? 0 : Number(draft)

    if (!Number.isFinite(planned)) {
      setAppError('Enter a valid budget amount.')
      return
    }

    setSavingBudgetCategory(category)
    try {
      await updateBudget(category, planned)
      setBudgetDrafts((current) => {
        const next = { ...current }
        delete next[key]
        return next
      })
    } finally {
      setSavingBudgetCategory('')
    }
  }

  async function addBlankExpectedExpense(kind: RecurringKind) {
    const accountId = activeAccounts[0]?.id ?? ''
    if (!accountId) return

    const itemId = crypto.randomUUID()
    setPendingRecurringFocusId(itemId)
    await saveRecurringCashflow({
      id: itemId,
      kind,
      name: 'New expense',
      accountId,
      category: firstExpenseCategory,
      amount: -0.01,
      day: 1,
      frequency: 'monthly',
      nextDueDate: todayDateString(),
      isActive: true,
      isPersisted: true,
    })
  }

  async function addMonthlyRecurring(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(recurringForm.amount)
    const day = Number(recurringForm.day)
    const name = recurringForm.name.trim()
    const accountId = activeAccounts.some((account) => account.id === recurringForm.accountId)
      ? recurringForm.accountId
      : activeAccounts[0]?.id ?? ''
    const category = categoryLabels.includes(recurringForm.category) ? recurringForm.category : firstIncomeCategory
    if (!name || !accountId || Number.isNaN(amount) || amount === 0 || Number.isNaN(day)) return

    await saveRecurringCashflow({
      id: crypto.randomUUID(),
      kind: 'monthly_recurring',
      name,
      accountId,
      category,
      amount: Math.abs(amount),
      day: clampMonthDay(day),
      frequency: recurringForm.frequency,
      nextDueDate:
        recurringForm.frequency === 'monthly'
          ? nextRecurringDueDate({ day: clampMonthDay(day), frequency: recurringForm.frequency })
          : recurringForm.nextDueDate || nextRecurringDueDate({ day: clampMonthDay(day), frequency: recurringForm.frequency }),
      isActive: true,
      isPersisted: true,
    })
    setRecurringForm({
      name: '',
      accountId,
      category,
      amount: '',
      day: '1',
      frequency: 'monthly',
      nextDueDate: todayDateString(),
    })
  }

  async function saveRecurringCashflow(item: RecurringCashflow) {
    if (remoteEnabled && session) {
      const categoryId = await ensureRemoteCategory(item.category)
      const { error } = await remoteEnabled.from('recurring_cashflows').upsert({
        id: item.id,
        user_id: session.user.id,
        account_id: item.accountId,
        category_id: categoryId,
        source_transaction_id: item.sourceTransactionId ?? null,
        kind: item.kind,
        name: item.name.trim(),
        amount: item.amount,
        day: clampMonthDay(item.day),
        frequency: item.frequency ?? 'monthly',
        next_due_date: item.nextDueDate ?? nextRecurringDueDate(item),
        is_active: item.isActive !== false,
      })

      if (error) {
        setAppError(error.message)
        return
      }

      await loadRemoteData()
    } else {
      const next = normalizeRecurringCashflow({ ...item, isPersisted: true })
      const setter = item.kind === 'subscription' ? setLocalSubscriptionServices : setLocalMonthlyRecurring
      setter((current) =>
        current.some((existing) => existing.id === item.id)
          ? current.map((existing) => (existing.id === item.id ? next : existing))
          : [...current, next],
      )
    }
  }

  async function createMatchRuleForRecurring(item: RecurringCashflow) {
    const matchText = item.sourceDescription || item.name
    const normalizedMatchText = normalizeText(matchText)
    if (!normalizedMatchText) return
    const amountSign = item.amount > 0 ? 'income' : 'expense'

    if (remoteEnabled && session) {
      const categoryId = await ensureRemoteCategory(item.category)
      const { error } = await remoteEnabled.from('transaction_match_rules').upsert(
        {
          user_id: session.user.id,
          recurring_cashflow_id: item.id,
          account_id: item.accountId,
          category_id: categoryId,
          match_text: matchText,
          normalized_match_text: normalizedMatchText,
          match_strategy: 'contains',
          amount_sign: amountSign,
          is_active: true,
        },
        { onConflict: 'user_id,normalized_match_text,account_id,amount_sign' },
      )

      if (error) {
        setAppError(error.message)
        return
      }

      await loadRemoteData()
    } else {
      setLocalMatchRules((current) => {
        const nextRule: TransactionMatchRule = {
          id: crypto.randomUUID(),
          recurringCashflowId: item.id,
          accountId: item.accountId,
          category: item.category,
          matchText,
          normalizedMatchText,
          amountSign,
          isActive: true,
        }
        return current.some(
          (rule) =>
            rule.normalizedMatchText === normalizedMatchText &&
            rule.accountId === item.accountId &&
            rule.amountSign === amountSign,
        )
          ? current
          : [...current, nextRule]
      })
    }
  }

  async function persistRecurringCandidate(itemId: string) {
    const candidate = [...subscriptionServices, ...monthlyRecurring].find((item) => item.id === itemId)
    if (!candidate) return
    const persisted = { ...candidate, id: crypto.randomUUID(), isPersisted: true, isActive: candidate.isActive !== false }
    await saveRecurringCashflow(persisted)
    await createMatchRuleForRecurring(persisted)
    setRecurringCandidateDrafts((current) => {
      const remaining = { ...current }
      delete remaining[itemId]
      return remaining
    })
  }

  async function updateExpectedCashflow(itemId: string, patch: Partial<RecurringCashflow>) {
    const existing = [...persistedSubscriptionServices, ...persistedMonthlyRecurring].find((item) => item.id === itemId)
    if (!existing) {
      updateRecurringCandidateDraft(itemId, patch)
      return
    }
    const nextCategory = patch.category ?? existing.category
    await saveRecurringCashflow({
      ...existing,
      ...patch,
      kind:
        (patch.amount ?? existing.amount) > 0
          ? 'monthly_recurring'
          : isSubscriptionCategory(nextCategory)
            ? 'subscription'
            : 'monthly_recurring',
    })
  }

  function updateRecurringCandidateDraft(itemId: string, patch: Partial<RecurringCashflow>) {
    setRecurringCandidateDrafts((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] ?? {}),
        ...patch,
      },
    }))
  }

  async function deleteRecurringCashflow(itemId: string, kind: RecurringKind) {
    if (remoteEnabled && session) {
      setRemoteRecurringCashflows((current) => current.filter((item) => item.id !== itemId))
      const { error } = await remoteEnabled.from('recurring_cashflows').delete().eq('id', itemId)
      if (error) {
        setAppError(error.message)
        await loadRemoteData()
      }
    } else if (kind === 'subscription') {
      setLocalSubscriptionServices((current) => current.filter((item) => item.id !== itemId))
      setLocalMatchRules((current) => current.filter((rule) => rule.recurringCashflowId !== itemId))
    } else {
      setLocalMonthlyRecurring((current) => current.filter((item) => item.id !== itemId))
      setLocalMatchRules((current) => current.filter((rule) => rule.recurringCashflowId !== itemId))
    }
  }

  function deleteExpectedCashflow(itemId: string) {
    const existing = [...persistedSubscriptionServices, ...persistedMonthlyRecurring].find((item) => item.id === itemId)
    void deleteRecurringCashflow(itemId, existing?.kind ?? 'monthly_recurring')
  }

  function dismissRecurringCandidate(itemId: string) {
    setDismissedRecurringCandidateIds((current) => current.includes(itemId) ? current : [...current, itemId])
    setRecurringCandidateDrafts((current) => {
      const remaining = { ...current }
      delete remaining[itemId]
      return remaining
    })
  }

  async function addAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = accountForm.name.trim()
    const balance = Number(accountForm.balance)
    if (!name || Number.isNaN(balance)) return

    if (remoteEnabled && session) {
      const { error } = await remoteEnabled.from('accounts').insert({
        user_id: session.user.id,
        name,
        institution: accountForm.institution.trim() || null,
        account_type: accountForm.type,
        balance,
        is_archived: false,
      })

      if (error) {
        setAppError(error.message)
        return
      }

      await loadRemoteData()
    } else {
      setLocalAccounts((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          name,
          institution: accountForm.institution.trim(),
          type: accountForm.type,
          balance,
          isArchived: false,
        },
      ])
    }

    setAccountForm({ name: '', institution: '', type: 'checking', balance: '' })
  }

  async function updateAccount(accountId: string, patch: Partial<Account>) {
    if (remoteEnabled && session) {
      setRemoteAccounts((current) =>
        current.map((account) => (account.id === accountId ? { ...account, ...patch } : account)),
      )
      const { error } = await remoteEnabled
        .from('accounts')
        .update({
          name: patch.name,
          institution: patch.institution,
          account_type: patch.type,
          balance: patch.balance,
          is_archived: patch.isArchived,
        })
        .eq('id', accountId)

      if (error) {
        setAppError(error.message)
        await loadRemoteData()
      }
    } else {
      setLocalAccounts((current) =>
        current.map((account) => (account.id === accountId ? { ...account, ...patch } : account)),
      )
    }
  }

  function startPlaidBusy(message: string) {
    setPlaidBusyMessage(message)
    setPlaidWorking(true)
  }

  function stopPlaidBusy() {
    setPlaidWorking(false)
    setPlaidBusyMessage('')
  }

  async function connectPlaid() {
    if (!remoteEnabled || !session) {
      setAppError('Sign in with Supabase before connecting Plaid.')
      return
    }

    startPlaidBusy('Starting Plaid Link...')
    setAppError('')

    try {
      const { data: linkTokenData, error: linkTokenError } = await remoteEnabled.functions.invoke<{
        link_token?: string
      }>('plaid-create-link-token', { body: {} })

      if (linkTokenError) throw linkTokenError
      if (!linkTokenData?.link_token) throw new Error('Plaid did not return a Link token.')

      await loadPlaidLinkScript()
      const plaid = window.Plaid
      if (!plaid) throw new Error('Plaid Link did not load.')

      const handler = plaid.create({
        token: linkTokenData.link_token,
        onSuccess: (publicToken, metadata) => {
          void exchangePlaidPublicToken(publicToken, metadata)
          handler.destroy()
        },
        onExit: (error) => {
          stopPlaidBusy()
          if (error) setAppError('Plaid Link exited before completing the connection.')
        },
      })

      handler.open()
    } catch (error) {
      stopPlaidBusy()
      setAppError(errorMessage(error, 'Unable to start Plaid Link.'))
    }
  }

  async function exchangePlaidPublicToken(publicToken: string, metadata: PlaidLinkMetadata) {
    if (!remoteEnabled || !session) return

    startPlaidBusy('Connecting Plaid accounts...')
    setAppError('')

    try {
      const { data, error } = await remoteEnabled.functions.invoke<{
        institution_name?: string
        accounts?: Array<{
          plaid_account_id: string
          name: string
          official_name?: string | null
          type: string
          subtype?: string | null
          mask?: string | null
          available_balance?: number | null
          current_balance?: number | null
          limit_amount?: number | null
          iso_currency_code?: string | null
        }>
      }>('plaid-exchange-public-token', {
        body: {
          public_token: publicToken,
          metadata,
        },
      })

      if (error) throw error

      setPlaidAccounts(
        (data?.accounts ?? []).map((account) => ({
          plaidAccountId: account.plaid_account_id,
          institutionName: data?.institution_name ?? metadata.institution?.name,
          name: account.name,
          officialName: account.official_name ?? undefined,
          type: account.type,
          subtype: account.subtype ?? undefined,
          mask: account.mask ?? undefined,
          availableBalance: account.available_balance,
          currentBalance: account.current_balance,
          limitAmount: account.limit_amount,
          isoCurrencyCode: account.iso_currency_code,
        })),
      )
      setNotice('Plaid connected. Review the account preview before mapping balances.')
      await loadRemoteData()
    } catch (error) {
      setAppError(errorMessage(error, 'Unable to exchange Plaid token.'))
    } finally {
      stopPlaidBusy()
    }
  }

  async function updatePlaidAccountMapping(plaidAccountId: string, linkedAccountId: string) {
    if (!remoteEnabled || !session) {
      setAppError('Sign in with Supabase before mapping Plaid accounts.')
      return
    }

    const nextLinkedAccountId = linkedAccountId || undefined
    setPlaidAccounts((current) =>
      current.map((account) =>
        account.plaidAccountId === plaidAccountId ? { ...account, linkedAccountId: nextLinkedAccountId } : account,
      ),
    )

    startPlaidBusy('Saving Plaid account mapping...')

    try {
      const { error } = await remoteEnabled
        .from('plaid_accounts')
        .update({ linked_account_id: linkedAccountId || null, updated_at: new Date().toISOString() })
        .eq('plaid_account_id', plaidAccountId)

      if (error) {
        setAppError(error.message)
        await loadRemoteData()
      }
    } finally {
      stopPlaidBusy()
    }
  }

  async function refreshPlaidBalances() {
    if (!remoteEnabled || !session) {
      setAppError('Sign in with Supabase before refreshing Plaid balances.')
      return
    }
    if (plaidItemIds.length === 0) return

    startPlaidBusy('Refreshing Plaid balances...')
    setAppError('')

    try {
      for (const plaidItemId of plaidItemIds) {
        const { error } = await remoteEnabled.functions.invoke('plaid-refresh-accounts', {
          body: {
            plaid_item_id: plaidItemId,
          },
        })

        if (error) throw error
      }

      await loadRemoteData()
      setNotice(`Refreshed ${plaidItemIds.length} Plaid connection${plaidItemIds.length === 1 ? '' : 's'}.`)
    } catch (error) {
      setAppError(errorMessage(error, 'Unable to refresh Plaid balances.'))
    } finally {
      stopPlaidBusy()
    }
  }

  async function syncMappedPlaidBalances() {
    if (!remoteEnabled || !session) {
      setAppError('Sign in with Supabase before syncing Plaid balances.')
      return
    }

    const syncableAccounts = mappedPlaidAccounts.filter((plaidAccount) =>
      accounts.some((account) => account.id === plaidAccount.linkedAccountId),
    )
    if (syncableAccounts.length === 0) return

    startPlaidBusy('Syncing mapped balances...')
    setAppError('')

    try {
      for (const plaidAccount of syncableAccounts) {
        const linkedAccount = accounts.find((account) => account.id === plaidAccount.linkedAccountId)
        if (!linkedAccount || typeof plaidAccount.currentBalance !== 'number') continue

        await updateAccount(linkedAccount.id, {
          balance: normalizePlaidBalanceForAccount(plaidAccount.currentBalance, linkedAccount.type),
        })
      }

      await loadRemoteData()
      setNotice(`Synced ${syncableAccounts.length} mapped Plaid balance${syncableAccounts.length === 1 ? '' : 's'}.`)
    } finally {
      stopPlaidBusy()
    }
  }

  async function disconnectPlaidItem(plaidItemId: string, institutionName: string) {
    if (!remoteEnabled || !session) {
      setAppError('Sign in with Supabase before disconnecting Plaid.')
      return
    }

    const confirmed = window.confirm(
      `Disconnect ${institutionName}? This removes the Plaid connection and stored Plaid account mappings, but keeps app accounts and imported transactions.`,
    )
    if (!confirmed) return

    startPlaidBusy(`Disconnecting ${institutionName}...`)
    setAppError('')

    try {
      const { error } = await remoteEnabled.functions.invoke('plaid-disconnect-item', {
        body: {
          plaid_item_id: plaidItemId,
        },
      })

      if (error) throw error

      setPlaidTransactionRows((current) => current.filter((row) => row.plaidItemId !== plaidItemId))
      setPlaidTransactionCursors((current) => {
        const next = { ...current }
        delete next[plaidItemId]
        return next
      })
      await loadRemoteData()
      setNotice(`Disconnected ${institutionName}.`)
    } catch (error) {
      setAppError(errorMessage(error, 'Unable to disconnect Plaid connection.'))
    } finally {
      stopPlaidBusy()
    }
  }

  async function previewPlaidTransactions() {
    if (!remoteEnabled || !session) {
      setAppError('Sign in with Supabase before previewing Plaid transactions.')
      return
    }
    if (plaidItemIds.length === 0) return

    startPlaidBusy('Previewing Plaid transactions...')
    setAppError('')

    try {
      const rows: PlaidTransactionPreview[] = []
      const nextCursors: Record<string, string> = {}
      const previewStats: PlaidTransactionPreviewStats = { added: 0, modified: 0, removed: 0 }
      const existingKeys = new Set(
        transactions.map((transaction) =>
          transactionDedupeKey(
            transaction.accountId,
            transaction.date,
            transaction.amount,
            transaction.description,
          ),
        ),
      )
      const existingPlaidTransactionIds = new Set(
        transactions
          .filter((transaction) => transaction.source === 'bank_api' && transaction.externalId)
          .map((transaction) => transaction.externalId as string),
      )

      for (const plaidItemId of plaidItemIds) {
        const { data, error } = await remoteEnabled.functions.invoke<{
          next_cursor?: string
          added_count?: number
          modified_count?: number
          removed_count?: number
          transactions?: Array<{
            update_type: 'added' | 'modified'
            plaid_transaction_id: string
            pending_transaction_id?: string | null
            plaid_account_id: string
            linked_account_id: string
            plaid_account_name?: string
            date: string
            description: string
            original_description?: string
            amount: number
            pending: boolean
          }>
        }>('plaid-preview-transactions', {
          body: {
            plaid_item_id: plaidItemId,
          },
        })

        if (error) throw error
        if (data?.next_cursor) nextCursors[plaidItemId] = data.next_cursor
        previewStats.added += data?.added_count ?? 0
        previewStats.modified += data?.modified_count ?? 0
        previewStats.removed += data?.removed_count ?? 0

        for (const transaction of data?.transactions ?? []) {
          const category =
            applyTransactionMatchRules(transaction.description, transaction.amount, matchRules, transaction.linked_account_id) ||
            inferCategory(transaction.description)
          const duplicate = existingKeys.has(
            transactionDedupeKey(
              transaction.linked_account_id,
              transaction.date,
              transaction.amount,
              transaction.description,
            ),
          ) || existingPlaidTransactionIds.has(transaction.plaid_transaction_id)

          const modeledOutcome = initialPlaidModeledOutcome({ duplicate, pending: transaction.pending })
          rows.push({
            id: transaction.plaid_transaction_id,
            updateType: transaction.update_type,
            plaidTransactionId: transaction.plaid_transaction_id,
            pendingTransactionId: transaction.pending_transaction_id,
            plaidItemId,
            plaidAccountId: transaction.plaid_account_id,
            accountId: transaction.linked_account_id,
            plaidAccountName: transaction.plaid_account_name,
            date: transaction.date,
            description: transaction.description,
            originalDescription: transaction.original_description,
            amount: transaction.amount,
            category,
            modeledOutcome,
            pending: transaction.pending,
            shouldImport: modeledOutcome === 'import',
            duplicate,
          })
        }
      }

      const modeledRows = detectPlaidTransferOutcomes(rows, accounts)
      modeledRows.sort((a, b) => b.date.localeCompare(a.date))
      setPlaidTransactionRows(modeledRows)
      setPlaidTransactionCursors(nextCursors)
      setPlaidTransactionPreviewStats(previewStats)
      setNotice(`Previewed ${modeledRows.length} Plaid transaction update${modeledRows.length === 1 ? '' : 's'}.`)
    } catch (error) {
      setAppError(errorMessage(error, 'Unable to preview Plaid transactions.'))
    } finally {
      stopPlaidBusy()
    }
  }

  function updatePlaidTransactionRow(rowId: string, patch: Partial<PlaidTransactionPreview>) {
    setPlaidTransactionRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row
        const next = { ...row, ...patch }
        if (patch.modeledOutcome) {
          next.shouldImport = shouldImportPlaidPreviewRow(next)
        }
        return next
      }),
    )
  }

  async function commitPlaidTransactionCursors() {
    if (!remoteEnabled || !session) return

    for (const [plaidItemId, nextCursor] of Object.entries(plaidTransactionCursors)) {
      const { error } = await remoteEnabled.functions.invoke('plaid-commit-transaction-cursor', {
        body: {
          plaid_item_id: plaidItemId,
          next_cursor: nextCursor,
        },
      })

      if (error) throw error
    }
  }

  async function markPlaidTransactionPreviewReviewed() {
    if (!remoteEnabled || !session) {
      setAppError('Sign in with Supabase before committing Plaid transaction sync.')
      return
    }
    if (Object.keys(plaidTransactionCursors).length === 0) return
    if (hasReviewBlockingPlaidRows(plaidTransactionRows)) {
      setAppError('Resolve Plaid transaction rows marked Review first before committing the cursor.')
      return
    }

    startPlaidBusy('Marking Plaid preview reviewed...')
    setAppError('')

    try {
      await commitPlaidTransactionCursors()
      setPlaidTransactionRows([])
      setPlaidTransactionCursors({})
      setPlaidTransactionPreviewStats({ added: 0, modified: 0, removed: 0 })
      await loadRemoteData()
      setNotice('Marked Plaid transaction preview reviewed.')
    } catch (error) {
      setAppError(errorMessage(error, 'Unable to commit Plaid cursor.'))
    } finally {
      stopPlaidBusy()
    }
  }

  async function importPlaidTransactionRows() {
    if (!remoteEnabled || !session) {
      setAppError('Sign in with Supabase before importing Plaid transactions.')
      return
    }

    const rowsToImport = plaidTransactionRows.filter(shouldImportPlaidPreviewRow)
    if (rowsToImport.length === 0) return
    if (hasReviewBlockingPlaidRows(plaidTransactionRows)) {
      setAppError('Resolve Plaid transaction rows marked Review first before importing ready rows.')
      return
    }

    startPlaidBusy('Importing Plaid transactions...')
    setAppError('')

    try {
      const categoryIds = new Map<string, string>()
      for (const category of [...new Set(rowsToImport.map((row) => row.category))]) {
        categoryIds.set(category, await ensureRemoteCategory(category))
      }

      const { error } = await remoteEnabled.from('transactions').upsert(
        rowsToImport.map((row) => ({
          user_id: session.user.id,
          account_id: row.accountId,
          category_id: categoryIds.get(row.category),
          transaction_date: row.date,
          description: row.description,
          amount: row.amount,
          source: 'bank_api',
          external_id: row.plaidTransactionId,
          pending_external_id: row.pendingTransactionId,
          original_description: row.originalDescription ?? null,
          role: roleForPlaidModeledOutcome(row.modeledOutcome),
          transfer_group_id: row.transferGroupId,
          modeled_outcome: row.modeledOutcome,
          dedupe_key: transactionDedupeKey(row.accountId, row.date, row.amount, row.description),
          notes: row.originalDescription ? `Plaid original: ${row.originalDescription}` : null,
        })),
        { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true },
      )

      if (error) throw error

      await commitPlaidTransactionCursors()

      await loadRemoteData()
      setPlaidTransactionRows([])
      setPlaidTransactionCursors({})
      setPlaidTransactionPreviewStats({ added: 0, modified: 0, removed: 0 })
      setNotice(`Imported ${rowsToImport.length} Plaid transaction${rowsToImport.length === 1 ? '' : 's'}.`)
    } catch (error) {
      setAppError(errorMessage(error, 'Unable to import Plaid transactions.'))
    } finally {
      stopPlaidBusy()
    }
  }

  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = categoryForm.name.trim()
    if (!name) return

    if (remoteEnabled && session) {
      const { error } = await remoteEnabled.from('categories').upsert(
        {
          user_id: session.user.id,
          name,
          color: categoryForm.color,
          category_type: categoryForm.type,
          parent_id: categoryForm.parentId || null,
          role: categoryForm.role || null,
          budgetable: categoryForm.budgetable,
          is_archived: false,
        },
        { onConflict: 'user_id,name' },
      )
      if (error) {
        setAppError(error.message)
        return
      }
      await loadRemoteData()
    } else {
      setLocalCategories((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          name,
          color: categoryForm.color,
          type: categoryForm.type,
          parentId: categoryForm.parentId || undefined,
          role: categoryForm.role || undefined,
          budgetable: categoryForm.budgetable,
          isArchived: false,
        },
      ])
    }

    setCategoryForm({ name: '', color: categoryPalette[0], type: 'expense', parentId: '', role: '', budgetable: true })
  }

  async function updateCategory(categoryId: string, patch: Partial<Category>) {
    if (remoteEnabled && session) {
      setRemoteCategories((current) =>
        current.map((category) => (category.id === categoryId ? { ...category, ...patch } : category)),
      )
      const { error } = await remoteEnabled
        .from('categories')
        .update({
          name: patch.name,
          color: patch.color,
          category_type: patch.type,
          parent_id: patch.parentId === undefined ? null : patch.parentId,
          role: patch.role === undefined ? null : patch.role,
          budgetable: patch.budgetable,
          is_archived: patch.isArchived,
        })
        .eq('id', categoryId)
      if (error) {
        setAppError(error.message)
        await loadRemoteData()
      }
    } else {
      setLocalCategories((current) =>
        current.map((category) => (category.id === categoryId ? { ...category, ...patch } : category)),
      )
    }
  }

  async function addTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = tagForm.name.trim()
    if (!name) return

    if (remoteEnabled && session) {
      const { error } = await remoteEnabled.from('tags').upsert(
        {
          user_id: session.user.id,
          name,
          color: tagForm.color,
          is_archived: false,
        },
        { onConflict: 'user_id,name' },
      )
      if (error) {
        setAppError(error.message)
        return
      }
      await loadRemoteData()
    } else {
      setLocalTags((current) => [
        ...current,
        { id: crypto.randomUUID(), name, color: tagForm.color, isArchived: false },
      ])
    }

    setTagForm({ name: '', color: categoryPalette[1] })
  }

  async function updateTag(tagId: string, patch: Partial<Tag>) {
    if (remoteEnabled && session) {
      setRemoteTags((current) => current.map((tag) => (tag.id === tagId ? { ...tag, ...patch } : tag)))
      const { error } = await remoteEnabled
        .from('tags')
        .update({ name: patch.name, color: patch.color, is_archived: patch.isArchived })
        .eq('id', tagId)
      if (error) {
        setAppError(error.message)
        await loadRemoteData()
      }
    } else {
      setLocalTags((current) => current.map((tag) => (tag.id === tagId ? { ...tag, ...patch } : tag)))
    }
  }

  function parseCsv(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const normalized = results.data
          .map((row) => normalizeCsvRow(row, matchRules, selectedImportAccountId))
          .filter((row): row is CsvPreviewRow => Boolean(row))
        setCsvRows(normalized)
      },
    })
  }

  function updateCsvRow(rowId: string, patch: Partial<CsvPreviewRow>) {
    setCsvRows((current) => current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)))
  }

  async function importCsvRows() {
    if (!selectedImportAccountId) return
    const existingKeys = new Set(
      transactions.map((transaction) =>
        transactionDedupeKey(
          transaction.accountId,
          transaction.date,
          transaction.amount,
          transaction.description,
        ),
      ),
    )
    const rowsToImport = csvRows.filter((row) => {
      const key = transactionDedupeKey(selectedImportAccountId, row.date, row.amount, row.description)
      return row.shouldImport && !existingKeys.has(key)
    })

    if (remoteEnabled && session) {
      const { data: importRecord, error: importError } = await remoteEnabled
        .from('imports')
        .insert({
          user_id: session.user.id,
          account_id: selectedImportAccountId,
          row_count: rowsToImport.length,
        })
        .select('id')
        .single()

      if (importError) {
        setAppError(importError.message)
        return
      }

      const categoryIds = new Map<string, string>()
      for (const category of [...new Set(rowsToImport.map((row) => row.category))]) {
        categoryIds.set(category, await ensureRemoteCategory(category))
      }

      const { error } = await remoteEnabled.from('transactions').upsert(
        rowsToImport.map((row) => ({
          user_id: session.user.id,
          account_id: selectedImportAccountId,
          category_id: categoryIds.get(row.category),
          import_id: importRecord.id,
          transaction_date: row.date,
          description: row.description,
          amount: row.amount,
          source: 'csv',
          external_id: row.externalId,
          notes: row.notes,
          dedupe_key: transactionDedupeKey(selectedImportAccountId, row.date, row.amount, row.description),
        })),
        { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true },
      )

      if (error) {
        setAppError(error.message)
        return
      }

      await loadRemoteData()
    } else {
      setLocalTransactions((current) => [
        ...rowsToImport.map((row) => ({
          id: crypto.randomUUID(),
          date: row.date,
          accountId: selectedImportAccountId,
          description: row.description,
          category: row.category,
          amount: row.amount,
          source: 'csv' as const,
          tagIds: [],
        })),
        ...current,
      ])
    }

    setCsvRows([])
  }

  async function ensureRemoteCategory(name: string) {
    if (!remoteEnabled || !session) return ''
    const existing = remoteCategories.find((category) => category.name === name)
    if (existing) return existing.id

    const { data, error } = await remoteEnabled
      .from('categories')
      .upsert({
        user_id: session.user.id,
        name,
        color: categoryColors[name] ?? categoryPalette[remoteCategories.length % categoryPalette.length],
        category_type: isIncomeCategory(name) ? 'income' : name === 'Transfers' ? 'transfer' : 'expense',
        budgetable: !isProjectionCategory(name) && name !== 'Transfers',
        is_archived: false,
      }, { onConflict: 'user_id,name' })
      .select('id,name,color,category_type,budgetable,is_archived')
      .single()

    if (error) {
      setAppError(error.message)
      throw error
    }

    setRemoteCategories((current) => [
      ...current,
      {
        id: data.id,
        name: data.name,
        color: data.color,
        type: data.category_type,
        budgetable: data.budgetable,
        isArchived: data.is_archived,
      },
    ])
    return data.id
  }

  if (!authReady) {
    if (!showAuthLoading) return null
    return <FullPageState title="Connecting to Supabase" body="Checking the current auth session." />
  }

  if (remoteEnabled && !session) {
    return <AuthScreen setAppError={setAppError} setNotice={setNotice} appError={appError} notice={notice} />
  }

  const sidebar = sidebarCollapsed ? null : (
    <Sidebar
      footer={
        <Stack gap="sm">
          <Inline align="center" gap="sm">
            <ShieldCheck size={18} />
            <Stack gap="none">
              <Text size="sm" weight="semibold">
                {isRemoteSignedIn ? 'Supabase connected' : 'Local browser storage'}
              </Text>
              <Text size="xs" tone="muted">
                {session?.user.email ?? 'Data persists on this device'}
              </Text>
            </Stack>
          </Inline>

          {isRemoteSignedIn && (
            <Button fullWidth onClick={() => supabase?.auth.signOut()} size="sm" variant="ghost">
              <LogOut size={17} />
              Sign out
            </Button>
          )}
        </Stack>
      }
      header={<AppBrand subtitle="Personal finance" />}
      width="220px"
    >
      <Nav label="Primary">
        {primaryNavItems.map(([id, label, Icon]) => (
          <NavItem
            active={activeView === id}
            href={`#${id}`}
            key={id}
            onClick={(event) => {
              event.preventDefault()
              setActiveView(id)
            }}
          >
            <Icon size={18} />
            {label}
          </NavItem>
        ))}
      </Nav>
    </Sidebar>
  )

  return (
    <AppShell
      className={`finance-shell finance-shell--${activeView}`}
      header={
        <Header
          actions={
            <Inline align="center" gap="xs" wrap>
              <MonthSelector onMonthChange={setSelectedMonth} selectedMonth={selectedMonth} />
              <Button disabled={activeAccounts.length === 0} onClick={() => setActiveView('transactions')} size="sm">
                <Plus size={18} />
                Add transaction
              </Button>
            </Inline>
          }
          brand={
            <Inline align="center" gap="sm">
              <IconButton
                label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                size="sm"
                variant="ghost"
              >
                {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
              </IconButton>
              <Stack gap="none">
                <Text as="span" size="xs" tone="muted" weight="bold">
                  {formatMonthLabel(selectedMonth)}
                </Text>
                <Text as="h1" size="xl" weight="bold">
                  {viewTitle(activeView)}
                </Text>
              </Stack>
            </Inline>
          }
        />
      }
      leftSidebar={sidebar}
    >
      <LoadingOverlay active={showLoadingData} label="Loading Supabase data">
        <Stack gap="sm">
        {appError && (
          <Alert tone="danger">
            {appError}
          </Alert>
        )}

        {!isInitialRemoteDataLoading && (
        <>
            {activeView === 'dashboard' && (
              <DashboardView
                activeCategoryByName={activeCategoryByName}
                actualVariableSpend={actualVariableSpend}
                cashflowAccounts={monthlyCashSummary.cashflowScopedAccounts}
                currentCashPosition={monthlyCashSummary.cashOnHand}
                monthPositionTrend={monthPositionTrend}
                onOpenAccounts={() => setActiveView('accounts')}
                remainingPlannedSpend={remainingPlannedSpend}
                savingsGoalVariance={monthlyCashSummary.savingsGoalVariance}
                spendByCategory={spendByCategory}
                totalBudgetRemaining={totalBudgetRemaining}
                trackedMonthEndPosition={monthlyCashSummary.projectedMonthEndCashBalance}
                unpaidCreditCardLiability={monthlyCashSummary.unpaidCreditCardLiability}
              />
            )}

            {activeView === 'accounts' && (
              <AccountsView
                accountForm={accountForm}
                accountInitialValue={accountInitialValue}
                accounts={accounts}
                activeAccountCount={activeAccounts.length}
                onAccountFormChange={setAccountForm}
                onAddAccount={addAccount}
                onUpdateAccount={updateAccount}
              />
            )}

            {activeView === 'plaid' && (
              <PlaidView
                accounts={accounts}
                balanceStatusByAccountId={plaidBalanceStatusByAccountId}
                busyMessage={plaidBusyMessage}
                categoryLabels={categoryLabels}
                connections={plaidConnections}
                institutionCount={plaidInstitutionCount}
                isRemoteSignedIn={isRemoteSignedIn}
                mappedAccountCount={mappedPlaidAccounts.length}
                mappedPlaidAccountCount={mappedPlaidAccounts.length}
                onConnect={connectPlaid}
                onDisconnectItem={(plaidItemId, institutionName) => {
                  void disconnectPlaidItem(plaidItemId, institutionName)
                }}
                onImportTransactions={importPlaidTransactionRows}
                onMarkTransactionsReviewed={markPlaidTransactionPreviewReviewed}
                onPreviewTransactions={previewPlaidTransactions}
                onRefreshBalances={refreshPlaidBalances}
                onSyncBalances={syncMappedPlaidBalances}
                onUpdateAccountMapping={(plaidAccountId, linkedAccountId) => {
                  void updatePlaidAccountMapping(plaidAccountId, linkedAccountId)
                }}
                onUpdateTransactionRow={updatePlaidTransactionRow}
                plaidAccounts={plaidAccounts}
                plaidItemCount={plaidItemIds.length}
                transactionCursorCount={Object.keys(plaidTransactionCursors).length}
                transactionPreviewStats={plaidTransactionPreviewStats}
                transactionRows={plaidTransactionRows}
                working={plaidWorking}
              />
            )}

            {activeView === 'categories' && (
              <CategoriesView
                categories={categories}
                categoryForm={categoryForm}
                onAddCategory={addCategory}
                onAddTag={addTag}
                onCategoryFormChange={setCategoryForm}
                onTagFormChange={setTagForm}
                onUpdateCategory={updateCategory}
                onUpdateTag={updateTag}
                tagForm={tagForm}
                tags={tags}
              />
            )}

            {activeView === 'transactions' && (
              <TransactionsView
                accounts={accounts}
                activeAccounts={activeAccounts}
                activeCategories={activeCategories}
                activeTags={activeTags}
                categoryLabels={categoryLabels}
                columnVisibility={transactionColumns}
                selectedMonthLabel={formatMonthLabel(selectedMonth)}
                displayedTransactions={displayedTransactions}
                isSelectedMonthOnly={showSelectedMonthTransactions}
                newTransaction={newTransaction}
                onAddTransaction={addTransaction}
                onColumnVisibilityChange={setTransactionColumns}
                onSelectedMonthOnlyChange={setShowSelectedMonthTransactions}
                onDeleteTransaction={deleteTransaction}
                onNewTransactionChange={setNewTransaction}
                onOpenAccounts={() => setActiveView('accounts')}
                onUpdateTransaction={updateTransaction}
                selectedAccountId={selectedTransactionAccountId}
                selectedCategory={selectedTransactionCategory}
                totalTransactionCount={transactions.length}
              />
            )}

            {activeView === 'import' && (
              <ImportView
                accounts={activeAccounts}
                categoryLabels={categoryLabels}
                csvRows={csvRows}
                onImportRows={importCsvRows}
                onOpenAccounts={() => setActiveView('accounts')}
                onParseCsv={parseCsv}
                onSelectedAccountChange={setImportAccountId}
                onUpdateCsvRow={updateCsvRow}
                selectedAccountId={selectedImportAccountId}
              />
            )}

            {activeView === 'expenses' && (
              <ExpensesView
                accountById={activeAccountNameById}
                accounts={activeAccounts}
                categoryLabels={categoryLabels}
                defaultCategory={firstExpenseCategory}
                expectedExpenseSpend={expectedExpenseSpend}
                focusItemId={pendingRecurringFocusId}
                focusRef={recurringFocusRef}
                monthlyRecurringItems={expectedMonthlyRecurringExpenseItems}
                monthlyRecurringSpend={monthlyRecurringSpend}
                onAddBlank={(kind) => void addBlankExpectedExpense(kind)}
                onDelete={deleteExpectedCashflow}
                onDismiss={dismissRecurringCandidate}
                onOpenAccounts={() => setActiveView('accounts')}
                onPersist={persistRecurringCandidate}
                onUpdate={updateExpectedCashflow}
                subscriptionItems={expectedSubscriptionItems}
                subscriptionServicesSpend={subscriptionServicesSpend}
              />
            )}

            {activeView === 'income' && (
              <IncomeView
                accountById={activeAccountNameById}
                accounts={activeAccounts}
                categoryLabels={categoryLabels}
                defaultCategory={firstIncomeCategory}
                expectedIncomeItems={expectedIncomeItems}
                form={recurringForm}
                monthlyRecurringFlow={monthlyRecurringFlow}
                monthlyRecurringIncome={monthlyRecurringIncome}
                onAdd={addMonthlyRecurring}
                onDelete={deleteExpectedCashflow}
                onDismiss={dismissRecurringCandidate}
                onFormChange={setRecurringForm}
                onOpenAccounts={() => setActiveView('accounts')}
                onPersist={persistRecurringCandidate}
                onUpdate={updateExpectedCashflow}
                subscriptionServicesSpend={subscriptionServicesSpend}
              />
            )}

            {activeView === 'budgets' && (
              <BudgetsView
                budgetDrafts={budgetDrafts}
                currentMonth={selectedMonth}
                onDraftChange={(category, value) =>
                  setBudgetDrafts((current) => ({
                    ...current,
                    [budgetDraftKey(selectedMonth, category)]: value,
                  }))
                }
                onSaveBudget={(category) => {
                  void saveBudgetDraft(category)
                }}
                rows={budgetRows}
                savingBudgetCategory={savingBudgetCategory}
                summary={budgetSummary}
              />
            )}

            {activeView === 'net-worth' && (
              <NetWorthView
                latestNetWorth={latestNetWorth}
                newSnapshot={newSnapshot}
                onAddSnapshot={addSnapshot}
                onNewSnapshotChange={setNewSnapshot}
                trend={netWorthTrend}
              />
            )}
        </>
        )}
        </Stack>
      </LoadingOverlay>
      <NoticeToast message={notice} onDismiss={dismissNotice} />
    </AppShell>
  )
}

function AuthScreen({
  appError,
  notice,
  setAppError,
  setNotice,
}: {
  appError: string
  notice: string
  setAppError: (message: string) => void
  setNotice: (message: string) => void
}) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [working, setWorking] = useState(false)
  const dismissNotice = useCallback(() => setNotice(''), [setNotice])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setWorking(true)
    setAppError('')
    setNotice('')

    const result =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    if (result.error) {
      setAppError(result.error.message)
    } else if (mode === 'sign-up' && !result.data.session) {
      setNotice('Check your email to confirm the account, then sign in here.')
    }

    setWorking(false)
  }

  return (
    <AppShell>
      <Panel>
        <PanelBody>
          <form onSubmit={submit}>
            <Stack gap="md">
              <AppBrand subtitle="Supabase-backed finance tracking" />
              <SegmentedControl
                label="Authentication mode"
                onValueChange={(value) => setMode(value as 'sign-in' | 'sign-up')}
                options={[
                  { label: 'Sign in', value: 'sign-in' },
                  { label: 'Sign up', value: 'sign-up' },
                ]}
                value={mode}
              />
              {appError && <Alert tone="danger">{appError}</Alert>}
              <Field>
                <Label>Email</Label>
                <Input autoComplete="email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
              </Field>
              <Field>
                <Label>Password</Label>
                <Input
                  autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                  minLength={6}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  value={password}
                />
              </Field>
              <Button disabled={working} type="submit">
                {working ? 'Working...' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
              </Button>
            </Stack>
          </form>
        </PanelBody>
      </Panel>
      <NoticeToast message={notice} onDismiss={dismissNotice} />
    </AppShell>
  )
}

function MonthSelector({
  onMonthChange,
  selectedMonth,
}: {
  onMonthChange: (month: string) => void
  selectedMonth: string
}) {
  const currentCalendarMonth = currentMonthString()
  const isCurrentMonth = selectedMonth === currentCalendarMonth

  return (
    <Inline align="center" gap="xs" wrap>
      <IconButton
        label="Previous month"
        onClick={() => onMonthChange(addMonthsToMonth(selectedMonth, -1))}
        size="sm"
        variant="ghost"
      >
        <ChevronLeft size={16} />
      </IconButton>
      <Input
        aria-label="Selected month"
        inputSize="sm"
        onChange={(event) => {
          if (event.target.value) onMonthChange(event.target.value)
        }}
        type="month"
        value={selectedMonth}
      />
      <IconButton
        label="Next month"
        onClick={() => onMonthChange(addMonthsToMonth(selectedMonth, 1))}
        size="sm"
        variant="ghost"
      >
        <ChevronRight size={16} />
      </IconButton>
      <Button disabled={isCurrentMonth} onClick={() => onMonthChange(currentCalendarMonth)} size="sm">
        <CalendarDays size={16} />
        Current
      </Button>
    </Inline>
  )
}

function AppBrand({ subtitle }: { className?: string; subtitle: string }) {
  return (
    <Inline align="center" gap="sm">
      <CircleDollarSign size={24} />
      <Stack gap="none">
        <Text size="sm" weight="semibold">
          Buy Some Coffee
        </Text>
        <Text size="xs" tone="muted">
          {subtitle}
        </Text>
      </Stack>
    </Inline>
  )
}

function NoticeToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const toast = useToast()

  useEffect(() => {
    if (!message) return

    toast.success({ title: message })
    onDismiss()
  }, [message, onDismiss, toast])

  return null
}

function FullPageState({ title, body }: { title: string; body: string }) {
  return (
    <AppShell>
      <Panel>
        <PanelBody>
          <Stack gap="sm">
            <Text as="h1" size="xl" weight="bold">{title}</Text>
            <Text tone="muted">{body}</Text>
          </Stack>
        </PanelBody>
      </Panel>
    </AppShell>
  )
}

function useLocalStorageState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = window.localStorage.getItem(key)
    if (!stored) return fallback

    try {
      return JSON.parse(stored) as T
    } catch {
      return fallback
    }
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

function useDelayedBoolean(value: boolean, delayMs: number) {
  const [delayedValue, setDelayedValue] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDelayedValue(value), value ? delayMs : 80)
    return () => window.clearTimeout(timeout)
  }, [delayMs, value])

  return delayedValue
}

function normalizeCsvRow(
  row: Record<string, string>,
  matchRules: TransactionMatchRule[] = [],
  accountId = '',
): CsvPreviewRow | null {
  const normalizedKeys = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeText(key), value]),
  )

  if (isMacuRow(normalizedKeys)) return normalizeMacuRow(normalizedKeys, matchRules, accountId)
  if (isCitiRow(normalizedKeys)) return normalizeCitiRow(normalizedKeys, matchRules, accountId)

  const rawDate = pickValue(normalizedKeys, [
    'date',
    'transactiondate',
    'postingdate',
    'posteddate',
    'postdate',
    'effectivedate',
  ])
  const rawDescription = pickValue(normalizedKeys, [
    'description',
    'extendeddescription',
    'memo',
    'name',
    'merchant',
    'payee',
  ])
  const category = pickValue(normalizedKeys, ['transactioncategory', 'category'])
  const rawAmount = pickValue(normalizedKeys, ['amount', 'transactionamount'])
  const rawDebit = pickValue(normalizedKeys, ['debit', 'withdrawal', 'outflow'])
  const rawCredit = pickValue(normalizedKeys, ['credit', 'deposit', 'inflow'])

  const amount =
    parseCurrency(rawAmount) ??
    (parseCurrency(rawCredit) ?? 0) - Math.abs(parseCurrency(rawDebit) ?? 0)
  const date = normalizeDate(rawDate)

  const description = cleanInstitutionDescription(rawDescription)

  if (!date || !description || amount === 0) return null

  return {
    id: crypto.randomUUID(),
    date,
    description,
    amount,
    category: normalizeCategory(category || applyTransactionMatchRules(description, amount, matchRules, accountId) || inferCategory(description)),
    shouldImport: true,
    notes: compactNotes([['Original Description', rawDescription !== description ? rawDescription : '']]),
  }
}

function isMacuRow(row: Record<string, string>) {
  return Boolean(row.transactionid && (row.postingdate || row.effectivedate))
}

function isCitiRow(row: Record<string, string>) {
  return Boolean(row.status && row.date && row.description && (row.debit || row.credit))
}

function normalizeMacuRow(
  row: Record<string, string>,
  matchRules: TransactionMatchRule[] = [],
  accountId = '',
): CsvPreviewRow | null {
  const date = normalizeDate(pickValue(row, ['postingdate', 'effectivedate']))
  const rawDescription = pickValue(row, ['description', 'extendeddescription', 'memo'])
  const description = cleanInstitutionDescription(rawDescription, 'macu')
  const amount = parseCurrency(row.amount)

  if (!date || !description || !amount) return null

  return {
    id: row.transactionid || crypto.randomUUID(),
    date,
    description,
    amount,
    category: normalizeCategory(
      row.transactioncategory || applyTransactionMatchRules(description, amount, matchRules, accountId) || inferCategory(description),
    ),
    shouldImport: true,
    externalId: row.transactionid,
    notes: compactNotes([
      ['Transaction Type', row.transactiontype],
      ['Type', row.type],
      ['Reference Number', row.referencenumber],
      ['Check Number', row.checknumber],
      ['Memo', row.memo],
      ['Extended Description', row.extendeddescription],
      ['Original Description', rawDescription !== description ? rawDescription : ''],
      ['Balance', row.balance],
    ]),
  }
}

function normalizeCitiRow(
  row: Record<string, string>,
  matchRules: TransactionMatchRule[] = [],
  accountId = '',
): CsvPreviewRow | null {
  const date = normalizeDate(row.date)
  const rawDescription = row.description
  const description = cleanInstitutionDescription(rawDescription, 'citi')
  const debit = parseCurrency(row.debit)
  const credit = parseCurrency(row.credit)
  const amount = Math.abs(credit ?? 0) - Math.abs(debit ?? 0)

  if (!date || !description || amount === 0) return null

  return {
    id: crypto.randomUUID(),
    date,
    description,
    amount,
    category: applyTransactionMatchRules(description, amount, matchRules, accountId) || inferCategory(description),
    shouldImport: true,
    notes: compactNotes([
      ['Status', row.status],
      ['Member Name', row.membername],
      ['Original Description', rawDescription !== description ? rawDescription : ''],
    ]),
  }
}

function pickValue(row: Record<string, string>, keys: string[]) {
  return keys.map((key) => row[key]).find(Boolean) ?? ''
}

function cleanInstitutionDescription(value: string, profile?: 'macu' | 'citi') {
  let description = value.replace(/\s+/g, ' ').trim()
  if (!description) return ''

  if (profile === 'macu') {
    const companyMatch = description.match(/\bCO:\s*(.*?)(?:\s+NAME:|\s+Entry Class Code:|$)/i)
    if (companyMatch?.[1]) return titleCaseDescription(companyMatch[1])

    description = description
      .replace(/^(Withdrawal|Deposit)\s+/i, '')
      .replace(/^Debit\s+/i, '')
      .replace(/\s+Date\s+\d{2}\/\d{2}\/\d{2}.*$/i, '')
      .replace(/\s+Card\s+\d+.*$/i, '')
  }

  if (profile === 'citi') {
    description = description.replace(/^(TST\*|PP\*|SQ \*|SP \*)/i, '')
  }

  description = description
    .replace(/\bSALT LAKE CITUT\b/gi, 'SALT LAKE CITY UT')
    .replace(/\s+\d{3}-\d{3}-\d{4}\s+[A-Z]{2}$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return titleCaseDescription(description)
}

function titleCaseDescription(value: string) {
  const preserved = new Set(['ACH', 'ATM', 'CITI', 'MACU', 'UT', 'CA', 'NV', 'WA', 'MI', 'NJ'])
  return value
    .toLowerCase()
    .split(' ')
    .map((word) => {
      const stripped = word.replace(/[^a-z0-9]/gi, '').toUpperCase()
      if (preserved.has(stripped)) return word.toUpperCase()
      return word.replace(/[a-z]/i, (letter) => letter.toUpperCase())
    })
    .join(' ')
}

function compactNotes(values: Array<[string, string | undefined]>) {
  const notes = values
    .filter(([, value]) => value?.trim())
    .map(([label, value]) => `${label}: ${value?.trim()}`)
  return notes.length ? notes.join('\n') : undefined
}

function normalizeDate(value: string) {
  if (!value) return ''
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoDate) return isoDate[0]
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : localDatePart(date)
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function applyTransactionMatchRules(
  description: string,
  amount: number,
  matchRules: TransactionMatchRule[],
  accountId = '',
) {
  const normalizedDescription = normalizeText(description)
  const amountSign = amount > 0 ? 'income' : 'expense'
  const matchedRule = matchRules
    .filter((rule) => rule.isActive !== false)
    .filter((rule) => !rule.accountId || !accountId || rule.accountId === accountId)
    .filter((rule) => rule.amountSign === 'any' || rule.amountSign === amountSign)
    .filter((rule) => rule.normalizedMatchText && normalizedDescription.includes(rule.normalizedMatchText))
    .sort((a, b) => b.normalizedMatchText.length - a.normalizedMatchText.length)[0]

  return matchedRule?.category
}

function buildRecurringCandidates(
  kind: RecurringKind,
  transactions: Transaction[],
  persistedItems: RecurringCashflow[],
  drafts: Record<string, Partial<RecurringCashflow>> = {},
  matchRules: TransactionMatchRule[] = [],
  dismissedCandidateIds: string[] = [],
) {
  const relevantTransactions = transactions.filter((transaction) => {
    if (kind === 'subscription') {
      return isSubscriptionCategory(transaction.category) && transaction.amount < 0
    }

    return transaction.category === monthlyRecurringCategoryName || isIncomeCategory(transaction.category)
  })

  const grouped = new Map<string, Transaction[]>()
  relevantTransactions.forEach((transaction) => {
    const key = [
      transaction.accountId,
      transaction.category,
      normalizeText(transaction.description),
      transaction.amount > 0 ? 'income' : 'expense',
    ].join('|')
    grouped.set(key, [...(grouped.get(key) ?? []), transaction])
  })

  return [...grouped.entries()]
    .flatMap(([key, groupedTransactions]) =>
      groupTransactionsByAmountTolerance(groupedTransactions).map((candidateTransactions, index) => {
        const latest = candidateTransactions.toSorted((a, b) => b.date.localeCompare(a.date))[0]
        const amountKey = Math.round(Math.abs(latest.amount))
        const candidateId = `candidate-${kind}-${key}|${amountKey}|${index}`
        return normalizeRecurringCashflow({
          id: candidateId,
          kind,
          name: latest.description,
          accountId: latest.accountId,
          category: latest.category,
          amount: latest.amount,
          day: clampMonthDay(Number(latest.date.slice(8, 10))),
          frequency: 'monthly' as const,
          nextDueDate: latest.date,
          isActive: true,
          isPersisted: false,
          sourceDescription: latest.description,
          sourceTransactionId: latest.id,
          ...(drafts[candidateId] ?? {}),
        })
      })
    )
    .filter(
      (candidate) =>
        !dismissedCandidateIds.includes(candidate.id) &&
        !persistedItems.some(
          (item) =>
            item.accountId === candidate.accountId &&
            recurringCategoriesMatch(item.category, candidate.category) &&
            Math.abs(item.amount - candidate.amount) <= 1 &&
            recurringSourceMatches(item, candidate),
        ) && !candidateMatchesExistingRule(candidate, matchRules),
    )
    .sort((a, b) => a.day - b.day || a.name.localeCompare(b.name))
}

function groupTransactionsByAmountTolerance(transactions: Transaction[], tolerance = 1) {
  const sorted = transactions.toSorted((a, b) => Math.abs(a.amount) - Math.abs(b.amount))
  const groups: Transaction[][] = []

  sorted.forEach((transaction) => {
    const group = groups.find((candidateGroup) =>
      candidateGroup.some((groupedTransaction) => Math.abs(groupedTransaction.amount - transaction.amount) <= tolerance),
    )
    if (group) {
      group.push(transaction)
    } else {
      groups.push([transaction])
    }
  })

  return groups
}

function candidateMatchesExistingRule(candidate: RecurringCashflow, matchRules: TransactionMatchRule[]) {
  const sourceDescription = candidate.sourceDescription || candidate.name
  const normalizedSource = normalizeText(sourceDescription)
  const amountSign = candidate.amount > 0 ? 'income' : 'expense'

  return matchRules
    .filter((rule) => rule.isActive !== false)
    .filter((rule) => !rule.accountId || rule.accountId === candidate.accountId)
    .filter((rule) => recurringCategoriesMatch(rule.category, candidate.category))
    .filter((rule) => rule.amountSign === 'any' || rule.amountSign === amountSign)
    .some((rule) => rule.normalizedMatchText && normalizedSource.includes(rule.normalizedMatchText))
}

function recurringCategoriesMatch(left: string, right: string) {
  if (left === right) return true
  return isIncomeCategory(left) && isIncomeCategory(right)
}

function recurringSourceMatches(item: RecurringCashflow, candidate: RecurringCashflow) {
  if (item.sourceTransactionId && candidate.sourceTransactionId) {
    return item.sourceTransactionId === candidate.sourceTransactionId
  }

  const itemSource = item.sourceDescription || item.name
  const candidateSource = candidate.sourceDescription || candidate.name
  return descriptionsMatch(itemSource, candidateSource)
}

function descriptionsMatch(left: string, right: string) {
  const normalizedLeft = normalizeText(left)
  const normalizedRight = normalizeText(right)
  return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)
}

function transactionDedupeKey(accountId: string, date: string, amount: number, description: string) {
  return [accountId, date, amount.toFixed(2), normalizeText(description)].join('|')
}

function relationName(value: unknown) {
  if (Array.isArray(value)) return String(value[0]?.name ?? uncategorizedCategoryName)
  if (value && typeof value === 'object' && 'name' in value) return String(value.name)
  return uncategorizedCategoryName
}

function relationInstitutionName(value: unknown) {
  if (Array.isArray(value)) return String(value[0]?.institution_name ?? '')
  if (value && typeof value === 'object' && 'institution_name' in value) {
    return String(value.institution_name ?? '')
  }
  return ''
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) return String(error.message)
  return fallback
}

function loadPlaidLinkScript() {
  if (window.Plaid) return Promise.resolve()

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Plaid Link.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Unable to load Plaid Link.'))
    document.head.appendChild(script)
  })
}

function inferCategory(_description?: string) {
  void _description
  return uncategorizedCategoryName
}

function viewTitle(view: string) {
  const titles: Record<string, string> = {
    dashboard: 'Current Month',
    accounts: 'Accounts',
    plaid: 'Plaid',
    categories: 'Categories',
    transactions: 'Transactions',
    import: 'Import CSV',
    expenses: 'Expenses',
    income: 'Income',
    budgets: 'Budgets',
    'net-worth': 'Net Worth',
  }
  return titles[view] ?? 'Dashboard'
}

function isKnownView(view: string) {
  return knownViewIds.has(view)
}

export default App
