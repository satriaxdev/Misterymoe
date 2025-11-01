document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const dropArea = document.getElementById('dropArea');
    const resultArea = document.getElementById('resultArea');
    const linkText = document.getElementById('linkText');
    const copyBtn = document.getElementById('copyBtn');
    const newUploadBtn = document.getElementById('newUploadBtn');
    const previewContainer = document.getElementById('previewContainer');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const loading = document.getElementById('loading');
    const detailName = document.getElementById('detailName');
    const detailSize = document.getElementById('detailSize');
    const detailType = document.getElementById('detailType');
    
    let selectedFile = null;
    
    // Event listener untuk tombol pilih file
    selectFileBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Event listener untuk input file
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });
    
    // Event listener untuk drag and drop
    dropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });
    
    dropArea.addEventListener('dragleave', function() {
        dropArea.classList.remove('dragover');
    });
    
    dropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });
    
    // Event listener untuk tombol unggah
    uploadBtn.addEventListener('click', function() {
        if (selectedFile) {
            uploadFile(selectedFile);
        }
    });
    
    // Event listener untuk tombol salin
    copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(linkText.textContent)
            .then(() => {
                copyBtn.textContent = 'Tersalin!';
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.textContent = 'Salin';
                    copyBtn.classList.remove('copied');
                }, 2000);
            })
            .catch(err => {
                console.error('Gagal menyalin teks: ', err);
                alert('Gagal menyalin link. Silakan salin manual.');
            });
    });
    
    // Event listener untuk tombol unggah baru
    newUploadBtn.addEventListener('click', function() {
        resetUploader();
    });
    
    // Fungsi untuk menangani pemilihan file
    function handleFileSelection(file) {
        // Validasi ukuran file (maksimal 25MB)
        if (file.size > 25 * 1024 * 1024) {
            showError('Ukuran file terlalu besar. Maksimal 25MB.');
            return;
        }
        
        selectedFile = file;
        uploadBtn.style.display = 'inline-block';
        fileInfo.style.display = 'block';
        
        // Tampilkan info file
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        
        // Tampilkan preview jika file adalah gambar
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview" class="file-preview">`;
            };
            reader.readAsDataURL(file);
        } else {
            previewContainer.innerHTML = `<p>File: ${file.name}</p>`;
        }
    }
    
    // Fungsi untuk mengunggah file
    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Tampilkan indikator loading
        uploadBtn.disabled = true;
        loading.style.display = 'block';
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            loading.style.display = 'none';
            
            if (data.success) {
                // Tampilkan hasil
                linkText.textContent = data.url;
                detailName.textContent = data.fileInfo.originalName;
                detailSize.textContent = formatFileSize(data.fileInfo.size);
                detailType.textContent = data.fileInfo.mimetype;
                
                resultArea.style.display = 'block';
                
                // Scroll ke hasil
                resultArea.scrollIntoView({ behavior: 'smooth' });
                
                // Reset tombol unggah
                uploadBtn.disabled = false;
                uploadBtn.style.display = 'none';
                fileInfo.style.display = 'none';
            } else {
                showError(data.error || 'Terjadi kesalahan saat mengunggah file');
                uploadBtn.disabled = false;
            }
        })
        .catch(error => {
            loading.style.display = 'none';
            console.error('Upload error:', error);
            showError('Terjadi kesalahan saat mengunggah file');
            uploadBtn.disabled = false;
        });
    }
    
    // Fungsi untuk mereset pengunggah
    function resetUploader() {
        fileInput.value = '';
        selectedFile = null;
        uploadBtn.style.display = 'none';
        uploadBtn.disabled = false;
        resultArea.style.display = 'none';
        fileInfo.style.display = 'none';
        previewContainer.innerHTML = '';
        
        // Hapus pesan error jika ada
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }
    
    // Fungsi untuk menampilkan pesan error
    function showError(message) {
        // Hapus pesan error sebelumnya jika ada
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        uploadArea.insertBefore(errorDiv, uploadBtn);
        
        // Hapus pesan error setelah 5 detik
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
    
    // Fungsi untuk memformat ukuran file
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});
