
import { useMemo, useState } from "react";

import {
  Wallet,
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Settings,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  ShoppingBag,
  Briefcase,
  Menu,
  X,
  Download,
  Trash2,
  Pencil,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "./App.css";

// ==========================================
// INITIAL DATA
// ==========================================

const initialTransactions = [
  {
    id: 1,
    title: "Monthly Salary",
    category: "Income",
    date: "Nov 20, 2026",
    amount: 4500,
    type: "income",
  },
  {
    id: 2,
    title: "Grocery Shopping",
    category: "Food",
    date: "Nov 19, 2026",
    amount: 125,
    type: "expense",
  },
  {
    id: 3,
    title: "Netflix Subscription",
    category: "Entertainment",
    date: "Nov 18, 2026",
    amount: 15,
    type: "expense",
  },
  {
    id: 4,
    title: "Apartment Rent",
    category: "Housing",
    date: "Nov 17, 2026",
    amount: 950,
    type: "expense",
  },
  {
    id: 5,
    title: "Uber Ride",
    category: "Transport",
    date: "Nov 16, 2026",
    amount: 32,
    type: "expense",
  },
];

const chartData = [
  { month: "Jun", income: 3800, expenses: 2100 },
  { month: "Jul", income: 4200, expenses: 2400 },
  { month: "Aug", income: 3900, expenses: 1900 },
  { month: "Sep", income: 4500, expenses: 2600 },
  { month: "Oct", income: 4300, expenses: 2300 },
  { month: "Nov", income: 4500, expenses: 1122 },
];

const initialBudgets = [
  { name: "Housing", limit: 1200, color: "#9b8cff" },
  { name: "Food", limit: 600, color: "#50d5b7" },
  { name: "Transport", limit: 300, color: "#f5b85c" },
];

const categoryColors = {
  Housing: "#9b8cff",
  Food: "#50d5b7",
  Transport: "#f5b85c",
  Entertainment: "#6b91ff",
  Health: "#f08caa",
  Other: "#8c94a8",
  Income: "#50d5b7",
};

// ==========================================
// HELPERS
// ==========================================

const money = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

function getCurrentMonthKey() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

// ==========================================
// REUSABLE BUDGET ALERT
// ==========================================

function BudgetAlert({ budget }) {
  const overBudget = budget.percentage >= 100;
  const warning =
    budget.percentage >= 80 && !overBudget;

  const status = overBudget
    ? "danger"
    : warning
      ? "warning"
      : "normal";

  const StatusIcon = overBudget
    ? ShieldAlert
    : warning
      ? AlertTriangle
      : CheckCircle;

  const title = overBudget
    ? "Budget exceeded!"
    : warning
      ? "Budget warning"
      : "Looking good!";

  const message = overBudget
    ? `You have exceeded your ${budget.name} budget by ${money(
        Math.abs(budget.remaining)
      )}. Consider reducing your spending.`
    : warning
      ? `You've used ${budget.percentage}% of your ${budget.name} budget. Only ${money(
          budget.remaining
        )} remains.`
      : `${money(budget.remaining)} remaining in your ${budget.name} budget.`;

  return (
    <div className={`budget-alert ${status}`}>
      <StatusIcon size={19} />
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}

// ==========================================
// REUSABLE TRANSACTION TABLE
// ==========================================

function TransactionTable({
  transactions,
  onEdit,
  onDelete,
}) {
  return (
    <div className="table-scroll">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>TRANSACTION</th>
            <th>CATEGORY</th>
            <th>DATE</th>
            <th>AMOUNT</th>
            <th>ACTIONS</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((transaction) => {
            const Icon =
              transaction.type === "income"
                ? Briefcase
                : ShoppingBag;

            return (
              <tr key={transaction.id}>
                <td>
                  <div className="transaction-name">
                    <span
                      className={`transaction-icon ${transaction.type}`}
                    >
                      <Icon size={17} />
                    </span>
                    <strong>{transaction.title}</strong>
                  </div>
                </td>

                <td>
                  <span className="category-tag">
                    {transaction.category}
                  </span>
                </td>

                <td className="date-cell">
                  {transaction.date}
                </td>

                <td
                  className={
                    transaction.type === "income"
                      ? "amount-income"
                      : "amount-expense"
                  }
                >
                  {transaction.type === "income" ? "+" : "−"}
                  {money(transaction.amount)}
                </td>

                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      title="Edit"
                      onClick={() => onEdit(transaction)}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      title="Delete"
                      onClick={() => onDelete(transaction.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {transactions.length === 0 && (
            <tr>
              <td colSpan="5" className="empty-state">
                No transactions found. Add one to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// MAIN APP
// ==========================================

function App() {
  // TRANSACTION STATE

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem("fintrack-transactions");
      return saved ? JSON.parse(saved) : initialTransactions;
    } catch {
      return initialTransactions;
    }
  });

  const [activePage, setActivePage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [transactionFilter, setTransactionFilter] =
    useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  // BUDGET STATE

  const [budgets, setBudgets] = useState(() => {
    try {
      const saved = localStorage.getItem("fintrack-budgets");
      return saved ? JSON.parse(saved) : initialBudgets;
    } catch {
      return initialBudgets;
    }
  });

  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudgetName, setEditingBudgetName] =
    useState(null);
  const [budgetError, setBudgetError] = useState("");

  const [budgetForm, setBudgetForm] = useState({
    name: "Food",
    limit: "",
  });

  const [form, setForm] = useState({
    title: "",
    category: "Food",
    amount: "",
    type: "expense",
  });

  // NOTIFICATION STATE

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [readNotificationIds, setReadNotificationIds] =
    useState([]);

  // ==========================================
  // FINANCIAL TOTALS
  // ==========================================

  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const expenses = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  // ==========================================
  // SPENDING BREAKDOWN
  // ==========================================

  const categoryData = useMemo(() => {
    const expensesByCategory = transactions
      .filter((item) => item.type === "expense")
      .reduce((result, item) => {
        const category = item.category || "Other";

        result[category] =
          (result[category] || 0) + Number(item.amount);

        return result;
      }, {});

    const total = Object.values(expensesByCategory).reduce(
      (sum, amount) => sum + amount,
      0
    );

    if (total === 0) return [];

    return Object.entries(expensesByCategory).map(
      ([name, amount]) => ({
        name,
        value: Math.round((amount / total) * 100),
        color: categoryColors[name] || categoryColors.Other,
      })
    );
  }, [transactions]);

  // ==========================================
  // BUDGET CALCULATIONS
  // ==========================================

  const currentMonthKey = getCurrentMonthKey();

  const budgetData = useMemo(() => {
    return budgets.map((budget) => {
      const spent = transactions
        .filter((transaction) => {
          if (
            transaction.type !== "expense" ||
            transaction.category !== budget.name
          ) {
            return false;
          }

          const parsedDate = new Date(transaction.date);

          if (Number.isNaN(parsedDate.getTime())) {
            return false;
          }

          const transactionMonthKey =
            `${parsedDate.getFullYear()}-${String(
              parsedDate.getMonth() + 1
            ).padStart(2, "0")}`;

          return transactionMonthKey === currentMonthKey;
        })
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount),
          0
        );

      const percentage =
        budget.limit > 0
          ? Math.round((spent / budget.limit) * 100)
          : 0;

      return {
        ...budget,
        spent,
        percentage,
        remaining: budget.limit - spent,
      };
    });
  }, [budgets, transactions, currentMonthKey]);

  // ==========================================
  // BUDGET ALERT SUMMARY
  // ==========================================

  const budgetAlertSummary = useMemo(() => {
    const exceeded = budgetData.filter(
      (budget) => budget.percentage >= 100
    );

    const warnings = budgetData.filter(
      (budget) =>
        budget.percentage >= 80 &&
        budget.percentage < 100
    );

    const normal = budgetData.filter(
      (budget) => budget.percentage < 80
    );

    return {
      exceeded,
      warnings,
      normal,
      totalAlerts: exceeded.length + warnings.length,
    };
  }, [budgetData]);

  // ==========================================
  // NOTIFICATION DATA
  // ==========================================

  const notifications = useMemo(() => {
    return budgetData.map((budget) => {
      const overBudget = budget.percentage >= 100;

      const warning =
        budget.percentage >= 80 && !overBudget;

      const status = overBudget
        ? "danger"
        : warning
          ? "warning"
          : "normal";

      return {
        id: `${budget.name}-${status}`,
        name: budget.name,
        status,
        percentage: budget.percentage,
        message: overBudget
          ? `${budget.name} is over budget by ${money(
              Math.abs(budget.remaining)
            )}.`
          : warning
            ? `${budget.percentage}% used. ${money(
                budget.remaining
              )} remaining.`
            : `${money(
                budget.remaining
              )} remaining in your ${budget.name} budget.`,
      };
    });
  }, [budgetData]);

  const unreadCount = notifications.filter(
    (notification) =>
      !readNotificationIds.includes(notification.id)
  ).length;

  function markAllNotificationsRead() {
    setReadNotificationIds((previous) => [
      ...new Set([
        ...previous,
        ...notifications.map((notification) => notification.id),
      ]),
    ]);
  }

  function openNotification(notification) {
    setReadNotificationIds((previous) => [
      ...new Set([...previous, notification.id]),
    ]);

    setActivePage("Budgets");
    setNotificationsOpen(false);
  }

  // ==========================================
  // SAVE FUNCTIONS
  // ==========================================

  function saveTransactions(next) {
    setTransactions(next);
    localStorage.setItem(
      "fintrack-transactions",
      JSON.stringify(next)
    );
  }

  function saveBudgets(next) {
    setBudgets(next);
    localStorage.setItem(
      "fintrack-budgets",
      JSON.stringify(next)
    );
  }

  // ==========================================
  // BUDGET FUNCTIONS
  // ==========================================

  function openNewBudget() {
    setEditingBudgetName(null);
    setBudgetError("");

    const availableCategory = [
      "Food",
      "Housing",
      "Transport",
      "Entertainment",
      "Health",
      "Other",
    ].find(
      (category) =>
        !budgets.some((budget) => budget.name === category)
    ) || "Food";

    setBudgetForm({
      name: availableCategory,
      limit: "",
    });

    setShowBudgetForm(true);
  }

  function openEditBudget(budget) {
    setEditingBudgetName(budget.name);
    setBudgetError("");

    setBudgetForm({
      name: budget.name,
      limit: String(budget.limit),
    });

    setShowBudgetForm(true);
  }

  function handleBudgetSubmit(event) {
    event.preventDefault();

    const limit = Number(budgetForm.limit);

    if (
      !budgetForm.name ||
      !Number.isFinite(limit) ||
      limit <= 0
    ) {
      setBudgetError(
        "Enter a category and a monthly limit greater than zero."
      );
      return;
    }

    const duplicate = budgets.some(
      (budget) =>
        budget.name === budgetForm.name &&
        budget.name !== editingBudgetName
    );

    if (duplicate) {
      setBudgetError(
        "A budget already exists for this category. Please edit that budget instead."
      );
      return;
    }

    const color =
      categoryColors[budgetForm.name] || categoryColors.Other;

    let next;

    if (editingBudgetName !== null) {
      next = budgets.map((budget) =>
        budget.name === editingBudgetName
          ? {
              name: budgetForm.name,
              limit,
              color,
            }
          : budget
      );
    } else {
      next = [
        ...budgets,
        {
          name: budgetForm.name,
          limit,
          color,
        },
      ];
    }

    saveBudgets(next);
    setShowBudgetForm(false);
    setEditingBudgetName(null);
    setBudgetError("");
  }

  function deleteBudget(name) {
    const confirmed = window.confirm(
      `Delete the ${name} budget? Your transactions will not be deleted.`
    );

    if (!confirmed) return;

    saveBudgets(
      budgets.filter((budget) => budget.name !== name)
    );
  }

  // ==========================================
  // TRANSACTION FUNCTIONS
  // ==========================================

  function openNewTransaction() {
    setEditingId(null);

    setForm({
      title: "",
      category: "Food",
      amount: "",
      type: "expense",
    });

    setShowForm(true);
  }

  function editTransaction(transaction) {
    setEditingId(transaction.id);

    setForm({
      title: transaction.title,
      category: transaction.category,
      amount: String(transaction.amount),
      type: transaction.type,
    });

    setShowForm(true);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !Number.isFinite(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      return;
    }

    if (editingId !== null) {
      const updated = transactions.map((transaction) =>
        transaction.id === editingId
          ? {
              ...transaction,
              ...form,
              title: form.title.trim(),
              amount: Number(form.amount),
            }
          : transaction
      );

      saveTransactions(updated);
    } else {
      const newTransaction = {
        id: Date.now(),
        ...form,
        title: form.title.trim(),
        amount: Number(form.amount),
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };

      saveTransactions([
        newTransaction,
        ...transactions,
      ]);
    }

    setShowForm(false);
    setEditingId(null);
  }

  function deleteTransaction(id) {
    saveTransactions(
      transactions.filter(
        (transaction) => transaction.id !== id
      )
    );
  }

  // ==========================================
  // CSV EXPORT
  // ==========================================

  function exportCSV() {
    const rows = [
      ["Title", "Category", "Date", "Type", "Amount"],
      ...transactions.map((transaction) => [
        transaction.title,
        transaction.category,
        transaction.date,
        transaction.type,
        transaction.amount,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replaceAll('"', '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "fintrack-transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  // ==========================================
  // SEARCH AND FILTER
  // ==========================================

  const filteredTransactions = transactions.filter(
    (transaction) => {
      const matchesSearch =
        `${transaction.title} ${transaction.category}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        transactionFilter === "all" ||
        transaction.type === transactionFilter;

      return matchesSearch && matchesFilter;
    }
  );

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Transactions", icon: ArrowLeftRight },
    { name: "Budgets", icon: ChartNoAxesCombined },
  ];

  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          mobileMenu ? "sidebar-open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-icon">
            <Wallet size={23} />
          </div>

          <span>
            fintrack<span className="brand-dot">.</span>
          </span>

          <button
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
          >
            <X />
          </button>
        </div>

        <p className="nav-label">MENU</p>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(item.name);
                setMobileMenu(false);
              }}
            >
              <item.icon size={19} />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <TrendingUp size={20} />
            </div>

            <h4>Smart money moves</h4>

            <p>
              Stay on top of your finances and reach your goals.
            </p>

            <button onClick={() => setActivePage("Budgets")}>
              Explore budgets <ArrowUpRight size={15} />
            </button>
          </div>

          <button className="nav-item settings-item">
            <Settings size={19} />
            Settings
          </button>

          <div className="profile">
            <div className="avatar">K</div>

            <div>
              <strong>Kalpana</strong>
              <span>Personal account</span>
            </div>

            <MoreHorizontal size={20} />
          </div>
        </div>
      </aside>

      {mobileMenu && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* TOP HEADER */}

        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenu(true)}
            >
              <Menu />
            </button>

            <div>
              <p className="breadcrumb">
                Workspace / <span>{activePage}</span>
              </p>

              <h1>
                {activePage === "Dashboard"
                  ? "Financial Overview"
                  : activePage}
              </h1>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="date-pill">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
              <span>⌄</span>
            </div>

            {/* NOTIFICATION CENTER */}

            <div className="notification-wrapper">
              <button
                className="icon-button notification-trigger"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() =>
                  setNotificationsOpen((previous) => !previous)
                }
              >
                <Bell size={19} />
                {unreadCount > 0 && <i />}
              </button>

              {notificationsOpen && (
                <div className="notification-panel">
                  <div className="notification-heading">
                    <div>
                      <h3>Notifications</h3>
                      <p>
                        {unreadCount > 0
                          ? `${unreadCount} unread`
                          : "You're all caught up"}
                      </p>
                    </div>

                    <button
                      className="notification-close"
                      onClick={() =>
                        setNotificationsOpen(false)
                      }
                      aria-label="Close notifications"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="notification-list">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => {
                        const isRead =
                          readNotificationIds.includes(
                            notification.id
                          );

                        const Icon =
                          notification.status === "danger"
                            ? ShieldAlert
                            : notification.status === "warning"
                              ? AlertTriangle
                              : CheckCircle;

                        return (
                          <button
                            key={notification.id}
                            className={`notification-item ${notification.status} ${
                              isRead ? "read" : "unread"
                            }`}
                            onClick={() =>
                              openNotification(notification)
                            }
                          >
                            <span className="notification-icon">
                              <Icon size={19} />
                            </span>

                            <span className="notification-content">
                              <strong>
                                {notification.status === "danger"
                                  ? `${notification.name} budget exceeded`
                                  : notification.status === "warning"
                                    ? `${notification.name} budget warning`
                                    : `${notification.name} budget update`}
                              </strong>

                              <small>
                                {notification.message}
                              </small>
                            </span>

                            {!isRead && (
                              <span className="notification-unread-dot" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <p className="notification-empty">
                        No notifications yet.
                      </p>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <button
                      className="mark-read-button"
                      onClick={markAllNotificationsRead}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="top-avatar">K</div>
          </div>
        </header>

        {/* ==========================================
            DASHBOARD PAGE
        ========================================== */}

        {activePage === "Dashboard" && (
          <>
            <section className="welcome-row">
              <div>
                <h2>Good afternoon, Kalpana 👋</h2>
                <p>
                  Here's what's happening with your money today.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={openNewTransaction}
              >
                <Plus size={18} />
                Add transaction
              </button>
            </section>

            {/* FINANCIAL SUMMARY */}

            <section className="summary-grid">
              <div className="summary-card balance-card">
                <div className="card-heading">
                  <span>Total balance</span>
                  <span className="card-icon purple">
                    <Wallet size={19} />
                  </span>
                </div>

                <h2>{money(totals.balance)}</h2>

                <p className="positive">
                  <ArrowUpRight size={15} />
                  Your income minus expenses
                </p>

                <div className="balance-decoration" />
              </div>

              <div className="summary-card">
                <div className="card-heading">
                  <span>Total income</span>
                  <span className="card-icon green">
                    <ArrowDownRight size={19} />
                  </span>
                </div>

                <h2>{money(totals.income)}</h2>

                <p className="muted-text">
                  Based on your transactions
                </p>

                <div className="mini-progress">
                  <span className="income-progress" />
                </div>
              </div>

              <div className="summary-card">
                <div className="card-heading">
                  <span>Total expenses</span>
                  <span className="card-icon orange">
                    <ArrowUpRight size={19} />
                  </span>
                </div>

                <h2>{money(totals.expenses)}</h2>

                <p className="muted-text">
                  Based on your transactions
                </p>

                <div className="mini-progress">
                  <span className="expense-progress" />
                </div>
              </div>
            </section>

            {/* SMART BUDGET ALERTS */}

            {budgetAlertSummary.totalAlerts > 0 && (
              <section className="budget-alerts">
                <div className="panel-heading">
                  <div>
                    <h3>Smart Budget Alerts</h3>
                    <p>
                      Keep an eye on your monthly spending limits.
                    </p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => setActivePage("Budgets")}
                  >
                    View budgets <ArrowUpRight size={15} />
                  </button>
                </div>

                {budgetAlertSummary.exceeded.map((budget) => (
                  <BudgetAlert
                    key={budget.name}
                    budget={budget}
                  />
                ))}

                {budgetAlertSummary.warnings.map((budget) => (
                  <BudgetAlert
                    key={budget.name}
                    budget={budget}
                  />
                ))}
              </section>
            )}

            {/* CHARTS */}

            <section className="dashboard-grid">
              <div className="panel analytics-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Cash flow</h3>
                    <p>Income vs expenses over time</p>
                  </div>

                  <span className="period-label">
                    Last 6 months⌄
                  </span>
                </div>

                <div className="chart-legend">
                  <span>
                    <i className="legend-income" />
                    Income
                  </span>

                  <span>
                    <i className="legend-expense" />
                    Expenses
                  </span>
                </div>

                <div className="area-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{
                        top: 12,
                        right: 8,
                        left: -20,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="incomeFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#8e7cff"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#8e7cff"
                            stopOpacity={0}
                          />
                        </linearGradient>

                        <linearGradient
                          id="expenseFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#48cdb0"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#48cdb0"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        stroke="#292b3a"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="month"
                        stroke="#77798d"
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        stroke="#77798d"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                          `$${value / 1000}k`
                        }
                      />

                      <Tooltip
                        contentStyle={{
                          background: "#202130",
                          border: "1px solid #37394c",
                          borderRadius: 12,
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#9b8cff"
                        strokeWidth={2.5}
                        fill="url(#incomeFill)"
                      />

                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="#50d5b7"
                        strokeWidth={2.5}
                        fill="url(#expenseFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SPENDING BREAKDOWN */}

              <div className="panel spending-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Spending breakdown</h3>
                    <p>Where your money goes</p>
                  </div>

                  <MoreHorizontal size={21} />
                </div>

                <div className="donut-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={85}
                        paddingAngle={5}
                        stroke="none"
                      >
                        {categoryData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.color}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          background: "#202130",
                          border: "1px solid #37394c",
                          borderRadius: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="donut-center">
                    <strong>{money(totals.expenses)}</strong>
                    <span>Total spent</span>
                  </div>
                </div>

                <div className="category-legend">
                  {categoryData.length > 0 ? (
                    categoryData.map((category) => (
                      <div key={category.name}>
                        <span>
                          <i
                            style={{
                              background: category.color,
                            }}
                          />
                          {category.name}
                        </span>

                        <strong>{category.value}%</strong>
                      </div>
                    ))
                  ) : (
                    <p className="muted-text">
                      No expenses recorded yet.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* RECENT TRANSACTIONS */}

            <section className="panel transactions-panel">
              <div className="panel-heading">
                <div>
                  <h3>Recent transactions</h3>
                  <p>Your latest financial activity</p>
                </div>

                <button
                  className="text-button"
                  onClick={() =>
                    setActivePage("Transactions")
                  }
                >
                  View all <ArrowUpRight size={15} />
                </button>
              </div>

              <TransactionTable
                transactions={transactions.slice(0, 5)}
                onEdit={editTransaction}
                onDelete={deleteTransaction}
              />
            </section>
          </>
        )}

        {/* ==========================================
            TRANSACTIONS PAGE
        ========================================== */}

        {activePage === "Transactions" && (
          <section className="panel full-page-panel">
            <div className="panel-heading">
              <div>
                <h3>All transactions</h3>
                <p>Manage your income and expenses</p>
              </div>

              <button
                className="primary-button"
                onClick={openNewTransaction}
              >
                <Plus size={17} />
                Add transaction
              </button>
            </div>

            <div className="table-tools">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  width: "100%",
                }}
              >
                <div className="search-box">
                  <Search size={17} />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search transactions..."
                  />
                </div>

                <div
                  className="transaction-filters"
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { label: "All", value: "all" },
                    { label: "Income", value: "income" },
                    { label: "Expenses", value: "expense" },
                  ].map((filter) => {
                    const active =
                      transactionFilter === filter.value;

                    return (
                      <button
                        key={filter.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setTransactionFilter(filter.value)
                        }
                        style={{
                          padding: "10px 16px",
                          borderRadius: "9px",
                          border: active
                            ? "1px solid #9b8cff"
                            : "1px solid #343548",
                          background: active
                            ? "rgba(155, 140, 255, 0.18)"
                            : "transparent",
                          color: active
                            ? "#b5a8ff"
                            : "#a5a6b8",
                          fontWeight: 600,
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                className="secondary-button"
                onClick={exportCSV}
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>

            <TransactionTable
              transactions={filteredTransactions}
              onEdit={editTransaction}
              onDelete={deleteTransaction}
            />
          </section>
        )}

        {/* ==========================================
            BUDGETS PAGE
        ========================================== */}

        {activePage === "Budgets" && (
          <section className="panel full-page-panel">
            <div className="panel-heading">
              <div>
                <h3>Monthly budgets</h3>

                <p>
                  Track your spending against your limits ·{" "}
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <button
                className="primary-button"
                onClick={openNewBudget}
              >
                <Plus size={17} />
                Add budget
              </button>
            </div>

            {/* BUDGET ALERT SUMMARY */}

            {budgetAlertSummary.totalAlerts > 0 && (
              <div className="alert-summary">
                <AlertTriangle size={18} />

                <span>
                  You have{" "}
                  <strong>
                    {budgetAlertSummary.totalAlerts}
                  </strong>{" "}
                  budget{" "}
                  {budgetAlertSummary.totalAlerts === 1
                    ? "alert"
                    : "alerts"}{" "}
                  to review.
                </span>
              </div>
            )}

            {/* BUDGET LIST */}

            <div className="budget-list">
              {budgetData.length > 0 ? (
                budgetData.map((budget) => {
                  const overBudget =
                    budget.percentage >= 100;

                  const warning =
                    budget.percentage >= 80 && !overBudget;

                  const progressWidth = Math.min(
                    100,
                    budget.percentage
                  );

                  return (
                    <div
                      className="budget-row"
                      key={budget.name}
                    >
                      <div className="budget-info">
                        <span>{budget.name}</span>

                        <strong>
                          {money(budget.spent)}
                          <small>
                            {" "}of {money(budget.limit)}
                          </small>
                        </strong>
                      </div>

                      <div className="budget-track">
                        <span
                          style={{
                            width: `${progressWidth}%`,
                            background: overBudget
                              ? "#f07878"
                              : warning
                                ? "#f0b25e"
                                : budget.color,
                          }}
                        />
                      </div>

                      <div
                        className="budget-info"
                        style={{ marginTop: 8 }}
                      >
                        <p
                          style={{
                            color: overBudget
                              ? "#f07878"
                              : warning
                                ? "#f0b25e"
                                : undefined,
                          }}
                        >
                          {budget.percentage}% used ·{" "}
                          {overBudget
                            ? `${money(
                                Math.abs(budget.remaining)
                              )} over budget`
                            : `${money(
                                budget.remaining
                              )} remaining`}
                        </p>

                        <div className="row-actions">
                          <button
                            type="button"
                            title={`Edit ${budget.name} budget`}
                            onClick={() =>
                              openEditBudget(budget)
                            }
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            title={`Delete ${budget.name} budget`}
                            onClick={() =>
                              deleteBudget(budget.name)
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <BudgetAlert budget={budget} />
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  No budgets yet. Select "Add budget" to create your first monthly budget.
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ==========================================
          ADD / EDIT BUDGET MODAL
      ========================================== */}

      {showBudgetForm && (
        <div
          className="modal-backdrop"
          onClick={() => setShowBudgetForm(false)}
        >
          <form
            className="transaction-modal"
            onSubmit={handleBudgetSubmit}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2>
                  {editingBudgetName
                    ? "Edit budget"
                    : "New budget"}
                </h2>

                <p>Set a monthly spending limit</p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setShowBudgetForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <label>
              Category

              <select
                value={budgetForm.name}
                onChange={(event) =>
                  setBudgetForm({
                    ...budgetForm,
                    name: event.target.value,
                  })
                }
              >
                {[
                  "Food",
                  "Housing",
                  "Transport",
                  "Entertainment",
                  "Health",
                  "Other",
                ]
                  .filter(
                    (category) =>
                      category === editingBudgetName ||
                      !budgets.some(
                        (budget) => budget.name === category
                      )
                  )
                  .map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              Monthly limit

              <input
                autoFocus
                required
                type="number"
                min="0.01"
                step="0.01"
                value={budgetForm.limit}
                onChange={(event) =>
                  setBudgetForm({
                    ...budgetForm,
                    limit: event.target.value,
                  })
                }
                placeholder="e.g. 500"
              />
            </label>

            {budgetError && (
              <p
                role="alert"
                style={{
                  color: "#f07878",
                  margin: "0 0 12px",
                }}
              >
                {budgetError}
              </p>
            )}

            <button
              className="primary-button modal-submit"
              type="submit"
            >
              {editingBudgetName
                ? "Save changes"
                : "Create budget"}
            </button>
          </form>
        </div>
      )}

      {/* ==========================================
          ADD / EDIT TRANSACTION MODAL
      ========================================== */}

      {showForm && (
        <div
          className="modal-backdrop"
          onClick={() => setShowForm(false)}
        >
          <form
            className="transaction-modal"
            onSubmit={handleSubmit}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2>
                  {editingId !== null
                    ? "Edit transaction"
                    : "New transaction"}
                </h2>

                <p>Enter the details below</p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setShowForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <label>
              Description

              <input
                autoFocus
                required
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
                placeholder="e.g. Grocery shopping"
              />
            </label>

            <label>
              Amount

              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  setForm({
                    ...form,
                    amount: event.target.value,
                  })
                }
                placeholder="0.00"
              />
            </label>

            <label>
              Category

              <select
                value={form.category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category: event.target.value,
                  })
                }
              >
                <option>Food</option>
                <option>Housing</option>
                <option>Transport</option>
                <option>Entertainment</option>
                <option>Health</option>
                <option>Income</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Type

              <select
                value={form.type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    type: event.target.value,
                  })
                }
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>

            <button
              className="primary-button modal-submit"
              type="submit"
            >
              {editingId !== null
                ? "Save changes"
                : "Add transaction"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
