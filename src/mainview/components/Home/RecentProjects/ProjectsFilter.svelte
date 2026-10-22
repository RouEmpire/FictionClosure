<script lang="ts">
    interface Props {
        count: number;
        searchQuery: string;
    }

    let { count, searchQuery = $bindable("") }: Props = $props();
</script>

<div class="section-title-bar">
    <div class="title-with-count">
        <h2 id="recent-heading" class="section-heading">
            Recent Projects
        </h2>
        <span class="count-badge">{count}</span>
    </div>

    <!-- Filter Search Box -->
    <div class="filter-box">
        <span class="filter-icon">
            <i class="fa-solid fa-magnifying-glass"></i>
        </span>
        <input
            type="text"
            placeholder="Filter projects..."
            bind:value={searchQuery}
            aria-label="Filter recent projects"
        />
        {#if searchQuery}
            <button
                type="button"
                class="clear-filter-btn"
                onclick={() => (searchQuery = "")}
                title="Clear filter"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>
        {/if}
    </div>
</div>
