<script lang="ts">
	import {
		Chart,
		BarController,
		BarElement,
		CategoryScale,
		LinearScale,
		Title,
		Tooltip,
		Legend
	} from 'chart.js';
	import type { ChartData, ChartOptions } from 'chart.js';

	Chart.register(
		BarController,
		BarElement,
		CategoryScale,
		LinearScale,
		Title,
		Tooltip,
		Legend
	);

	const { data, options } = $props<{
		data: ChartData<'bar'>;
		options?: ChartOptions<'bar'>;
	}>();

	let canvasElement = $state<HTMLCanvasElement | undefined>(undefined);
	let chartInstance: Chart<'bar'> | null = null;

	$effect(() => {
		if (!canvasElement) return;

		const dataClone = JSON.parse(JSON.stringify(data));
		const optionsClone = options ? JSON.parse(JSON.stringify(options)) : {};

		if (chartInstance) {
			// If the chart exists, just update it imperatively.
			// This does NOT trigger Svelte reactivity.
			chartInstance.data = dataClone;
			chartInstance.options = optionsClone;
			chartInstance.update();
		} else {
			// Create the chart instance and store it in our plain variable.
			chartInstance = new Chart(canvasElement, {
				type: 'bar',
				data: dataClone,
				options: optionsClone
			});
		}
	});

	// The cleanup effect is separate and simpler. It runs when the component is unmounted.
	$effect(() => {
		return () => {
			// When the component is destroyed, destroy the chart instance.
			if (chartInstance) {
				chartInstance.destroy();
				chartInstance = null;
			}
		};
	});

</script>

<canvas bind:this={canvasElement}></canvas>