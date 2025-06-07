<script lang="ts">
  import { onMount } from "svelte";
  import type { Transaction, CategorizedTransaction } from "./lib/types";
  import { getCategory, CATEGORY_RULES } from "./lib/categories";
  import BarChart from "./lib/BarChart.svelte";
  import type { ChartData, ChartOptions } from "chart.js";

  // --- State Management ---
  let rawTransactions = $state<Transaction[]>([]);
  let displayTransactions = $state<CategorizedTransaction[]>([]);
  let searchTerm = $state("");
  let selectedCategory = $state("all");
  let startDate = $state("");
  let endDate = $state("");
  let sortKey = $state<"date" | "amount" | "category">("date");
  let sortDirection = $state<"asc" | "desc">("asc");

  onMount(async () => {
    const response = await fetch("static/transactions.json");
    rawTransactions = await response.json();
  });

  $effect(() => {
    if (rawTransactions.length > 0) {
      displayTransactions = rawTransactions.map((t) => ({
        ...t,
        category: getCategory(t.description),
      }));
    }
  });

  // List of all possible categories for the dropdowns in each row
  const allPossibleCategories = $derived([
    "Uncategorized",
    ...Object.keys(CATEGORY_RULES).sort(),
  ]);

  // List of categories currently present in the data for the main filter
  const uniqueCategoriesForFilter = $derived([
    "all",
    ...new Set(displayTransactions.map((t) => t.category).sort()),
  ]);

  const filteredTransactions = $derived(
    displayTransactions.filter((t) => {
      const searchMatch =
        searchTerm === "" ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.amount.toString().includes(searchTerm);

      const categoryMatch =
        selectedCategory === "all" || t.category === selectedCategory;

      const transactionDate = new Date(t.date);
      const startMatch =
        startDate === "" || transactionDate >= new Date(startDate);
      const endMatch = endDate === "" || transactionDate <= new Date(endDate);

      return searchMatch && categoryMatch && startMatch && endMatch;
    })
  );

  const sortedTransactions = $derived(() => {
    if (!sortKey) return filteredTransactions;

    const sorted = [...filteredTransactions].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (typeof valA === "string" && typeof valB === "string") {
        return valA.localeCompare(valB);
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return valA - valB;
      }
      if (sortKey === "date") {
        return new Date(valA).getTime() - new Date(valB).getTime();
      }
      return 0;
    });

    return sortDirection === "asc" ? sorted : sorted.reverse();
  });

  const rawChartData: ChartData<"bar"> = $derived(
    (() => {
      const spendingByCategory = new Map<string, number>();
      for (const transaction of filteredTransactions) {
        if (transaction.amount < 0) {
          const currentTotal =
            spendingByCategory.get(transaction.category) || 0;
          spendingByCategory.set(
            transaction.category,
            Math.round(currentTotal + Math.abs(transaction.amount))
          );
        }
      }
      const sortedCategories = [...spendingByCategory.entries()].sort(
        (a, b) => b[1] - a[1]
      );

      return {
        labels: sortedCategories.map((entry) => entry[0]),
        datasets: [
          {
            label: "Spending by Category",
            data: sortedCategories.map((entry) => entry[1]),
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      };
    })()
  );

  // Initialize with an empty structure that matches the ChartData type.
  let chartData = $state<ChartData<"bar">>({
    labels: [],
    datasets: [{ data: [], label: "Spending by Category" }],
  });

  $effect(() => {
    if (JSON.stringify(chartData) !== JSON.stringify(rawChartData)) {
      // If the content is different, update the stable state.
      chartData = rawChartData;
    }
  });

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Spending Summary" },
    },
  };

  function handleSort(key: "date" | "amount" | "category") {
    if (sortKey === key) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDirection = "asc";
    }
  }

  function getSortIndicator(key: "date" | "amount" | "category"): string {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? "▲" : "▼";
  }
</script>

