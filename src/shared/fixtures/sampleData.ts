import type { FictionDocument, ProjectFolder, ProjectInfo } from "../types";

export const initialFolders: ProjectFolder[] = [
	{
		id: "folder-manuscript",
		name: "Manuscript",
		type: "manuscript",
		icon: "fa-solid fa-book-open",
		tags: ["manuscript"],
		note: "Primary chapters of The Whispering Tide",
		relativePath: "manuscript",
		createdAt: "2026-10-10T09:00:00Z",
		updatedAt: "2026-10-15T14:32:00Z",
		parentId: null,
	},
	{
		id: "folder-act-1",
		name: "Act I: Port of Shadows",
		type: "manuscript",
		icon: "fa-solid fa-folder-open",
		tags: ["act-1", "harbor"],
		note: "Elena's arrival at Ash Harbor and discovery of the oceanic anomaly.",
		relativePath: "manuscript/act-1",
		createdAt: "2026-10-10T09:00:00Z",
		updatedAt: "2026-10-15T14:32:00Z",
		parentId: "folder-manuscript",
	},
	{
		id: "folder-characters",
		name: "Characters",
		type: "character",
		icon: "fa-solid fa-user",
		tags: ["cast"],
		note: "Cast dossiers and character sheets",
		relativePath: "characters",
		createdAt: "2026-10-10T09:00:00Z",
		updatedAt: "2026-10-15T14:32:00Z",
		parentId: null,
	},
	{
		id: "folder-plots",
		name: "Plots & Arcs",
		type: "plot",
		icon: "fa-solid fa-chart-line",
		tags: ["structure"],
		note: "Plot arcs and outlines",
		relativePath: "plots",
		createdAt: "2026-10-10T09:00:00Z",
		updatedAt: "2026-10-15T14:32:00Z",
		parentId: null,
	},
	{
		id: "folder-world",
		name: "World & Lore",
		type: "world",
		icon: "fa-solid fa-map",
		tags: ["lore"],
		note: "Islands, reefs, factions, and tide magic",
		relativePath: "world",
		createdAt: "2026-10-10T09:00:00Z",
		updatedAt: "2026-10-15T14:32:00Z",
		parentId: null,
	},
	{
		id: "folder-world-locations",
		name: "Locations",
		type: "world",
		icon: "fa-solid fa-location-dot",
		tags: ["islands", "ports"],
		note: "Archipelago islands and navigation waypoints",
		relativePath: "world/locations",
		createdAt: "2026-10-10T09:00:00Z",
		updatedAt: "2026-10-15T14:32:00Z",
		parentId: "folder-world",
	},
	{
		id: "folder-notes",
		name: "Notes & Outlines",
		type: "note",
		icon: "fa-solid fa-file-lines",
		tags: ["research"],
		note: "Tide chart research and ideas",
		relativePath: "notes",
		createdAt: "2026-10-10T09:00:00Z",
		updatedAt: "2026-10-15T14:32:00Z",
		parentId: null,
	},
];

export const initialProject: ProjectInfo = {
	name: "The Whispering Tide",
	author: "A. R. Vance",
	genre: "Naval Fantasy / Mystery",
	targetWordCount: 80000,
	folders: initialFolders,
};

