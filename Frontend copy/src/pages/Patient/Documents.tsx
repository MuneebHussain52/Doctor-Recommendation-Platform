import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, Calendar, Eye } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface Document {
	id: string;
	document_name: string;
	category: string;
	file_size: number;
	uploaded_at: string;
	file_url: string;
}

const categoryOptions = [
	'Other',
	'Image',
	'Lab Report',
	'Prescription',
	'Medical Record',
];

const Documents = () => {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const { t } = useLanguage();
	const { patient } = useAuth();

	const [dragActive, setDragActive] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [uploadedDocs, setUploadedDocs] = useState<Document[]>([]);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [rename, setRename] = useState<string>('');
	const [category, setCategory] = useState<string>('Other');
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [showDeleteId, setShowDeleteId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt', 'dcm', 'xlsx', 'csv', 'tiff', 'tif', 'xls', 'rtf', 'bmp'];

	// Fetch documents from backend
	useEffect(() => {
		const fetchDocuments = async () => {
			if (!patient?.id) return;

			try {
				const response = await fetch(`http://localhost:8000/api/patients/${patient.id}/documents/`);
				const data = await response.json();
				setUploadedDocs(data);
				setLoading(false);
			} catch (error) {
				console.error('[Documents] Failed to fetch documents:', error);
				setLoading(false);
			}
		};

		fetchDocuments();
	}, [patient]);

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === 'dragenter' || e.type === 'dragover') {
			setDragActive(true);
		} else if (e.type === 'dragleave') {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			handleFiles(e.dataTransfer.files);
		}
	};

	const handleFiles = (files: FileList) => {
		const file = files[0];
		if (!file) return;
		const ext = file.name.split('.').pop()?.toLowerCase();
		if (!ext || !allowedExtensions.includes(ext)) {
			setUploadError(`File '${file.name}' ${t('documents.fileNotAllowed')}`);
			setShowUploadModal(false);
			return;
		}
		setSelectedFile(file);
		setRename(file.name);
		setCategory('Other');
		setShowUploadModal(true);
		setUploadError(null);
		// Reset file input so same file can be selected again after deletion
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleUpload = async () => {
		if (!selectedFile || !patient?.id) return;

		try {
			const formData = new FormData();
			formData.append('file', selectedFile);
			formData.append('document_name', rename);
			formData.append('category', category);

			const response = await fetch(`http://localhost:8000/api/patients/${patient.id}/upload_document/`, {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				const data = await response.json();
				setUploadedDocs(prev => [data, ...prev]);
				setShowUploadModal(false);
				setSelectedFile(null);
				setRename('');
				setCategory('Other');
				if (fileInputRef.current) fileInputRef.current.value = "";
			} else {
				const error = await response.json();
				setUploadError(error.error || 'Failed to upload document');
			}
		} catch (error) {
			console.error('[Documents] Upload error:', error);
			setUploadError('An error occurred while uploading');
		}
	};

	const handleDelete = async (id: string) => {
		if (!patient?.id) return;

		try {
			const response = await fetch(`http://localhost:8000/api/patients/${patient.id}/documents/${id}/`, {
				method: 'DELETE',
			});

			if (response.ok) {
				setUploadedDocs(prev => prev.filter(doc => doc.id !== id));
				setShowDeleteId(null);
			} else {
				console.error('[Documents] Failed to delete document');
			}
		} catch (error) {
			console.error('[Documents] Delete error:', error);
		}
	};

	const handleDownload = async (doc: Document) => {
		try {
			console.log('[Documents] Downloading:', doc.document_name);
			console.log('[Documents] File URL:', doc.file_url);

			// Extract original file extension from the file_url
			const urlParts = doc.file_url.split('/');
			const fileName = urlParts[urlParts.length - 1];
			const fileExt = fileName.split('.').pop();

			console.log('[Documents] Original file name from URL:', fileName);
			console.log('[Documents] File extension:', fileExt);

			// Ensure document_name has the correct extension
			let downloadName = doc.document_name;

			// Check if document_name already has an extension
			const nameHasExtension = downloadName.includes('.') &&
				downloadName.split('.').pop()?.toLowerCase() === fileExt?.toLowerCase();

			if (!nameHasExtension) {
				downloadName = `${downloadName}.${fileExt}`;
			}

			console.log('[Documents] Download name:', downloadName);

			// Fetch the file as a blob with no-cors mode
			const response = await fetch(doc.file_url, { mode: 'cors' });

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const blob = await response.blob();
			console.log('[Documents] Blob type:', blob.type);
			console.log('[Documents] Blob size:', blob.size);

			// Create a temporary URL for the blob
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.style.display = 'none';
			a.href = url;
			a.download = downloadName;
			document.body.appendChild(a);
			a.click();

			// Cleanup after a short delay
			setTimeout(() => {
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			}, 100);

			console.log('[Documents] Download initiated successfully');
		} catch (error) {
			console.error('[Documents] Download error:', error);
			alert(`Failed to download document: ${error}`);
		}
	};

	const handleView = (doc: Document) => {
		// Open document in new tab for viewing
		window.open(doc.file_url, '_blank');
	};

	const getFileIcon = (fileName: string) => {
		const ext = fileName.split('.').pop()?.toLowerCase();
		switch (ext) {
			case 'pdf':
				return <FileText className="h-8 w-8 text-red-500" />;
			case 'jpg':
			case 'jpeg':
			case 'png':
				return <FileText className="h-8 w-8 text-blue-500" />;
			case 'doc':
			case 'docx':
				return <FileText className="h-8 w-8 text-blue-600" />;
			default:
				return <FileText className="h-8 w-8 text-gray-500" />;
		}
	};

	const getCategoryColor = (category: string) => {
		const colors: Record<string, string> = {
			'Lab Report': 'bg-green-100 text-green-800',
			'Image': 'bg-blue-100 text-blue-800',
			'Prescription': 'bg-purple-100 text-purple-800',
			'Medical Record': 'bg-gray-100 text-gray-800',
			'Other': 'bg-yellow-100 text-yellow-800',
		};
		return colors[category] || 'bg-gray-100 text-gray-800';
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	};

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">{t('documents.title')}</h1>
				<p className="text-gray-600">
					{t('documents.subtitle')}
				</p>
			</div>

			{/* File Upload Section */}
			<div className="bg-white rounded-lg shadow p-6 mb-6">
				<h3 className="text-lg font-medium text-gray-900 mb-4">
					{t('documents.uploadNewDocument')}
				</h3>

				<div
					className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
						dragActive
							? 'border-cyan-500 bg-cyan-50'
							: 'border-gray-300 hover:border-gray-400'
					}`}
					onDragEnter={handleDrag}
					onDragLeave={handleDrag}
					onDragOver={handleDrag}
					onDrop={handleDrop}
				>
					<Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
					<h4 className="text-lg font-medium text-gray-900 mb-2">
						{t('documents.dropFilesHere')}
					</h4>
					<p className="text-gray-600 mb-4">
						{t('documents.uploadDescription')}
					</p>
					<input
						type="file"
						className="hidden"
						id="file-upload"
						ref={fileInputRef}
						onChange={(e) =>
							e.target.files && handleFiles(e.target.files)
						}
						accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.dcm,.xlsx,.csv,.tiff,.tif,.xls,.rtf,.bmp"
					/>
					<label
						htmlFor="file-upload"
						className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-md cursor-pointer transition-colors"
					>
						{t('documents.chooseFiles')}
					</label>
				</div>

				<div className="mt-4">
					{uploadError && (
						<div className="text-red-600 text-sm mb-2">{uploadError}</div>
					)}
					<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
						<h4 className="text-sm font-medium text-gray-900 mb-3">
							{t('documents.acceptedFormats')}:
						</h4>
						<div className="flex flex-wrap gap-2">
							{allowedExtensions.map((format, index) => (
								<span
									key={index}
									className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-gray-300 text-gray-700"
								>
									.{format}
								</span>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Documents List */}
			<div className="bg-white rounded-lg shadow">
				<div className="p-6 border-b border-gray-200">
					<h3 className="text-lg font-medium text-gray-900">{t('documents.myDocuments')}</h3>
				</div>

				{loading ? (
					<div className="text-center py-12">
						<p className="text-gray-500">Loading documents...</p>
					</div>
				) : uploadedDocs.length === 0 ? (
					<div className="text-center py-12">
						<FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							{t('documents.noDocuments')}
						</h3>
						<p className="text-gray-600">
							{t('documents.noDocumentsDescription')}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th
										scope="col"
										className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										{t('documents.document')}
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										{t('documents.category')}
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										{t('documents.uploadDate')}
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										{t('documents.size')}
									</th>
									<th
										scope="col"
										className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										{t('documents.actions')}
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{uploadedDocs.map((document) => (
									<tr
										key={document.id}
										className="hover:bg-gray-50 transition-colors"
									>
										<td className="px-6 py-4 whitespace-nowrap text-left rtl:text-right">
											<div className="flex items-center rtl:flex-row-reverse">
												<div className="flex-shrink-0">
													{getFileIcon(document.document_name)}
												</div>
												<div className="ml-4 rtl:mr-4 rtl:ml-0">
													<div className="text-sm font-medium text-gray-900">
														{document.document_name}
													</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-left rtl:text-right">
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
													document.category
												)}`}
											>
												{document.category}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-left rtl:text-right">
											<div className="flex items-center rtl:flex-row-reverse text-sm text-gray-900">
												<Calendar className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-gray-400" />
												{formatDate(document.uploaded_at)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-left rtl:text-right text-sm text-gray-900">
											{formatFileSize(document.file_size)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right rtl:text-left text-sm font-medium">
											<div className="flex items-center justify-end rtl:justify-start space-x-2 rtl:space-x-reverse">
												<button
													className="text-blue-600 hover:text-blue-900 p-1"
													title="View"
													onClick={() => handleView(document)}
												>
													<Eye className="h-4 w-4" />
												</button>
												<button
													className="text-cyan-600 hover:text-cyan-900 p-1"
													title="Download"
													onClick={() => handleDownload(document)}
												>
													<Download className="h-4 w-4" />
												</button>
												<button
													className="text-red-600 hover:text-red-800 flex items-center"
													title="Delete"
													onClick={() => setShowDeleteId(document.id)}
												>
													<Trash2 className="h-5 w-5" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Upload Modal */}
			{showUploadModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
					<div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center relative">
						<h2 className="text-lg font-semibold mb-4">{t('documents.uploadDocument')}</h2>
						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-700 mb-2">
								{t('documents.renameFile')}
							</label>
							<input
								type="text"
								className="w-full px-3 py-2 border rounded"
								value={rename}
								onChange={(e) => setRename(e.target.value)}
							/>
						</div>
						<div className="mb-6">
							<label className="block text-sm font-medium text-gray-700 mb-2">
								{t('documents.selectCategory')}
							</label>
							<select
								className="w-full px-3 py-2 border rounded"
								value={category}
								onChange={(e) => setCategory(e.target.value)}
							>
								{categoryOptions.map((opt) => (
									<option key={opt} value={opt}>
										{opt}
									</option>
								))}
							</select>
						</div>
						<div className="flex justify-center gap-4">
							<button
								className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
								onClick={() => {
									setShowUploadModal(false);
									if (fileInputRef.current) fileInputRef.current.value = "";
								}}
							>
								{t('documents.cancel')}
							</button>
							<button
								className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 text-sm font-medium"
								onClick={handleUpload}
								disabled={!rename}
							>
								{t('documents.upload')}
							</button>
						</div>
						<button
							className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
							onClick={() => setShowUploadModal(false)}
						>
							&times;
						</button>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
					<div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center relative">
						<h2 className="text-lg font-semibold mb-4">{t('documents.deleteDocument')}</h2>
						<p className="mb-6 text-gray-600 text-sm">
							{t('documents.deleteConfirmation')}
						</p>
						<div className="flex justify-center gap-4">
							<button
								className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
								onClick={() => setShowDeleteId(null)}
							>
								{t('documents.cancel')}
							</button>
							<button
								className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
								onClick={() => handleDelete(showDeleteId)}
							>
								{t('documents.delete')}
							</button>
						</div>
						<button
							className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
							onClick={() => setShowDeleteId(null)}
						>
							&times;
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default Documents;
