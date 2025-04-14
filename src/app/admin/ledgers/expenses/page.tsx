"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { saveAs } from "file-saver"; // For CSV export

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ExpensesLedgerPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [balanceForward, setBalanceForward] = useState(0);
  const [filter, setFilter] = useState<"daily" | "monthly" | "yearly" | "all">("all");
  const [formData, setFormData] = useState({
    item: "",
    amount_spent: 0,
    department: "",
    mode_of_payment: "",
    account: "",
  });
  const [editExpense, setEditExpense] = useState<any>(null);
  const [modes, setModes] = useState<string[]>([]);
  const [subModes, setSubModes] = useState<string[]>([]);

  // Fetch all necessary data when component mounts or filter changes
  useEffect(() => {
    fetchExpenses(filter);
    fetchTotalIncome();
    fetchModes();
    fetchBalanceForward();
  }, [filter]);

  // Fetch balance forward (total amount_available from finance table)
  const fetchBalanceForward = async () => {
    const { data, error } = await supabase
      .from("finance")
      .select("amount_available")
      .eq("submittedby", "Cashier");

    if (error) {
      console.error("Error fetching balance forward:", error.message);
      return;
    }

    const totalAvailable = data.reduce((sum, entry) => sum + (entry.amount_available || 0), 0);
    
    // Fetch total expenses to calculate balance forward
    const { data: expensesData, error: expensesError } = await supabase
      .from("expenses")
      .select("amount_spent")
      .eq("submittedby", "Cashier");

    if (expensesError) {
      console.error("Error fetching expenses for balance:", expensesError.message);
      return;
    }

    const totalExpenses = expensesData.reduce((sum, entry) => sum + (entry.amount_spent || 0), 0);
    
    setBalanceForward(totalAvailable - totalExpenses);
  };

  // Fetch modes of payment from finance table
  const fetchModes = async () => {
    const { data, error } = await supabase
      .from("finance")
      .select("mode_of_payment")
      .eq("submittedby", "Cashier");

    if (error) {
      console.error("Error fetching modes:", error.message);
      return;
    }

    const uniqueModes = Array.from(new Set(data.map((entry) => entry.mode_of_payment)));
    setModes(uniqueModes);
  };

  // Fetch submodes/accounts based on selected mode
  const fetchSubModes = async (mode: string) => {
    if (mode === "Cash") {
      setSubModes([]);
      return;
    }

    const { data, error } = await supabase
      .from("finance")
      .select(mode === "Bank" ? "bank_name" : "mode_of_mobilemoney")
      .eq("submittedby", "Cashier")
      .eq("mode_of_payment", mode);

    if (error) {
      console.error("Error fetching submodes:", error.message);
      return;
    }

    const uniqueSubModes = Array.from(
      new Set(data.map((entry) => (mode === "Bank" ? entry.bank_name : entry.mode_of_mobilemoney)))
    ).filter((subMode): subMode is string => !!subMode);

    setSubModes(uniqueSubModes);
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

    let query = supabase.from("expenses").select("*").eq("submittedby", "Cashier");

    if (startDate && endDate) {
      query = query.gte("date", startDate.toISOString()).lte("date", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching expenses:", error.message);
      setLoading(false);
      return;
    }

    setExpenses(data || []);
    calculateTotalExpenses(data || []);
    setLoading(false);
  };

  // Fetch total income from finance table
  const fetchTotalIncome = async () => {
    const { data, error } = await supabase
      .from("finance")
      .select("amount_paid")
      .eq("submittedby", "Cashier");

    if (error) {
      console.error("Error fetching total income:", error.message);
      return;
    }

    const total = data.reduce((sum, entry) => sum + (entry.amount_paid || 0), 0);
    setTotalIncome(total);
  };

  // Calculate total expenses
  const calculateTotalExpenses = (data: any[]) => {
    const total = data.reduce((sum, entry) => sum + (entry.amount_spent || 0), 0);
    setTotalExpenses(total);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "mode_of_payment") {
      fetchSubModes(value);
      setFormData((prev) => ({ ...prev, account: "" }));
    }
  };

  // Submit expense (add or update)
  const submitExpense = async () => {
    if (!formData.item || !formData.amount_spent || !formData.department || !formData.mode_of_payment) {
      alert("Please fill in all required fields.");
      return;
    }

    const expenseData = {
      item: formData.item,
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

    if (error) {
      alert("Error submitting expense: " + error.message);
      return;
    }

    // Refresh all data to get updated calculations
    fetchExpenses(filter);
    fetchBalanceForward();
    
    // Reset form
    setFormData({ item: "", amount_spent: 0, department: "", mode_of_payment: "", account: "" });
    setEditExpense(null);
    
    alert("Expense successfully submitted!");
  };

  // Handle edit action
  const handleEdit = (expense: any) => {
    setEditExpense(expense);
    setFormData({
      item: expense.item,
      amount_spent: expense.amount_spent,
      department: expense.department,
      mode_of_payment: expense.mode_of_payment,
      account: expense.account,
    });
    fetchSubModes(expense.mode_of_payment);
  };

  // Handle delete action
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      const { error } = await supabase.from("expenses").delete().eq("id", id);

      if (error) {
        alert("Error deleting expense: " + error.message);
        return;
      }

      // Refresh data after deletion
      fetchExpenses(filter);
      fetchBalanceForward();
      alert("Expense successfully deleted!");
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
    saveAs(csvBlob, "expenses.csv");
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item</label>
            <input
              type="text"
              name="item"
              placeholder="Item name"
              value={formData.item}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (UGX)</label>
            <input
              type="number"
              name="amount_spent"
              placeholder="Amount"
              value={formData.amount_spent}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
            <input
              type="text"
              name="department"
              placeholder="Department"
              value={formData.department}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
            <select
              name="mode_of_payment"
              value={formData.mode_of_payment}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Select Account</option>
              {modes.map((mode, index) => (
                <option key={index} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
          {formData.mode_of_payment !== "Cash" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
              <select
                name="account"
                value={formData.account}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                disabled={!formData.mode_of_payment}
              >
                <option value="">Select Provider</option>
                {subModes.map((subMode, index) => (
                  <option key={index} value={subMode}>
                    {subMode}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={submitExpense}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            {editExpense ? "Update Expense" : "Add Expense"}
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading expenses...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Provider</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{expense.mode_of_payment}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{expense.account}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
