document.addEventListener('DOMContentLoaded', function() {
    // 设置文件预览
    setupFilePreview('livePhoto');

    // 获取DOM元素
    const separateBtn = document.getElementById('separateBtn');
    const downloadButtons = document.getElementById('downloadButtons');

    // 拆分功能
    separateBtn.addEventListener('click', async function() {
        const os = document.getElementById('sepOS').value;
        const livePhoto = document.getElementById('livePhoto').files[0];

        if (!livePhoto) {
            showResult('请选择动态照片文件', true);
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
            showResult(`处理失败: ${error.message}`, true);
        }
    });

    // 下载按钮事件处理
    const downloadImage = document.getElementById('downloadImage');
    const downloadVideo = document.getElementById('downloadVideo');

    downloadImage.addEventListener('click', function() {
        if (window.separatedFiles?.imageData) {
            FileUtils.downloadFile(
                window.separatedFiles.imageData,
                `${window.separatedFiles.baseName}_image.jpg`
            );
            showResult('图片已开始下载');
        }
    });

    downloadVideo.addEventListener('click', function() {
        if (window.separatedFiles?.videoData) {
            FileUtils.downloadFile(
                window.separatedFiles.videoData,
                `${window.separatedFiles.baseName}_video.mp4`
            );
            showResult('视频已开始下载');
        }
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
}); 