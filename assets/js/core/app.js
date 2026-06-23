import UIHandler from '../ui/ui.handler.js';
import { APP_CONFIG } from './config.js';
import {
	logError,
	isValidDetection,
	createDelay,
} from './utils.js';
import CameraService    from '../services/camera.service.js';
import DetectionService from '../services/detection.service.js';
import FunFactService   from '../services/facts.service.js';

class RootFactsApp {
	constructor() {
		this.detector         = null;
		this.camera           = null;
		this.funFactGenerator = null;
		this.ui               = new UIHandler();
		this.isRunning        = false;
		this.currentLoopId    = null;
		this.config           = APP_CONFIG;
		this.currentFunFact   = '';

		// [Advanced] Tone preference selected by the user
		this.selectedTone = 'normal';

		// Disable the button until models are ready
		this.ui.disableButton();

		this.bindEvents();
		this.init();

		// [Basic] Register Service Worker for PWA / offline support
		this.registerServiceWorker();
	}

	// ─────────────────────────────────────────────────────────────────
	// Event Binding
	// ─────────────────────────────────────────────────────────────────

	/**
   * Bind UI events to their respective handler methods.
   */
	bindEvents() {
		this.ui.bindEvents({
			// [Basic] Toggle camera on/off
			onToggleCamera: () => this.onToggleCamera(),

			// [Basic] Switch camera device
			onCameraChange: () => this.onCameraChange(),

			// [Skilled] Update FPS cap live
			onFPSChange: (fps) => this.onFPSChange(fps),

			// [Skilled] Copy fun fact to clipboard
			onCopy: () => this.onCopy(),

			// [Advanced] Change generation tone
			onToneChange: (tone) => this.onToneChange(tone),
		});
	}

	// ─────────────────────────────────────────────────────────────────
	// Initialisation
	// ─────────────────────────────────────────────────────────────────

	/**
   * [Skilled] Load TF model + Transformers.js model, then enable the UI.
   */
	async init() {
		try {
			// Show "Menunggu Model..." overlay and update header status
			this.ui.updateHeaderStatus('Memuat model...', false);
			this._showModelLoadingOverlay(true);

			// Initialise services
			this.detector         = new DetectionService();
			this.camera           = new CameraService();
			this.funFactGenerator = new FunFactService();

			// Load both models (TF model is required; Transformers.js can be lazy)
			await this.detector.loadModel();

			// Load the fun-fact model in parallel — it's large but non-blocking for UX
			this.funFactGenerator.loadModel().catch((err) =>
				logError('Transformers.js model load failed (non-fatal)', err),
			);

			// Hide overlay and mark as ready
			this._showModelLoadingOverlay(false);

			// [Skilled] Update header to "Siap" once both are loaded
			this.ui.updateHeaderStatus('Siap', false);
			this.ui.enableButton();
		} catch (error) {
			logError('Gagal menginisialisasi aplikasi', error);

			this._showModelLoadingOverlay(false);

			// [Skilled] Show error in header if init fails
			this.ui.updateHeaderStatus('Error', false);
			this.ui.showError(`Gagal menginisialisasi: ${error.message}`);
			this.ui.disableButton();
		}
	}

	/** Toggle the "Menunggu Model..." overlay on the camera card. */
	_showModelLoadingOverlay(show) {
		const overlay = document.getElementById('model-loading-overlay');
		if (!overlay) return;
		if (show) {
			overlay.classList.remove('hidden');
		} else {
			overlay.classList.add('hidden');
		}
	}

	// ─────────────────────────────────────────────────────────────────
	// Service Worker
	// ─────────────────────────────────────────────────────────────────

	/**
   * [Basic] Register the Workbox-powered service worker for PWA / offline.
   */
	registerServiceWorker() {
		if ('serviceWorker' in navigator) {
			window.addEventListener('load', () => {
				navigator.serviceWorker
					.register('./sw.js')
					.then((reg) => console.log('✅ SW registered:', reg.scope))
					.catch((err) => logError('SW registration failed', err));
			});
		}
	}

	// ─────────────────────────────────────────────────────────────────
	// Event Handlers
	// ─────────────────────────────────────────────────────────────────

	/** [Basic] Toggle camera on / off. */
	onToggleCamera() {
		this.toggleCamera();
	}

	/** [Basic] Re-start the camera when user switches device. */
	onCameraChange() {
		if (this.isRunning) {
			this.stopCamera();
			this.startCamera();
		}
	}

	/** [Skilled] Update the FPS cap on the camera service. */
	onFPSChange(fps) {
		if (this.camera) {
			this.camera.setFPS(fps);
		}
		this.ui.updateFPS(fps);
	}

