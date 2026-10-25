<script lang="ts">
    interface Props {
        onNewProject: () => void;
        onImportProject: () => void;
    }

    let { onNewProject, onImportProject }: Props = $props();
</script>

<section class="welcome-hero" aria-labelledby="welcome-heading">
    <div class="hero-left">
        <h1 id="welcome-heading" class="hero-title">
            Welcome to <span class="brand-gradient">FictionClosure</span>
        </h1>
        <p class="hero-subtitle">
            A Markdown-first fiction writing workspace built for speed, safety,
            creative flow, git integration, modern UI, keyboard-focus and
            customization.
        </p>
    </div>
    <div class="hero-actions">
        <button
            type="button"
            class="btn primary-action"
            onclick={onNewProject}
        >
            <span class="btn-icon"><i class="fa-solid fa-plus"></i></span>
            <span>New Project</span>
        </button>
        <button
            type="button"
            class="btn secondary-action"
            onclick={onImportProject}
        >
            <span class="btn-icon"><i class="fa-solid fa-folder-open"></i></span>
            <span>Import / Open Folder</span>
        </button>
    </div>
</section>

<style>
    .welcome-hero {
        background: linear-gradient(
            135deg,
            rgba(230, 157, 69, 0.08) 0%,
            rgba(88, 166, 255, 0.04) 100%
        );
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 12px;
        padding: 24px 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
    }

    @media (max-width: 800px) {
        .welcome-hero {
            flex-direction: column;
            align-items: flex-start;
        }
    }

    .hero-left {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .hero-title {
        font-size: 24px;
        font-weight: 800;
        color: var(--text-primary, #e6edf3);
        margin: 0;
        letter-spacing: -0.02em;
    }

    .brand-gradient {
        background: linear-gradient(120deg, #e69d45 0%, #f0b060 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
        font-size: 13px;
        color: var(--text-secondary, #c9d1d9);
        margin: 0;
        max-width: 580px;
        line-height: 1.5;
    }

    .hero-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
    }

    .btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        border: 1px solid transparent;
    }

    .primary-action {
        background: var(--accent-primary, #e69d45);
        color: #12151a;
    }

    .primary-action:hover {
        background: var(--accent-hover, #f0b060);
        box-shadow: 0 4px 12px rgba(230, 157, 69, 0.3);
    }

    .secondary-action {
        background: var(--bg-tertiary, #21262d);
        border-color: var(--border-subtle, #30363d);
        color: var(--text-primary, #e6edf3);
    }

    .secondary-action:hover {
        background: var(--bg-hover, rgba(255, 255, 255, 0.08));
        border-color: var(--accent-primary, #e69d45);
    }

    .btn-icon {
        font-size: 14px;
    }
</style>
