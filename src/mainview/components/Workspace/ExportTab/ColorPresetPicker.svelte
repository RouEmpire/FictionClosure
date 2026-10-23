<script lang="ts">
	interface Props {
		id: string;
		label: string;
		hint: string;
		value: string;
		presets: Array<{ id: string; label: string; hex: string }>;
		onChange: (color: string) => void;
	}

	let { id, label, hint, value = $bindable(), presets, onChange }: Props = $props();

	function handleChipClick(hex: string) {
		value = hex;
		onChange(hex);
	}
</script>

<div class="option-field">
	<label class="option-label" for={id}>
		<span>{label}</span>
		<span class="option-hint">{hint}</span>
	</label>
	<div class="color-picker-row">
		<input
			type="color"
			{id}
			class="color-input-native"
			bind:value
			oninput={() => onChange(value)}
		/>
		<input
			type="text"
			class="option-input color-hex-input"
			bind:value
			oninput={() => onChange(value)}
		/>
		<div class="color-chips-row">
			{#each presets as c (c.id)}
				<button
					type="button"
					class="color-chip"
					class:selected={value.toUpperCase() === c.hex.toUpperCase()}
					style="background-color: {c.hex};"
					onclick={() => handleChipClick(c.hex)}
					title={c.label}
					aria-label={c.label}
				></button>
			{/each}
		</div>
	</div>
</div>