<main>
  <h1>Transactions</h1>

  <div class="filters">
    <div class="filter-group">
      <label for="search-input" class="form-label-color">Search</label>
      <input
        id="search-input"
        type="search"
        placeholder="Description or amount"
        bind:value={searchTerm}
        class="form-text-color"
      />
    </div>
    <div class="filter-group">
      <label for="category-filter" class="form-label-color"
        >Filter by Category</label
      >
      <select
        id="category-filter"
        bind:value={selectedCategory}
        class="form-text-color"
      >
        {#each uniqueCategoriesForFilter as category}
          <option value={category}
            >{category.charAt(0).toUpperCase() + category.slice(1)}</option
          >
        {/each}
      </select>
    </div>
    <div class="filter-group">
      <label for="start-date" class="form-label-color">From</label>
      <input
        id="start-date"
        type="date"
        bind:value={startDate}
        class="form-text-color"
      />
    </div>
    <div class="filter-group">
      <label for="end-date" class="form-label-color">To</label>
      <input
        id="end-date"
        type="date"
        bind:value={endDate}
        class="form-text-color"
      />
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th onclick={() => handleSort("date")}>
            Date {getSortIndicator("date")}
          </th>
          <th>Description</th>
          <th onclick={() => handleSort("amount")}>
            Amount {getSortIndicator("amount")}
          </th>
          <th onclick={() => handleSort("category")}>
            Category {getSortIndicator("category")}
          </th>
        </tr>
      </thead>
      <tbody>
        {#each sortedTransactions() as transaction (transaction.id)}
          <tr>
            <td data-label="Date">{transaction.date}</td>
            <td data-label="Description">{transaction.description}</td>
            <td
              data-label="Amount"
              class={transaction.amount > 0 ? "positive" : "negative"}
            >
              ${transaction.amount.toFixed(2)}
            </td>
            <td data-label="Category">
              <select bind:value={transaction.category} class="form-text-color">
                {#each allPossibleCategories as cat}
                  <option value={cat}>{cat}</option>
                {/each}
              </select>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="4">No transactions found.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="totals-container">
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Total</th>
          <th>Average</th>
        </tr>
      </thead>
      <tbody>
        {#each allPossibleCategories as category}
          <tr>
            <td data-label="Category">{category}</td>
            <td
              data-label="Total"
              class={displayTransactions
                .filter((x) => x.category === category)
                .map((x) => x.amount)
                .reduce((a, b) => a + b, 0) > 0
                ? "positive"
                : "negative"}
              >${displayTransactions.filter((x) => x.category === category)
                .length > 0
                ? displayTransactions
                    .filter((x) => x.category === category)
                    .map((x) => x.amount)
                    .reduce((a, b) => a + b, 0)
                    .toFixed(2)
                : 0}</td
            >
            <td
              data-label="Average"
              class={displayTransactions
                .filter((x) => x.category === category)
                .map((x) => x.amount)
                .reduce((a, b) => a + b, 0) > 0
                ? "positive"
                : "negative"}
            >
              ${displayTransactions.filter((x) => x.category === category)
                .length > 0
                ? (
                    displayTransactions
                      .filter((x) => x.category === category)
                      .map((x) => x.amount)
                      .reduce((a, b) => a + b, 0) /
                    displayTransactions.filter((x) => x.category === category)
                      .length
                  ).toFixed(2)
                : 0}
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="4">No data to display.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="chart-container">
    {#if chartData.labels && chartData.labels.length > 0}
      <BarChart data={chartData} options={chartOptions} />
    {/if}
  </div>
</main>

<style>
  :root {
    --primary-color: #4a5568;
    --secondary-color: #edf2f7;
    --border-color: #cbd5e0;
    --text-color: #cbd5e0;
    --form-text-color: #2d3748;
    --header-text-color: #2d3748;
    --negative-color: #c53030;
    --positive-color: #2f855a;
  }

  main {
    max-width: 900px;
    margin: 2rem auto;
    padding: 0 1rem;
    font-family: sans-serif;
    color: var(--text-color);
  }

  h1 {
    text-align: center;
    color: var(--primary-color);
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem; /* Increased gap for better spacing between groups */
    margin-bottom: 1.5rem;
    margin-left: 0.5rem;
  }

  /* NEW: Style for the label/input groups */
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem; /* Space between label and input */
    flex-grow: 1;
    min-width: 120px;
    max-width: 150px;
  }

  /* NEW: Style for the labels */
  .filter-group label {
    font-size: 0.875rem; /* 14px */
    font-weight: 500;
  }

  /* This now styles the inputs within the group */
  .filters input,
  .filters select {
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    background-color: white;
    color-scheme: auto;
    max-width: 150px;
  }

  .table-container {
    width: 100%;
    overflow-x: auto;
    margin-bottom: 5rem;
  }

  .chart-container {
    height: 350px;
  }

  .totals-container {
    width: 100%;
    margin-bottom: 5rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
  }

  .form-text-color {
    color: var(--primary-color);
  }

  .form-label-color {
    color: var(--text-color);
  }

  thead {
    background-color: var(--secondary-color);
    color: var(--header-text-color);
  }

  th {
    font-weight: 600;
    cursor: pointer;
    user-select: none;
  }

  th:hover {
    background-color: #e2e8f0;
  }

  .positive {
    color: var(--positive-color);
  }
  .negative {
    color: var(--negative-color);
  }

  td select {
    width: 100%;
    padding: 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid var(--border-color);
    background-color: white;
    font-size: 1em;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%234a5568' class='w-6 h-6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m19.5 8.25-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    background-size: 1.25em;
    padding-right: 2rem;
  }

  @media (max-width: 640px) {
    thead {
      display: none;
    }

    tr {
      display: block;
      border: 1px solid var(--border-color);
      margin-bottom: 1rem;
      border-radius: 0.25rem;
    }

    td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
    }

    td::before {
      content: attr(data-label);
      font-weight: 600;
      margin-right: 1rem;
      flex-shrink: 0;
    }

    td:last-child {
      border-bottom: none;
    }

    td select {
      flex-grow: 1;
    }

    .filters {
      margin-left: unset;
    }
  }
</style>
