export const APP_CONFIG = {
	/** Confidence threshold (0-100) to accept a detection as valid */
	detectionConfidenceThreshold: 70,

	/** Delay in ms before showing the "analyzing" state */
	analyzingDelay: 2000,

	/** Delay in ms before triggering fun-fact generation */
	funFactGenerationDelay: 500,

	/** Retry interval in ms while waiting for a valid detection */
	detectionRetryInterval: 100,

	/** Default FPS for the detection loop */
	defaultFPS: 30,

	/** Maximum allowed input length for fun-fact prompt (anti-injection) */
	maxVegetableNameLength: 50,

	/** Path to the local Teachable Machine model folder */
	modelURL: './model/',
};

export const UI_CONFIG = {
	fadeAnimation: 'fadeIn 0.5s ease-out forwards',
	confidenceThresholds: {
		excellent: 90,
		good: 80,
	},
};
