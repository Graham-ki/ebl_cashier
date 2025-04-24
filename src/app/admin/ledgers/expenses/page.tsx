"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Predefined expense categories
const EXPENSE_CATEGORIES = [
  "Labour",
  "Salary",
  "Wage",
  "Repairs",
  "Stock",
  "Allowance",
  "Utility/Welfare",
  "Other"
];

export default function ExpensesLedgerPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [balanceForward, setBalanceForward] = useState(0);
  const [filter, setFilter] = useState<"daily" | "monthly" | "yearly" | "all">("all");
  const [formData, setFormData] = useState({
    item: "",
    customItem: "",
    amount_spent: 0,
    department: "",
    mode_of_payment: "",
    account: "",
  });
  const [editExpense, setEditExpense] = useState<any>(null);

  // Fetch all necessary data
  useEffect(() => {
    fetchExpenses(filter);
    fetchFinancialData();
  }, [filter]);

  // Fetch financial data (income and expenses totals)
  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch total available amount from finance table
      const { data: financeData, error: financeError } = await supabase
        .from("finance")
        .select("amount_available")
        .eq("submittedby", "Cashier");

      if (financeError) throw financeError;

      const totalAvailable = financeData.reduce((sum, entry) => sum + (entry.amount_available || 0), 0);
      setTotalIncome(totalAvailable);

      // Fetch total expenses from expenses table
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("amount_spent")
        .eq("submittedby", "Cashier");

      if (expensesError) throw expensesError;

      const totalExpended = expensesData.reduce((sum, entry) => sum + (entry.amount_spent || 0), 0);
      setTotalExpenses(totalExpended);

      // Calculate balance forward
      setBalanceForward(totalAvailable - totalExpended);
    } catch (error) {
      console.error("Error fetching financial data:", error);
      alert("Error fetching financial data. Please check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch expenses based on filter
  const fetchExpenses = async (filterType: "daily" | "monthly" | "yearly" | "all") => {
    setLoading(true);

    // Calculate date range based on filter
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (filterType) {
      case "daily":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = null;
        endDate = null;
        break;
    }

    try {
      let query = supabase.from("expenses").select("*").eq("submittedby", "Cashier").order('date',{ascending:false});

      if (startDate && endDate) {
        query = query.gte("date", startDate.toISOString()).lte("date", endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      alert("Error fetching expenses. Please check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Reset customItem when selecting a non-"Other" category
    if (name === "item" && value !== "Other") {
      setFormData(prev => ({ ...prev, customItem: "" }));
    }
  };

  // Submit expense (add or update)
  const submitExpense = async () => {
    // Determine the final item name (use customItem if "Other" was selected)
    const finalItem = formData.item === "Other" ? formData.customItem : formData.item;
    
    if (!finalItem || !formData.amount_spent || !formData.department) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      
      const expenseData = {
        item: finalItem,
        amount_spent: formData.amount_spent,
        department: formData.department,
        mode_of_payment: formData.mode_of_payment,
        account: formData.account,
        submittedby: "Cashier",
      };

      // Submit the expense
      const { error } = editExpense
        ? await supabase.from("expenses").update(expenseData).eq("id", editExpense.id)
        : await supabase.from("expenses").insert([expenseData]);

      if (error) throw error;

      // Refresh all data
      await Promise.all([fetchExpenses(filter), fetchFinancialData()]);

      // Reset form
      setFormData({ 
        item: "", 
        customItem: "", 
        amount_spent: 0, 
        department: "", 
        mode_of_payment: "", 
        account: "" 
      });
      setEditExpense(null);
      
      alert("Expense successfully submitted!");
    } catch (error) {
      console.error("Error submitting expense:", error);
      alert("Error submitting expense. Please check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit action
  const handleEdit = (expense: any) => {
    setEditExpense(expense);
    // Check if the expense item is in our predefined categories
    const isPredefinedCategory = EXPENSE_CATEGORIES.includes(expense.item);
    setFormData({
      item: isPredefinedCategory ? expense.item : "Other",
      customItem: isPredefinedCategory ? "" : expense.item,
      amount_spent: expense.amount_spent,
      department: expense.department,
      mode_of_payment: expense.mode_of_payment,
      account: expense.account,
    });
  };

  // Handle delete action
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      setLoading(true);
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;

      // Refresh all data
      await Promise.all([fetchExpenses(filter), fetchFinancialData()]);
      
      alert("Expense successfully deleted!");
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Error deleting expense. Please check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Export expenses to CSV
  const exportToCSV = () => {
    const csvData = expenses.map((expense) => ({
      Item: expense.item,
      "Amount Spent": expense.amount_spent,
      Department: expense.department,
      "Mode of Payment": expense.mode_of_payment,
      Account: expense.account,
      Date: new Date(expense.date).toLocaleDateString(),
    }));

    const csvHeaders = Object.keys(csvData[0]).join(",") + "\n";
    const csvRows = csvData.map((row) => Object.values(row).join(",")).join("\n");
    const csvBlob = new Blob([csvHeaders + csvRows], { type: "text/csv;charset=utf-8" });
    
    // Create download link and trigger click
    const link = document.createElement("a");
    link.href = URL.createObjectURL(csvBlob);
    link.download = "expenses.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Expenses Ledger</h1>
        <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Total Income</h2>
          <p className="text-2xl font-bold">UGX {totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-red-500">
          <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Total Expenses</h2>
          <p className="text-2xl font-bold">UGX {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Balance Forward</h2>
          <p className="text-2xl font-bold">UGX {balanceForward.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex flex-wrap gap-2">
          {(["all", "daily", "monthly", "yearly"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-medium transition-colors"
          disabled={loading || expenses.length === 0}
        >
          <span>Download CSV</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>

      {/* Add/Edit Expense Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editExpense ? "Edit Expense" : "Add New Expense"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item *</label>
            <select
              name="item"
              value={formData.item}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              disabled={loading}
            >
              <option value="">Select an item</option>
              {EXPENSE_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {formData.item === "Other" && (
              <div className="mt-2">
                <input
                  type="text"
                  name="customItem"
                  placeholder="Specify item name"
                  value={formData.customItem}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  disabled={loading}
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (UGX) *</label>
            <input
              type="number"
              name="amount_spent"
              placeholder="Amount"
              value={formData.amount_spent || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department *</label>
            <input
              type="text"
              name="department"
              placeholder="Department/person"
              value={formData.department}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source Account</label>
            <select
              name="mode_of_payment"
              value={formData.mode_of_payment}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              disabled={loading}
            >
              <option value="">Select</option>
              <option value="Cash">Cash</option>
              <option value="Mobile Money">Mobile Money</option>
            </select>
          </div>
          {formData.mode_of_payment && formData.mode_of_payment !== "Cash" && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {formData.mode_of_payment === "Mobile Money" ? "Mobile Money Provider" : "Bank Name"}
              </label>
              <input
                type="text"
                name="account"
                placeholder={formData.mode_of_payment === "Mobile Money" ? "e.g. MTN, Airtel" : "Bank name"}
                value={formData.account}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                disabled={loading}
              />
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {editExpense && (
            <button
              onClick={() => {
                setEditExpense(null);
                setFormData({ 
                  item: "", 
                  customItem: "", 
                  amount_spent: 0, 
                  department: "", 
                  mode_of_payment: "", 
                  account: "" 
                });
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            onClick={submitExpense}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {editExpense ? "Updating..." : "Submitting..."}
              </span>
            ) : editExpense ? "Update Expense" : "Add Expense"}
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {loading && !expenses.length ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">No expenses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Source Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{expense.item}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">UGX {expense.amount_spent.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{expense.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{expense.mode_of_payment || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{expense.account || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
