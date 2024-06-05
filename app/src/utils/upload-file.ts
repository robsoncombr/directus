// import api from '@/api';
import { emitter, Events } from '@/events';
import { i18n } from '@/lang';
import { notify } from '@/utils/notify';
// import type { AxiosProgressEvent } from 'axios';
// import { unexpectedError } from './unexpected-error';
import * as tus from 'tus-js-client';

export async function uploadFile(
	file: File,
	options?: {
		onProgressChange?: (percentage: number) => void;
		notifications?: boolean;
		preset?: Record<string, any>;
		fileId?: string;
	},
): Promise<any> {
	const progressHandler = options?.onProgressChange || (() => undefined);

	// if (options?.preset) {
	// 	for (const [key, value] of Object.entries(options.preset)) {
	// 		formData.append(key, value);
	// 	}
	// }

	return new Promise((resolve, reject) => {
	//-------------------------------
	// Create a new tus upload
	const upload = new tus.Upload(file, {
		endpoint: '/files/tus',
		retryDelays: [0, 3000, 5000, 10000, 20000],
		chunkSize: 10_000_000,
		metadata: {
		  filename: file.name,
		  filetype: file.type,
		},
		onError: function (error) {
		  console.log('Failed because: ' + error)
		  reject(error);
		},
		onProgress: function (bytesUploaded, bytesTotal) {
		  const percentage = Number(((bytesUploaded / bytesTotal) * 100).toFixed(2));
			progressHandler(percentage);
		//   console.log(bytesUploaded, bytesTotal, percentage + '%')
		},
		onSuccess: function () {
			//   console.log('Download %s from %s', upload.file.name, upload.url)

			if (options?.notifications) {
				notify({
					title: i18n.global.t('upload_file_success'),
				});
			}

			emitter.emit(Events.upload);

			resolve('test');
		},
	  });

	  // Check if there are any previous uploads to continue.
	  upload.findPreviousUploads().then(function (previousUploads) {
		// Found previous uploads so we select the first one.
		if (previousUploads.length) {
		  upload.resumeFromPreviousUpload(previousUploads[0]!);
		}

		// Start the upload
		upload.start()
	  })
	});
}
