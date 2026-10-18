import { describe, test, expect } from "bun:test";
import { formatLoadDuration } from "../src/shared/domain/timeFormatting";

describe("Time & Duration Formatting Utilities", () => {
	test("formats durations under 2 seconds in milliseconds", () => {
		expect(formatLoadDuration(0)).toBe("0ms");
		expect(formatLoadDuration(45)).toBe("45ms");
		expect(formatLoadDuration(450.4)).toBe("450ms");
		expect(formatLoadDuration(999)).toBe("999ms");
		expect(formatLoadDuration(1250)).toBe("1250ms");
		expect(formatLoadDuration(1999)).toBe("1999ms");
	});

	test("formats durations of 2 seconds or more in seconds", () => {
		expect(formatLoadDuration(2000)).toBe("2s");
		expect(formatLoadDuration(2450)).toBe("2.45s");
		expect(formatLoadDuration(2500)).toBe("2.5s");
		expect(formatLoadDuration(3120)).toBe("3.12s");
		expect(formatLoadDuration(10000)).toBe("10s");
		expect(formatLoadDuration(12345)).toBe("12.35s");
	});

	test("handles boundary and edge cases safely", () => {
		expect(formatLoadDuration(-100)).toBe("0ms");
		expect(formatLoadDuration(1999.4)).toBe("1999ms");
		expect(formatLoadDuration(1999.6)).toBe("2s");
	});
});
