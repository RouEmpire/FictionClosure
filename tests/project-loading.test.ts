import { describe, test, expect } from "bun:test";
import {
	formatTimestamp,
	createLogEntry,
	SIMULATED_BOOT_STEPS,
} from "../src/mainview/components/ProjectLoadingScreen/projectLoadingHelpers";

describe("Project Loading Screen Utilities", () => {
	test("formats timestamps with two-digit minutes, seconds, and three-digit milliseconds", () => {
		const testDate = new Date(2026, 0, 1, 14, 5, 9, 42);
		const formatted = formatTimestamp(testDate);
		expect(formatted).toBe("05:09.042");
	});

	test("createLogEntry constructs valid entry with timestamp and tag", () => {
		const entry = createLogEntry("MOUNT", "Mounting test project");
		expect(entry.tag).toBe("MOUNT");
		expect(entry.text).toBe("Mounting test project");
		expect(entry.id).toContain("log-");
		expect(entry.time).toMatch(/^\d{2}:\d{2}\.\d{3}$/);
	});

	test("SIMULATED_BOOT_STEPS defines ordered progression with valid messages", () => {
		expect(SIMULATED_BOOT_STEPS.length).toBeGreaterThan(0);

		let prevProgress = 0;
		for (const step of SIMULATED_BOOT_STEPS) {
			expect(step.progress).toBeGreaterThan(prevProgress);
			prevProgress = step.progress;

			const message = step.getMessage("TestProject", "/path/to/project");
			expect(typeof message).toBe("string");
			expect(message.length).toBeGreaterThan(5);
		}
	});
});