	/** [Skilled] Copy the current fun fact text to the clipboard. */
	async onCopy() {
		const text = this.ui.getFunFactText();
		if (!text || text === 'Fakta menarik akan muncul di sini...') return;

		try {
			await navigator.clipboard.writeText(text);
			this.ui.setCopyButtonCopied();
			setTimeout(() => this.ui.resetCopyButton(), 2000);
		} catch (err) {
			logError('Clipboard copy failed', err);
			// Fallback: select the text
			const el = document.getElementById('fun-fact-text');
			if (el) {
				const range = document.createRange();
				range.selectNodeContents(el);
				window.getSelection().removeAllRanges();
				window.getSelection().addRange(range);
			}
		}
	}

	/** [Advanced] Update tone preference used in fun fact generation. */
	onToneChange(tone) {
		this.selectedTone = tone;
	}

	// ─────────────────────────────────────────────────────────────────
	// Camera Control
	// ─────────────────────────────────────────────────────────────────

	/** [Basic] Toggle camera and detection loop. */
	toggleCamera() {
		if (this.isRunning) {
			this.stopCamera();
			this.stopDetection();
			this.ui.updateCameraUI(false);
			this.ui.switchToState('idle');
		} else {
			this.startCamera();
		}
	}

	/** [Basic] Start the camera stream. */
	async startCamera() {
		try {
			await this.camera.startCamera();
			this.isRunning = true;
			this.ui.updateCameraUI(true);
			this.ui.switchToState('loading');
			this.startDetection();
		} catch (error) {
			logError('Failed to start camera', error);
			this.ui.showError(error.message);
		}
	}

	/** [Basic] Stop the camera stream. */
	stopCamera() {
		this.isRunning = false;
		if (this.camera) this.camera.stopCamera();
	}

	// ─────────────────────────────────────────────────────────────────
	// Detection Loop
	// ─────────────────────────────────────────────────────────────────

	/** [Basic] Start the detection loop with a unique ID to prevent stale loops. */
	startDetection() {
		const loopId = Symbol('detectLoop');
		this.currentLoopId = loopId;
		this._scheduleNextFrame(loopId);
	}

	/** [Basic] Signal the current detection loop to stop. */
	stopDetection() {
		this.currentLoopId = null;
	}

	/** Internal: schedule the next frame using requestAnimationFrame. */
	_scheduleNextFrame(loopId) {
		if (this.currentLoopId !== loopId) return;

		requestAnimationFrame(async (timestamp) => {
			if (this.currentLoopId !== loopId) return;

			// FPS throttle: only process when enough time has elapsed
			if (this.camera.shouldCaptureFrame(timestamp)) {
				await this.detectLoop(loopId);
			}

			// Continue the loop
			this._scheduleNextFrame(loopId);
		});
	}

	/**
   * [Basic] One iteration of the detection loop.
   * Runs inference on the current video frame and, on a valid hit,
   * pauses the loop while results are displayed.
   * @param {Symbol} loopId
   */
	async detectLoop(loopId) {
		if (this.currentLoopId !== loopId) return;
		if (!this.camera.isReady()) return;

		try {
			const result = await this.detector.predict(this.camera.video);

			if (isValidDetection(result)) {
				// Pause detection while we show results
				this.stopDetection();
				await createDelay(this.config.analyzingDelay);
				await this.generateAndShowResults(result);
			}
		} catch (error) {
			logError('Detection loop error', error);
		}
	}

	// ─────────────────────────────────────────────────────────────────
	// Results Display
	// ─────────────────────────────────────────────────────────────────

	/**
   * [Basic] Show the detected vegetable in the result card, then generate
   * and display the fun fact.
   * @param {{ className: string, confidence: number }} detectionResult
   */
	async generateAndShowResults(detectionResult) {
		try {
			// Show result card immediately (fun fact loading state)
			this.ui.showResults(detectionResult, null);

			// Generate fun fact
			await createDelay(this.config.funFactGenerationDelay);

			let funFact;
			if (this.funFactGenerator.isReady()) {
				funFact = await this.funFactGenerator.generateFunFact(
					detectionResult.className,
					this.selectedTone,
				);
			} else {
				// Graceful fallback if the NLP model is still loading
				funFact = `${detectionResult.className} is a nutritious vegetable rich in essential vitamins and minerals that are important for a healthy body.`;
			}

			this.currentFunFact = funFact;
			this.ui.updateFunFactState('success', { funFact });
		} catch (error) {
			logError('Gagal menampilkan hasil', error);
			this.ui.updateFunFactState('error');
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
	// eslint-disable-next-line no-unused-vars
	const app = new RootFactsApp();

	if (typeof lucide !== 'undefined') {
		lucide.createIcons();
	}
});

export default RootFactsApp;
