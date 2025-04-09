'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxnrfzcurobahklqefjs.supabase.co';
const supabaseKey = 'YOUR_SUPABASE_KEY'; // Replace with environment variable
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LedgerPage() {
  const router = useRouter();
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [accountBalances, setAccountBalances] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('Loading...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total expenses
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('amount')
          .eq('submittedby', 'Cashier');

        if (!expensesError && expensesData) {
          const total = expensesData.reduce((sum, item) => sum + (item.amount || 0), 0);
          setTotalExpenses(total);
        }

        // Fetch account balances
        const { data: accountsData, error: accountsError } = await supabase
          .from('finance')
          .select('amount_available')
          .eq('submittedby', 'Cashier')
          .eq('currency', 'UGX');

        if (!accountsError && accountsData) {
          const total = accountsData.reduce((sum, item) => sum + (item.amount_available || 0), 0);
          setAccountBalances(total);
        }

        // Fetch last updated date
        const { data: dateData, error: dateError } = await supabase
          .from('finance')
          .select('created_at')
          .eq('submittedby', 'Cashier')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!dateError && dateData && dateData[0]?.created_at) {
          const date = new Date(dateData[0].created_at);
          setLastUpdated(date.toLocaleDateString());
        } else {
          setLastUpdated('Today');
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const ledgerCards = [
    {
      title: "Expenses Ledger",
      description: "Track company expenses like materials, wages, and other costs",
      path: "/admin/ledgers/expenses",
      bgColor: "bg-red-50 hover:bg-red-100",
      borderColor: "border-red-200",
      accentColor: "text-red-600"
    },
    {
      title: "Accounts",
      description: "Track amounts received via various company accounts",
      path: "/admin/ledgers/accounts",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      borderColor: "border-blue-200",
      accentColor: "text-blue-600"
    }
  ];

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📊</span>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            Ledger Management
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-2xl">
          Comprehensive financial tracking and accounting management system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {ledgerCards.map((card, index) => (
          <Card 
            key={index}
            className={`cursor-pointer ${card.bgColor} border ${card.borderColor} shadow-sm hover:shadow-md transition-all duration-200 group`}
            onClick={() => router.push(card.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
              <div>
                <CardTitle className={`text-lg font-semibold ${card.accentColor} group-hover:underline`}>
                  {card.title}
                </CardTitle>
              </div>
              <div className="p-3 rounded-lg bg-white shadow-sm border">
                <span className="text-xl">
                  {index === 0 ? '💰' : '💳'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {card.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
                  View ledger →
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-white border text-gray-600">
                  {index + 1}/{ledgerCards.length}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>📈</span>
          Cashier Financial Summary
        </h3>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-xs border animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-500 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-xs border">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
              <p className="text-xl font-bold">{totalExpenses.toLocaleString()} UGX</p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-xs border">
              <p className="text-sm text-gray-500 dark:text-gray-400">Account Balances </p>
              <p className="text-xl font-bold">{accountBalances.toLocaleString()} UGX</p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-xs border">
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
              <p className="text-xl font-bold">{lastUpdated}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
