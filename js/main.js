// 主要功能控制
// 定义全局 showResult 函数
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

document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const synthesizeBtn = document.getElementById('synthesizeBtn');
    const separateBtn = document.getElementById('separateBtn');
    const viewInfoBtn = document.getElementById('viewInfoBtn');
    const clearBtn = document.getElementById('clearResult');
    const resultContent = document.getElementById('resultContent');

    // 合成功能
    synthesizeBtn.addEventListener('click', async function() {
        const os = document.getElementById('synOS').value;
        const staticImage = document.getElementById('staticImage').files[0];
        const videoFile = document.getElementById('videoFile').files[0];

        if (!staticImage || !videoFile) {
            showResult('请选择静态图片和视频文件');
            return;
        }

        const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

        if (staticImage.size > MAX_FILE_SIZE || videoFile.size > MAX_FILE_SIZE) {
            showResult('文件太大，请选择小于100MB的文件');
            return;
        }

        if (!staticImage.type.startsWith('image/jpeg')) {
            showResult('静态图片必须是JPEG格式');
            return;
        }

        if (!videoFile.type.startsWith('video/mp4')) {
            showResult('视频必须是MP4格式');
            return;
        }

        try {
            showResult('处理中...');
            if (os === 'MIUI') {
                await synthesizeXiaomi(staticImage, videoFile);
            } else if (os === 'ColorOS') {
                await synthesizeOppo(staticImage, videoFile);
            }
        } catch (error) {
            showResult(`处理失败: ${error.message}`);
        }
    });

    // 拆分功能
    separateBtn.addEventListener('click', async function() {
        const os = document.getElementById('sepOS').value;
        const livePhoto = document.getElementById('livePhoto').files[0];

        if (!livePhoto) {
            showResult('请选择动态照片文件');
            return;
        }

        try {
            showResult('处理中...');
            if (os === 'MIUI') {
                await separateXiaomi(livePhoto);
            } else if (os === 'ColorOS') {
                await separateOppo(livePhoto);
            }
        } catch (error) {
            showResult(`处理失败: ${error.message}`);
        }
    });

    // 查看信息功能
    viewInfoBtn.addEventListener('click', async function() {
        const photo = document.getElementById('infoPhoto').files[0];
        const lang = document.getElementById('infoLang').value;

        if (!photo) {
            showResult('请选择照片文件');
            return;
        }

        try {
            showResult('读取中...');
            const info = await getPhotoInfo(photo, lang);
            showResult(info);
        } catch (error) {
            showResult(`读取失败: ${error.message}`);
        }
    });

    // 下载按钮事件处理
    const downloadImage = document.getElementById('downloadImage');
    const downloadVideo = document.getElementById('downloadVideo');
    const downloadButtons = document.getElementById('downloadButtons');

    downloadImage.addEventListener('click', function() {
        if (window.separatedFiles?.imageData) {
            FileUtils.downloadFile(
                window.separatedFiles.imageData,
                `${window.separatedFiles.baseName}_image.jpg`
            );
            window.showResult('图片已开始下载');
        }
    });

    downloadVideo.addEventListener('click', function() {
        if (window.separatedFiles?.videoData) {
            FileUtils.downloadFile(
                window.separatedFiles.videoData,
                `${window.separatedFiles.baseName}_video.mp4`
            );
            window.showResult('视频已开始下载');
        }
    });

    // 清除按钮也需要清除分离的文件数据
    clearBtn.addEventListener('click', function() {
        resultContent.textContent = '';
        window.separatedFiles = {
            imageData: null,
            videoData: null,
            baseName: null
        };
        downloadButtons.style.display = 'none';
    });

    // 当选择新文件时，清除之前的分离文件数据
    document.getElementById('livePhoto').addEventListener('change', function() {
        window.separatedFiles = {
            imageData: null,
            videoData: null,
            baseName: null
        };
        downloadButtons.style.display = 'none';
    });

    // 读取照片信息
    async function getPhotoInfo(photo, lang) {
        // 这里使用 ExifReader 库读取照片信息
        // 实际实现需要引入相关库
        return '照片信息读取功能开发中...';
    }

    // 文件预览功能
    function setupFilePreview(inputId, previewId) {
        const input = document.getElementById(inputId);
        const preview = document.createElement('div');
        preview.id = previewId;
        preview.className = 'file-preview';
        input.parentNode.appendChild(preview);

        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) {
                preview.innerHTML = '';
                return;
            }

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.onload = () => URL.revokeObjectURL(img.src);
                preview.innerHTML = '';
                preview.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = URL.createObjectURL(file);
                video.controls = true;
                preview.innerHTML = '';
                preview.appendChild(video);
            }
        });
    }

    // 设置文件预览
    setupFilePreview('staticImage', 'staticImagePreview');
    setupFilePreview('videoFile', 'videoFilePreview');
    setupFilePreview('livePhoto', 'livePhotoPreview');
    setupFilePreview('infoPhoto', 'infoPhotoPreview');
});

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