import React, { useState, useEffect } from "react";
import "./App.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_KEY =process.env.REACT_APP_MY_API_KEY


function App() {
  const [transactions, setTransactions] = useState([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("expense");
  const [currentId, setCurrentId] = useState(1);
  const [editingTransaction, setEditingTransaction] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(process.env.REACT_APP_MY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({
          query: `
          {
            transactionCollection(first: 50) {
              edges {
                node {
                  id
                  description
                  amount
                  date
                  type
                }
              }
            }
          }
          `,
        }),
      });

      const result = await response.json();
      console.log("API Response:", result);

      if (result.data && result.data.transactionCollection) {
        const transactionsData = result.data.transactionCollection.edges.map(edge => edge.node);
        setTransactions(transactionsData);
        const highestId = Math.max(...transactionsData.map(item => item.id));
        setCurrentId(highestId + 1);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("An error occurred while fetching transactions.");
    }
  };

  const handleAddTransaction = async () => {
    if (description && amount && date) {
      try {
        const response = await fetch(process.env.REACT_APP_MY_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify({
            query: `
            mutation TransactionCreate($input: TransactionCreateInput!) {
              transactionCreate(input: $input) {
                transaction {
                  id
                  description
                  amount
                  date
                  type
                }
              }
            }
            `,
            variables: {
              input: {
                description,
                amount: parseFloat(amount),
                date,
                type,
              },
            },
          }),
        });

        const result = await response.json();
        console.log("Add Transaction Result:", result);

        if (result.data && result.data.transactionCreate) {
          const newTransaction = result.data.transactionCreate.transaction;
          setTransactions([...transactions, newTransaction]);
          setCurrentId(currentId + 1);

          setDescription("");
          setAmount("");
          setDate("");
          setType("expense");

          toast.success("Transaction added successfully!");
        }
      } catch (error) {
        console.error("Error adding transaction:", error);
        toast.error("An error occurred while adding the transaction.");
      }
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const response = await fetch(process.env.REACT_APP_MY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({
          query: `
            mutation TransactionDelete($id: ID!) {
              transactionDelete(by: { id: $id }) {
                deletedId
              }
            }
          `,
          variables: {
            id: transactionId,
          },
        }),
      });

      const result = await response.json();
      console.log("Delete Transaction Result:", result);

      if (result.data && result.data.transactionDelete) {
        const deletedId = result.data.transactionDelete.deletedId;
        const updatedTransactions = transactions.filter(transaction => transaction.id !== deletedId);
        setTransactions(updatedTransactions);

        toast.info("Transaction deleted.");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("An error occurred while deleting the transaction.");
    }
  };

  const handleEditTransaction = (transaction) => {
    setDescription(transaction.description);
    setAmount(transaction.amount.toString());
    setDate(transaction.date);
    setType(transaction.type);
    setEditingTransaction(transaction);
  };

  const handleUpdateTransaction = async () => {
    if (description && amount && date && editingTransaction) {
      try {
        const updatedTransaction = {
          description,
          amount: parseFloat({amount}),
          date,
          type,
        };
  
        const response = await fetch(process.env.REACT_APP_MY_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify({
            query: `
            mutation TransactionUpdate($by: TransactionByInput!, $input: TransactionUpdateInput!) {
              transactionUpdate(by: $by, input: $input) {
                transaction {
                  id
                  description
                  amount
                  date
                  type
                }
              }
            }
            `,
            variables: {
              by: { id: editingTransaction.id },
              input: updatedTransaction,
            },
          }),
        });
  
        const result = await response.json();
        console.log("Update Transaction Result:", result);
  
        if (result.data && result.data.transactionUpdate) {
          const updatedTransactionData = result.data.transactionUpdate.transaction;
          const updatedTransactions = transactions.map(transaction =>
            transaction.id === updatedTransactionData.id ? updatedTransactionData : transaction
          );
          setTransactions(updatedTransactions);
  
          setDescription("");
          setAmount("");
          setDate("");
          setType("expense");
          setEditingTransaction(null);
  
          toast.success("Transaction updated successfully!");
        }
      } catch (error) {
        console.error("Error updating transaction:", error);
        toast.error("An error occurred while updating the transaction.");
      }
    }
  };   


  const totalAmount = transactions.reduce(
    (total, transaction) =>
      transaction.type === "expense"
        ? total - transaction.amount
        : total + transaction.amount,
    0
  );

  return (
    <div className="App">
      <h1 className="title">Transaction Tracker</h1>
      <div className="transaction-form">
        <input
          type="text"
          className="input"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="number"
          className="input"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <select
          className="input"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="expense">Expense</option>
          <option value="revenue">Revenue</option>
        </select>
        {editingTransaction ? (
          <div>
            <button className="update-button" onClick={handleUpdateTransaction}>
              Update Transaction
            </button>
            <button className="cancel-button" onClick={() => setEditingTransaction(null)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="add-button" onClick={handleAddTransaction}>
            Add Transaction
          </button>
        )}
      </div>
      <div>
        <ul className="transaction-list">
          {transactions.map((transaction) => (
            <li
              key={transaction.id}
              className={`transaction-item ${
                transaction.type === "expense" ? "expense" : "revenue"
              }`}
            >
              <strong>{transaction.description}</strong> ${transaction.amount.toFixed(2)} ({transaction.date})
              <div className="button-group">
                <button className="edit-button" onClick={() => handleEditTransaction(transaction)}>
                  Edit
                </button>
                <button className="delete-button" onClick={() => handleDeleteTransaction(transaction.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="total">Total: ${totalAmount.toFixed(2)}</p>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

export default App;
