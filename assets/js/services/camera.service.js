import {
	getCameraErrorMessage,
	logError,
	isMobileDevice,
} from '../core/utils.js';
import { APP_CONFIG } from '../core/config.js';

class CameraService {
	constructor() {
		this.stream = null;
		this.video = null;
		this.canvas = null;
		this.config = null;

		/** Target interval in ms derived from FPS setting */
		this._frameInterval = 1000 / APP_CONFIG.defaultFPS;
		/** Timestamp of the last processed frame */
		this._lastFrameTime = 0;

		this.initializeElements();
		this.init();
	}

	/**
   * [Basic] Initialise references to the DOM elements used by the camera.
   */
	initializeElements() {
		this.video  = document.getElementById('videoElement');
		this.canvas = document.getElementById('canvasElement');
	}

	async init() {
		await this.loadCameras();
	}

	/**
   * [Basic] Enumerate available video input devices and populate the
   * <select id="camera-select"> dropdown.
   */
	async loadCameras() {
		try {
			// We need to request permission first so labels are available
			const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
			tempStream.getTracks().forEach((t) => t.stop());

			const devices = await navigator.mediaDevices.enumerateDevices();
			const videoDevices = devices.filter((d) => d.kind === 'videoinput');

			const select = document.getElementById('camera-select');
			if (select && videoDevices.length > 1) {
				select.innerHTML = '';
				videoDevices.forEach((device, idx) => {
					const option = document.createElement('option');
					option.value = device.deviceId;
					option.textContent = device.label || `Kamera ${idx + 1}`;
					select.appendChild(option);
				});
			}
		} catch (error) {
			logError('Gagal memuat kamera', error);
			// Non-fatal: fall back to default constraints
		}
	}

	/**
   * [Basic] Start the camera stream and attach it to the video element.
   * Respects the value of <select id="camera-select">.
   */
	async startCamera() {
		try {
			const select  = document.getElementById('camera-select');
			const deviceId = select?.value;

			let videoConstraints;
			if (!deviceId || deviceId === 'default') {
				videoConstraints = {
					facingMode: isMobileDevice() ? 'environment' : 'user',
					width: { ideal: 640 },
					height: { ideal: 480 },
				};
			} else if (deviceId === 'front') {
				videoConstraints = {
					facingMode: 'user',
					width: { ideal: 640 },
					height: { ideal: 480 },
				};
			} else {
				videoConstraints = {
					deviceId: { exact: deviceId },
					width: { ideal: 640 },
					height: { ideal: 480 },
				};
			}

			this.stream = await navigator.mediaDevices.getUserMedia({
				video: videoConstraints,
				audio: false,
			});

			if (this.video) {
				this.video.srcObject = this.stream;
				await this.video.play();
			}
		} catch (error) {
			logError('Gagal memulai kamera', error);
			const errorMessage = getCameraErrorMessage(error);
			throw new Error(errorMessage);
		}
	}

	/**
   * [Basic] Stop all tracks on the current media stream.
   */
	stopCamera() {
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.stream = null;
		}
		if (this.video) {
			this.video.srcObject = null;
		}
	}

	/**
   * [Skilled] Set the desired capture FPS.
   * Converts fps to a minimum interval between frames.
   * @param {number} fps
   */
	setFPS(fps) {
		if (fps > 0) {
			this._frameInterval = 1000 / fps;
		}
	}

	/**
   * [Skilled] Returns true when enough time has passed since the last frame
   * to honour the current FPS cap.
   * @param {number} now - performance.now() timestamp
   * @returns {boolean}
   */
	shouldCaptureFrame(now) {
		if (now - this._lastFrameTime >= this._frameInterval) {
			this._lastFrameTime = now;
			return true;
		}
		return false;
	}

	/**
   * [Basic] Whether the camera stream is currently active.
   * @returns {boolean}
   */
	isActive() {
		return !!(this.stream && this.stream.active);
	}

	/**
   * [Basic] Whether the video element has enough data to be used for
   * inference (readyState >= HAVE_ENOUGH_DATA).
   * @returns {boolean}
   */
	isReady() {
		return !!(
			this.video &&
      this.video.readyState >= 4 &&
      this.video.videoWidth > 0
		);
	}
}

export default CameraService;
