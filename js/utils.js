// 全局工具函数
window.showResult = function(message, isError = false) {
    const resultContent = document.getElementById('resultContent');
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${message}`;
    
    // 同时输出到控制台以便调试
    if (isError) {
        console.error(formattedMessage);
    } else {
        console.log(formattedMessage);
    }
    
    if (isError) {
        resultContent.innerHTML += `<div class="error-message">${formattedMessage}</div>`;
    } else {
        resultContent.innerHTML += `<div>${formattedMessage}</div>`;
    }
    
    resultContent.scrollTop = resultContent.scrollHeight;
};

// 文件处理工具函数
const FileUtils = {
    // 读取文件为 ArrayBuffer
    readAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    },

    // 下载文件
    downloadFile(data, filename) {
        const blob = new Blob([data]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// 文件预览功能
function setupFilePreview(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    // 创建预览按钮和文件信息显示
    const previewContainer = document.createElement('div');
    const previewButton = document.createElement('a');
    const fileInfo = document.createElement('div');
    
    previewContainer.style.marginTop = '8px';
    previewButton.className = 'preview-button';
    previewButton.style.display = 'none';
    previewButton.innerHTML = '<i class="material-icons">visibility</i>查看所选文件';
    fileInfo.className = 'file-info';
    
    // 找到正确的插入位置：file-field input-field 的末尾
    const fileField = input.closest('.file-field');
    if (fileField) {
        fileField.appendChild(previewContainer);
    }
    previewContainer.appendChild(fileInfo);
    previewContainer.appendChild(previewButton);

    // 创建预览模态框
    const modalId = `${inputId}PreviewModal`;
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal preview-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h4>文件预览</h4>
            <div class="preview-content"></div>
        </div>
        <div class="modal-footer">
            <a href="#!" class="modal-close waves-effect waves-blue btn-flat">关闭</a>
        </div>
    `;
    document.body.appendChild(modal);

    // 初始化模态框
    const modalInstance = M.Modal.init(modal);

    // 文件选择事件处理
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) {
            previewButton.style.display = 'none';
            fileInfo.textContent = '';
            return;
        }

        // 显示文件信息
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        fileInfo.textContent = `已选择：${file.name} (${fileSize}MB)`;
        previewButton.style.display = 'inline-flex';

        // 预览按钮点击事件
        previewButton.onclick = function() {
            const previewContent = modal.querySelector('.preview-content');
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.onload = () => URL.revokeObjectURL(img.src);
                previewContent.innerHTML = '';
                previewContent.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = URL.createObjectURL(file);
                video.controls = true;
                previewContent.innerHTML = '';
                previewContent.appendChild(video);
            }
            modalInstance.open();
        };
    });
} 