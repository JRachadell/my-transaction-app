<script lang="ts">
	import { onMount } from 'svelte';
	import type { Transaction, CategorizedTransaction } from '$lib/types';
	import { getCategory } from '$lib/categories';

	// Svelte 5 State Management using Runes
	let rawTransactions = $state<Transaction[]>([]);
	let searchTerm = $state('');
	let selectedCategory = $state('all');
	let startDate = $state('');
	let endDate = $state('');
	let sortKey = $state<'date' | 'amount' | 'category' | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');

	onMount(async () => {
		// Fetch data from the static JSON file
		const response = await fetch('/transactions.json');
		rawTransactions = await response.json();
	});

	// --- Derived State: Automatically recalculates when dependencies change ---

	// 1. Add categories to raw transactions
	const categorizedTransactions = $derived(
		rawTransactions.map((t) => ({
			...t,
			category: getCategory(t.description)
		}))
	);

	// 2. Create a list of unique categories for the filter dropdown
	const uniqueCategories = $derived([
		'all',
		...new Set(categorizedTransactions.map((t) => t.category).sort())
	]);

	// 3. Filter transactions based on user inputs
	const filteredTransactions = $derived(
		categorizedTransactions.filter((t) => {
			// Search filter (description and amount)
			const searchMatch =
				searchTerm === '' ||
				t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
				t.amount.toString().includes(searchTerm);
			
			// Category filter
			const categoryMatch = selectedCategory === 'all' || t.category === selectedCategory;

			// Date range filter
			const transactionDate = new Date(t.date);
			const startMatch = startDate === '' || transactionDate >= new Date(startDate);
			const endMatch = endDate === '' || transactionDate <= new Date(endDate);
			
			return searchMatch && categoryMatch && startMatch && endMatch;
		})
	);

	// 4. Sort the filtered transactions
	const sortedTransactions = $derived(() => {
		if (!sortKey) return filteredTransactions;

		const sorted = [...filteredTransactions].sort((a, b) => {
			const valA = a[sortKey];
			const valB = b[sortKey];

			if (typeof valA === 'string' && typeof valB === 'string') {
				return valA.localeCompare(valB);
			}
			if (typeof valA === 'number' && typeof valB === 'number') {
				return valA - valB;
			}
			// Handle date sorting (as strings 'YYYY-MM-DD')
			if (sortKey === 'date') {
				return new Date(valA).getTime() - new Date(valB).getTime();
			}

			return 0;
		});

		return sortDirection === 'asc' ? sorted : sorted.reverse();
	});

	// --- Event Handlers ---

	function handleSort(key: 'date' | 'amount' | 'category') {
		if (sortKey === key) {
			// If already sorting by this key, reverse direction
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			// Otherwise, set new key and default to ascending
			sortKey = key;
			sortDirection = 'asc';
		}
	}

	function getSortIndicator(key: 'date' | 'amount' | 'category'): string {
		if (sortKey !== key) return '';
		return sortDirection === 'asc' ? '▲' : '▼';
	}
</script>

<main>
	<h1>Transactions</h1>

	<div class="filters">
		<input type="search" placeholder="Search description or amount..." bind:value={searchTerm} />
		<select bind:value={selectedCategory}>
			{#each uniqueCategories as category}
				<option value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
			{/each}
		</select>
		<input type="date" bind:value={startDate} title="Start Date"/>
		<input type="date" bind:value={endDate} title="End Date"/>
	</div>

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th on:click={() => handleSort('date')}>
						Date {getSortIndicator('date')}
					</th>
					<th>Description</th>
					<th on:click={() => handleSort('amount')}>
						Amount {getSortIndicator('amount')}
					</th>
					<th on:click={() => handleSort('category')}>
						Category {getSortIndicator('category')}
					</th>
				</tr>
			</thead>
			<tbody>
				{#each sortedTransactions as transaction (transaction.id)}
					<tr>
						<td data-label="Date">{transaction.date}</td>
						<td data-label="Description">{transaction.description}</td>
						<td data-label="Amount" class={transaction.amount > 0 ? 'positive' : 'negative'}>
							${transaction.amount.toFixed(2)}
						</td>
						<td data-label="Category">{transaction.category}</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4">No transactions found.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</main>

<style>
	:root {
		--primary-color: #4a5568;
		--secondary-color: #edf2f7;
		--border-color: #cbd5e0;
		--text-color: #2d3748;
		--negative-color: #c53030;
		--positive-color: #2f855a;
	}

	main {
		max-width: 800px;
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
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.filters input,
	.filters select {
		padding: 0.5rem;
		border: 1px solid var(--border-color);
		border-radius: 0.25rem;
		background-color: white;
		flex-grow: 1;
	}

	.table-container {
		width: 100%;
		overflow-x: auto; /* Allows horizontal scrolling on small screens if needed */
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th, td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid var(--border-color);
	}

	thead {
		background-color: var(--secondary-color);
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

	/* Responsive Table for Mobile */
	@media (max-width: 640px) {
		thead {
			display: none; /* Hide table headers */
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
			content: attr(data-label); /* Use data-label for pseudo-headers */
			font-weight: 600;
			margin-right: 1rem;
		}

		td:last-child {
			border-bottom: none;
		}
	}
</style>