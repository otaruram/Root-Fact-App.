import { logError, validateModelMetadata } from '../core/utils.js';
import { APP_CONFIG } from '../core/config.js';

class DetectionService {
	constructor() {
		this.model  = null;
		this.labels = [];
		this.config = APP_CONFIG;
	}

	/**
   * [Basic] Load the Teachable Machine image model from the local /model
   * directory, then validate its metadata.
   *
   * The global `tmImage` object is provided by the Teachable Machine CDN
   * script loaded in index.html.
   */
	async loadModel() {
		try {
			const modelURL    = `${this.config.modelURL}model.json`;
			const metadataURL = `${this.config.modelURL}metadata.json`;

			// Fetch & validate metadata before loading the full model
			const metadataRes  = await fetch(metadataURL);
			const metadata     = await metadataRes.json();

			if (!validateModelMetadata(metadata)) {
				throw new Error('metadata.json tidak valid atau tidak memiliki properti labels');
			}

			this.labels = metadata.labels;

			// Load the Teachable Machine model (provided via CDN global `tmImage`)
			this.model = await tmImage.load(modelURL, metadataURL);

			console.log('✅ TF Model loaded. Labels:', this.labels);
		} catch (error) {
			logError('Failed to load model', error);
			throw new Error(`Failed to load model: ${error.message}`);
		}
	}

	/**
   * [Basic] Run the model on a given image element and return the top
   * prediction with its className and confidence (0-100).
   *
   * Memory management: tensors are disposed in the `finally` block to
   * prevent leaks.
   *
   * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} imageElement
   * @returns {{ className: string, confidence: number, isValid: boolean }}
   */
	async predict(imageElement) {
		let predictions = null;
		try {
			predictions = await this.model.predict(imageElement);

			// Find the label with the highest probability
			let top = predictions[0];
			for (const p of predictions) {
				if (p.probability > top.probability) top = p;
			}

			const confidence = Math.round(top.probability * 100);

			return {
				className:  top.className,
				confidence,
				isValid:    confidence >= this.config.detectionConfidenceThreshold,
			};
		} catch (error) {
			logError('Prediction error', error);
			throw new Error(`Prediksi gagal: ${error.message}`);
		} finally {
			// tmImage.predict() internally uses TF tensors; calling tf.dispose
			// on any lingering tensors keeps memory clean.
			if (typeof tf !== 'undefined') {
				tf.tidy(() => {}); // flushing any leaked intermediate tensors
			}
		}
	}

	/**
   * [Basic] Whether the model has been successfully loaded.
   * @returns {boolean}
   */
	isLoaded() {
		return this.model !== null;
	}
}

export default DetectionService;