export const sampleDocuments: FictionDocument[] = [
	{
		id: "doc-ch1",
		title: "Chapter 1: The Ash Harbor",
		type: "manuscript",
		status: "revised",
		tags: ["Act I", "Opening", "Port"],
		pov: "Elena Vance",
		summary: "Elena arrives at Ash Harbor seeking passage past the Reef of Whispers.",
		order: 1,
		folderId: "folder-act-1",
		createdAt: "2026-10-10T09:00:00Z",
		updatedAt: "2026-10-15T14:32:00Z",
		content: `# Chapter 1: The Ash Harbor

The mist clung to Ash Harbor like cold grease.

Elena leaned against the weathered salt-pine railing of the lower docks, watching the morning packet boat struggle against the undertow. Every sailor in the archipelago knew the waters had grown heavier since the eclipse, but nobody spoke it aloud. To name the tides was to invite them in.

"You're standing where the tide marks used to be, girl," a voice rasped behind her.

She turned to find [[Captain Kaelen]] adjusting the bronze quadrant at his hip. His coat was crusted white with dried brine, frayed at the cuffs where silver thread had once traced naval insignia.

"The tide hasn't touched this quay in forty years, Captain," Elena said, tapping the iron ledger under her arm. "According to the guild records, Ash Harbor rests three fathoms above the surge."

"Records lie when the seabed shivers," Kaelen muttered, staring past the breakwater toward [[The Driftwood Isles]]. "Take a look at the buoys. The bells aren't ringing with the wind. They're ringing with the bottom."

Elena followed his gaze. Far across the grey chop, the channel markers dipped with irregular, syncopated jerks—as if something huge and restless was breathing beneath the kelp shelves.

Her fingers tightened on the brass clasp of her journal. If the charts were wrong, then everything she had prepared for the crossing would need to be rewritten before dusk.
`,
	},
	{
		id: "doc-ch2",
		title: "Chapter 2: The Cartographer's Needle",
		type: "manuscript",
		status: "in-progress",
		tags: ["Act I", "Navigation", "Mystery"],
		pov: "Elena Vance",
		summary: "Elena discovers anomalous magnetic shifts while recalibrating the sea compass.",
		order: 2,
		folderId: "folder-act-1",
		createdAt: "2026-10-12T11:20:00Z",
		updatedAt: "2026-10-16T18:15:00Z",
		content: `# Chapter 2: The Cartographer's Needle

The lantern oil smelled of rancid clover.

In the cramped backroom of the harbor master's depot, Elena laid out three generations of navigational vellum. The paper was stiff, yellowed with age, and crackled under the dry friction of her calipers.

She set the iron lodestone in the center of the table.

Normally, the needle would swing true toward the Northern Spire. Today, it trembled, spun two full revolutions, and drifted toward the south-by-southeast—directly pointing at the submerged trenches of [[The Driftwood Isles]].

"Curious," she whispered.

She cross-referenced the reading with her notes on [[Aether Resonance]]. When mineral veins in the seabed saturate with arcane currents, magnetic lines warp. But an attraction of this magnitude required either a sunken engine or an awakened titan.
`,
	},
	{
		id: "doc-char-elena",
		title: "Elena Vance",
		type: "character",
		status: "completed",
		tags: ["Protagonist", "Cartographer", "Scholar"],
		pov: "Elena Vance",
		summary: "A stubborn cartographer and scholar exiled from the mainland observatory.",
		order: 1,
		folderId: "folder-characters",
		createdAt: "2026-10-08T10:00:00Z",
		updatedAt: "2026-10-14T11:00:00Z",
		content: `# Elena Vance

## Role in Story
Protagonist. Former assistant archivist at the High Observatory; now an independent nautical surveyor attempting to map unchartable waters.

## Physical Description
- **Age**: 27
- **Eyes**: Amber-hazel, sharp and calculating.
- **Notable features**: Ink stains across her right thumb and forefinger; wears an oiled canvas duster with deep interior map pockets.

## Motive & Stakes
- **Goal**: Chart the hidden reef passages before the winter freeze closes the strait.
- **Fear**: Discovering that her father's fatal shipwreck was caused by intentional chart tampering rather than bad weather.
- **Conflict with [[Captain Kaelen]]**: Trusts instruments and written records; Kaelen trusts instinct, salt-scent, and maritime folklore.

## Key Relationships
- **[[Captain Kaelen]]**: Reluctant guide and shipmaster.
`,
	},
	{
		id: "doc-char-kaelen",
		title: "Captain Kaelen",
		type: "character",
		status: "in-progress",
		tags: ["Companion", "Sailor", "Veteran"],
		summary: "Veteran sea captain haunted by the loss of his corvette during the Third Blockade.",
		order: 2,
		folderId: "folder-characters",
		createdAt: "2026-10-09T14:00:00Z",
		updatedAt: "2026-10-15T16:20:00Z",
		content: `# Captain Kaelen

## Overview
Owner and captain of *The Peregrine*, an armored cutter refitted for shallow-water exploration.

## Background
- Veteran of the naval conflicts between the Eastern League and the Guild Coalition.
- Claims to have heard the singing coral beds near [[The Driftwood Isles]] firsthand.

## Mannerisms
- Never boards a ship with his left foot first.
- Carries a tarnished pocket quadrant that doesn't tell time, only tidal elevation.
`,
	},
	{
		id: "doc-world-isles",
		title: "The Driftwood Isles",
		type: "world",
		status: "draft",
		tags: ["Setting", "Archipelago", "Hazard"],
		summary: "A shifting maze of petrified banyan groves and volcanic shallows.",
		order: 1,
		folderId: "folder-world-locations",
		createdAt: "2026-10-09T16:00:00Z",
		updatedAt: "2026-10-13T12:00:00Z",
		content: `# The Driftwood Isles

## Geography & Hazards
The Driftwood Isles are not true volcanic islands, but ancient petrified mangrove and iron-banyan networks rooted in shallow continental shelves.

### Key Landmarks
1. **The Bone Shoals**: White coral shelves sharp enough to gut wooden keels.
2. **The Sunken Vault**: A pre-cataclysm stone pavilion submerged at high tide.
3. **Marrow Cay**: The only permanently dry island, inhabited by scavengers and tide-gatherers.

### The Phenomenon
During spring tides, water drains through subterranean caverns, creating whirlpools that emit low harmonic hums (see [[Aether Resonance]]).
`,
	},
	{
		id: "doc-world-aether",
		title: "Aether Resonance",
		type: "world",
		status: "draft",
		tags: ["Magic System", "Rules", "Science"],
		summary: "The natural interaction between tidal pressure and latent mineral harmonics.",
		order: 2,
		folderId: "folder-world",
		createdAt: "2026-10-10T11:00:00Z",
		updatedAt: "2026-10-14T09:45:00Z",
		content: `# Aether Resonance

## Fundamental Rules
1. **Pressure Amplification**: Arcane conductivity increases exponentially with hydrostatic depth.
2. **Harmonic Echoes**: Sound travels through resonated water four times faster than through air, transmitting thoughts or vibrations across miles.
3. **Inversion**: When celestial bodies align, the polarity of resonance flips, disorienting standard navigation compasses.
`,
	},
	{
		id: "doc-note-outline",
		title: "Plot Outline — Act I",
		type: "note",
		status: "in-progress",
		tags: ["Outline", "Planning", "Structure"],
		summary: "Pacing notes and plot beats for the opening third of the manuscript.",
		order: 1,
		folderId: "folder-notes",
		createdAt: "2026-10-07T08:30:00Z",
		updatedAt: "2026-10-16T17:00:00Z",
		content: `# Plot Outline — Act I

## Arc Structure
- [x] **Hook**: Elena arrives at Ash Harbor, observes anomalous tidal recessions.
- [x] **Inciting Incident**: Discovery of needle deflection in [[Chapter 2: The Cartographer's Needle]].
- [ ] **First Plot Point**: Securing passage aboard *The Peregrine* with [[Captain Kaelen]].
- [ ] **Midpoint Setup**: Entering the fog bank surrounding [[The Driftwood Isles]].

## Notes & Checkpoints
- Ensure Elena's voice remains pragmatic and observant, not overly dramatic.
- Foreshadow the depth effect of [[Aether Resonance]] in the tavern scene.
`,
	},
];
