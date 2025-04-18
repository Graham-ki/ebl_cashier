"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FinancialSummaryPage() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Deposit form state
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [modeOfPayment, setModeOfPayment] = useState("");
  const [modeOfMobileMoney, setModeOfMobileMoney] = useState("");
  const [bankName, setBankName] = useState("");
  const [purpose, setPurpose] = useState("");

  // Financial summary state
  const [financialSummary, setFinancialSummary] = useState<any>({
    cash: 0,
    bank: 0,
    mobileMoney: 0,
    mtn: 0,
    airtel: 0,
    bankNames: {} as { [key: string]: number },
    balanceForward: {
      cash: 0,
      bank: 0,
      mobileMoney: 0
    }
  });

  // Fetch all ledger entries
  const fetchAllLedgerEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("finance").select("*").eq("submittedby", "Cashier").order('id',{ascending:false});

    if (error) {
      alert("Error fetching ledger entries: " + error.message);
      setLoading(false);
      return;
    }

    setLedger(data || []);
    await calculateFinancialSummary(data || []);
    setLoading(false);
  };

  // Calculate financial summary
  const calculateFinancialSummary = async (ledger: any[]) => {
    const summary = {
      cash: 0,
      bank: 0,
      mobileMoney: 0,
      mtn: 0,
      airtel: 0,
      bankNames: {} as { [key: string]: number },
      balanceForward: {
        cash: 0,
        bank: 0,
        mobileMoney: 0
      }
    };

    // Calculate total deposits for each payment method
    ledger.forEach((entry) => {
      if (entry.mode_of_payment === "Cash") {
        summary.cash += entry.amount_paid;
      } else if (entry.mode_of_payment === "Bank") {
        summary.bank += entry.amount_paid;
        if (entry.bank_name) {
          summary.bankNames[entry.bank_name] =
            (summary.bankNames[entry.bank_name] || 0) + entry.amount_paid;
        }
      } else if (entry.mode_of_payment === "Mobile Money") {
        summary.mobileMoney += entry.amount_paid;
        if (entry.mode_of_mobilemoney === "MTN") {
          summary.mtn += entry.amount_paid;
        } else if (entry.mode_of_mobilemoney === "Airtel") {
          summary.airtel += entry.amount_paid;
        }
      }
    });

    // Fetch and calculate expenses for each payment method
    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("amount_spent, mode_of_payment")
      .eq("submittedby", "Cashier")
      .order('date',{ascending:false});

    if (!error && expenses) {
      const expenseSummary = {
        cash: 0,
        bank: 0,
        mobileMoney: 0
      };

      expenses.forEach((expense) => {
        if (expense.amount_spent) {
          if (expense.mode_of_payment === "Cash") {
            expenseSummary.cash += expense.amount_spent;
          } else if (expense.mode_of_payment === "Bank") {
            expenseSummary.bank += expense.amount_spent;
          } else if (expense.mode_of_payment === "Mobile Money") {
            expenseSummary.mobileMoney += expense.amount_spent;
          }
        }
      });

      // Calculate balance forward (deposits - expenses)
      summary.balanceForward.cash = summary.cash - expenseSummary.cash;
      summary.balanceForward.bank = summary.bank - expenseSummary.bank;
      summary.balanceForward.mobileMoney = summary.mobileMoney - expenseSummary.mobileMoney;
    }

    setFinancialSummary(summary);
  };

  // Handle deposit submission
  const handleDepositSubmit = async () => {
    if (!amountPaid || !modeOfPayment || !purpose) {
      alert("Please fill in all required fields.");
      return;
    }

    const amount = typeof amountPaid === 'string' ? parseFloat(amountPaid) : amountPaid;

    const depositData: any = {
      amount_available: amount,
      mode_of_payment: modeOfPayment,
      submittedby: "Cashier",
      amount_paid: amount,
      purpose: purpose
    };

    if (modeOfPayment === "Mobile Money") {
      depositData.mode_of_mobilemoney = modeOfMobileMoney;
    } else if (modeOfPayment === "Bank") {
      depositData.bank_name = bankName;
    }

    const { error } = await supabase.from("finance").insert([depositData]);

    if (error) {
      alert("Error making deposit: " + error.message);
      return;
    }

    // Reset form
    setAmountPaid("");
    setModeOfPayment("");
    setModeOfMobileMoney("");
    setBankName("");
    setPurpose("");

    alert("Deposit successfully recorded!");
    setIsModalOpen(false);
    fetchAllLedgerEntries();
  };

  useEffect(() => {
    fetchAllLedgerEntries();
  }, []);

  const deleteFinanceEntry = async (entryId: number) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    
    const { error } = await supabase
      .from('finance')
      .delete()
      .eq('id', entryId);

    if (error) {
      console.error('Error deleting finance entry:', error);
      alert('Failed to delete entry.');
    } else {
      alert('Entry deleted successfully.');
      fetchAllLedgerEntries();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          Accounts Summary
        </h1>
        <p className="text-gray-600 mt-2">Cashier financial records and transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-500">Cash</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(financialSummary.cash)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Balance forward: <span className="font-medium">{formatCurrency(financialSummary.balanceForward.cash)}</span>
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">💰</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-500">Bank</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(financialSummary.bank)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Balance forward: <span className="font-medium">{formatCurrency(financialSummary.balanceForward.bank)}</span>
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">🏦</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-500">Mobile Money</h3>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(financialSummary.mobileMoney)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Balance forward: <span className="font-medium">{formatCurrency(financialSummary.balanceForward.mobileMoney)}</span>
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">📱</div>
          </div>
        </div>
      </div>

      {/* Sub Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {financialSummary.mtn > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-xs border">
            <h3 className="text-sm font-medium text-gray-500">MTN Mobile Money</h3>
            <p className="text-lg font-semibold">{formatCurrency(financialSummary.mtn)}</p>
          </div>
        )}
        {financialSummary.airtel > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-xs border">
            <h3 className="text-sm font-medium text-gray-500">Airtel Money</h3>
            <p className="text-lg font-semibold">{formatCurrency(financialSummary.airtel)}</p>
          </div>
        )}
        {Object.entries(financialSummary.bankNames).map(([bankName, amount]: [string, number]) => (
          <div key={bankName} className="bg-white p-4 rounded-lg shadow-xs border">
            <h3 className="text-sm font-medium text-gray-500">{bankName}</h3>
            <p className="text-lg font-semibold">{formatCurrency(amount)}</p>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Deposit Records</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Make Deposit
        </button>
      </div>

      {/* Deposit Records Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ledger.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono">{formatCurrency(entry.amount_paid)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{entry.mode_of_payment}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {entry.mode_of_mobilemoney || entry.bank_name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {entry.purpose || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => deleteFinanceEntry(entry.id)}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Make a Deposit</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (UGX)</label>
                  <input 
                    type="number" 
                    placeholder="Enter amount" 
                    value={amountPaid} 
                    onChange={(e) => setAmountPaid(e.target.value === "" ? "" : parseFloat(e.target.value))} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select 
                    value={modeOfPayment} 
                    onChange={(e) => setModeOfPayment(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select payment mode</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Mobile Money">Mobile Money</option>
                  </select>
                </div>

                {modeOfPayment === "Mobile Money" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Provider</label>
                    <select 
                      value={modeOfMobileMoney} 
                      onChange={(e) => setModeOfMobileMoney(e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select provider</option>
                      <option value="MTN">MTN</option>
                      <option value="Airtel">Airtel</option>
                    </select>
                  </div>
                )}

                {modeOfPayment === "Bank" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter bank name" 
                      value={bankName} 
                      onChange={(e) => setBankName(e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose/Reason</label>
                  <input 
                    type="text" 
                    placeholder="Enter purpose of deposit" 
                    value={purpose} 
                    onChange={(e) => setPurpose(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDepositSubmit} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Submit Deposit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
